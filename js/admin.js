const API_URL = 'https://wabi-sabi-8pwb.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('adminToken');

    if (token) {
        // Уже авторизован — показываем панель
        showAdminPanel();
    } else {
        // Показываем форму входа
        document.getElementById('admin-login-form').style.display = 'flex';
        document.getElementById('admin-panel').style.display = 'none';
    }

    // Обработка формы входа
    const loginForm = document.getElementById('admin-login');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('admin-email').value;
            const password = document.getElementById('admin-password').value;
            const errorEl = document.getElementById('admin-login-error');

            try {
                const res = await fetch(`${API_URL}/api/admin/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (data.success) {
                    localStorage.setItem('adminToken', data.token);
                    showAdminPanel();
                } else {
                    errorEl.textContent = data.message || 'Ошибка входа';
                }
            } catch (err) {
                errorEl.textContent = 'Ошибка соединения с сервером';
            }
        });
    }
});

function showAdminPanel() {
    document.getElementById('admin-login-form').style.display = 'none';
    document.getElementById('admin-panel').style.display = 'block';
    loadAdminOrders();
}

async function loadAdminOrders() {
    const token = localStorage.getItem('adminToken');

    try {
        const res = await fetch(`${API_URL}/api/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        if (!data.success) {
            alert('Ошибка загрузки заказов');
            return;
        }

        renderOrdersTable(data.orders);
    } catch (err) {
        console.error(err);
    }
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('orders-table-body');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('ru-RU');
        const itemsHtml = order.items.map(i => `${i.name} ×${i.quantity}`).join('<br>');

        const row = `
            <tr>
                <td>#${order.id}</td>
                <td>${order.user_name}</td>
                <td>${order.user_email}<br>${order.user_phone || ''}</td>
                <td>${date}</td>
                <td>${itemsHtml}</td>
                <td><strong>${order.total_amount} ₸</strong></td>
                <td>
                    <select id="status-${order.id}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>В обработке</option>
                        <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Готовится</option>
                        <option value="ready" ${order.status === 'ready' ? 'selected' : ''}>Готов к выдаче</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                        <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Завершён</option>
                        <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменён</option>
                    </select>
                </td>
                <td>
                    <button onclick="updateOrderStatus(${order.id})">Сохранить</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

async function updateOrderStatus(orderId) {
    const select = document.getElementById(`status-${orderId}`);
    const newStatus = select.value;
    const token = localStorage.getItem('adminToken');

    try {
        const res = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await res.json();
        if (data.success) {
            alert('Статус обновлён!');
            loadAdminOrders();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Ошибка обновления статуса');
    }
}

function logoutAdmin() {
    localStorage.removeItem('adminToken');
    window.location.reload();
}