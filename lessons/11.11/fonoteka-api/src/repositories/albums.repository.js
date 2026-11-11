// Репозиторій альбомів: лише SQL. Не знає ні про HTTP, ні про бізнес-правила.
import { pool } from '../db/pool.js';

// Білий список: поле API → стовпець. Назву стовпця НЕМОЖЛИВО передати параметром $n —
// вона потрапляє в текст SQL, тому береться лише з цього списку (захист від SQL-ін'єкції).
const SORT_COLUMNS = {
  title: 'a.title',
  releaseDate: 'a.release_date',
  rating: 'a.rating',
  trackCount: 'a.track_count',
  createdAt: 'a.created_at',
};

// Альбом разом із виконавцем — ОДНИМ запитом (JOIN), без проблеми N+1
const SELECT_ALBUMS = `
  SELECT a.*, ar.name AS artist_name, ar.country AS artist_country
    FROM albums a
    JOIN artists ar ON ar.id = a.artist_id`;

// % і _ у LIKE — спецсимволи; екрануємо, щоб пошук «100%» шукав саме «100%»
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

// Динамічний WHERE: умова додається лише для заданого фільтра, значення — лише параметрами
function buildFilters(filters = {}) {
  const conditions = [];
  const params = [];

  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replaceAll('?', `$${params.length}`));
  };

  if (filters.search) add('a.title ILIKE ?', `%${escapeLike(filters.search)}%`);
  if (filters.artistId) add('a.artist_id = ?', filters.artistId);
  if (filters.format) add('a.format = ?', filters.format);
  if (filters.inCollection !== undefined) add('a.in_collection = ?', filters.inCollection);
  if (filters.yearFrom) add('a.release_date >= make_date(?, 1, 1)', filters.yearFrom);
  if (filters.yearTo) add('a.release_date <= make_date(?, 12, 31)', filters.yearTo);
  if (filters.ratingMin) add('a.rating >= ?', filters.ratingMin);

  return { where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', params };
}

export async function findAll({ filters, sort, order, limit, offset }) {
  const { where, params } = buildFilters(filters);
  const column = SORT_COLUMNS[sort] ?? 'a.title';
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  params.push(limit, offset);

  // , a.id — стабільний порядок для однакових значень (інакше дублікати між сторінками)
  const { rows } = await pool.query(
    `${SELECT_ALBUMS}
      ${where}
      ORDER BY ${column} ${direction} NULLS LAST, a.id
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows;
}

export async function count(filters) {
  const { where, params } = buildFilters(filters);
  // COUNT(*) — bigint, який pg віддає РЯДКОМ ('25'); ::int робить із нього число
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM albums a ${where}`, params);
  return rows[0].total;
}

export async function findById(id) {
  const { rows } = await pool.query(`${SELECT_ALBUMS} WHERE a.id = $1`, [id]);
  return rows[0] ?? null;
}

export async function findByTitle(title) {
  const { rows } = await pool.query('SELECT * FROM albums WHERE LOWER(title) = LOWER($1)', [title]);
  return rows[0] ?? null;
}

// поле API (camelCase) → стовпець (snake_case); заодно білий список для INSERT і UPDATE
const COLUMNS = {
  title: 'title',
  description: 'description',
  artistId: 'artist_id',
  releaseDate: 'release_date',
  trackCount: 'track_count',
  durationMinutes: 'duration_minutes',
  rating: 'rating',
  format: 'format',
  inCollection: 'in_collection',
  coverUrl: 'cover_url',
};

export async function create(data) {
  const keys = Object.keys(COLUMNS).filter((key) => Object.hasOwn(data, key));
  const columns = keys.map((key) => COLUMNS[key]);
  const placeholders = keys.map((_, index) => `$${index + 1}`);

  const { rows } = await pool.query(
    `INSERT INTO albums (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
    keys.map((key) => data[key]),
  );
  return findById(rows[0].id);
}

/** Оновлює лише ПЕРЕДАНІ поля (для PUT валідатор передає всі) */
export async function update(id, data) {
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(COLUMNS)) {
    if (Object.hasOwn(data, key)) {
      params.push(data[key]);
      sets.push(`${column} = $${params.length}`);
    }
  }
  params.push(id);

  const { rowCount } = await pool.query(
    `UPDATE albums SET ${sets.join(', ')} WHERE id = $${params.length}`,
    params,
  );
  return rowCount > 0;
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM albums WHERE id = $1', [id]);
  return rowCount > 0;
}
