// products.js
import { 
    getProducts as getProductsFromBackend, 
    addProduct as addProductToBackend,
    updateProduct as updateProductInBackend,
    deleteProduct as deleteProductFromBackend,
    getCurrentUser 
} from './supabase.js'

// Получить товары (с учетом прав доступа)
async function getProducts() {
    const user = getCurrentUser();
    
    if (!user) {
        return [];
    }
    
    try {
        let result;
        if (user && user.role === 'admin') {
            // Админ видит все товары
            result = await getProductsFromBackend();
        } else {
            // Обычный пользователь видит свои товары
            result = await getProductsFromBackend(user ? user.id : null);
        }
        
        if (result.success) {
            return result.data || [];
        } else {
            console.error('Ошибка загрузки товаров из Supabase:', result.error);
            // Возвращаем из localStorage как fallback
            return JSON.parse(localStorage.getItem(`warehouse_products_${user.username}`)) || [];
        }
    } catch (error) {
        console.error('Ошибка при получении товаров:', error);
        return JSON.parse(localStorage.getItem(`warehouse_products_${user.username}`)) || [];
    }
}

// Сохранить товары (с учетом прав доступа)
function saveProducts(productsArray) {
    const user = getCurrentUser();
    
    if (!user) {
        console.error('Пользователь не авторизован');
        return;
    }
    
    if (user.role === 'admin') {
        // Для администратора - сохраняем товары каждого пользователя отдельно
        const productsByUser = {};
        
        productsArray.forEach(product => {
            if (!productsByUser[product.owner]) {
                productsByUser[product.owner] = [];
            }
            
            // Убираем информацию о владельце для сохранения
            const productCopy = {...product};
            delete productCopy.owner;
            delete productCopy.ownerName;
            
            productsByUser[product.owner].push(productCopy);
        });
        
        // Сохраняем в соответствующие ключи
        Object.keys(productsByUser).forEach(username => {
            const userProductsKey = `warehouse_products_${username}`;
            localStorage.setItem(userProductsKey, JSON.stringify(productsByUser[username]));
        });
    } else {
        // Для обычного пользователя - сохраняем только свои товары
        const userProductsKey = `warehouse_products_${user.username}`;
        
        // Убираем информацию о владельце для сохранения
        const productsToSave = productsArray.map(product => {
            const productCopy = {...product};
            delete productCopy.owner;
            delete productCopy.ownerName;
            return productCopy;
        });
        
        localStorage.setItem(userProductsKey, JSON.stringify(productsToSave));
    }
}

// === ФУНКЦИИ УДАЛЕНИЯ И РЕДАКТИРОВАНИЯ ===

