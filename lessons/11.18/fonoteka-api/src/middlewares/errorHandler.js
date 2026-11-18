import { AppError, NotFoundError } from '../errors/index.js';
import { translatePgError } from '../db/pgErrors.js';

// Помилки express.json() мають англійські повідомлення — даємо свої
const PARSER_MESSAGES = {
  'entity.parse.failed': 'Некоректний JSON у тілі запиту',
  'entity.too.large': 'Завелике тіло запиту',
};

// Жоден маршрут не підійшов → 404 у загальному форматі помилки
export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl}`));
}

// ЧОТИРИ параметри — саме так Express відрізняє обробник помилок від звичайного middleware
export function errorHandler(rawError, req, res, next) {
  if (res.headersSent) return next(rawError);

  // Коди помилок PostgreSQL (23505, 23503, …) → помилки API; решта — без змін
  const error = translatePgError(rawError);

  // expose: true мають помилки express.json(): битий JSON → 400, завелике тіло → 413
  const isOperational = error instanceof AppError || error.expose === true;
  const status = isOperational ? error.status : 500;

  // Неочікувану помилку логуємо з повним стеком (req.log додає pino-http разом з id запиту).
  // Очікувані 4xx окремо не логуємо — їх і так видно в рядку запиту з рівнем warn.
  if (!isOperational) req.log.error({ err: error }, 'Неочікувана помилка');

  res.status(status).json({
    status,
    message: isOperational
      ? (PARSER_MESSAGES[error.type] ?? error.message)
      : 'Внутрішня помилка сервера',
    ...(error.details ? { errors: error.details } : {}),
    // Стек викликів НІКОЛИ не йде клієнту — він лише в логах (req.log.error вище)
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
