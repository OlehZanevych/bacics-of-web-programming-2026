import { useMemo, useRef, useState } from 'react';
import Field from '../../components/Field.jsx';
import { useFilms } from '../../context/FilmsContext.js';
import { useUnsavedChangesWarning } from '../../hooks/useUnsavedChangesWarning.js';
import { buildFilmSchema, validateAll, validateField } from '../../validation/filmValidation.js';
import styles from './FilmForm.module.css';

const EMPTY_VALUES = { title: '', year: '', note: '', watched: false };

/**
 * Одна форма і для створення, і для редагування.
 * Форма нічого не знає про маршрути чи редюсер — лише віддає дані через onSubmit.
 *
 * @param {Object} props
 * @param {typeof EMPTY_VALUES} [props.initialValues]
 * @param {string} [props.currentId] — id фільму, що редагується
 * @param {string} props.submitLabel
 * @param {(values: object) => void} props.onSubmit
 * @param {() => void} props.onCancel
 */
function FilmForm({ initialValues = EMPTY_VALUES, currentId, submitLabel, onSubmit, onCancel }) {
  const films = useFilms();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const formRef = useRef(null);

  // Схема залежить від списку фільмів (перевірка унікальності назви)
  const schema = useMemo(() => buildFilmSchema(films, currentId), [films, currentId]);

  // Похідне значення: обчислюємо під час рендера — ні стану, ні ефекту не треба
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
  useUnsavedChangesWarning(isDirty);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({ ...prev, [name]: nextValue }));

    // Поле вже з помилкою — перевіряємо на кожен символ:
    // помилка зникає «рано», щойно значення стало правильним
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(schema, name, nextValue) }));
    }
  };

  // …а з'являється «пізно» — коли користувач покинув поле
  const handleBlur = (event) => {
    // Фокус перейшов на кнопку відправки — усе перевірить handleSubmit.
    // Інакше помилка з'явиться ще до відпускання миші, зсуне кнопку вниз — і клік «промахнеться».
    if (event.relatedTarget?.type === 'submit') return;

    const { name, value } = event.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(schema, name, value) }));
  };

  const handleSubmit = (event) => {
    event.preventDefault(); // без цього браузер перезавантажить сторінку

    const nextErrors = validateAll(schema, values);
    setErrors(nextErrors);

    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      // Фокус на перше помилкове поле: користувач одразу бачить, що виправляти
      formRef.current.elements.namedItem(firstInvalid).focus();
      return;
    }

    onSubmit({
      title: values.title.trim(),
      year: Number(values.year), // з <input> завжди приходить рядок
      note: values.note.trim(),
      watched: values.watched,
    });
  };

  return (
    // noValidate: вимикаємо стандартні підказки браузера — валідуємо самі
    <form ref={formRef} className={styles.form} onSubmit={handleSubmit} noValidate>
      <Field label="Назва" error={errors.title}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="title"
            value={values.title}
            onChange={handleChange}
            onBlur={handleBlur}
            autoComplete="off"
          />
        )}
      </Field>

      <Field label="Рік" hint="Перший фільм зняли 1888 року" error={errors.year}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="year"
            type="number"
            inputMode="numeric"
            value={values.year}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}
      </Field>

      <Field label="Нотатка" hint="Необов'язково, до 300 символів" error={errors.note}>
        {(fieldProps) => (
          <textarea
            {...fieldProps}
            name="note"
            rows={3}
            value={values.note}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}
      </Field>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          name="watched"
          checked={values.watched}
          onChange={handleChange}
        />
        Уже переглянуто
      </label>

      {/* Кнопку НЕ блокуємо, поки форма невалідна: краще показати, що не так */}
      <div className="actions">
        <button type="submit" className="button">
          {submitLabel}
        </button>
        <button type="button" className="button button--secondary" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  );
}

export default FilmForm;
