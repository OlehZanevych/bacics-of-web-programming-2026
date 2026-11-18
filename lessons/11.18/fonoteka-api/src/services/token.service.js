// Видача й перевірка JWT. Payload: { sub, role, iat, exp } — iat і exp додає бібліотека.
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../errors/index.js';

export function generateToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  try {
    // algorithms — явно: захист від підміни алгоритму (alg: none, RS256 → HS256)
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Термін дії токена вичерпано');
    }
    throw new UnauthorizedError('Недійсний токен');
  }
}
