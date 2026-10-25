/* ==========================================================================
   main.js — точка входу (класичний скрипт, підключений з defer).
   Знаходить елементи, вішає обробники подій і зв'язує частини між собою:

       подія користувача → зміна СТАНУ → render() + saveUsers()

   Жоден обробник тут не змінює DOM «напряму» (крім дрібниць на кшталт
   прев'ю фото). Вони лише викликають функції з state.js, а DOM
   перемальовується сам — бо render() підписаний на зміни стану.
   ========================================================================== */

/* Класичний скрипт: import недоступний. Беремо готові об'єкти з глобального
   App, який заповнили попередні скрипти (state.js, storage.js, photo.js,
   render.js).

   ⚠️ Тому ПОРЯДОК тегів <script> в index.html має значення: якщо main.js
   підключити першим, тут буде помилка «App is not defined».

   Зверніть увагу: цей файл НЕ загорнутий в IIFE, тож усі його змінні
   верхнього рівня (form, list, ui, render…) — глобальні.
   🧪 Наберіть у консолі DevTools:  ui   або   state.getUsers()
   У версії з ES-модулями (02-user-cards-es-modules) так не вийде. */

const state = App.state;
const { renderUserList } = App.render;
const { STORAGE_KEY, loadUsers, saveUsers, debounce, onExternalChange } = App.storage;
const { createAvatar } = App.photo;

/* --- 1. Посилання на елементи ------------------------------------------ */

const form = document.querySelector('#user-form');
const photoInput = form.elements.photo;          // form.elements — поля за name
const photoPreview = document.querySelector('#photo-preview');
const dropzone = document.querySelector('#dropzone');
const dropzoneHint = dropzone.querySelector('.user-form__hint');

const list = document.querySelector('#user-list');
const emptyMessage = document.querySelector('#empty-message');
const searchInput = document.querySelector('#search');
const counter = document.querySelector('#counter');
const unsafeToggle = document.querySelector('#unsafe');
const clearAllButton = document.querySelector('#clear-all');

/* --- 2. Стан інтерфейсу ------------------------------------------------
   Не плутати зі станом даних: пошуковий запит і прев'ю фото не треба
   зберігати в localStorage, тому вони живуть окремо. */

const ui = {
    query: '',
    unsafe: false,
    pendingPhoto: null,   // data: URL вибраного, але ще не збереженого фото
};

/* --- 3. Рендеринг ------------------------------------------------------ */

function render() {
    const allUsers = state.getUsers();
    const visibleUsers = state.filterUsers(allUsers, ui.query);

    renderUserList(list, visibleUsers, { unsafe: ui.unsafe });

    counter.textContent = `Показано ${visibleUsers.length} з ${allUsers.length}`;
    clearAllButton.disabled = allUsers.length === 0;

    emptyMessage.hidden = visibleUsers.length > 0;
    emptyMessage.textContent = allUsers.length === 0
        ? 'Поки нікого немає. Додайте першого користувача!'
        : `За запитом «${ui.query}» нікого не знайдено.`;
}

