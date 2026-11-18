import { randomUUID } from 'node:crypto';

// Наскрізний ідентифікатор запиту: є в кожному рядку логу й у заголовку відповіді.
// Користувач надсилає його зі скріншота помилки — і ви за секунду знаходите запит у логах.
export function requestId(req, res, next) {
  req.id = req.get('X-Request-Id') ?? randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
