import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { useFilmActions, useFilms } from '../context/FilmsContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useFilmInfo } from '../hooks/useFilmInfo.js';
import NotFoundPage from './NotFoundPage.jsx';
import styles from './FilmDetailsPage.module.css';

function FilmDetailsPage() {
    const { id } = useParams(); // параметри шляху — завжди рядки
    const films = useFilms();
    const { toggleWatched, deleteFilm } = useFilmActions();
    const navigate = useNavigate();
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const index = films.findIndex((item) => item.id === id);
    const film = films[index];

    // Усі хуки — ДО умовного return: їхня кількість і порядок не мають змінюватися
    useDocumentTitle(film ? film.title : 'Фільм не знайдено');
    const info = useFilmInfo(id);

    if (!film) {
        return <NotFoundPage message="Такого фільму немає у списку." />;
    }

    const previous = films[index - 1];
    const next = films[index + 1];

    const handleDelete = () => {
        deleteFilm(film.id);
        // replace: сторінки видаленого фільму не має бути в історії «Назад»
        navigate('/', { replace: true });
    };

    return (
        <article>
            <Link to="/" className={styles.back}>
                ← До списку
            </Link>

            <div className="page-header">
                <h1 className="page-title">{film.title}</h1>
                <div className="actions">
                    <Link to={`/films/${film.id}/edit`} className="button button--secondary">
                        Редагувати
                    </Link>
                    <button
                        type="button"
                        className="button button--danger"
                        onClick={() => setIsConfirmOpen(true)}
                    >
                        Видалити
                    </button>
                </div>
            </div>

            <dl className={styles.facts}>
                <div>
                    <dt>Рік</dt>
                    <dd>{film.year}</dd>
                </div>
                <div>
                    <dt>Статус</dt>
                    <dd>{film.watched ? 'Переглянуто' : 'Подивитися'}</dd>
                </div>
                {film.note && (
                    <div>
                        <dt>Нотатка</dt>
                        <dd>{film.note}</dd>
                    </div>
                )}
            </dl>

            <button type="button" className="button" onClick={() => toggleWatched(film.id)}>
                {film.watched ? 'Позначити як непереглянутий' : 'Позначити як переглянутий'}
            </button>

            <section className={styles.info} aria-labelledby="info-title" aria-busy={info.status === 'loading'}>
                <h2 id="info-title">Довідка</h2>
                {info.status === 'loading' && <p className="muted">Завантаження довідки…</p>}
                {info.status === 'error' && (
                    <p className={styles.error} role="alert">
                        Не вдалося завантажити довідку: {info.error.message}
                    </p>
                )}
                {info.status === 'success' && info.data === null && (
                    <p className="muted">Для цього фільму довідки поки немає.</p>
                )}
                {info.status === 'success' && info.data !== null && (
                    <>
                        <p>
                            <strong>Режисер:</strong> {info.data.director}
                        </p>
                        <p>{info.data.description}</p>
                    </>
                )}
            </section>

            <nav className={styles.pager} aria-label="Сусідні фільми">
                {previous && <Link to={`/films/${previous.id}`}>← {previous.title}</Link>}
                {next && (
                    <Link to={`/films/${next.id}`} className={styles.next}>
                        {next.title} →
                    </Link>
                )}
            </nav>

            <ConfirmDialog
                open={isConfirmOpen}
                title="Видалити фільм?"
                message={`«${film.title}» буде видалено зі списку. Цю дію не можна скасувати.`}
                confirmLabel="Видалити"
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
            />
        </article>
    );
}

export default FilmDetailsPage;