/* Web Animations API: анімація прямо з JS, без жодного @keyframes у CSS */
function highlightCard(id) {
    const card = list.querySelector(`[data-id="${id}"]`);
    if (!card) return;   // картку може приховувати фільтр пошуку

    card.animate(
        [
            { opacity: 0, transform: 'translateY(-12px) scale(0.95)' },
            { opacity: 1, transform: 'none' },
        ],
        { duration: 300, easing: 'ease-out' },
    );
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function removeWithAnimation(card) {
    if (card.dataset.removing) return;    // захист від подвійного кліку
    card.dataset.removing = 'true';

    const animation = card.animate(
        [{ opacity: 1 }, { opacity: 0, transform: 'translateX(40px)' }],
        { duration: 200, easing: 'ease-in' },
    );

    // Анімація теж генерує подію! Стан змінюємо, коли вона завершилась.
    animation.addEventListener('finish', () => state.removeUser(card.dataset.id));
}

/* --- 4. Форма ---------------------------------------------------------- */

form.addEventListener('submit', event => {
    // Без цього рядка браузер відправить форму й ПЕРЕЗАВАНТАЖИТЬ сторінку.
    // 🧪 Закоментуйте його і подивіться на адресний рядок.
    event.preventDefault();

    // FormData збирає значення всіх полів з атрибутом name.
    // photo — це File, він нам тут не потрібен, тому «відкидаємо» його rest-ом.
    const { photo, ...fields } = Object.fromEntries(new FormData(form));
    console.log('Дані форми:', fields);

    const firstName = fields.firstName.trim();
    const lastName = fields.lastName.trim();

    // required пропускає рядок із самих пробілів — перевіряємо самі
    for (const [input, value] of [[form.elements.firstName, firstName], [form.elements.lastName, lastName]]) {
        if (!value) {
            input.setCustomValidity('Поле не може складатися лише з пробілів');
            input.reportValidity();   // показати стандартну підказку браузера
            return;
        }
    }

    const user = state.addUser({ firstName, lastName, role: fields.role, photo: ui.pendingPhoto });

    form.reset();                       // спрацює подія reset (нижче)
    form.elements.firstName.focus();
    highlightCard(user.id);
});

// Користувач почав виправляти поле — прибираємо нашу помилку.
// Один обробник на всю форму: подія input спливає від будь-якого поля.
form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
});

// ⚠️ Зміна value з JS НЕ генерує подію input — тоді помилку знімаємо самі
function clearCustomErrors() {
    for (const field of form.elements) field.setCustomValidity?.('');
}

form.addEventListener('reset', () => {
    clearCustomErrors();
    ui.pendingPhoto = null;
    photoPreview.hidden = true;
    photoPreview.removeAttribute('src');
    dropzoneHint.textContent = 'або перетягніть файл сюди';
});

// Кнопки «Випадковий» і «XSS-атака» — делегування через data-action
form.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'random') fillRandomUser();
    if (action === 'xss') fillXssPayload();
    if (action) clearCustomErrors();
});

const RANDOM_PEOPLE = [
    ['Олена', 'Коваленко', 'Студент'], ['Тарас', 'Шевчук', 'Студент'],
    ['Соломія', 'Бондар', 'Аспірант'], ['Андрій', 'Ткачук', 'Викладач'],
    ["Мар'яна", 'Гнатюк', 'Студент'], ['Остап', 'Мельник', 'Студент'],
    ['Ірина', 'Савчук', 'Викладач'], ['Богдан', 'Кравець', 'Аспірант'],
];

function fillRandomUser() {
    const [firstName, lastName, role] =
        RANDOM_PEOPLE[Math.floor(Math.random() * RANDOM_PEOPLE.length)];

    // Властивість value, а не атрибут: змінюємо ПОТОЧНЕ значення поля
    form.elements.firstName.value = firstName;
    form.elements.lastName.value = lastName;
    form.elements.role.value = role;
}

function fillXssPayload() {
    form.elements.firstName.value = `<img src=x onerror="alert('XSS!')">`;
    form.elements.lastName.value = 'Хакер';
    form.elements.role.value = 'Студент';
}

/* --- 5. Фото: вибір файлу та drag & drop -------------------------------- */

function usePhotoFile(file) {
    dropzoneHint.textContent = 'Обробляємо…';

    createAvatar(
        file,
        dataUrl => {
            ui.pendingPhoto = dataUrl;
            photoPreview.src = dataUrl;
            photoPreview.hidden = false;
            dropzoneHint.textContent = `${file.name} · ${Math.round(dataUrl.length / 1024)} КБ після стиснення`;
        },
        message => {
            dropzoneHint.textContent = message;
        },
    );
}

photoInput.addEventListener('change', () => {
    const [file] = photoInput.files;   // FileList — теж «не масив», але ітерується
    if (file) usePhotoFile(file);
});

