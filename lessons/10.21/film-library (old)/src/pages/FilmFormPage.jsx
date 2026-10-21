import { useNavigate, useParams } from 'react-router';
import FilmForm from '../features/films/FilmForm.jsx';
import { useFilmActions, useFilms } from '../context/FilmsContext.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import NotFoundPage from './NotFoundPage.jsx';

// Одна сторінка для двох маршрутів: /films/new і /films/:id/edit
function FilmFormPage() {
  const { id } = useParams();
  const isEdit = id !== undefined;
  const films = useFilms();
  const { addFilm, updateFilm } = useFilmActions();
  const navigate = useNavigate();

  const film = isEdit ? films.find((item) => item.id === id) : null;
  useDocumentTitle(isEdit ? 'Редагування' : 'Новий фільм');

  if (isEdit && !film) {
    return <NotFoundPage message="Фільм для редагування не знайдено." />;
  }

  // Рік у формі — рядок: так працює <input>
  const initialValues = film
    ? { title: film.title, year: String(film.year), note: film.note, watched: film.watched }
    : undefined;

  const handleSubmit = (values) => {
    if (isEdit) {
      updateFilm(id, values);
      navigate(`/films/${id}`, { replace: true });
    } else {
      const created = addFilm(values);
      // replace: після збереження «Назад» не повертає до заповненої форми
      navigate(`/films/${created.id}`, { replace: true });
    }
  };

  const handleCancel = () => navigate(isEdit ? `/films/${id}` : '/');

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{isEdit ? `Редагування: ${film.title}` : 'Новий фільм'}</h1>
      </div>

      {/* key: при переході «редагування» → «новий» React створює форму заново,
          і її стан (values, errors) скидається */}
      <FilmForm
        key={id ?? 'new'}
        initialValues={initialValues}
        currentId={id}
        submitLabel={isEdit ? 'Зберегти зміни' : 'Додати фільм'}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </>
  );
}

export default FilmFormPage;
