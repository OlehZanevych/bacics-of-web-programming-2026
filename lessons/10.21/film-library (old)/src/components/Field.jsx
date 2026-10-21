import { useId } from 'react';
import styles from './Field.module.css';

/**
 * Поле форми: підпис, підказка, помилка і всі aria-зв'язки між ними.
 * Сам елемент введення малює батько — через функцію в children
 * (так один Field підходить і для <input>, і для <textarea>).
 *
 * @param {Object} props
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {string | null} [props.error]
 * @param {(fieldProps: object) => React.ReactNode} props.children
 */
function Field({ label, hint, error, children }) {
  // Унікальний id для зв'язку label ↔ input, навіть якщо Field на сторінці кілька
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default Field;
