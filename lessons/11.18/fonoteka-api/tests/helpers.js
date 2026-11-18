// Підготовка тестової бази: міграції + невеликий передбачуваний набір даних.
import bcrypt from 'bcrypt';
import { runner } from 'node-pg-migrate';
import { config } from '../src/config/index.js';
import { pool } from '../src/db/pool.js';

// Захист від випадкового запуску тестів на робочій базі: TRUNCATE видалив би все
if (!config.isTest || !config.databaseUrl.includes('_test')) {
  throw new Error('Тести запускаються лише з NODE_ENV=test і базою *_test (npm test)');
}

export const ARTIST_ID = { okean: 1, dakha: 2 };
export const ALBUM_ID = {
  first: '00000000-0000-4000-8000-000000000001',
  second: '00000000-0000-4000-8000-000000000002',
  third: '00000000-0000-4000-8000-000000000003',
};
export const USER = { email: 'user@test.ua', password: 'UserPass123' };
export const ADMIN = { email: 'admin@test.ua', password: 'AdminPass123' };

export async function migrate() {
  await runner({
    databaseUrl: config.databaseUrl,
    dir: 'src/db/migrations',
    direction: 'up',
    migrationsTable: 'pgmigrations',
    log: () => {}, // без зайвого виводу в тестах
  });
}

export async function resetData() {
  await pool.query('TRUNCATE albums, artists, users RESTART IDENTITY CASCADE');
  await pool.query(
    `INSERT INTO artists (name, country) VALUES ('Океан Ельзи', 'Україна'), ('ДахаБраха', 'Україна')`,
  );
  await pool.query(
    `INSERT INTO albums (id, title, artist_id, release_date, track_count, rating, format, in_collection)
     VALUES ($1, 'Земля', 1, '2013-03-05', 12, 5, 'vinyl', true),
            ($2, 'Без меж', 1, '2016-05-20', 10, 4, 'cd', false),
            ($3, 'Шлях', 2, '2016-09-23', 9, 5, 'digital', true)`,
    [ALBUM_ID.first, ALBUM_ID.second, ALBUM_ID.third],
  );
  // Вартість 4 замість 12: у тестах швидкість важливіша за стійкість до перебору
  for (const [user, role] of [
    [USER, 'USER'],
    [ADMIN, 'ADMIN'],
  ]) {
    await pool.query('INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)', [
      user.email,
      await bcrypt.hash(user.password, 4),
      role,
    ]);
  }
}
