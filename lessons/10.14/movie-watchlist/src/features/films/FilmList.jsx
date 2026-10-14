import FilmItem from './FilmItem.jsx';
import styles from './FilmList.module.css';

/**
 * Список фільмів або повідомлення, що список порожній.
 *
 * @param {Object} props
 * @param {Array<{id: string, title: string, year: number, watched: boolean}>} props.films
 * @param {(id: string) => void} props.onToggle
 * @param {(id: string) => void} props.onDelete
 */
function FilmList({ films, onToggle, onDelete }) {
    // Умовний рендеринг: раннє повернення для «порожнього» випадку
    if (films.length === 0) {
        return <p className={styles.empty}>Тут поки порожньо.</p>;
    }

    return (
        <ul className={styles.list}>
            {films.map((film) => (
                <li key={film.id}>
                    <FilmItem film={film} onToggle={onToggle} onDelete={onDelete} />
                </li>
            ))}
        </ul>
    );
}

export default FilmList;