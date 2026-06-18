const API_URL = 'https://wabi-sabi-8pwb.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

async function loadOrders() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('orders-list');
    if (!user) {
        container.innerHTML = '<p>Войдите в аккаунт, чтобы увидеть заказы.</p>';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/orders/${user.id}`);
        const data = await res.json();

        if (!data.success || data.orders.length === 0) {
            container.innerHTML = '<p>У вас пока нет заказов.</p>';
            return;
        }

        let html = '';
        data.orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('ru-RU');
            const statusText = getStatusText(order.status);
            const statusClass = `status-${order.status}`;

            let itemsHtml = order.items.map(i => 
                `<div>${i.name} × ${i.quantity} = <strong>${i.price * i.quantity} ₸</strong></div>`
            ).join('');

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <strong>Заказ #${order.id}</strong>
                        <span class="order-date">${date}</span>
                    </div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="order-total">
                        <span>Итого:</span> <strong>${order.total_amount} ₸</strong>
                    </div>
                    <div style="margin-top: 10px;">
                        <span class="status-badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    } catch (err) {
        container.innerHTML = '<p style="color:red;">Ошибка загрузки заказов.</p>';
    }
}

function getStatusText(status) {
    const map = {
        'pending': 'В обработке',
        'preparing': 'Готовится',
        'ready': 'Готов к выдаче',
        'delivered': 'Доставлен',
        'completed': 'Завершён',
        'cancelled': 'Отменён'
    };
    return map[status] || status;
}