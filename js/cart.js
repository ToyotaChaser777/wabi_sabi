// js/cart.js

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Добавление товара
window.addToCart = function(button) {
    const id = parseInt(button.dataset.id);
    const name = button.dataset.name;
    const price = parseFloat(button.dataset.price);

    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast(`${name} добавлен в корзину`);
};

// Обновление счётчика
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const countEl = document.querySelector('.cart-count');
    if (countEl) countEl.textContent = count;
}

// Показ уведомления
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;background:#d9230e;color:white;padding:15px 25px;border-radius:8px;z-index:3000;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

// ==================== СТРАНИЦА КОРЗИНЫ ====================
function renderCart() {
    const container = document.getElementById('cart-items');
    const totalAmountEl = document.getElementById('total-amount');
    const finalTotalEl = document.getElementById('final-total');

    if (!container) return;

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<p style="text-align:center;padding:40px;color:#888;">Корзина пуста</p>`;
        totalAmountEl.textContent = '0 ₸';
        finalTotalEl.textContent = '0 ₸';
        return;
    }

    let total = 0;

    cart.forEach((item, index) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const itemHTML = `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h3>${item.name}</h3>
                    <p>${item.price} ₸ × ${item.quantity}</p>
                </div>
                <div class="quantity-controls">
                    <button onclick="changeQuantity(${index}, -1)">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${index}, 1)">+</button>
                </div>
                <div style="margin-left:auto; font-weight:bold; min-width:90px; text-align:right;">
                    ${itemTotal} ₸
                </div>
                <button onclick="removeFromCart(${index})" style="margin-left:15px; background:none; border:none; color:#d9230e; font-size:22px; cursor:pointer;">×</button>
            </div>
        `;
        container.innerHTML += itemHTML;
    });

    totalAmountEl.textContent = total + ' ₸';
    finalTotalEl.textContent = total + ' ₸';
}

// Изменение количества
window.changeQuantity = function(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity < 1) cart[index].quantity = 1;

    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
};

// Удаление товара
window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
};

// Оформление заказа
async function checkout() {
    if (cart.length === 0) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
        alert('Пожалуйста, войдите в аккаунт, чтобы оформить заказ.');
        return;
    }

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
        const res = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                items: cart,
                total: total
            })
        });

        const data = await res.json();

        if (data.success) {
            alert(data.message);
            // Очищаем корзину
            cart = [];
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCart();
            updateCartCount();
        } else {
            alert(data.message);
        }
    } catch (err) {
        alert('Ошибка при оформлении заказа. Попробуйте позже.');
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();
    renderCart();

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }
});