import { useState } from 'react';
import Button from '../../components/Button/Button.jsx';
import styles from './FilmForm.module.css';

const EMPTY_FORM = { title: '', year: '' };
const MIN_YEAR = 1888; // рік першого відомого фільму
const MAX_YEAR = new Date().getFullYear();

/**
 * Форма додавання фільму. Тримає ЛИШЕ стан своїх полів —
 * список фільмів їй не належить, тому новий фільм вона
 * віддає батькові через onAdd.
 *
 * @param {Object} props
 * @param {(film: {title: string, year: number}) => void} props.onAdd
 */
function FilmForm({ onAdd }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState('');

    // Один обробник на всі поля: name поля = ключ в об'єкті form
    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault(); // інакше браузер перезавантажить сторінку

        const title = form.title.trim();
        const year = Number(form.year);

        if (title === '') {
            setError('Введіть назву фільму.');
            return;
        }
        if (!Number.isInteger(year) || year < MIN_YEAR || year > MAX_YEAR) {
            setError(`Рік має бути від ${MIN_YEAR} до ${MAX_YEAR}.`);
            return;
        }

        onAdd({ title, year });
        setForm(EMPTY_FORM);
        setError('');
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
                <label htmlFor="film-title">Назва</label>
                <input
                    id="film-title"
                    name="title"
                    type="text"
                    autoComplete="off"
                    value={form.title}
                    onChange={handleChange}
                />
            </div>

            <div className={styles.field}>
                <label htmlFor="film-year">Рік</label>
                <input
                    id="film-year"
                    name="year"
                    type="number"
                    min={MIN_YEAR}
                    max={MAX_YEAR}
                    value={form.year}
                    onChange={handleChange}
                />
            </div>

            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}

            <Button type="submit">Додати фільм</Button>
        </form>
    );
}

export default FilmForm;