import { memo } from 'react';
import { Link } from 'react-router';
import { useFilmActions } from '../../context/FilmsContext.js';
import styles from './FilmCard.module.css';

/**
 * Картка фільму у списку.
 * @param {Object} props
 * @param {{id: string, title: string, year: number, watched: boolean}} props.film
 */
function FilmCard({ film }) {
  // Лише дії — тому картка НЕ залежить від FilmsContext і не перемальовується,
  // коли змінюється якийсь інший фільм
  const { toggleWatched } = useFilmActions();

  return (
    <article className={styles.card}>
      <h2 className={styles.title}>
        <Link to={`/films/${film.id}`}>{film.title}</Link>
      </h2>
      <p className="muted">{film.year}</p>

      {/* aria-pressed — кнопка-перемикач: читач екрана оголосить «натиснуто» */}
      <button
        type="button"
        className={`button button--secondary ${styles.toggle}`}
        aria-pressed={film.watched}
        onClick={() => toggleWatched(film.id)}
      >
        Переглянуто
      </button>
    </article>
  );
}

// memo: якщо prop film — той самий об'єкт, що й минулого разу, рендер пропускається.
// Редюсер створює новий об'єкт лише для зміненого фільму — решта карток «відпочиває».
export default memo(FilmCard);
