// Константы и начальные данные приложения
const DELIVERY_TIMES = {
    regular: 75,    // 2 месяца и 2 недели (около 75 дней)
    royal: 135,     // 4 месяца и 2 недели (около 135 дней) - AVZ, JARVI, Royal Canin, Eukanuba
    premium: 165    // 5 месяцев и 2 недели (около 165 дней) - Award, Best Diner, Edel Cat/Dog
};

const SHELF_LIFE_MONTHS = 18; // Стандартный срок годности кормов

const FEED_CATEGORIES = {
    'regular': {
        name: 'Корма+Ветка',
        days: 75,
        description: 'Сдавать за 2 месяца и 2 недели (75 дней)',
        color: '#4A90E2',
        icon: 'fas fa-bone'
    },
    'royal': {
        name: 'AVZ, JARVI, Royal Canin, Eukanuba',
        days: 135,
        description: 'Сдавать за 4 месяца и 2 недели (135 дней)',
        color: '#9F7AEA',
        icon: 'fas fa-crown'
    },
    'premium': {
        name: 'Award, Best Diner, Edel Cat/Dog',
        days: 165,
        description: 'Сдавать за 5 месяцев и 2 недели (165 дней)',
        color: '#38A169',
        icon: 'fas fa-medal'
    }
};

// Данные пользователей (только админ по умолчанию)
let users = JSON.parse(localStorage.getItem('warehouse_users')) || [
    {username: 'admin', password: 'admin', name: 'Администратор', role: 'admin'}
];

// Текущий пользователь и фильтр
let currentUser = null;
let currentFilter = 'all';

// Получить товары текущего пользователя
function getUserProducts() {
    if (!currentUser) return [];
    
    const userProductsKey = `warehouse_products_${currentUser.username}`;
    return JSON.parse(localStorage.getItem(userProductsKey)) || [];
}

// Сохранить товары текущего пользователя
function saveUserProducts(productsArray) {
    if (!currentUser) return;
    
    const userProductsKey = `warehouse_products_${currentUser.username}`;
    localStorage.setItem(userProductsKey, JSON.stringify(productsArray));
}

// Получить ВСЕ товары (только для администратора)
function getAllProducts() {
    if (currentUser && currentUser.role === 'admin') {
        const allProducts = [];
        
        // Собираем товары всех пользователей
        users.forEach(user => {
            const userProductsKey = `warehouse_products_${user.username}`;
            const userProducts = JSON.parse(localStorage.getItem(userProductsKey)) || [];
            
            // Добавляем информацию о пользователе к каждому товару
            userProducts.forEach(product => {
                product.owner = user.username;
                product.ownerName = user.name;
            });
            
            allProducts.push(...userProducts);
        });
        
        return allProducts;
    }
    
    return getUserProducts();
}

// Сохранить всех пользователей
function saveUsers() {
    localStorage.setItem('warehouse_users', JSON.stringify(users));
}

// Получить продукты с учетом фильтра и пользователя
function getFilteredProducts(filter) {
    let products = currentUser.role === 'admin' ? getAllProducts() : getUserProducts();
    
    const today = new Date();
    
    switch(filter) {
        case 'week':
            const weekFromNow = new Date();
            weekFromNow.setDate(today.getDate() + 7);
            return products.filter(p => {
                const expiryDate = new Date(p.expiryDate);
                return expiryDate >= today && expiryDate <= weekFromNow;
            });
            
        case 'regular':
            return products.filter(p => p.type === 'regular');
            
        case 'royal':
            return products.filter(p => p.type === 'royal');
            
        case 'premium':
            return products.filter(p => p.type === 'premium');
            
        case 'expired':
            return products.filter(p => {
                const expiryDate = new Date(p.expiryDate);
                return expiryDate < today;
            });
            
        case 'my':
            return products.filter(p => p.addedBy === currentUser.username);
            
        default:
            return products;
    }
}