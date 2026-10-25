/* ==========================================================================
   state.js — СТАН застосунку. Єдине джерело істини.

   Правило цього файлу: тут немає жодного звернення до document чи window.
   Лише дані та функції, що їх змінюють. Такий модуль можна протестувати
   без браузера — і рівно так само буде влаштований стан у React.
   ========================================================================== */

/** @typedef {{ id: string, firstName: string, lastName: string, role: string,
 *              photo: string | null, favorite: boolean, createdAt: number }} User */

/** @type {User[]} */
let users = [];

// Підписники — функції, які треба викликати після кожної зміни стану
// (рендеринг, збереження…). Set не дозволить підписати одну функцію двічі.
const listeners = new Set();

export const getUsers = () => users;

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);   // функція відписки
}

function notify() {
    listeners.forEach(listener => listener(users));
}

// crypto.randomUUID доступний лише в «безпечному контексті» (https, localhost).
// Якщо відкрити сторінку за IP у локальній мережі — знадобиться запасний варіант.
const createId = () =>
    crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/* --- Операції над станом ------------------------------------------------
   Кожна операція НЕ змінює масив на місці, а створює новий (незмінність,
   лекція 3). Так легко порівнювати «було/стало» і не ловити дивні баги. */

export function addUser({ firstName, lastName, role, photo = null }) {
    const user = {
        id: createId(),
        firstName,
        lastName,
        role,
        photo,
        favorite: false,
        createdAt: Date.now(),
    };

    users = [...users, user];
    notify();
    return user;
}

export function updateUser(id, changes) {
    users = users.map(user => (user.id === id ? { ...user, ...changes } : user));
    notify();
}

export function toggleFavorite(id) {
    const user = users.find(u => u.id === id);
    if (user) updateUser(id, { favorite: !user.favorite });
}

export function removeUser(id) {
    users = users.filter(user => user.id !== id);
    notify();
}

export function replaceAll(nextUsers) {
    users = [...nextUsers];
    notify();
}

/* --- Похідні дані ------------------------------------------------------
   Відфільтрований список НЕ зберігаємо в стані — обчислюємо щоразу.
   Інакше доведеться синхронізувати дві копії одних і тих самих даних. */

export function filterUsers(list, query) {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(({ firstName, lastName }) =>
        `${firstName} ${lastName}`.toLowerCase().includes(q));
}
