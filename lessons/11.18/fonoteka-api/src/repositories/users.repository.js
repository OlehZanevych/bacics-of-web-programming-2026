import { pool } from '../db/pool.js';

// Поля, які можна віддавати назовні. password_hash сюди НЕ входить:
// його читає лише findByEmail — щоб перевірити пароль під час входу
const PUBLIC_COLUMNS = 'id, email, role, created_at';

export async function findByEmail(email) {
  const { rows } = await pool.query(
    `SELECT ${PUBLIC_COLUMNS}, password_hash FROM users WHERE LOWER(email) = LOWER($1)`,
    [email],
  );
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function create({ email, passwordHash, role }) {
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)
     RETURNING ${PUBLIC_COLUMNS}`,
    [email, passwordHash, role],
  );
  return rows[0];
}
