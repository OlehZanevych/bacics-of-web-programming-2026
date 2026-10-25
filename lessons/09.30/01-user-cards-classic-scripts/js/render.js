/* ==========================================================================
   render.js — перетворення СТАНУ на DOM.

   Функції тут лише читають дані й будують елементи. Вони нічого не
   змінюють у стані — так завжди зрозуміло, звідки береться картинка
   на екрані: «DOM = render(стан)».
   ========================================================================== */

/* Класичний скрипт (не модуль): тут немає import / export.
   Усе, що оголошено на верхньому рівні такого файлу, стає ГЛОБАЛЬНИМ і
   видимим у всіх інших скриптах сторінки — легко отримати конфлікт імен.
   Тому ховаємо код у функцію, що одразу викликається (IIFE), а назовні
   відкриваємо лише один об'єкт: App.render. Так писали до появи модулів. */

window.App = window.App || {};

App.render = (() => {
    const template = document.querySelector('#user-card-template');

    const timeFormatter = new Intl.DateTimeFormat('uk-UA', { timeStyle: 'short' });

    /* Колір аватарки обчислюємо з імені: однакове ім'я → однаковий колір.
       Простий хеш рядка → число від 0 до 359 (відтінок у HSL). */
    function hueFromText(text) {
        let hash = 0;
        for (const char of text) {
            hash = (hash * 31 + char.codePointAt(0)) % 360;
        }
        return hash;
    }

    const initialsOf = ({ firstName, lastName }) =>
        `${firstName.at(0) ?? ''}${lastName.at(0) ?? ''}`.toUpperCase();

    /**
     * Створює картку одного користувача з <template>.
     * @param {object} user
     * @param {{ unsafe: boolean }} options
     */
    function createUserCard(user, { unsafe = false } = {}) {
        // true — глибоке клонування, разом з усіма нащадками
        const card = template.content.firstElementChild.cloneNode(true);

        // dataset → атрибут data-id. Саме за ним делегований обробник
        // дізнається, по якій картці клікнули.
        card.dataset.id = user.id;
        card.classList.toggle('user-card--favorite', user.favorite);

        const fullName = `${user.firstName} ${user.lastName}`;
        const nameEl = card.querySelector('.user-card__name');

        if (unsafe) {
            // ⚠️ ТАК РОБИТИ НЕ МОЖНА. Рядок від користувача стає HTML-кодом:
            // <img src=x onerror="…"> виконає будь-який JavaScript.
            nameEl.innerHTML = fullName;
        } else {
            // ✅ textContent: будь-які < > & стають просто символами.
            nameEl.textContent = fullName;
        }

        card.querySelector('.user-card__meta').textContent =
            `${user.role} · додано о ${timeFormatter.format(user.createdAt)}`;

        const photoEl = card.querySelector('.user-card__photo');
        const initialsEl = card.querySelector('.user-card__initials');

        // У шаблоні є обидва варіанти аватарки — зайвий просто видаляємо
        if (user.photo) {
            photoEl.src = user.photo;
            photoEl.alt = fullName;
            photoEl.hidden = false;
            initialsEl.remove();
        } else {
            photoEl.remove();
            initialsEl.textContent = initialsOf(user);
            // CSS-змінна: JS задає ЛИШЕ число, а вигляд описаний у CSS
            initialsEl.style.setProperty('--hue', hueFromText(fullName));
        }

        const favoriteButton = card.querySelector('[data-action="favorite"]');
        favoriteButton.textContent = user.favorite ? '★' : '☆';
        favoriteButton.setAttribute('aria-pressed', String(user.favorite));

        return card;
    }

    /**
     * Перемальовує весь список. Для навчального прикладу цього достатньо;
     * у React ту саму роботу (але розумніше) робить «віртуальний DOM».
     */
    function renderUserList(listEl, users, options) {
        // DocumentFragment — «невидимий контейнер»: збираємо всі картки в ньому,
        // а в живий DOM вставляємо ОДНИМ викликом (один перерахунок макета).
        const fragment = document.createDocumentFragment();

        for (const user of users) {
            fragment.append(createUserCard(user, options));
        }

        listEl.replaceChildren(fragment);   // очистити + вставити
    }

    // «Експорт»: лише те, що повертаємо, буде доступне ззовні
    return {
        hueFromText,
        createUserCard,
        renderUserList,
    };
})();