// Удаление товара
window.deleteProductById = async function(productId) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showAlert('formAlert', 'Вы не авторизованы', 'danger');
        return;
    }
    
    try {
        // Удаляем с сервера
        const result = await deleteProductFromBackend(productId);
        
        if (result.success) {
            // Удаляем локально
            let products = await getProducts();
            const index = products.findIndex(p => p.id === productId);
            
            if (index !== -1) {
                // Проверяем права доступа
                const product = products[index];
                if (user.role !== 'admin' && product.owner !== user.username) {
                    showAlert('formAlert', 'Вы можете удалять только свои товары!', 'danger');
                    return;
                }
                
                // Удаляем товар из массива
                products.splice(index, 1);
                
                // Сохраняем обновленный список локально
                saveProducts(products);
                
                // Показываем уведомление
                showAlert('formAlert', 'Товар успешно удален!', 'success');
                
                // Обновляем отображение
                updateProductsDisplay();
            }
        } else {
            showAlert('formAlert', `Ошибка удаления: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Ошибка при удалении товара:', error);
        showAlert('formAlert', 'Ошибка при удалении товара', 'danger');
    }
};

// Редактирование товара
window.editProduct = function(productId) {
    const user = getCurrentUser();
    if (!user) {
        showAlert('formAlert', 'Вы не авторизованы', 'danger');
        return;
    }
    
    // Используем локальные данные для быстрого доступа
    const localProducts = JSON.parse(localStorage.getItem(`warehouse_products_${user.username}`)) || [];
    const product = localProducts.find(p => p.id === productId);
    
    if (!product) {
        // Если не нашли локально, пробуем найти в общем массиве
        getProducts().then(products => {
            const foundProduct = products.find(p => p.id === productId);
            if (foundProduct) {
                showEditForm(foundProduct, user);
            } else {
                showAlert('formAlert', 'Товар не найден', 'danger');
            }
        });
        return;
    }
    
    showEditForm(product, user);
};

// Показать форму редактирования
function showEditForm(product, user) {
    // Проверяем права доступа
    if (user.role !== 'admin' && product.owner !== user.username) {
        showAlert('formAlert', 'Вы можете редактировать только свои товары!', 'danger');
        return;
    }
    
    // Заполняем форму редактирования
    document.getElementById('article').value = product.article || '';
    document.getElementById('productName').value = product.name || '';
    document.getElementById('productType').value = product.type || 'regular';
    
    // Форматируем дату для input[type="date"]
    let expiryDate = product.expiry_date || product.expiryDate;
    if (expiryDate) {
        // Если дата в формате "YYYY-MM-DD"
        if (expiryDate.includes('T')) {
            expiryDate = expiryDate.split('T')[0];
        }
        document.getElementById('expiryDate').value = expiryDate;
    }
    
    // Меняем текст и поведение кнопки добавления
    const addButton = document.querySelector('.btn-add');
    addButton.innerHTML = '<i class="fas fa-edit"></i> Сохранить изменения';
    addButton.dataset.editingId = product.id;
    
    // Создаем кнопку отмены если её нет
    let cancelButton = document.querySelector('.btn-cancel-edit');
    if (!cancelButton) {
        cancelButton = document.createElement('button');
        cancelButton.className = 'btn btn-cancel btn-cancel-edit';
        cancelButton.innerHTML = '<i class="fas fa-times"></i> Отменить редактирование';
        cancelButton.style.marginLeft = '10px';
        cancelButton.style.marginTop = '10px';
        cancelButton.onclick = cancelEdit;
        addButton.parentElement.appendChild(cancelButton);
    }
    cancelButton.style.display = 'inline-block';
    
    // Прокручиваем к форме
    document.getElementById('article').scrollIntoView({ behavior: 'smooth' });
}

// Сохранение отредактированного товара
window.saveEditedProduct = async function(productId) {
    const user = getCurrentUser();
    if (!user) {
        showAlert('formAlert', 'Вы не авторизованы', 'danger');
        return;
    }
    
    // Получаем данные из формы
    const article = document.getElementById('article').value.trim();
    const name = document.getElementById('productName').value.trim();
    const productType = document.getElementById('productType').value;
    const expiryDate = document.getElementById('expiryDate').value;
    
    // Валидация
    if (!article || !name || !expiryDate) {
        showAlert('formAlert', 'Пожалуйста, заполните все обязательные поля', 'warning');
        return;
    }
    
    // Проверяем, что дата не в прошлом
    if (!isValidFutureDate(expiryDate)) {
        showAlert('formAlert', 'Дата сдачи не может быть в прошлом!', 'danger');
        return;
    }
    
    try {
        let products = await getProducts();
        const index = products.findIndex(p => p.id === productId);
        
        if (index !== -1) {
            // Проверяем права доступа
            const product = products[index];
            if (user.role !== 'admin' && product.owner !== user.username) {
                showAlert('formAlert', 'Вы можете редактировать только свои товары!', 'danger');
                return;
            }
            
            // Проверяем, есть ли уже товар с таким артикулом и датой сдачи (кроме текущего)
            const duplicate = products.find(p => 
                p.id !== productId && 
                p.article === article && 
                p.expiry_date === expiryDate
            );
            
            if (duplicate) {
                showAlert('formAlert', `Товар с артикулом "${article}" и датой сдачи ${formatDate(expiryDate)} уже существует!`, 'danger');
                return;
            }
            
            // Обновляем товар
            const updatedProduct = {
                ...products[index],
                article: article,
                name: name,
                type: productType,
                expiry_date: expiryDate,
                updated_at: new Date().toISOString(),
                updated_by: user.username
            };
            
            // Обновляем на сервере
            const result = await updateProductInBackend(productId, updatedProduct);
            
            if (result.success) {
                // Обновляем локально
                products[index] = updatedProduct;
                saveProducts(products);
                
                // Восстанавливаем кнопку
                cancelEdit();
                
                // Показываем уведомление
                showAlert('formAlert', 'Товар успешно обновлен!', 'success');
                
                // Обновляем отображение
                updateProductsDisplay();
            } else {
                showAlert('formAlert', `Ошибка обновления: ${result.error}`, 'danger');
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении товара:', error);
        showAlert('formAlert', 'Ошибка при обновлении товара', 'danger');
    }
};

// Отмена редактирования
window.cancelEdit = function() {
    const addButton = document.querySelector('.btn-add');
    addButton.innerHTML = '<i class="fas fa-save"></i> Добавить товар';
    delete addButton.dataset.editingId;
    
    const cancelButton = document.querySelector('.btn-cancel-edit');
    if (cancelButton) {
        cancelButton.style.display = 'none';
    }
    
    // Очищаем форму
    document.getElementById('article').value = '';
    document.getElementById('productName').value = '';
    document.getElementById('productType').value = 'regular';
    
    // Устанавливаем дату по умолчанию (через неделю)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    document.getElementById('expiryDate').value = nextWeek.toISOString().split('T')[0];
};

// === КОНЕЦ ФУНКЦИЙ УДАЛЕНИЯ И РЕДАКТИРОВАНИЯ ===

// Добавление нового товара
window.addProduct = async function() {
    const addButton = document.querySelector('.btn-add');
    
    // Если идет редактирование, сохраняем изменения
    if (addButton.dataset.editingId) {
        await saveEditedProduct(addButton.dataset.editingId);
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showAlert('formAlert', 'Вы не авторизованы', 'danger');
        return;
    }
    
    const article = document.getElementById('article').value.trim();
    const name = document.getElementById('productName').value.trim();
    const productType = document.getElementById('productType').value;
    const expiryDate = document.getElementById('expiryDate').value;
    
    if (!article || !name || !expiryDate) {
        showAlert('formAlert', 'Пожалуйста, заполните все обязательные поля', 'warning');
        return;
    }
    
    // Проверяем, что дата не в прошлом
    if (!isValidFutureDate(expiryDate)) {
        showAlert('formAlert', 'Дата сдачи не может быть в прошлом!', 'danger');
        return;
    }
    
    try {
        let products = await getProducts();
        
        // Проверяем, есть ли уже товар с таким артикулом и датой сдачи
        const duplicate = products.find(p => 
            p.article === article && p.expiry_date === expiryDate
        );
        
        if (duplicate) {
            showAlert('formAlert', `Товар с артикулом "${article}" и датой сдачи ${formatDate(expiryDate)} уже существует!`, 'danger');
            return;
        }
        
        // Создаем новый товар
        const newProduct = {
            article,
            name,
            type: productType,
            expiry_date: expiryDate,
            user_id: user.id,
            added_by: user.username,
            owner: user.username,
            owner_name: user.name,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // Отправляем на сервер
        const result = await addProductToBackend(newProduct);
        
        if (result.success) {
            // Добавляем ID от сервера
            newProduct.id = result.data.id;
            newProduct.added_date = new Date().toISOString().split('T')[0];
            
            // Добавляем локально
            products.push(newProduct);
            saveProducts(products);
            
            // Очищаем форму
            document.getElementById('article').value = '';
            document.getElementById('productName').value = '';
            
            // Устанавливаем дату по умолчанию (через неделю)
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            document.getElementById('expiryDate').value = nextWeek.toISOString().split('T')[0];
            
            showAlert('formAlert', 'Товар успешно добавлен!', 'success');
            
            // Обновляем отображение товаров
            updateProductsDisplay();
        } else {
            showAlert('formAlert', `Ошибка добавления: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Ошибка при добавлении товара:', error);
        showAlert('formAlert', 'Ошибка при добавлении товара', 'danger');
    }
};

// Фильтрация товаров
window.filterProducts = function(filterType) {
    currentFilter = filterType;
    
    // Обновляем активные кнопки фильтра
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    updateProductsDisplay();
};

// Обновление отображения товаров
async function updateProductsDisplay() {
    try {
        // Обновляем статистику
        updateStats();
        
        // Отображаем все товары (с учетом фильтра)
        displayAllProducts();
        
        // Отображаем товары на этой неделе
        displayWeekProducts();
        
        // Отображаем последние добавления
        displayRecentProducts();
        
        // Обновляем статистику пользователя
        updateUserStats();
    } catch (error) {
        console.error('Ошибка при обновлении отображения:', error);
    }
}

// Остальные функции (updateStats, displayAllProducts, displayWeekProducts, 
// displayRecentProducts, createProductElement, clearMyData, clearAllData)
// остаются без изменений, но должны быть асинхронными где нужно

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(updateUserStats, 100);
    
    // Добавляем стили для кнопок если их нет
    const style = document.createElement('style');
    style.textContent = `
        .product-actions {
            display: flex;
            gap: 5px;
        }
        
        .btn-edit-small, .btn-delete-small {
            width: 30px;
            height: 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.2s ease;
        }
        
        .btn-edit-small {
            background: var(--category-royal);
            color: white;
        }
        
        .btn-edit-small:hover {
            background: #1976D2;
            transform: translateY(-1px);
        }
        
        .btn-delete-small {
            background: #f44336;
            color: white;
        }
        
        .btn-delete-small:hover {
            background: #d32f2f;
            transform: translateY(-1px);
        }
        
        .btn-cancel {
            background: var(--text-secondary);
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s ease;
        }
        
        .btn-cancel:hover {
            background: #666;
        }
    `;
    document.head.appendChild(style);
});

// Экспортируем функции если нужно
export { getProducts, saveProducts };