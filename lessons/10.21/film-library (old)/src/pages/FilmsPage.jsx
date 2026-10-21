import { useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router';
import FilmCard from '../features/films/FilmCard.jsx';
import { useFilms } from '../context/FilmsContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import styles from './FilmsPage.module.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Усі' },
  { value: 'toWatch', label: 'Подивитися' },
  { value: 'watched', label: 'Переглянуті' },
];

function FilmsPage() {
  const films = useFilms();
  const searchRef = useRef(null);
  useDocumentTitle('Фільми');

  // Стан фільтрів живе в URL: ?q=тіні&status=watched
  // Таке посилання можна скопіювати, а кнопка «Назад» повертає попередній фільтр.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') ?? '';
  const status = searchParams.get('status') ?? 'all';

  const updateParam = (key, value, options) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      // Значення за замовчуванням з адреси прибираємо — URL лишається чистим
      if (value === '' || value === 'all') next.delete(key);
      else next.set(key, value);
      return next;
    }, options);
  };

  // Клавіша «/» переводить фокус у поле пошуку.
  // Слухач на window — зовнішня система, тому ефект з очищенням.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === '/' && document.activeElement !== searchRef.current) {
        event.preventDefault();
        searchRef.current.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Похідні дані: не стан і не ефект, а обчислення під час рендера.
  // useMemo — щоб не фільтрувати заново, коли змінилося щось інше.
  const visibleFilms = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return films.filter((film) => {
      if (status === 'watched' && !film.watched) return false;
      if (status === 'toWatch' && film.watched) return false;
      return film.title.toLowerCase().includes(normalized);
    });
  }, [films, query, status]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Фільми</h1>
        <Link to="/films/new" className="button">
          + Додати фільм
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input
          ref={searchRef}
          type="search"
          className={styles.search}
          placeholder="Пошук за назвою (натисніть /)"
          aria-label="Пошук за назвою"
          value={query}
          // replace: кожна літера НЕ стає окремим записом в історії
          onChange={(event) => updateParam('q', event.target.value, { replace: true })}
        />

        <div className={styles.filters} role="group" aria-label="Фільтр за статусом">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.filter}
              aria-pressed={status === option.value}
              onClick={() => updateParam('status', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* aria-live: читач екрана оголосить нову кількість після фільтрації */}
      <p className="muted" aria-live="polite">
        Показано {visibleFilms.length} з {films.length}
      </p>

      {visibleFilms.length > 0 ? (
        <ul className={styles.grid}>
          {visibleFilms.map((film) => (
            <li key={film.id}>
              <FilmCard film={film} />
            </li>
          ))}
        </ul>
      ) : (
        <div className={`stack ${styles.empty}`}>
          <p>Нічого не знайдено.</p>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setSearchParams({})}
          >
            Скинути фільтри
          </button>
        </div>
      )}
    </>
  );
}

export default FilmsPage;
