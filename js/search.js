// js/search.js

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    // Находим все карточки товаров на странице
    const productItems = document.querySelectorAll('.product-item');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        productItems.forEach(item => {
            const title = item.querySelector('h3');
            if (!title) return;

            const productName = title.textContent.toLowerCase();

            // Если название содержит поисковый запрос — показываем, иначе скрываем
            if (productName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // Опционально: очистка поиска при нажатии Escape
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            productItems.forEach(item => item.style.display = 'flex');
        }
    });
});