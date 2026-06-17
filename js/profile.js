document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const profileInfo = document.getElementById('profile-info');

    if (!user) {
        profileInfo.innerHTML = `
            <h2>Вы не авторизованы</h2>
            <p>Пожалуйста, войдите в аккаунт.</p>
            <a href="index.html" style="color:#d9230e;">← Вернуться на главную</a>
        `;
        return;
    }

    profileInfo.innerHTML = `
        <div class="profile-avatar">
            <img src="../img/profile.png" alt="Avatar">
        </div>
        <div class="profile-details">
            <h2>Информация о пользователе</h2>
            <div class="profile-row">
                <span>Имя:</span>
                <span>${user.name}</span>
            </div>
            <div class="profile-row">
                <span>Email:</span>
                <span>${user.email}</span>
            </div>
            <div class="profile-row">
                <span>ID пользователя:</span>
                <span>#${user.id}</span>
            </div>
            
            <div class="profile-actions">
                <button onclick="logout()">Выйти из аккаунта</button>
            </div>
        </div>
    `;
});

window.logout = function() {
    if (confirm('Вы действительно хотите выйти?')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
};