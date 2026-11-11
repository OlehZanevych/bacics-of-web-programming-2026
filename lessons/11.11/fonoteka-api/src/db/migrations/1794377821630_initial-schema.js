// Початкова схема «Фонотеки». Ім'я файлу (позначка часу) задає порядок міграцій.
// Правило: застосовану міграцію НЕ редагують — кожна зміна схеми йде новою міграцією.

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  const identityId = {
    type: 'integer',
    primaryKey: true,
    sequenceGenerated: { precedence: 'ALWAYS' }, // INTEGER GENERATED ALWAYS AS IDENTITY
  };

  // Довідник: виконавці (зв'язок «багато-до-одного» з альбомами)
  pgm.createTable('artists', {
    id: identityId,
    name: { type: 'varchar(120)', notNull: true },
    country: { type: 'varchar(60)' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  // Головна сутність: альбоми
  pgm.createTable(
    'albums',
    {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      title: { type: 'varchar(200)', notNull: true },
      description: { type: 'text' },
      artist_id: { type: 'integer', notNull: true, references: 'artists', onDelete: 'RESTRICT' },
      release_date: { type: 'date', notNull: true },
      track_count: { type: 'smallint', notNull: true },
      duration_minutes: { type: 'smallint' },
      rating: { type: 'smallint' },
      format: { type: 'varchar(10)', notNull: true, default: 'digital' },
      in_collection: { type: 'boolean', notNull: true, default: false },
      cover_url: { type: 'text' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    {
      constraints: {
        check: [
          'track_count BETWEEN 1 AND 999',
          'duration_minutes BETWEEN 1 AND 600',
          'rating BETWEEN 1 AND 5',
          "format IN ('vinyl', 'cd', 'cassette', 'digital')",
          "release_date >= '1900-01-01'",
        ],
      },
    },
  );

  // Користувачі для автентифікації
  pgm.createTable(
    'users',
    {
      id: identityId,
      email: { type: 'varchar(255)', notNull: true },
      password_hash: { type: 'varchar(255)', notNull: true },
      role: { type: 'varchar(10)', notNull: true, default: 'USER' },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    { constraints: { check: "role IN ('USER', 'ADMIN')" } },
  );

  // Унікальність без урахування регістру: «Сніг» = «сніг», Ivan@x.com = ivan@x.com.
  // Індекс за виразом заодно пришвидшує пошук WHERE LOWER(title) = LOWER($1).
  pgm.createIndex('albums', 'lower(title)', { unique: true, name: 'albums_title_lower_unique' });
  pgm.createIndex('artists', 'lower(name)', { unique: true, name: 'artists_name_lower_unique' });
  pgm.createIndex('users', 'lower(email)', { unique: true, name: 'users_email_lower_unique' });

  // Зовнішній ключ PostgreSQL САМ не індексує
  pgm.createIndex('albums', 'artist_id');
  // Пошук за частиною назви (ILIKE '%…%') звичайний B-tree не прискорює — потрібен pg_trgm
  pgm.sql('CREATE EXTENSION IF NOT EXISTS pg_trgm');
  pgm.sql('CREATE INDEX albums_title_trgm_index ON albums USING gin (title gin_trgm_ops)');
  // Сортування й фільтр за датою виходу
  pgm.createIndex('albums', 'release_date');

  // updated_at оновлюється тригером — не треба пам'ятати про нього в кожному UPDATE
  pgm.sql(`
    CREATE FUNCTION set_updated_at() RETURNS trigger AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER albums_set_updated_at
      BEFORE UPDATE ON albums
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  `);
};

/** down — точний відкат up у зворотному порядку */
export const down = (pgm) => {
  pgm.dropTable('users');
  pgm.dropTable('albums');
  pgm.dropTable('artists');
  pgm.sql('DROP FUNCTION set_updated_at()');
  pgm.sql('DROP EXTENSION IF EXISTS pg_trgm');
};
