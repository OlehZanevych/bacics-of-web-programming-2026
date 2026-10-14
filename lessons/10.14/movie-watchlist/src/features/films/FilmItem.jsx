import Button from '../../components/Button/Button.jsx';
import styles from './FilmItem.module.css';

/**
 * Один рядок списку: позначка «переглянуто», назва, рік, кнопка видалення.
 * Власного стану не має — лише показує дані й повідомляє батька про дії.
 *
 * @param {Object} props
 * @param {{id: string, title: string, year: number, watched: boolean}} props.film
 * @param {(id: string) => void} props.onToggle
 * @param {(id: string) => void} props.onDelete
 */
function FilmItem({ film, onToggle, onDelete }) {
    const checkboxId = `watched-${film.id}`;

    return (
        <div className={`${styles.item} ${film.watched ? styles.watched : ''}`}>
            <input
                id={checkboxId}
                type="checkbox"
                className={styles.checkbox}
                checked={film.watched}
                onChange={() => onToggle(film.id)}
            />
            <label htmlFor={checkboxId} className={styles.label}>
                {film.title} <span className={styles.year}>{film.year}</span>
            </label>
            <Button
                variant="danger"
                onClick={() => onDelete(film.id)}
                aria-label={`Видалити «${film.title}»`}
            >
                Видалити
            </Button>
        </div>
    );
}

export default FilmItem;