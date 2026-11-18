import { ValidationError } from '../errors/index.js';

// Куди класти очищені дані залежно від джерела
const TARGETS = { body: 'validatedBody', query: 'validatedQuery', params: 'validatedParams' };

/** Перетворює помилки Zod на [{ field, message }] — формат, який чекає клієнт */
export function toFieldErrors(issues, source) {
  return issues.flatMap((issue) => {
    // Невідомі поля (.strict()) Zod повідомляє одним записом на весь об'єкт
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({ field: key, message: 'Невідоме поле' }));
    }
    return [{ field: issue.path.join('.') || source, message: issue.message }];
  });
}

/**
 * Middleware-фабрика: validate(schema, 'body' | 'query' | 'params').
 * Очищені й приведені до потрібних типів дані — у req.validatedBody / validatedQuery / validatedParams.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ValidationError(toFieldErrors(result.error.issues, source)));
    }
    req[TARGETS[source]] = result.data;
    next();
  };
}
