document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    // поиск карточек
    const productItems = document.querySelectorAll('.product-item');

    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase().trim();

        productItems.forEach(item => {
            const title = item.querySelector('h3');
            if (!title) return;

            const productName = title.textContent.toLowerCase();

            // если название содержит поисковый запрос — показываем
            if (productName.includes(searchTerm)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // очистка поиска при нажатии esc
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            productItems.forEach(item => item.style.display = 'flex');
        }
    });
});