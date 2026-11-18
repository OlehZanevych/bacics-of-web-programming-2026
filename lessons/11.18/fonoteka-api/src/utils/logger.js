// Структурований логер: JSON у продакшені, кольоровий читабельний вивід у розробці.
import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isTest ? 'silent' : config.logLevel,
  transport: config.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,req,res,responseTime', // у розробці — один короткий рядок
        },
      },
  // Чутливі поля НІКОЛИ не потрапляють у логи
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
    ],
    censor: '[ПРИХОВАНО]',
  },
});
