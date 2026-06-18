const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const SECRET_KEY = '8bgn_clPRLksiZ-yoKnCAbCzXhxMDg';

// Подключение к SQLite
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка открытия базы:', err);
    } else {
        console.log('✅ Подключено к SQLite (database.db)');
    }
});

// Создание таблиц
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_amount REAL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        dish_name TEXT,
        quantity INTEGER,
        price REAL
    )`);
});

// регистрация

app.post('/api/register', async (req, res) => {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Заполните имя, email и пароль" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, email, password, phone, is_admin) VALUES (?, ?, ?, ?, 0)',
            [name, email, hashedPassword, phone || null],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                        return res.status(400).json({ success: false, message: "Этот email уже занят" });
                    }
                    return res.status(500).json({ success: false, message: "Ошибка сервера" });
                }
                res.json({ success: true, message: "Регистрация прошла успешно!" });
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// логин
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err || !user) {
            return res.status(400).json({ success: false, message: "Неверный email или пароль" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Неверный email или пароль" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: "Вход выполнен успешно",
            token,
            user: { id: user.id, name: user.name, email: user.email, is_admin: user.is_admin }
        });
    });
});

// админ логин
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ? AND is_admin = 1', [email], async (err, user) => {
        if (err || !user) {
            return res.status(401).json({ success: false, message: "Неверный логин или пароль администратора" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Неверный логин или пароль администратора" });
        }

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, is_admin: true },
            SECRET_KEY,
            { expiresIn: '12h' }
        );

        res.json({
            success: true,
            message: "Вход в админ-панель выполнен",
            token,
            user: { id: user.id, name: user.name, email: user.email, is_admin: true }
        });
    });
});

// получение всех заказов в админке
app.get('/api/admin/orders', (req, res) => {
    const sql = `
        SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone,
               (SELECT json_group_array(
                   json_object('name', oi.dish_name, 'quantity', oi.quantity, 'price', oi.price)
               ) FROM order_items oi WHERE oi.order_id = o.id) as items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    `;

    db.all(sql, [], (err, orders) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Ошибка получения заказов" });
        }

        orders.forEach(order => {
            order.items = order.items ? JSON.parse(order.items) : [];
        });

        res.json({ success: true, orders });
    });
});

// изменение статуса
app.put('/api/admin/orders/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    const allowedStatuses = ['pending', 'preparing', 'ready', 'delivered', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Недопустимый статус" });
    }

    db.run(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId],
        function(err) {
            if (err) {
                return res.status(500).json({ success: false, message: "Ошибка обновления статуса" });
            }
            res.json({ success: true, message: "Статус заказа обновлён" });
        }
    );
});

// история заказов
app.get('/api/orders/:user_id', (req, res) => {
    const userId = req.params.user_id;

    db.all(
        `SELECT o.*, 
                (SELECT json_group_array(
                    json_object('name', oi.dish_name, 'quantity', oi.quantity, 'price', oi.price)
                ) FROM order_items oi WHERE oi.order_id = o.id) as items
         FROM orders o 
         WHERE o.user_id = ? 
         ORDER BY o.created_at DESC`,
        [userId],
        (err, orders) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Ошибка получения заказов" });
            }

            orders.forEach(order => {
                order.items = order.items ? JSON.parse(order.items) : [];
            });

            res.json({ success: true, orders });
        }
    );
});

const frontendRoot = path.join(__dirname, '..');
app.use(express.static(frontendRoot));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'html', 'index.html'));
});

app.get('/html/cart.html', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'html', 'cart.html'));
});

app.get('/html/profile.html', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'html', 'profile.html'));
});

app.get('/html/admin.html', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'html', 'admin.html'));
});

app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    res.sendFile(path.join(frontendRoot, 'html', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});