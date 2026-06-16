// js/auth.js
const API_URL = 'http://localhost:5000';

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUser(); // Обновляем шапку при загрузке страницы

    const modal = document.getElementById('auth-modal');
    const loginLink = document.getElementById('user-link'); // теперь это user-link
    const closeModal = document.getElementById('close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            // Если пользователь уже авторизован — ведём в профиль
            const user = JSON.parse(localStorage.getItem('user'));
            if (user) {
                e.preventDefault();
                window.location.href = 'profile.html';
            } else {
                e.preventDefault();
                if (modal) modal.style.display = 'flex';
            }
        });
    }

    if (closeModal && modal) {
        closeModal.addEventListener('click', () => modal.style.display = 'none');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // Переключение вкладок
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.dataset.tab === 'login') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

    // ==================== РЕГИСТРАЦИЯ ====================
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const phone = document.getElementById('reg-phone').value.trim();

            try {
                const res = await fetch(`${API_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, phone })
                });
                const data = await res.json();
                alert(data.message);

                if (data.success) {
                    modal.style.display = 'none';
                    registerForm.reset();
                }
            } catch (err) {
                alert('Ошибка соединения с сервером');
            }
        });
    }

    // ==================== ЛОГИН ====================
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${API_URL}/api/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                alert(data.message);

                if (data.success) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    modal.style.display = 'none';
                    updateHeaderUser(); // ← Обновляем шапку после входа
                }
            } catch (err) {
                alert('Ошибка соединения с сервером');
            }
        });
    }
});

// ==================== ФУНКЦИЯ ОБНОВЛЕНИЯ ШАПКИ ====================
function updateHeaderUser() {
    const userLink = document.getElementById('user-link');
    if (!userLink) return;

    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.name) {
        userLink.textContent = user.name;
        userLink.href = 'profile.html';
        userLink.style.color = '#d9230e';
    } else {
        userLink.textContent = 'Войти';
        userLink.href = '#';
        userLink.style.color = '#ffffff';
    }
}