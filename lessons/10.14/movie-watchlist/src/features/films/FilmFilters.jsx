import Button from '../../components/Button/Button.jsx';
import { FILTERS } from './filters.js';
import styles from './FilmFilters.module.css';

/**
 * Перемикач фільтра. Який фільтр обрано — вирішує батько (value),
 * компонент лише показує кнопки й повідомляє про вибір (onChange).
 *
 * @param {Object} props
 * @param {string} props.value — поточний фільтр
 * @param {(value: string) => void} props.onChange
 */
function FilmFilters({ value, onChange }) {
    return (
        <div className={styles.filters} role="group" aria-label="Фільтр списку">
            {FILTERS.map((filter) => (
                <Button
                    key={filter.value}
                    variant="secondary"
                    className={styles.filter}
                    aria-pressed={value === filter.value}
                    onClick={() => onChange(filter.value)}
                >
                    {filter.label}
                </Button>
            ))}
        </div>
    );
}

export default FilmFilters;