// Точка входу: перевіряємо базу, запускаємо HTTP-сервер, коректно завершуємося.
import app from './app.js';
import { config } from './config/index.js';
import { checkConnection, closePool } from './db/pool.js';
import { logger } from './utils/logger.js';

try {
  await checkConnection();
} catch (error) {
  logger.fatal(
    `Немає з'єднання з PostgreSQL (${error.message || error.code}). Чи запущено docker compose up -d?`,
  );
  process.exit(1);
}

const server = app.listen(config.port, () => {
  logger.info(`API «Фонотеки»: http://localhost:${config.port}/api/v1 · документація: /api-docs`);
});

async function shutdown(signal) {
  logger.info(`Отримано ${signal}, завершуємо роботу…`);
  server.close(async () => {
    await closePool();
    logger.info('Завершено коректно');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // запасний вихід
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
