// Уся конфігурація — в одному місці й лише зі змінних середовища.
// Решта коду імпортує config і не звертається до process.env напряму.

const env = process.env.NODE_ENV ?? 'development';

export const config = {
    env,
    isProduction: env === 'production',
    port: Number(process.env.PORT ?? 3000),
    corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};