// --- Правила -----------------------------------------------------------------
// Кожне правило — функція, що повертає текст помилки або null.
// Правила описані окремо від компонента: їх легко читати, комбінувати й тестувати.

const required = (message = "Обов'язкове поле") => (value) =>
    String(value ?? '').trim() === '' ? message : null;

const minLength = (min) => (value) =>
    String(value).trim().length < min ? `Мінімум ${min} символи` : null;

const maxLength = (max) => (value) =>
    String(value).length > max ? `Максимум ${max} символів` : null;

const integerInRange = (min, max) => (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= min && number <= max
        ? null
        : `Введіть рік від ${min} до ${max}`;
};

const uniqueTitle = (films, currentId) => (value) => {
    const title = String(value).trim().toLowerCase();
    const exists = films.some(
        (film) => film.id !== currentId && film.title.trim().toLowerCase() === title,
    );
    return exists ? 'Фільм із такою назвою вже є у списку' : null;
};

// --- Схема ---------------------------------------------------------------------
// Для кожного поля — список правил. Перевіряються по черзі до першої помилки.

/**
 * @param {Array<{id: string, title: string}>} films — для перевірки унікальності
 * @param {string} [currentId] — id фільму, який редагуємо (його назва «не заважає» сама собі)
 */
export function buildFilmSchema(films, currentId) {
    return {
        title: [required(), minLength(2), maxLength(100), uniqueTitle(films, currentId)],
        year: [required(), integerInRange(1888, new Date().getFullYear())],
        note: [maxLength(300)],
    };
}

export function validateField(schema, name, value) {
    for (const rule of schema[name] ?? []) {
        const error = rule(value);
        if (error) return error;
    }
    return null;
}

export function validateAll(schema, values) {
    const errors = {};
    for (const name of Object.keys(schema)) {
        const error = validateField(schema, name, values[name]);
        if (error) errors[name] = error;
    }
    return errors;
}