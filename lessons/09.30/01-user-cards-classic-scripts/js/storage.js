/* ==========================================================================
   storage.js — збереження стану в localStorage.

   localStorage зберігає ЛИШЕ рядки → JSON.stringify / JSON.parse.
   Дані звідти — зовнішні: їх могли пошкодити, змінити руками в DevTools
   або записати старою версією застосунку. Тому — try/catch і валідація.
   ========================================================================== */

/* Класичний скрипт (не модуль): тут немає import / export.
   Усе, що оголошено на верхньому рівні такого файлу, стає ГЛОБАЛЬНИМ і
   видимим у всіх інших скриптах сторінки — легко отримати конфлікт імен.
   Тому ховаємо код у функцію, що одразу викликається (IIFE), а назовні
   відкриваємо лише один об'єкт: App.storage. Так писали до появи модулів. */

window.App = window.App || {};

App.storage = (() => {
    const STORAGE_KEY = 'lecture-04:users:v1';

    const isValidUser = user =>
        user !== null &&
        typeof user === 'object' &&
        typeof user.id === 'string' &&
        typeof user.firstName === 'string' &&
        typeof user.lastName === 'string';

    function parseUsers(raw) {
        try {
            const parsed = JSON.parse(raw ?? '[]');
            return Array.isArray(parsed) ? parsed.filter(isValidUser) : [];
        } catch (error) {
            console.warn('Пошкоджені дані в localStorage — ігноруємо їх.', error);
            return [];
        }
    }

    const loadUsers = () => parseUsers(localStorage.getItem(STORAGE_KEY));

    function saveUsers(users) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
        } catch (error) {
            // QuotaExceededError — сховище переповнене (~5 МБ на сайт)
            console.warn('Не вдалося зберегти користувачів:', error);
        }
    }

    /* debounce: виконати функцію лише після паузи у викликах.
       Якщо стан змінюється 10 разів поспіль, запис відбудеться один раз. */
    function debounce(fn, delay) {
        let timerId;
        return (...args) => {
            clearTimeout(timerId);
            timerId = setTimeout(() => fn(...args), delay);
        };
    }

    /* Подія storage приходить в ІНШІ вкладки того самого сайту, коли ця
       вкладка змінила localStorage. 🧪 Відкрийте сторінку у двох вкладках! */
    function onExternalChange(callback) {
        window.addEventListener('storage', event => {
            if (event.key === STORAGE_KEY) {
                callback(parseUsers(event.newValue));
            }
        });
    }

    // «Експорт»: лише те, що повертаємо, буде доступне ззовні
    return {
        STORAGE_KEY,
        parseUsers,
        loadUsers,
        saveUsers,
        debounce,
        onExternalChange,
    };
})();
