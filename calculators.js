// Калькуляторы сроков годности и дат сдачи

// Расчет даты окончания срока годности
function calculateExpiryDate() {
    const productionDateInput = document.getElementById('productionDate').value;
    const shelfLifeMonths = parseInt(document.getElementById('shelfLife').value);
    
    if (!productionDateInput) {
        showAlert('formAlert', 'Пожалуйста, выберите дату изготовления', 'warning');
        return;
    }
    
    const productionDate = new Date(productionDateInput);
    const expiryDate = addMonths(productionDate, shelfLifeMonths);
    
    // Форматируем дату для отображения
    const formattedDate = formatDate(expiryDate.toISOString().split('T')[0]);
    
    // Показываем результат с анимацией
    document.getElementById('expiryDateResult').textContent = formattedDate;
    document.getElementById('expiryResult').style.display = 'block';
    
    // Сохраняем данные для возможного добавления в отслеживание
    window.calculatedExpiryData = {
        expiryDate: expiryDate.toISOString().split('T')[0],
        productionDate: productionDateInput,
        shelfLifeMonths: shelfLifeMonths
    };
}

// Расчет даты сдачи на склад
function calculateDeliveryDate() {
    const expiryDateInput = document.getElementById('expiryDateInput').value;
    const feedType = document.getElementById('feedType').value;
    
    if (!expiryDateInput) {
        showAlert('formAlert', 'Пожалуйста, выберите дату окончания срока годности', 'warning');
        return;
    }
    
    const expiryDate = new Date(expiryDateInput);
    const daysToSubtract = DELIVERY_TIMES[feedType];
    const deliveryDate = addDays(expiryDate, -daysToSubtract);
    
    // Форматируем дату для отображения
    const formattedDeliveryDate = formatDate(deliveryDate.toISOString().split('T')[0]);
    
    // Рассчитываем сколько дней осталось
    const today = new Date();
    const daysUntilDelivery = getDaysDifference(today, deliveryDate);
    
    // Показываем результат
    document.getElementById('deliveryDateResult').textContent = formattedDeliveryDate;
    document.getElementById('deliveryResult').style.display = 'block';
    
    // Отображаем информацию о днях до сдачи
    const daysToDeliveryElement = document.getElementById('daysToDelivery');
    const suggestionText = document.getElementById('suggestionText');
    const addButton = document.querySelector('#deliveryResult .btn-success');
    
    // Очищаем предыдущие сообщения
    daysToDeliveryElement.innerHTML = '';
    suggestionText.innerHTML = '';
    
    if (daysUntilDelivery < 0) {
        // Дата уже прошла - показываем ПРОСРОЧЕНО красным
        const daysOverdue = Math.abs(daysUntilDelivery);
        daysToDeliveryElement.innerHTML = `<div class="calculator-message message-danger">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>ПРОСРОЧЕНО!</strong><br>
                Дата сдачи прошла ${daysOverdue} ${getDayWord(daysOverdue)} назад
            </div>
        </div>`;
        
        suggestionText.innerHTML = `<div class="calculator-message message-danger">
            <i class="fas fa-times-circle"></i>
            <div>Товар необходимо было сдать до ${formattedDeliveryDate}. Сейчас уже поздно!</div>
        </div>`;
        addButton.style.display = 'none';
    } else if (daysUntilDelivery === 0) {
        // Сдать сегодня
        daysToDeliveryElement.innerHTML = `<div class="calculator-message message-danger">
            <i class="fas fa-exclamation-triangle"></i>
            <div><strong>СРОЧНО!</strong> Сдать сегодня!</div>
        </div>`;
        
        suggestionText.innerHTML = `<div class="calculator-message message-warning">
            <i class="fas fa-clock"></i>
            <div>Товар необходимо сдать сегодня! ${formattedDeliveryDate}</div>
        </div>`;
        addButton.style.display = 'inline-flex';
    } else if (daysUntilDelivery <= 7) {
        // Меньше недели
        daysToDeliveryElement.innerHTML = `<div class="calculator-message message-warning">
            <i class="fas fa-exclamation-circle"></i>
            <div><strong>Срочно!</strong> Осталось ${daysUntilDelivery} ${getDayWord(daysUntilDelivery)}</div>
        </div>`;
        
        suggestionText.innerHTML = `<div class="calculator-message message-warning">
            <i class="fas fa-calendar-day"></i>
            <div>Рекомендуется сдать в ближайшее время. Дата: ${formattedDeliveryDate}</div>
        </div>`;
        addButton.style.display = 'inline-flex';
    } else if (daysUntilDelivery <= 30) {
        // Меньше месяца
        daysToDeliveryElement.innerHTML = `<div class="calculator-message message-info">
            <i class="fas fa-calendar-alt"></i>
            <div>Осталось ${daysUntilDelivery} ${getDayWord(daysUntilDelivery)}</div>
        </div>`;
        
        suggestionText.innerHTML = `<div class="calculator-message message-info">
            <i class="fas fa-clock"></i>
            <div>Срок сдачи через ${daysUntilDelivery} ${getDayWord(daysUntilDelivery)}. Дата: ${formattedDeliveryDate}</div>
        </div>`;
        addButton.style.display = 'inline-flex';
    } else {
        // Больше месяца
        const monthsLeft = Math.floor(daysUntilDelivery / 30);
        const remainingDays = daysUntilDelivery % 30;
        
        let timeLeftText = `Осталось ${daysUntilDelivery} ${getDayWord(daysUntilDelivery)}`;
        if (monthsLeft > 0) {
            timeLeftText = `Осталось ${monthsLeft} ${getMonthWord(monthsLeft)}`;
            if (remainingDays > 0) {
                timeLeftText += ` и ${remainingDays} ${getDayWord(remainingDays)}`;
            }
        }
        
        daysToDeliveryElement.innerHTML = `<div class="calculator-message message-success">
            <i class="fas fa-check-circle"></i>
            <div>${timeLeftText}</div>
        </div>`;
        
        suggestionText.innerHTML = `<div class="calculator-message message-success">
            <i class="fas fa-calendar-check"></i>
            <div>Есть достаточно времени для подготовки. Дата сдачи: ${formattedDeliveryDate}</div>
        </div>`;
        
        // Показываем кнопку добавления только если дата в ближайших 3 месяцах
        if (daysUntilDelivery <= 90) {
            addButton.style.display = 'inline-flex';
        } else {
            addButton.style.display = 'none';
        }
    }
    
    // Сохраняем данные для возможного добавления в отслеживание
    window.calculatedDeliveryData = {
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        expiryDate: expiryDateInput,
        feedType: feedType,
        categoryName: FEED_CATEGORIES[feedType].name,
        daysToSubtract: daysToSubtract
    };
}

