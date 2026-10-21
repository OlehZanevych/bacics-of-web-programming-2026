// --- Типи дій ---------------------------------------------------------------
// Константи замість рядків: описка в імені константи — помилка одразу,
// описка в рядку — мовчазний баг.
export const FILM_ADDED = 'films/added';
export const FILM_UPDATED = 'films/updated';
export const FILM_DELETED = 'films/deleted';
export const WATCHED_TOGGLED = 'films/watchedToggled';

// --- Творці дій ---------------------------------------------------------------
// id і дата створюються ТУТ, а не в редюсері: редюсер має бути чистим.
export const filmAdded = (data) => ({
    type: FILM_ADDED,
    payload: { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
});

export const filmUpdated = (id, changes) => ({
    type: FILM_UPDATED,
    payload: { id, changes },
});

export const filmDeleted = (id) => ({ type: FILM_DELETED, payload: id });

export const watchedToggled = (id) => ({ type: WATCHED_TOGGLED, payload: id });

// --- Редюсер ------------------------------------------------------------------
// Чиста функція: (поточний стан, дія) → новий стан.
// Жодних мутацій, запитів, localStorage, Date.now() чи Math.random().
export function filmsReducer(films, action) {
    switch (action.type) {
        case FILM_ADDED:
            return [action.payload, ...films];

        case FILM_UPDATED: {
            const { id, changes } = action.payload;
            return films.map((film) => (film.id === id ? { ...film, ...changes } : film));
        }

        case FILM_DELETED:
            return films.filter((film) => film.id !== action.payload);

        case WATCHED_TOGGLED:
            return films.map((film) =>
                film.id === action.payload ? { ...film, watched: !film.watched } : film,
            );

        default:
            return films;
    }
}