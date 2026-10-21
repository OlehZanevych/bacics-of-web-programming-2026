import { useEffect, useMemo, useReducer } from 'react';
import { FilmActionsContext, FilmsContext } from './FilmsContext.js';
import {
    filmAdded,
    filmDeleted,
    filmsReducer,
    filmUpdated,
    watchedToggled,
} from '../store/filmsReducer.js';
import { seedFilms } from '../data/seedFilms.js';

// Версія в ключі: коли зміниться структура даних, змінимо на :v2,
// і стара збережена версія не зламає аплікацію.
const STORAGE_KEY = 'film-library:films:v1';

// Початковий стан читаємо ОДИН раз — третім аргументом useReducer.
function loadFilms() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : seedFilms;
    } catch {
        return seedFilms;
    }
}

export function FilmsProvider({ children }) {
    const [films, dispatch] = useReducer(filmsReducer, null, loadFilms);

    // Синхронізація із зовнішньою системою (localStorage) — справжня робота для ефекту
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(films));
        } catch (error) {
            console.warn('Не вдалося зберегти фільми:', error);
        }
    }, [films]);

    // Дії, прив'язані до dispatch. dispatch стабільний, тому об'єкт створюється
    // один раз і споживачі FilmActionsContext ніколи не перемальовуються через нього.
    const actions = useMemo(
        () => ({
            addFilm: (data) => {
                const action = filmAdded(data);
                dispatch(action);
                return action.payload; // новий фільм разом з id — щоб перейти на його сторінку
            },
            updateFilm: (id, changes) => dispatch(filmUpdated(id, changes)),
            deleteFilm: (id) => dispatch(filmDeleted(id)),
            toggleWatched: (id) => dispatch(watchedToggled(id)),
        }),
        [],
    );

    return (
        <FilmActionsContext value={actions}>
            <FilmsContext value={films}>{children}</FilmsContext>
        </FilmActionsContext>
    );
}