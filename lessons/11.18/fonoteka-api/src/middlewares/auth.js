import { verifyToken } from '../services/token.service.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

/** Перевіряє заголовок Authorization: Bearer <token> і кладе користувача в req.user */
export function authenticate(req, res, next) {
  const header = req.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Потрібна автентифікація'));
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}

/** Middleware-фабрика: requireRole('ADMIN') — після authenticate */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Недостатньо прав для цієї дії'));
    }
    next();
  };
}
