// Пул з'єднань PostgreSQL — один на весь застосунок.
import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool, types } = pg;

// DATE (OID 1082) за замовчуванням стає JS Date опівночі ЛОКАЛЬНОГО часу й «з'їжджає»
// на день при перетворенні в JSON. Дата без часу лишається рядком 'YYYY-MM-DD'.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Помилка неактивного з'єднання (наприклад, базу перезапустили) — інакше процес упаде
pool.on('error', (error) => {
  logger.error({ err: error }, 'Несподівана помилка пулу PostgreSQL');
});

export async function checkConnection() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

export async function closePool() {
  await pool.end();
}

/** Виконує callback(client) у транзакції: усе або нічого */
export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release(); // ⚠️ ЗАВЖДИ повертаємо з'єднання в пул
  }
}
