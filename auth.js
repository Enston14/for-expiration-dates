// auth.js
import { signUpUser, loginUser, logoutUser, getCurrentUser } from './supabase.js'

let currentUser = getCurrentUser()

// Переключение между вкладками входа и регистрации
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'login') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.getElementById('loginTab').classList.add('active');
    } else {
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('registerTab').classList.add('active');
    }
}

// Вход в систему (асинхронная версия для Supabase)
async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    
    if (!username || !password) {
        showAlert('loginAlert', 'Пожалуйста, заполните все поля', 'warning');
        return;
    }
    
    showAlert('loginAlert', 'Вход...', 'info');
    
    const result = await loginUser(username, password);
    
    if (result.success) {
        currentUser = {
            username: result.data.username,
            name: result.data.name,
            role: result.data.role,
            id: result.data.id,
            loggedIn: true
        };
        
        localStorage.setItem('warehouse_session', JSON.stringify(currentUser));
        showMainApp();
        showAlert('loginAlert', 'Вход успешен!', 'success');
    } else {
        showAlert('loginAlert', result.error || 'Неверный логин или пароль', 'danger');
    }
}

// Регистрация нового пользователя (асинхронная версия для Supabase)
async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const name = document.getElementById('registerName').value.trim();
    
    if (!username || !password || !name) {
        showAlert('registerAlert', 'Пожалуйста, заполните все поля', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showAlert('registerAlert', 'Пароль должен быть не менее 6 символов', 'danger');
        return;
    }
    
    showAlert('registerAlert', 'Регистрация...', 'info');
    
    const result = await signUpUser(username, password, name);
    
    if (result.success) {
        showAlert('registerAlert', 'Регистрация прошла успешно! Теперь вы можете войти.', 'success');
        
        // Очищаем поля
        document.getElementById('registerUsername').value = '';
        document.getElementById('registerPassword').value = '';
        document.getElementById('registerName').value = '';
        
        // Переключаемся на вкладку входа
        setTimeout(() => switchTab('login'), 1500);
    } else {
        showAlert('registerAlert', result.error || 'Ошибка регистрации', 'danger');
    }
}

// Показать основное приложение
function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    // Обновляем информацию о пользователе
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Администратор' : 'Пользователь';
    }
    
    updateUserStats();
    updateProductsDisplay();
}

// Выход из системы
async function logout() {
    if (confirm('Вы уверены, что хотите выйти из системы?')) {
        await logoutUser();
        currentUser = null;
        
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        
        // Очищаем поля входа
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        
        // Переключаемся на вкладку входа
        switchTab('login');
    }
}

// Показать экран входа
function showLoginScreen() {
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
    switchTab('login');
}

// Проверяем авторизацию при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        showMainApp();
    } else {
        showLoginScreen();
    }
});

// Делаем функции глобальными для использования из HTML
window.login = login;
window.register = register;
window.logout = logout;
window.switchTab = switchTab;
window.showMainApp = showMainApp;
window.showLoginScreen = showLoginScreen;