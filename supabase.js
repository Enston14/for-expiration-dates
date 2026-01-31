// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ⚠️ ЗАМЕНИТЕ эти значения на свои!
const SUPABASE_URL = 'https://loxhcumiievrrmebfzye.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_C8hky3Y38iN7VWKJcqahIA_EFACCVAM'

// Создаем клиент Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Функции для работы с пользователями
export async function signUpUser(username, password, name, role = 'user') {
    try {
        // Проверяем, есть ли уже такой пользователь
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single()
        
        if (existingUser) {
            return { success: false, error: 'Пользователь уже существует' }
        }
        
        // Создаем пользователя (в реальном проекте нужно хэшировать пароль)
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    username,
                    password_hash: btoa(password), // простейшее "шифрование", в продакшене используйте bcrypt
                    name,
                    role
                }
            ])
            .select()
            .single()
        
        if (error) throw error
        
        return { success: true, data }
    } catch (error) {
        console.error('Ошибка регистрации:', error)
        return { success: false, error: error.message }
    }
}

export async function loginUser(username, password) {
    try {
        // Ищем пользователя
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password_hash', btoa(password))
            .single()
        
        if (error) {
            if (error.code === 'PGRST116') { // Пользователь не найден
                return { success: false, error: 'Неверный логин или пароль' }
            }
            throw error
        }
        
        if (!user) {
            return { success: false, error: 'Неверный логин или пароль' }
        }
        
        // Сохраняем в localStorage для сессии
        localStorage.setItem('warehouse_session', JSON.stringify({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            loggedIn: true
        }))
        
        return { success: true, data: user }
    } catch (error) {
        console.error('Ошибка входа:', error)
        return { success: false, error: error.message }
    }
}

export async function logoutUser() {
    localStorage.removeItem('warehouse_session')
    return { success: true }
}

// Функции для работы с товарами
export async function getProducts(userId = null) {
    try {
        let query = supabase
            .from('products')
            .select('*')
            .order('expiry_date', { ascending: true })
        
        // Если указан userId, фильтруем по пользователю
        if (userId) {
            query = query.eq('user_id', userId)
        }
        
        const { data, error } = await query
        
        if (error) throw error
        
        return { success: true, data: data || [] }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error)
        return { success: false, error: error.message, data: [] }
    }
}

export async function addProduct(productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select()
            .single()
        
        if (error) throw error
        
        return { success: true, data }
    } catch (error) {
        console.error('Ошибка добавления товара:', error)
        return { success: false, error: error.message }
    }
}

export async function updateProduct(productId, productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', productId)
            .select()
            .single()
        
        if (error) throw error
        
        return { success: true, data }
    } catch (error) {
        console.error('Ошибка обновления товара:', error)
        return { success: false, error: error.message }
    }
}

export async function deleteProduct(productId) {
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)
        
        if (error) throw error
        
        return { success: true }
    } catch (error) {
        console.error('Ошибка удаления товара:', error)
        return { success: false, error: error.message }
    }
}

// Функция для получения текущего пользователя
export function getCurrentUser() {
    const session = localStorage.getItem('warehouse_session')
    return session ? JSON.parse(session) : null
}

// Функция для проверки авторизации
export function isLoggedIn() {
    return !!getCurrentUser()
}

// Экспортируем клиент для других нужд
export { supabase }