// Дія браузера за замовчуванням при кидку файлу — ВІДКРИТИ його замість
// сторінки. Щоб зона прийняла файл, скасовуємо dragover і drop.
dropzone.addEventListener('dragover', event => {
    event.preventDefault();
    dropzone.classList.add('user-form__dropzone--over');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('user-form__dropzone--over');
});

dropzone.addEventListener('drop', event => {
    event.preventDefault();
    dropzone.classList.remove('user-form__dropzone--over');

    const [file] = event.dataTransfer.files;
    if (file) usePhotoFile(file);
});

/* --- 6. Список: ОДИН обробник на всі картки (делегування) --------------- */

list.addEventListener('click', event => {
    // closest шукає вгору від точки кліку — спрацює, навіть якщо клікнули
    // по символу ★ всередині кнопки
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const card = button.closest('.user-card');

    switch (button.dataset.action) {
        case 'favorite':
            state.toggleFavorite(card.dataset.id);
            break;
        case 'delete':
            removeWithAnimation(card);
            break;
    }
});

// Редагування імені на місці: подвійний клік → contenteditable
list.addEventListener('dblclick', event => {
    const nameEl = event.target.closest('.user-card__name');
    if (nameEl) startEditing(nameEl, nameEl.closest('.user-card').dataset.id);
});

function startEditing(nameEl, id) {
    const originalText = nameEl.textContent;

    // plaintext-only: при вставці з буфера — лише текст, жодного HTML
    nameEl.contentEditable = 'plaintext-only';
    nameEl.focus();
    document.getSelection().selectAllChildren(nameEl);

    // AbortController знімає ОБИДВА обробники нижче одним викликом abort()
    const controller = new AbortController();

    const finish = save => {
        controller.abort();
        nameEl.removeAttribute('contenteditable');

        const [firstName, ...rest] = nameEl.textContent.trim().split(/\s+/);
        const lastName = rest.join(' ');

        if (!save || !firstName || !lastName) {
            nameEl.textContent = originalText;   // скасування
            return;
        }
        state.updateUser(id, { firstName, lastName });
    };

    nameEl.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            event.preventDefault();   // не вставляти перенесення рядка
            finish(true);
        }
        if (event.key === 'Escape') finish(false);
    }, { signal: controller.signal });

    nameEl.addEventListener('blur', () => finish(true), { signal: controller.signal });
}

/* --- 7. Пошук, небезпечний режим, очищення ------------------------------ */

// input — на КОЖНУ зміну (на відміну від change, що чекає втрати фокуса)
searchInput.addEventListener('input', () => {
    ui.query = searchInput.value;
    render();
});

unsafeToggle.addEventListener('change', () => {
    ui.unsafe = unsafeToggle.checked;
    render();
});

clearAllButton.addEventListener('click', () => {
    if (confirm(`Видалити всіх користувачів (${state.getUsers().length})?`)) {
        state.replaceAll([]);
    }
});

/* --- 8. Гарячі клавіші ------------------------------------------------- */

const isTyping = el => el.isContentEditable || el.matches('input, textarea, select');

document.addEventListener('keydown', event => {
    // event.code — фізична клавіша: працює і в українській розкладці,
    // де event.key для цієї клавіші — '.'
    if (event.code === 'Slash' && !isTyping(event.target)) {
        event.preventDefault();
        searchInput.focus();
    }
});

/* --- 9. Запуск ---------------------------------------------------------- */

state.subscribe(render);                          // будь-яка зміна → перемалювати
state.subscribe(debounce(saveUsers, 300));        // …і зберегти (не частіше ніж раз на 300 мс)

onExternalChange(users => state.replaceAll(users));   // зміни з іншої вкладки

if (localStorage.getItem(STORAGE_KEY) === null) {
    // Перший запуск — кілька демонстраційних записів
    RANDOM_PEOPLE.slice(0, 3).forEach(([firstName, lastName, role]) =>
        state.addUser({ firstName, lastName, role }));
} else {
    state.replaceAll(loadUsers());
}
