// Наповнення бази демо-даними: npm run seed
// ⚠️ СПЕРШУ ОЧИЩАЄ таблиці — лише для розробки!
import bcrypt from 'bcrypt';
import { pool, withTransaction } from '../src/db/pool.js';
import { artists, buildAlbums } from '../src/data/seed-data.js';

const ALBUM_COUNT = Number(process.env.SEED_ALBUMS ?? 60); // вимога Завдання №4: 50+

// Тестові облікові записи (паролі лише для розробки — у README)
const USERS = [
  { email: 'admin@fonoteka.test', password: 'AdminPass123', role: 'ADMIN' },
  { email: 'user@fonoteka.test', password: 'UserPass123', role: 'USER' },
];

// Багаторядкова вставка: VALUES ($1, $2), ($3, $4), … — один запит замість сотні
async function insertMany(client, table, columns, rows) {
  const params = [];
  const values = rows.map((row) => {
    const placeholders = row.map((value) => {
      params.push(value);
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });
  const { rows: inserted } = await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values.join(', ')} RETURNING *`,
    params,
  );
  return inserted;
}

async function main() {
  console.log('Наповнення бази…');
  const albums = buildAlbums(ALBUM_COUNT);
  const users = await Promise.all(
    USERS.map(async (user) => [user.email, await bcrypt.hash(user.password, 12), user.role]),
  );

  await withTransaction(async (client) => {
    // RESTART IDENTITY — лічильники id знову з 1; CASCADE — разом із залежними таблицями
    await client.query('TRUNCATE albums, artists, users RESTART IDENTITY CASCADE');

    await insertMany(client, 'users', ['email', 'password_hash', 'role'], users);

    const insertedArtists = await insertMany(
      client,
      'artists',
      ['name', 'country'],
      artists.map((artist) => [artist.name, artist.country]),
    );
    const artistId = new Map(insertedArtists.map((row) => [row.name, row.id]));

    const insertedAlbums = await insertMany(
      client,
      'albums',
      [
        'title',
        'description',
        'artist_id',
        'release_date',
        'track_count',
        'duration_minutes',
        'rating',
        'format',
        'in_collection',
      ],
      albums.map((album) => [
        album.title,
        album.description,
        artistId.get(album.artist),
        album.releaseDate,
        album.trackCount,
        album.durationMinutes,
        album.rating,
        album.format,
        album.inCollection,
      ]),
    );

    console.log(
      `✔ Користувачів: ${users.length}, виконавців: ${insertedArtists.length}, альбомів: ${insertedAlbums.length}`,
    );
  });
}

try {
  await main();
} catch (error) {
  console.error('✖ Помилка наповнення:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
