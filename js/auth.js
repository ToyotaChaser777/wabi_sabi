window.API_URL = 'https://wabi-sabi-8pwb.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
    updateHeaderUser();

    const modal = document.getElementById('auth-modal');
    const loginLink = document.getElementById('user-link');
    const closeModal = document.getElementById('close-modal');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            // Проверка входа
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

    // регистрация
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const password = document.getElementById('reg-password').value;
            const phone = document.getElementById('reg-phone').value.trim();

            try {
                const res = await fetch(`${window.API_URL}/api/register`, {
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

    // логин
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            try {
                const res = await fetch(`${window.API_URL}/api/login`, {
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
                    updateHeaderUser();
                }
            } catch (err) {
                alert('Ошибка соединения с сервером');
            }
        });
    }
});

// обновление шапки
function updateHeaderUser() {
    const userLink = document.getElementById('user-link');
    const adminLink = document.getElementById('admin-link');

    if (!userLink) return;

    const user = JSON.parse(localStorage.getItem('user'));

    if (user && user.name) {
        // Показываем имя пользователя
        userLink.textContent = user.name;
        userLink.href = '/html/profile.html';
        userLink.style.color = '#d9230e';

        // Показываем кнопку "Админ-панель", если пользователь — админ
        if (adminLink) {
            if (user.is_admin === 1 || user.is_admin === true) {
                adminLink.style.display = 'inline-block';
            } else {
                adminLink.style.display = 'none';
            }
        }
    } else {
        // Пользователь не вошёл
        userLink.textContent = 'Войти';
        userLink.href = '#';
        userLink.style.color = '#ffffff';

        if (adminLink) {
            adminLink.style.display = 'none';
        }
    }
}