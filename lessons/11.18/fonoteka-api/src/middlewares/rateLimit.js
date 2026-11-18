import { rateLimit } from 'express-rate-limit';
import { config } from '../config/index.js';

// Захист входу й реєстрації від перебору паролів: 10 невдалих спроб за 15 хвилин з однієї IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  skipSuccessfulRequests: true, // рахуємо лише невдалі спроби
  standardHeaders: 'draft-8', // заголовки RateLimit і RateLimit-Policy
  legacyHeaders: false,
  message: { status: 429, message: 'Забагато спроб. Спробуйте через 15 хвилин.' },
});
