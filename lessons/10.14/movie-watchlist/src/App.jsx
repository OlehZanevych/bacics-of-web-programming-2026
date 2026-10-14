import { useState } from 'react';
import Panel from './components/Panel/Panel.jsx';
import FilmForm from './features/films/FilmForm.jsx';
import FilmFilters from './features/films/FilmFilters.jsx';
import FilmList from './features/films/FilmList.jsx';
import { matchesFilter } from './features/films/filters.js';
import { initialFilms } from './data/films.js';
import styles from './App.module.css';

function App() {
    // СТАН — лише те, що змінюється і що неможливо обчислити
    const [films, setFilms] = useState(initialFilms);
    const [filter, setFilter] = useState('all');

    // ПОХІДНІ ДАНІ — обчислюємо під час кожного рендеру, у стані не зберігаємо
    const visibleFilms = films.filter((film) => matchesFilter(film, filter));
    const watchedCount = films.filter((film) => film.watched).length;

    // ОБРОБНИКИ — єдине місце, де змінюється список фільмів.
    // Кожен створює НОВИЙ масив, а не змінює старий.
    const handleAdd = ({ title, year }) => {
        const newFilm = { id: crypto.randomUUID(), title, year, watched: false };
        setFilms((prev) => [newFilm, ...prev]);
    };

    const handleToggle = (id) => {
        setFilms((prev) =>
            prev.map((film) =>
                film.id === id ? { ...film, watched: !film.watched } : film,
            ),
        );
    };

    const handleDelete = (id) => {
        setFilms((prev) => prev.filter((film) => film.id !== id));
    };

    return (
        <div className={styles.app}>
            <header className={styles.header}>
                <h1 className={styles.title}>Кіносписок</h1>
                <p className={styles.subtitle}>Українське кіно, яке варто подивитися</p>
            </header>

            <main className={styles.layout}>
                <Panel title="Новий фільм">
                    <FilmForm onAdd={handleAdd} />
                </Panel>

                <Panel
                    title="Мій список"
                    footer={
                        films.length > 0 && (
                            <p>
                                Переглянуто {watchedCount} з {films.length}
                            </p>
                        )
                    }
                >
                    <FilmFilters value={filter} onChange={setFilter} />
                    <FilmList
                        films={visibleFilms}
                        onToggle={handleToggle}
                        onDelete={handleDelete}
                    />
                </Panel>
            </main>
        </div>
    );
}

export default App;