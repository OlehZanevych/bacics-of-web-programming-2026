import { ConflictError, ValidationError } from '../errors/index.js';

// Обмеження бази — остання лінія оборони. Якщо порушення «проскочило» повз перевірки
// сервісу (наприклад, два однакові POST одночасно), повертаємо зрозумілу помилку, а не 500.
export function translatePgError(error) {
  switch (error.code) {
    case '23505': // UNIQUE
      return new ConflictError('Запис із таким значенням уже існує');
    case '23503': // FOREIGN KEY
      return new ConflictError("Операція порушує зв'язок між записами");
    case '23514': // CHECK
      return new ValidationError([
        { field: 'body', message: `Порушено обмеження ${error.constraint}` },
      ]);
    case '22P02': // некоректний формат значення
      return new ValidationError([{ field: 'id', message: 'Некоректний формат значення' }]);
    default:
      return error;
  }
}
