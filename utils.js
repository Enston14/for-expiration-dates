// Вспомогательные функции

// Форматирование даты
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('ru-RU', options);
}

// Получение имени пользователя по логину
function getUserName(username) {
    const user = users.find(u => u.username === username);
    return user ? user.name : username;
}

// Показать алерт
function showAlert(elementId, message, type) {
    const alertElement = document.getElementById(elementId);
    if (!alertElement) return;
    
    alertElement.style.display = 'flex';
    alertElement.className = `alert alert-${type}`;
    document.getElementById(`${elementId}Text`).textContent = message;
    
    // Скрываем алерт через 5 секунд
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
}

// Проверка, находится ли дата в ближайших 3 месяцах
function isWithinThreeMonths(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(today.getMonth() + 3);
    
    return date >= today && date <= threeMonthsFromNow;
}

// Проверка, прошла ли дата
function isDatePassed(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
}

// Добавление дней к дате
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Добавление месяцев к дате
function addMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
}

// Разница в днях между двумя датами
function getDaysDifference(date1, date2) {
    const time1 = new Date(date1).setHours(0, 0, 0, 0);
    const time2 = new Date(date2).setHours(0, 0, 0, 0);
    const diffTime = time2 - time1;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Получение информации о категории
function getCategoryInfo(type) {
    return FEED_CATEGORIES[type] || FEED_CATEGORIES.regular;
}

// Проверка даты на действительность (не прошлая дата)
function isValidFutureDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

// Получение цветового класса в зависимости от дней
function getDaysColorClass(days) {
    if (days < 0) return 'danger';
    if (days === 0) return 'danger';
    if (days <= 7) return 'warning';
    return 'normal';
}

// Очистка старых товаров (старше 6 месяцев)
function cleanupOldProducts() {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    let totalCleaned = 0;
    
    // Очищаем для всех пользователей
    users.forEach(user => {
        const userProductsKey = `warehouse_products_${user.username}`;
        const userProducts = JSON.parse(localStorage.getItem(userProductsKey)) || [];
        
        const oldCount = userProducts.filter(p => {
            const productDate = new Date(p.expiryDate);
            return productDate < sixMonthsAgo;
        }).length;
        
        if (oldCount > 0) {
            const newProducts = userProducts.filter(p => {
                const productDate = new Date(p.expiryDate);
                return productDate >= sixMonthsAgo;
            });
            
            localStorage.setItem(userProductsKey, JSON.stringify(newProducts));
            totalCleaned += oldCount;
        }
    });
    
    return totalCleaned;
}

// Обновление статистики пользователя
function updateUserStats() {
    const userProducts = getUserProducts();
    const today = new Date();
    const weekFromNow = new Date();
    weekFromNow.setDate(today.getDate() + 7);
    
    const userProductsCount = userProducts.length;
    const userWeekProducts = userProducts.filter(p => {
        const expiryDate = new Date(p.expiryDate);
        return expiryDate >= today && expiryDate <= weekFromNow;
    }).length;
    
    if (document.getElementById('userProductsCount')) {
        document.getElementById('userProductsCount').textContent = userProductsCount;
    }
    
    if (document.getElementById('userWeekProducts')) {
        document.getElementById('userWeekProducts').textContent = userWeekProducts;
    }
    
    if (document.getElementById('userRole')) {
        const roleText = currentUser.role === 'admin' ? 'Администратор' : 'Сотрудник';
        document.getElementById('userRole').textContent = roleText;
    }
}

// Инициализация очистки при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Автоматически очищаем старые товары при загрузке
    setTimeout(() => {
        const cleanedCount = cleanupOldProducts();
        if (cleanedCount > 0) {
            console.log(`Автоматически удалено ${cleanedCount} старых товаров`);
        }
    }, 1000);
});