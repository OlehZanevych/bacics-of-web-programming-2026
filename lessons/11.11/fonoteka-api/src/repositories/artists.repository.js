import { pool } from '../db/pool.js';

// Кількість альбомів — агрегацією в самій базі (LEFT JOIN лишає виконавців без альбомів)
const SELECT_ARTISTS = `
  SELECT ar.*, COUNT(a.id)::int AS album_count
    FROM artists ar
    LEFT JOIN albums a ON a.artist_id = ar.id`;

export async function findAll() {
  const { rows } = await pool.query(`${SELECT_ARTISTS} GROUP BY ar.id ORDER BY ar.name`);
  return rows;
}

export async function findById(id) {
  const { rows } = await pool.query(`${SELECT_ARTISTS} WHERE ar.id = $1 GROUP BY ar.id`, [id]);
  return rows[0] ?? null;
}
