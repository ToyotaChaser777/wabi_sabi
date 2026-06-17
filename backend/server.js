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
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица заказов
    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_amount REAL,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Таблица позиций заказа
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        dish_name TEXT,
        quantity INTEGER,
        price REAL
    )`);
});

// Регистрация
app.post('/api/register', async (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: "Заполните имя, email и пароль" });
    }
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run('INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)',
            [name, email, hashedPassword, phone || null],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ success: false, message: "Этот email уже занят" });
                    }
                    return res.status(500).json({ success: false, message: "Ошибка сервера" });
                }
                res.json({ success: true, message: "Регистрация прошла успешно!" });
            });
    } catch (error) {
        res.status(500).json({ success: false, message: "Ошибка сервера" });
    }
});

// Логин
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
            { id: user.id, name: user.name, email: user.email },
            SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: "Вход выполнен успешно",
            token: token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    });
});

// Уведомление в Тг
async function sendOrderToTelegram(orderData, user) {
    const BOT_TOKEN = "8444075254:AAE7yxOVhNYQTROXzhSWQEu2LDuHiXa8EVg";
    const CHAT_ID   = "565360334";

    if (!BOT_TOKEN || BOT_TOKEN.length < 30) {
        console.log("⚠️ Telegram не настроен (токен не указан)");
        return;
    }

    let message = `🆕 *Новый заказ #${orderData.order_id}*\n\n`;
    message += `👤 *Клиент:* ${user.name}\n`;
    message += `📧 Email: ${user.email}\n`;
    message += `📞 Телефон: ${user.phone || 'не указан'}\n\n`;
    message += `🛒 *Состав заказа:*\n`;

    orderData.items.forEach(item => {
        message += `• ${item.name} × ${item.quantity} = *${item.price * item.quantity} ₸*\n`;
    });

    message += `\n💰 *Итого к оплате:* *${orderData.total} ₸*`;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await response.json();

        if (result.ok) {
            console.log('Заказ успешно отправлен в Telegram');
        } else {
            console.error('Ошибка Telegram:', result.description);
        }
    } catch (err) {
        console.error('Ошибка отправки в Telegram:', err.message);
    }
}

// оформ. заказа
app.post('/api/orders', (req, res) => {
    const { user_id, items, total } = req.body;

    if (!user_id || !items || items.length === 0) {
        return res.status(400).json({ success: false, message: "Неверные данные заказа" });
    }

    db.run(
        'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
        [user_id, total, 'pending'],
        function(err) {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Ошибка при создании заказа" });
            }

            const orderId = this.lastID;

            const stmt = db.prepare('INSERT INTO order_items (order_id, dish_name, quantity, price) VALUES (?, ?, ?, ?)');
            items.forEach(item => {
                stmt.run(orderId, item.name, item.quantity, item.price);
            });
            stmt.finalize();

            db.get('SELECT name, email, phone FROM users WHERE id = ?', [user_id], (err, user) => {
                if (!err && user) {
                    sendOrderToTelegram({
                        order_id: orderId,
                        items: items,
                        total: total
                    }, user);
                }
            });

            res.json({ 
                success: true, 
                message: "Заказ успешно оформлен!", 
                order_id: orderId 
            });
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
                console.error(err);
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

app.use('/html', express.static(path.join(frontendRoot, 'html')));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendRoot, 'html', 'index.html'));
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.sendFile(path.join(frontendRoot, 'html', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
});