// Вспомогательная функция для правильного склонения слова "день"
function getDayWord(days) {
    const lastDigit = days % 10;
    const lastTwoDigits = days % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'дней';
    }
    
    switch (lastDigit) {
        case 1:
            return 'день';
        case 2:
        case 3:
        case 4:
            return 'дня';
        default:
            return 'дней';
    }
}

// Вспомогательная функция для правильного склонения слова "месяц"
function getMonthWord(months) {
    const lastDigit = months % 10;
    const lastTwoDigits = months % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
        return 'месяцев';
    }
    
    switch (lastDigit) {
        case 1:
            return 'месяц';
        case 2:
        case 3:
        case 4:
            return 'месяца';
        default:
            return 'месяцев';
    }
}

// Добавление товара в отслеживание из калькулятора срока годности
function addToTrackingFromExpiry() {
    if (!window.calculatedExpiryData) return;
    
    // Автоматически заполняем форму добавления товара
    const expiryDate = window.calculatedExpiryData.expiryDate;
    document.getElementById('expiryDate').value = expiryDate;
    
    // Прокручиваем к форме добавления товара
    document.getElementById('productName').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('productName').focus();
    
    showAlert('formAlert', 'Дата сдачи установлена. Заполните остальные поля и добавьте товар.', 'info');
}

// Добавление товара в отслеживание из калькулятора даты сдачи
function addToTrackingFromDelivery() {
    if (!window.calculatedDeliveryData) return;
    
    // Автоматически заполняем форму добавления товара
    const deliveryDate = window.calculatedDeliveryData.deliveryDate;
    document.getElementById('expiryDate').value = deliveryDate;
    
    // Устанавливаем тип товара
    const feedType = window.calculatedDeliveryData.feedType;
    document.getElementById('productType').value = feedType;
    
    // Прокручиваем к форме добавления товара
    document.getElementById('productName').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('productName').focus();
    
    showAlert('formAlert', 'Дата сдачи и категория товара установлены. Заполните остальные поля и добавьте товар.', 'info');
}