import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';

// Один рядок логу на запит: метод, адреса, статус, тривалість; рівень — за статусом
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id, // той самий id, що й у заголовку X-Request-Id
  customLogLevel: (req, res, error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    `[${req.id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} — ${responseTime} мс`,
  customErrorMessage: (req, res) =>
    `[${req.id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode}`,
  // У лог — лише корисне; заголовки (зокрема Authorization) не потрапляють узагалі
  serializers: {
    req: (req) => ({ id: req.id }),
    res: () => undefined,
  },
});
