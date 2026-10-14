// Варіанти фільтра — одне джерело правди і для кнопок, і для логіки.
export const FILTERS = [
    { value: 'all', label: 'Усі' },
    { value: 'toWatch', label: 'Подивитися' },
    { value: 'watched', label: 'Переглянуті' },
];

// Чиста функція: той самий вхід → той самий результат, без побічних ефектів.
export function matchesFilter(film, filter) {
    if (filter === 'watched') return film.watched;
    if (filter === 'toWatch') return !film.watched;
    return true;
}