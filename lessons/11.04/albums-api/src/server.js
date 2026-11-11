// Точка входу: запускаємо HTTP-сервер і коректно завершуємося.
import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
    console.log(`API «Фонотеки»: http://localhost:${config.port}/api/v1 (${config.env})`);
});

async function shutdown(signal) {
    console.log(`Отримано ${signal}, завершуємо роботу…`);

    // Перестаємо приймати нові з'єднання; колбек — коли завершаться поточні запити
    server.close(() => {
        console.log('Завершено коректно');
        process.exit(0);
    });

    // Якщо за 10 секунд не встигли — виходимо примусово
    setTimeout(() => {
        console.error('Не вдалося завершити коректно, вихід примусово');
        process.exit(1);
    }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));