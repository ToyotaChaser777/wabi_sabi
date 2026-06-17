const API_URL = 'https://wabi-sabi-8pwb.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

async function loadOrders() {
    const user = JSON.parse(localStorage.getItem('user'));
    const ordersList = document.getElementById('orders-list');

    if (!user) {
        ordersList.innerHTML = '<p>Войдите в аккаунт, чтобы увидеть заказы.</p>';
        return;
    }

    try {
        const res = await fetch(`${API_URL}/api/orders/${user.id}`);
        const data = await res.json();

        if (!data.success || !data.orders || data.orders.length === 0) {
            ordersList.innerHTML = '<p>У вас пока нет заказов.</p>';
            return;
        }

        let html = '';

        data.orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('ru-RU');
            
            let itemsHtml = '';
            if (order.items && order.items.length > 0) {
                itemsHtml = order.items.map(item => 
                    `<div style="padding: 3px 0; font-size: 0.95em; color: #ccc;">
                        ${item.name} × ${item.quantity} = <strong>${item.price * item.quantity} ₸</strong>
                    </div>`
                ).join('');
            }

            html += `
                <div class="order-card">
                    <div class="order-header">
                        <strong>Заказ #${order.id}</strong>
                        <span class="order-date">${date}</span>
                    </div>
                    <div class="order-items">
                        ${itemsHtml}
                    </div>
                    <div class="order-total">
                        <span>Итого:</span>
                        <strong>${order.total_amount} ₸</strong>
                    </div>
                </div>
            `;
        });

        ordersList.innerHTML = html;

    } catch (err) {
        ordersList.innerHTML = '<p style="color:#d9230e;">Ошибка загрузки заказов.</p>';
    }
}