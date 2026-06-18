const API_URL = 'https://wabi-sabi-8pwb.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    loadAdminOrders();
});

async function loadAdminOrders() {
    const token = localStorage.getItem('adminToken');
    if (!token) {
        window.location.href = '/html/index.html';
        return;
    }

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
        let itemsHtml = order.items.map(i => `${i.name} ×${i.quantity}`).join('<br>');

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
    window.location.href = '/html/index.html';
}