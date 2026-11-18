// Уся конфігурація — в одному місці й лише зі змінних середовища.
// dotenv читає файл .env і копіює значення в process.env (ті, що вже задані, не перезаписує).
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`✖ Відсутня обов'язкова змінна середовища: ${name}`);
    process.exit(1);
  }
  return value;
}

const env = process.env.NODE_ENV ?? 'development';
const jwtSecret = required('JWT_SECRET');

// Короткий секрет підбирається перебором — і тоді будь-хто підпише токен із роллю ADMIN
if (jwtSecret.length < 32) {
  console.error('✖ JWT_SECRET закороткий: потрібно щонайменше 32 символи');
  process.exit(1);
}

export const config = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  // 'http://localhost:5173,https://app.example.com' → ['http://localhost:5173', 'https://app.example.com']
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL ?? (env === 'production' ? 'info' : 'debug'),
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
};
