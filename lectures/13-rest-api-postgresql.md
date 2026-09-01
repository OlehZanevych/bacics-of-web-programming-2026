# Лекція 13. Проєктування REST API та робота з PostgreSQL

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язані завдання:** №4, №5
> **Попередня лекція:** [Лекція 12](12-express-middleware-architecture.md)

---

## Про що ця лекція

Дві теми, які на практиці нерозривні: **як спроєктувати API**, з яким приємно
працювати, і **як зберігати дані** так, щоб їх можна було швидко й безпечно
діставати.

Перша половина — про контракт: URI, методи, коди, пагінація, фільтрація.
Друга — про PostgreSQL: схема, зв'язки, індекси, параметризовані запити,
міграції, транзакції.

---

## Зміст

1. [Що таке REST](#1-що-таке-rest)
2. [Проєктування URI](#2-проєктування-uri)
3. [Методи та коди станів](#3-методи-та-коди-станів)
4. [Пагінація, фільтрація, сортування](#4-пагінація-фільтрація-сортування)
5. [Формат відповіді й помилок](#5-формат-відповіді-й-помилок)
6. [Версіонування API](#6-версіонування-api)
7. [PostgreSQL: чому саме він](#7-postgresql-чому-саме-він)
8. [Запуск бази в Docker](#8-запуск-бази-в-docker)
9. [Проєктування схеми](#9-проєктування-схеми)
10. [Зв'язки між таблицями](#10-звязки-між-таблицями)
11. [Міграції](#11-міграції)
12. [Підключення з Node.js](#12-підключення-з-nodejs)
13. [SQL-ін'єкції та параметризовані запити](#13-sql-інєкції-та-параметризовані-запити)
14. [Динамічні запити](#14-динамічні-запити)
15. [Індекси та продуктивність](#15-індекси-та-продуктивність)
16. [Транзакції](#16-транзакції)
17. [Проблема N+1](#17-проблема-n1)
18. [Seed-дані](#18-seed-дані)
19. [Типові помилки](#19-типові-помилки)
20. [Контрольні запитання](#20-контрольні-запитання)
21. [Практичні вправи](#21-практичні-вправи)
22. [Корисні посилання](#22-корисні-посилання)
23. [Література](#23-література)
24. [Глосарій](#24-глосарій)

---

## 1. Що таке REST

**REST (Representational State Transfer)** — архітектурний стиль, описаний
Роєм Філдінгом у 2000 році. Ключові принципи:

| Принцип | Що означає |
|---|---|
| **Клієнт-сервер** | розділення відповідальності |
| **Відсутність стану** | кожен запит самодостатній; сервер не пам'ятає сесію |
| **Кешованість** | відповідь має повідомляти, чи можна її кешувати |
| **Однорідний інтерфейс** | ресурси, стандартні методи, самоописові повідомлення |
| **Шарова система** | між клієнтом і сервером можуть бути проксі, кеші |

🔑 **Головна ідея REST — ресурси, а не дії.** URI іменує *річ*
(`/movies/42`), а що з нею робити, каже HTTP-метод (`GET`, `PUT`, `DELETE`).
Це принципово відрізняється від RPC-стилю, де URI іменує операцію
(`/getMovie?id=42`).

### Модель зрілості Річардсона

| Рівень | Опис |
|---|---|
| 0 | Одна точка входу, усе через `POST` (по суті RPC) |
| 1 | З'явилися **ресурси** — різні URI |
| 2 | Використовуються **HTTP-методи й коди станів** ← *сюди ми й цілимося* |
| 3 | **HATEOAS**: відповіді містять посилання на можливі дії |

Більшість промислових API — рівень 2. Рівень 3 рідкісний і в цьому курсі не
вимагається.

---

## 2. Проєктування URI

```
✅ Добре                       ❌ Погано
/api/v1/movies                 /api/getMovies
/api/v1/movies/42              /api/movie?id=42
/api/v1/movies/42/reviews      /api/getMovieReviews?movieId=42
/api/v1/genres                 /api/genre-list
```

**Правила:**

1. **Іменники, не дієслова.** Дію позначає метод.
2. **Множина** для колекцій: `/movies`, а не `/movie`.
3. **Нижній регістр, дефіси** для складених слів: `/movie-reviews`, не
   `/movieReviews` і не `/movie_reviews`.
4. **Ієрархія для вкладених ресурсів:** `/movies/42/reviews`.
5. **Фільтри — у query, не в шляху:**
   `/movies?genre=drama`, а не `/movies/genre/drama`.
6. **Без розширень:** `/movies`, а не `/movies.json` (формат визначає
   `Accept`).
7. **Без завершального слеша:** `/movies`, а не `/movies/`.

**Коли дієслово все ж доречне.** Деякі операції не лягають на CRUD:

```
POST /api/v1/auth/sign-in
POST /api/v1/movies/42/publish
POST /api/v1/orders/42/cancel
```

Це прийнятний прагматичний виняток — не варто вигадувати штучний ресурс
`/publications` заради чистоти теорії.

---

## 3. Методи та коди станів

### 3.1. Повний набір для Завдання №4

| Метод | Шлях | Дія | Успіх | Помилки |
|---|---|---|---|---|
| `GET` | `/movies` | список | 200 | 400 |
| `GET` | `/movies/count` | кількість | 200 | 400 |
| `GET` | `/movies/:id` | один | 200 | 404 |
| `POST` | `/movies` | створити | 201 + `Location` | 400, 401, 409 |
| `PUT` | `/movies/:id` | замінити повністю | 204 | 400, 401, 404, 409 |
| `PATCH` | `/movies/:id` | оновити частково | 204 | 400, 401, 404, 409 |
| `DELETE` | `/movies/:id` | видалити | 204 | 401, 403, 404 |

### 3.2. `PUT` проти `PATCH`

```http
PUT /api/v1/movies/42
{ "title": "Земля", "year": 1930, "description": null, "genreId": 3 }
```
Замінює ресурс **повністю**. Не передане поле стає порожнім.

```http
PATCH /api/v1/movies/42
{ "year": 1931 }
```
Змінює **лише передані** поля.

⚠️ Ключова тонкість `PATCH`: треба розрізняти «поле не передано» і «передано
`null`». Наївна перевірка `if (data.description)` зламається і на `null`, і на
порожньому рядку, і на нулі.

```js
// ✅ Правильно
const fields = [];
const params = [];

for (const key of ['title', 'year', 'description', 'genre_id']) {
  if (Object.hasOwn(data, key)) {      // саме hasOwn, не перевірка істинності
    params.push(data[key]);
    fields.push(`${key} = $${params.length}`);
  }
}

if (fields.length === 0) throw new ValidationError('Немає полів для оновлення');
```

### 3.3. Ідемпотентність

| Метод | Безпечний | Ідемпотентний |
|---|---|---|
| `GET` | ✅ | ✅ |
| `PUT` | ❌ | ✅ |
| `DELETE` | ❌ | ✅ |
| `POST` | ❌ | ❌ |
| `PATCH` | ❌ | залежить |

🔑 Практичний наслідок: клієнт може безпечно повторити `GET`, `PUT`,
`DELETE` після мережевого збою, а `POST` — ні (створяться дублікати).

Щодо `DELETE` неіснуючого ресурсу є два підходи: повертати `404` (ресурсу
немає — чесно) або `204` (кінцевий стан досягнуто — суворіша ідемпотентність).
Завдання №4 вимагає `404`.

---

## 4. Пагінація, фільтрація, сортування

### 4.1. Пагінація зсувом

```http
GET /api/v1/movies?limit=20&offset=40
```

```json
{
  "data": [ … ],
  "total": 137,
  "limit": 20,
  "offset": 40
}
```

Плюси: просто, можна перейти на довільну сторінку.
Мінуси: на великих зсувах повільно (база все одно «прогортає» пропущені
рядки); якщо між запитами додали запис — елементи можуть дублюватися чи
зникати.

### 4.2. Курсорна пагінація

```http
GET /api/v1/movies?limit=20&after=eyJpZCI6NDJ9
```

Швидка й стабільна, але не дозволяє «стрибнути на сторінку 7». Використовується
у стрічках (Twitter, GitHub API).

Для Завдання №4 достатньо `limit`/`offset`.

### 4.3. Обов'язкові запобіжники

```js
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const limit = Math.min(
  Math.max(Number.parseInt(query.limit ?? DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, 1),
  MAX_LIMIT
);
const offset = Math.max(Number.parseInt(query.offset ?? 0, 10) || 0, 0);
```

⚠️ Без обмеження `limit` клієнт надішле `?limit=999999999` і покладе сервер.

### 4.4. Фільтрація

```http
GET /api/v1/movies?search=земля&genreId=3&yearFrom=1920&yearTo=1940&isPublished=true
```

Домовленості:

- `search` — частковий збіг, нечутливий до регістру;
- `xxxFrom` / `xxxTo` — діапазони;
- `ids=1,2,3` або `ids=1&ids=2` — множинний вибір;
- порожній параметр = фільтр не застосовано.

### 4.5. Сортування

```http
GET /api/v1/movies?sort=year&order=desc
```

🔑 **Поле сортування ЗАВЖДИ перевіряється за білим списком:**

```js
const ALLOWED_SORT = new Set(['title', 'year', 'rating', 'created_at']);
const sortField = ALLOWED_SORT.has(query.sort) ? query.sort : 'title';
const sortOrder = query.order === 'desc' ? 'DESC' : 'ASC';
```

Це не стилістика, а безпека: назву стовпця **неможливо** передати
параметром запиту — вона підставляється в текст SQL. Без білого списку це
пряма SQL-ін'єкція.

---

## 5. Формат відповіді й помилок

### 5.1. Єдиний формат помилки

```json
{
  "status": 400,
  "message": "Помилка валідації",
  "errors": [
    { "field": "title", "message": "Мінімум 2 символи" },
    { "field": "year",  "message": "Значення від 1888 до 2100" }
  ],
  "path": "/api/v1/movies",
  "timestamp": "2026-09-01T10:15:30.000Z"
}
```

Альтернатива — стандарт **RFC 9457 Problem Details**:

```json
{
  "type": "https://example.com/errors/validation",
  "title": "Validation failed",
  "status": 400,
  "detail": "Поле title має містити щонайменше 2 символи",
  "instance": "/api/v1/movies"
}
```

з `Content-Type: application/problem+json`. Обидва варіанти прийнятні —
головне, щоб формат був **єдиним для всього API**.

### 5.2. Формат успішної відповіді

```json
// Колекція — завжди об'єкт, а не «голий» масив
{ "data": [...], "total": 137, "limit": 20, "offset": 0 }

// Один ресурс — можна напряму
{ "id": "42", "title": "Земля", "year": 1930 }
```

🔑 Чому колекція має бути об'єктом: у «голий» масив неможливо додати
метадані (кількість, посилання на наступну сторінку), не зламавши клієнтів.

### 5.3. Іменування полів

- `camelCase` у JSON (звична для JavaScript);
- `snake_case` у базі (звична для SQL);
- перетворення — у мапері (лекція 12);
- дати — у форматі **ISO 8601 UTC**: `"2026-09-01T10:15:30.000Z"`.

---

## 6. Версіонування API

```
/api/v1/movies       ← у шляху (найпростіше й найпоширеніше)
```

Альтернативи: заголовок `Accept: application/vnd.myapp.v2+json`, параметр
`?version=2`. У курсі використовуємо шлях.

Версію змінюють лише при **несумісних** змінах: видалення поля, зміна типу,
зміна семантики. Додавання **нового** поля сумісне — клієнт, що про нього не
знає, просто його проігнорує.

---

## 7. PostgreSQL: чому саме він

| Характеристика | Чому важливо |
|---|---|
| Відкритий код, безкоштовний | немає ліцензійних обмежень |
| Повна підтримка ACID | дані не губляться й не «псуються» |
| Багаті типи | `JSONB`, масиви, `UUID`, діапазони, геодані |
| Потужні індекси | B-tree, GIN, GiST, часткові, за виразом |
| Розширення | PostGIS, pgvector, TimescaleDB |
| Повнотекстовий пошук | вбудований, з підтримкою мов |

Актуальна мажорна версія — **PostgreSQL 18**; підтримка кожної триває 5 років.

**Реляційна база чи NoSQL?** Для нашої задачі (фільми ↔ жанри, чіткі зв'язки,
потрібні `JOIN` і цілісність) реляційна модель — очевидний вибір. MongoDB
доречніша для документів зі змінною структурою. І пам'ятайте: PostgreSQL
уміє зберігати JSON (`JSONB`) із індексами — часто це знімає саме питання.

---

## 8. Запуск бази в Docker

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:18-alpine
    container_name: movies-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: movies
      POSTGRES_PASSWORD: movies_dev_password
      POSTGRES_DB: movies
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U movies"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

```bash
docker compose up -d          # запустити
docker compose logs -f db     # логи
docker compose down           # зупинити
docker compose down -v        # зупинити й ВИДАЛИТИ дані
```

🔑 Docker знімає класичну проблему «у мене інша версія Postgres». Усі
працюють з однаковим середовищем, і його можна перестворити однією командою.

**Підключення для перевірки:**

```bash
docker compose exec db psql -U movies -d movies
```

Корисні команди `psql`: `\dt` (таблиці), `\d movies` (структура таблиці),
`\l` (бази), `\q` (вихід).

Графічні клієнти: **DBeaver** (безкоштовний, кросплатформний), **pgAdmin**,
**TablePlus**.

---

## 9. Проєктування схеми

```sql
CREATE TABLE genres (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(60) NOT NULL UNIQUE,
  slug        VARCHAR(60) NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE movies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        VARCHAR(200) NOT NULL,
  original_title VARCHAR(200),
  year         SMALLINT NOT NULL CHECK (year BETWEEN 1888 AND 2100),
  duration_min SMALLINT CHECK (duration_min > 0),
  rating       NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 10),
  description  TEXT,
  poster_url   TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  format       VARCHAR(20) NOT NULL DEFAULT 'digital'
               CHECK (format IN ('digital', 'disc', 'film')),
  release_date DATE,
  genre_id     INTEGER REFERENCES genres(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT movies_title_unique UNIQUE (title)
);
```

### 9.1. Вибір типів

| Тип | Коли |
|---|---|
| `SERIAL` / `IDENTITY` | автоінкремент; читабельні id |
| `UUID` | ідентифікатори, які можна генерувати на клієнті; не розкривають кількість записів |
| `VARCHAR(n)` | текст із розумним обмеженням |
| `TEXT` | текст без обмеження (у Postgres не повільніший!) |
| `SMALLINT` / `INTEGER` / `BIGINT` | цілі числа |
| `NUMERIC(p,s)` | **гроші й точні дроби** |
| `REAL` / `DOUBLE PRECISION` | наукові обчислення |
| `BOOLEAN` | так/ні |
| `DATE` | дата без часу |
| `TIMESTAMPTZ` | **завжди для моментів часу** |
| `JSONB` | напівструктуровані дані з індексами |

⚠️ **`NUMERIC`, а не `REAL`, для грошей.** `REAL` — число з рухомою комою, і
0.1 + 0.2 там теж не дорівнює 0.3 (лекція 3).

⚠️ **`TIMESTAMPTZ`, а не `TIMESTAMP`.** Перший зберігає момент часу з
урахуванням зони, другий — «настінний час» без прив'язки. Використання
`TIMESTAMP` майже завжди виявляється помилкою при першій же зміні часового
поясу чи розгортанні сервера в іншому регіоні.

### 9.2. Обмеження цілісності

| Обмеження | Гарантує |
|---|---|
| `PRIMARY KEY` | унікальний ідентифікатор рядка |
| `NOT NULL` | значення обов'язкове |
| `UNIQUE` | немає дублікатів |
| `CHECK` | значення відповідає умові |
| `FOREIGN KEY` | посилання веде на наявний рядок |
| `DEFAULT` | значення за замовчуванням |

🔑 **Обмеження в базі — остання лінія оборони.** Валідація в застосунку
захищає від помилок користувача, обмеження в базі — від помилок **у коді**.
Дублювання тут не надлишковість, а страховка: у базу можуть писати міграції,
скрипти, інший сервіс, ви руками через `psql`.

### 9.3. Автоматичне `updated_at`

```sql
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER movies_set_updated_at
  BEFORE UPDATE ON movies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## 10. Зв'язки між таблицями

### 10.1. Один-до-багатьох

Один жанр — багато фільмів. Зовнішній ключ **у таблиці «багато»**:

```sql
genre_id INTEGER REFERENCES genres(id) ON DELETE SET NULL
```

**Поведінка `ON DELETE`:**

| Варіант | Що станеться при видаленні жанру |
|---|---|
| `RESTRICT` (за замовчуванням) | заборонити, якщо є пов'язані фільми |
| `CASCADE` | видалити й усі фільми ⚠️ обережно! |
| `SET NULL` | у фільмів `genre_id` стане `NULL` |
| `SET DEFAULT` | підставити значення за замовчуванням |

### 10.2. Багато-до-багатьох

Фільм має кількох акторів, актор знявся в кількох фільмах — потрібна
**зв'язувальна таблиця**:

```sql
CREATE TABLE actors (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL
);

CREATE TABLE movie_actors (
  movie_id UUID    NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  actor_id INTEGER NOT NULL REFERENCES actors(id) ON DELETE CASCADE,
  role     VARCHAR(120),
  PRIMARY KEY (movie_id, actor_id)        -- складений ключ: пара унікальна
);

CREATE INDEX idx_movie_actors_actor ON movie_actors(actor_id);
```

Тут `ON DELETE CASCADE` доречний: зв'язок без фільму чи актора не має сенсу.

### 10.3. `JOIN`

```sql
-- Фільми з назвою жанру
SELECT m.*, g.name AS genre_name
  FROM movies m
  LEFT JOIN genres g ON g.id = m.genre_id;

-- Актори конкретного фільму
SELECT a.*, ma.role
  FROM actors a
  JOIN movie_actors ma ON ma.actor_id = a.id
 WHERE ma.movie_id = $1;

-- Фільми з масивом акторів одним запитом
SELECT m.*,
       COALESCE(
         json_agg(json_build_object('id', a.id, 'name', a.name))
           FILTER (WHERE a.id IS NOT NULL),
         '[]'
       ) AS actors
  FROM movies m
  LEFT JOIN movie_actors ma ON ma.movie_id = m.id
  LEFT JOIN actors a ON a.id = ma.actor_id
 GROUP BY m.id;
```

🔑 `LEFT JOIN` залишає фільми без жанру; звичайний `JOIN` їх відкине. Це
типова причина «частина записів зникла зі списку».

---

## 11. Міграції

**Міграція** — версійована зміна схеми бази, записана в коді.

🔑 **Схема ніколи не створюється руками в pgAdmin.** Причини: інші розробники
не отримають ваших змін; неможливо відтворити базу з нуля; немає історії й
відкату; на продакшені доведеться повторювати вручну.

```bash
npm install node-pg-migrate
```

```json
"scripts": {
  "migrate": "node-pg-migrate -m src/db/migrations",
  "migrate:up": "npm run migrate up",
  "migrate:down": "npm run migrate down",
  "migrate:create": "npm run migrate create"
}
```

```bash
npm run migrate:create -- create-genres-table
```

```js
// src/db/migrations/1725000000000_create-genres-table.js
export const up = (pgm) => {
  pgm.createTable('genres', {
    id:   'id',
    name: { type: 'varchar(60)', notNull: true, unique: true },
    slug: { type: 'varchar(60)', notNull: true, unique: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

export const down = (pgm) => {
  pgm.dropTable('genres');
};
```

**Правила роботи з міграціями:**

1. Кожна зміна схеми — **нова** міграція. Ніколи не редагуйте вже застосовану.
2. Завжди пишіть `down` — інакше відкотитися неможливо.
3. Міграції **комітяться в git** разом із кодом, що їх потребує.
4. Одна міграція — одна логічна зміна.
5. На порожній базі `npm run migrate up` має відтворити всю схему.

Альтернативи: `Knex migrations`, `db-migrate`, `Umzug`, або прості
пронумеровані `.sql` файли з власним раннером.

---

## 12. Підключення з Node.js

```bash
npm install pg
```

```js
// src/db/pool.js
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,                          // максимум з'єднань
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (error) => {
  console.error('Несподівана помилка пулу PostgreSQL:', error);
});

export async function checkConnection() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

export async function closePool() {
  await pool.end();
}
```

### Чому саме пул

Встановлення з'єднання з PostgreSQL — дорога операція (рукостискання,
автентифікація, виділення процесу на сервері). **Пул** тримає кілька відкритих
з'єднань і видає їх запитам по черзі.

⚠️ Ніколи не створюйте `new Client()` на кожен запит — сервер швидко впреться
в ліміт з'єднань (`too many clients already`).

---

## 13. SQL-ін'єкції та параметризовані запити

Це найважливіший розділ лекції з погляду безпеки.

```js
// ❌ КАТАСТРОФА
const { rows } = await pool.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

Якщо `email` дорівнює `' OR '1'='1`, запит стане:

```sql
SELECT * FROM users WHERE email = '' OR '1'='1'
```

— поверне **всіх** користувачів. А значення
`'; DROP TABLE users; --` знищить таблицю.

```js
// ✅ Параметризований запит
const { rows } = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);
```

🔑 **Як це працює.** Драйвер надсилає **текст запиту** й **значення окремо**.
Сервер бази спочатку розбирає структуру запиту, і лише потім підставляє
значення — вони фізично не можуть змінити структуру. Це не «екранування», а
принципово інший механізм.

### Що НЕ можна передати параметром

Параметри замінюють **лише значення**. Назви таблиць, стовпців, ключові слова
й напрямок сортування підставляються в текст запиту:

```js
// ❌ Не працює — синтаксична помилка
await pool.query('SELECT * FROM movies ORDER BY $1', [sortField]);

// ✅ Білий список
const ALLOWED = new Set(['title', 'year', 'rating', 'created_at']);
const field = ALLOWED.has(sortField) ? sortField : 'title';
const dir = order === 'desc' ? 'DESC' : 'ASC';

await pool.query(`SELECT * FROM movies ORDER BY ${field} ${dir} LIMIT $1`, [limit]);
```

### Корисні шаблони

```js
// LIKE із частковим збігом
await pool.query('SELECT * FROM movies WHERE title ILIKE $1', [`%${search}%`]);

// IN зі списком
await pool.query('SELECT * FROM movies WHERE id = ANY($1::uuid[])', [ids]);

// Вставка з поверненням створеного рядка
const { rows } = await pool.query(
  'INSERT INTO genres (name, slug) VALUES ($1, $2) RETURNING *',
  [name, slug]
);

// UPSERT
await pool.query(
  `INSERT INTO genres (name, slug) VALUES ($1, $2)
   ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
   RETURNING *`,
  [name, slug]
);
```

### Розпізнавання помилок PostgreSQL

```js
try {
  await repository.create(data);
} catch (error) {
  if (error.code === '23505') throw new ConflictError('Запис із такою назвою вже існує');
  if (error.code === '23503') throw new ValidationError('Вказаного жанру не існує');
  if (error.code === '23514') throw new ValidationError('Значення поза допустимим діапазоном');
  throw error;
}
```

| Код | Значення |
|---|---|
| `23505` | порушення `UNIQUE` |
| `23503` | порушення зовнішнього ключа |
| `23502` | `NOT NULL` |
| `23514` | порушення `CHECK` |
| `22P02` | некоректний формат (наприклад, не-UUID у полі UUID) |

---

## 14. Динамічні запити

Фільтрація зі змінним набором умов — місце, де найлегше припуститися помилки.

```js
// src/repositories/movies.repository.js

function buildFilters(filters) {
  const conditions = [];
  const params = [];

  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replace('?', `$${params.length}`));
  };

  if (filters.search)      add('m.title ILIKE ?', `%${filters.search}%`);
  if (filters.genreId)     add('m.genre_id = ?', filters.genreId);
  if (filters.yearFrom)    add('m.year >= ?', filters.yearFrom);
  if (filters.yearTo)      add('m.year <= ?', filters.yearTo);
  if (filters.isPublished !== undefined) add('m.is_published = ?', filters.isPublished);
  if (filters.ids?.length) add('m.id = ANY(?::uuid[])', filters.ids);

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export async function findAll({ filters, sort, order, limit, offset }) {
  const { where, params } = buildFilters(filters);

  const field = ALLOWED_SORT.has(sort) ? sort : 'title';
  const dir = order === 'desc' ? 'DESC' : 'ASC';

  params.push(limit, offset);

  const sql = `
    SELECT m.*, g.name AS genre_name
      FROM movies m
      LEFT JOIN genres g ON g.id = m.genre_id
      ${where}
     ORDER BY m.${field} ${dir}, m.id
     LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const { rows } = await pool.query(sql, params);
  return rows;
}
```

🔑 Додатковий `, m.id` у `ORDER BY` — важлива дрібниця: без нього рядки з
однаковим значенням поля сортування можуть повертатися в різному порядку між
запитами, і при пагінації користувач побачить дублікати.

---

## 15. Індекси та продуктивність

**Індекс** — структура даних, що пришвидшує пошук ціною місця на диску й
сповільнення записів.

```sql
-- Пошук за назвою
CREATE INDEX idx_movies_title ON movies (title);

-- Зовнішній ключ — індексується ЗАВЖДИ
CREATE INDEX idx_movies_genre_id ON movies (genre_id);

-- Складений (порядок стовпців має значення!)
CREATE INDEX idx_movies_genre_year ON movies (genre_id, year DESC);

-- Частковий: індексуємо лише те, що реально шукаємо
CREATE INDEX idx_movies_published ON movies (created_at DESC)
  WHERE is_published = true;

-- Для пошуку без урахування регістру (ILIKE '%…%')
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_movies_title_trgm ON movies USING gin (title gin_trgm_ops);
```

🔑 **`UNIQUE` і `PRIMARY KEY` створюють індекс автоматично. Зовнішні ключі —
ні.** Це найчастіше джерело повільних `JOIN`.

⚠️ Звичайний B-tree індекс **не працює** для `LIKE '%текст%'` (пошук із
довільного місця). Потрібне розширення `pg_trgm` або повнотекстовий пошук.

### Аналіз запиту

```sql
EXPLAIN ANALYZE
SELECT * FROM movies WHERE genre_id = 3 ORDER BY year DESC LIMIT 20;
```

Що шукати у виводі:

- `Seq Scan` на великій таблиці — індекс не використовується;
- `Index Scan` / `Bitmap Index Scan` — індекс працює;
- велика різниця між `rows=` (оцінка) і `actual rows=` — статистика застаріла
  (`ANALYZE movies;`).

### Коли індекс шкодить

Кожен індекс сповільнює `INSERT`, `UPDATE`, `DELETE` і займає місце. Не
створюйте індекси «про всяк випадок» — лише за результатами `EXPLAIN`.

### Повнотекстовий пошук

```sql
ALTER TABLE movies ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
  ) STORED;

CREATE INDEX idx_movies_search ON movies USING gin (search_vector);
```

```sql
SELECT * FROM movies WHERE search_vector @@ plainto_tsquery('simple', $1);
```

⚠️ PostgreSQL не має вбудованого словника української мови. Конфігурація
`'simple'` працює без морфології (шукає точні словоформи). Для повноцінної
підтримки потрібен зовнішній словник.

---

## 16. Транзакції

**Транзакція** — набір операцій, які виконуються **або всі, або жодна**.

```js
export async function createMovieWithActors(movieData, actorIds) {
  const client = await pool.connect();      // окреме з'єднання з пулу

  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      'INSERT INTO movies (title, year, genre_id) VALUES ($1, $2, $3) RETURNING *',
      [movieData.title, movieData.year, movieData.genreId]
    );
    const movie = rows[0];

    for (const actorId of actorIds) {
      await client.query(
        'INSERT INTO movie_actors (movie_id, actor_id) VALUES ($1, $2)',
        [movie.id, actorId]
      );
    }

    await client.query('COMMIT');
    return movie;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();                       // ⚠️ ОБОВ'ЯЗКОВО
  }
}
```

⚠️ **Забути `client.release()` — критична помилка.** З'єднання не повернеться
в пул; після 10 таких запитів сервер перестане працювати повністю. Тому
`release()` завжди у `finally`.

Зручна обгортка, щоб не повторювати цей шаблон:

```js
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
    client.release();
  }
}
```

**ACID:** Atomicity (усе або нічого), Consistency (обмеження не порушуються),
Isolation (паралельні транзакції не заважають), Durability (зафіксоване не
зникне при збої).

---

## 17. Проблема N+1

```js
// ❌ 1 запит за фільмами + 20 запитів за жанрами = 21 звернення до бази
const movies = await pool.query('SELECT * FROM movies LIMIT 20');

for (const movie of movies.rows) {
  const genre = await pool.query('SELECT * FROM genres WHERE id = $1', [movie.genre_id]);
  movie.genre = genre.rows[0];
}
```

Два правильні розв'язання:

```js
// ✅ Варіант 1: JOIN — один запит
const { rows } = await pool.query(`
  SELECT m.*, g.name AS genre_name
    FROM movies m
    LEFT JOIN genres g ON g.id = m.genre_id
   LIMIT 20
`);

// ✅ Варіант 2: два запити (коли JOIN дає багато дублювання)
const movies = await pool.query('SELECT * FROM movies LIMIT 20');
const genreIds = [...new Set(movies.rows.map(m => m.genre_id).filter(Boolean))];

const genres = await pool.query('SELECT * FROM genres WHERE id = ANY($1::int[])', [genreIds]);
const genreMap = new Map(genres.rows.map(g => [g.id, g]));

movies.rows.forEach(m => { m.genre = genreMap.get(m.genre_id) ?? null; });
```

🔑 Ознака N+1 — **запит до бази всередині циклу**. Побачили `await` у `for` із
зверненням до бази — зупиніться й перепишіть.

Для виявлення увімкніть логування запитів у розробці й порахуйте, скільки їх
на одне звернення до API.

---

## 18. Seed-дані

```js
// scripts/seed.js
import { pool } from '../src/db/pool.js';

const GENRES = ['Драма', 'Комедія', 'Трилер', 'Документальний', 'Анімація',
                'Історичний', 'Фантастика', 'Пригоди', 'Мелодрама', 'Жахи'];

const TITLES = ['Тіні забутих предків', 'Земля', 'Камінний хрест', 'Білий птах',
                'Пропала грамота', 'Вавилон XX', 'Криниця для спраглих' /* … */];

async function seed() {
  console.log('Наповнення бази…');

  await pool.query('TRUNCATE movie_actors, movies, genres RESTART IDENTITY CASCADE');

  const genreIds = [];
  for (const name of GENRES) {
    const { rows } = await pool.query(
      'INSERT INTO genres (name, slug) VALUES ($1, $2) RETURNING id',
      [name, slugify(name)]
    );
    genreIds.push(rows[0].id);
  }

  const values = [];
  const params = [];

  for (let i = 0; i < 200; i++) {                    // вимога завдання: 50+
    const title = `${pick(TITLES)} ${i + 1}`;
    const year = 1920 + Math.floor(Math.random() * 106);
    const rating = (Math.random() * 10).toFixed(1);
    const genreId = pick(genreIds);

    params.push(title, year, rating, genreId, i % 3 !== 0);
    const n = params.length;
    values.push(`($${n - 4}, $${n - 3}, $${n - 2}, $${n - 1}, $${n})`);
  }

  await pool.query(
    `INSERT INTO movies (title, year, rating, genre_id, is_published)
     VALUES ${values.join(', ')}`,
    params
  );

  console.log(`✔ Створено ${GENRES.length} жанрів і 200 фільмів`);
  await pool.end();
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

seed().catch(error => {
  console.error('Помилка наповнення:', error);
  process.exit(1);
});
```

🔑 Одна багаторядкова вставка замість 200 окремих — на порядок швидше.

Бібліотека [`@faker-js/faker`](https://fakerjs.dev/) уміє генерувати
реалістичні дані, зокрема українською (`faker.locale = 'uk'`).

---

## 19. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Склеювання значень у SQL-рядок | **SQL-ін'єкція** | Параметри `$1`, `$2` |
| 2 | Поле сортування без білого списку | SQL-ін'єкція через `?sort=` | `Set` дозволених |
| 3 | Немає обмеження `limit` | Сервер «падає» від `?limit=99999999` | `MAX_LIMIT = 100` |
| 4 | Дієслова в URI (`/getMovies`) | Не REST | Іменники + методи |
| 5 | `200` замість `201` при створенні | Клієнт не розуміє результат | Правильні коди |
| 6 | Немає заголовка `Location` при `201` | Клієнт не знає URL нового ресурсу | `res.location(...)` |
| 7 | `PATCH` через перевірку істинності | Не можна записати `null` чи `0` | `Object.hasOwn` |
| 8 | Схема створюється руками | Неможливо відтворити | Міграції |
| 9 | Редагування застосованої міграції | Розсинхронізація середовищ | Нова міграція |
| 10 | `REAL` для грошей | Втрата точності | `NUMERIC` |
| 11 | `TIMESTAMP` замість `TIMESTAMPTZ` | Помилки з часовими зонами | `TIMESTAMPTZ` |
| 12 | Немає індексу на зовнішньому ключі | Повільні `JOIN` | `CREATE INDEX` |
| 13 | Запит до бази в циклі | Проблема N+1 | `JOIN` або `ANY($1)` |
| 14 | Немає `client.release()` | Вичерпання пулу, сервер «зависає» | `finally` |
| 15 | `new Client()` на кожен запит | Вичерпання з'єднань | Пул |
| 16 | Немає `, id` у `ORDER BY` | Дублікати при пагінації | Додати стабільне поле |
| 17 | `JOIN` замість `LEFT JOIN` | Зникають записи без зв'язку | `LEFT JOIN` |
| 18 | `ON DELETE CASCADE` без потреби | Каскадне видалення даних | Обдумати поведінку |

---

## 20. Контрольні запитання

1. Сформулюйте головну ідею REST щодо URI та методів.
2. Що таке модель зрілості Річардсона й на якому рівні наше API?
3. Наведіть п'ять правил іменування URI.
4. Чим `PUT` відрізняється від `PATCH`? Яка складність із `null` у `PATCH`?
5. Які методи ідемпотентні й чому це важливо для клієнта?
6. Чому колекція має повертатися об'єктом, а не масивом?
7. Чому обов'язкове максимальне значення `limit`?
8. Як працює параметризований запит і чому він захищає від ін'єкцій?
9. Чому поле сортування не можна передати параметром і що робити натомість?
10. Чому `NUMERIC`, а не `REAL`, для грошей?
11. Чим `TIMESTAMPTZ` кращий за `TIMESTAMP`?
12. Навіщо обмеження в базі, якщо є валідація в застосунку?
13. Які варіанти `ON DELETE` існують і коли доречний кожен?
14. Чому зовнішній ключ треба індексувати вручну?
15. Чому B-tree індекс не допомагає для `LIKE '%текст%'`?
16. Що таке проблема N+1 і два способи її розв'язати?
17. Чому `client.release()` обов'язковий і чому у `finally`?
18. Навіщо додавати `id` у `ORDER BY` при пагінації?

---

## 21. Практичні вправи

**Вправа 1 (проєктування API, 30 хв).** Спроєктуйте API для бібліотеки:
книги, автори (багато-до-багатьох), видавництва (один-до-багатьох),
читачі, видачі книг. Опишіть таблицею: метод, URI, призначення, коди
відповіді, параметри.

**Вправа 2 (Docker і схема, 40 хв).** Підніміть PostgreSQL через
`docker-compose`. Створіть схему з трьох таблиць із усіма типами обмежень
(`PK`, `FK`, `UNIQUE`, `CHECK`, `NOT NULL`, `DEFAULT`). Перевірте кожне
обмеження, спробувавши його порушити через `psql`.

**Вправа 3 (міграції, 35 хв).** Переведіть схему на `node-pg-migrate`.
Створіть три міграції. Перевірте: `migrate down` до нуля, потім `migrate up` —
схема має відтворитися повністю.

**Вправа 4 (репозиторій, 50 хв).** Реалізуйте репозиторій із `findAll`
(5 фільтрів, сортування за білим списком, `limit`/`offset`), `count`,
`findById`, `create`, `update`, `patch`, `remove`. Усі запити —
параметризовані.

**Вправа 5 (ін'єкція, 25 хв).** Навмисно напишіть уразливий запит зі
склеюванням рядка. Через Postman виконайте ін'єкцію, що повертає всі записи
попри фільтр. Потім виправте на параметризований і переконайтеся, що атака не
працює. **Опишіть результат у README.**

**Вправа 6 (індекси, 35 хв).** Наповніть таблицю 100 000 записів. Виконайте
`EXPLAIN ANALYZE` для пошуку за назвою та фільтра за жанром. Додайте індекси
й порівняйте час. Перевірте, чи допомагає B-tree для `ILIKE '%…%'`, і
спробуйте `pg_trgm`.

**Вправа 7 (N+1, 30 хв).** Реалізуйте отримання списку фільмів із жанрами
двома способами (у циклі та через `JOIN`). Увімкніть логування SQL і
порівняйте кількість запитів та час.

**Вправа 8 (транзакція, 30 хв).** Реалізуйте створення фільму разом зі
списком акторів у транзакції. Перевірте відкат: навмисно передайте
неіснуючий `actor_id` і переконайтеся, що фільм **не** створився.

---

## 22. Корисні посилання

### REST

- [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines) —
  практичний, детальний посібник.
- [Google API Design Guide](https://cloud.google.com/apis/design) —
  зокрема про іменування й помилки.
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) —
  першоджерело про методи й коди.
- [RFC 9457 — Problem Details](https://www.rfc-editor.org/rfc/rfc9457.html).
- [MDN: HTTP response status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status).
- [Richardson Maturity Model](https://martinfowler.com/articles/richardsonMaturityModel.html) —
  стаття Мартіна Фаулера.

### PostgreSQL

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/) —
  розділи «Data Types», «Indexes», «Performance Tips».
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/) — практичні
  приклади з поясненнями.
- [Use The Index, Luke!](https://use-the-index-luke.com/) — **найкращий
  безкоштовний ресурс про індекси й продуктивність SQL.**
- [PostgreSQL Exercises](https://pgexercises.com/) — інтерактивні задачі.
- [pg (node-postgres)](https://node-postgres.com/) — документація драйвера.
- [node-pg-migrate](https://salsita.github.io/node-pg-migrate/).
- [Postgres Wiki: Don't Do This](https://wiki.postgresql.org/wiki/Don%27t_Do_This) —
  перелік поширених помилок.
- [OWASP: SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

---

## 23. Література

1. **PostgreSQL Global Development Group.** *PostgreSQL Documentation.* —
   Основне джерело; розділи про типи даних, індекси й планувальник запитів.
2. **Brown, E.** *Web Development with Node and Express.* 2nd ed. —
   O'Reilly, 2019. — Розділи про роботу з базами даних і REST API.
3. **Kleppmann, M.** *Designing Data-Intensive Applications.* — O'Reilly, 2017. —
   Глибоке пояснення транзакцій, індексів, реплікації. Складна, але одна з
   найкращих книг у галузі.
4. **Fowler, M.** *Patterns of Enterprise Application Architecture.* —
   Addison-Wesley, 2002. — Патерни доступу до даних: Repository, Data Mapper,
   Unit of Work.
5. **Sturgeon, P.** *Build APIs You Won't Hate.* — 2015. — Практичні поради
   щодо проєктування API з погляду того, хто ним користуватиметься.

---

## 24. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Ресурс | resource | Сутність, доступна за URI |
| Кінцева точка | endpoint | Конкретна пара «метод + URI» |
| Ідемпотентність | idempotence | Повторний запит дає той самий результат |
| Пагінація | pagination | Посторінкове віддавання даних |
| Зсув | offset | Кількість пропущених записів |
| Курсор | cursor | Позначка позиції для наступної сторінки |
| Схема | schema | Структура таблиць і зв'язків |
| Первинний ключ | primary key | Унікальний ідентифікатор рядка |
| Зовнішній ключ | foreign key | Посилання на рядок іншої таблиці |
| Обмеження | constraint | Правило цілісності даних |
| Зв'язувальна таблиця | junction table | Реалізація «багато-до-багатьох» |
| З'єднання | join | Об'єднання рядків кількох таблиць |
| Індекс | index | Структура для пришвидшення пошуку |
| Міграція | migration | Версійована зміна схеми |
| Наповнення | seeding | Заповнення бази початковими даними |
| Пул з'єднань | connection pool | Набір повторно використовуваних з'єднань |
| Параметризований запит | parameterized query | Запит зі значеннями окремо від тексту |
| SQL-ін'єкція | SQL injection | Атака через підстановку SQL у дані |
| Транзакція | transaction | Атомарна група операцій |
| Фіксація / Відкат | commit / rollback | Підтвердження / скасування транзакції |
| Проблема N+1 | N+1 problem | Зайві запити до бази в циклі |

---

**Попередня:** [Лекція 12. Express.js: маршрутизація, middleware, архітектура](12-express-middleware-architecture.md)
**Наступна:** [Лекція 14. Автентифікація, авторизація та безпека](14-auth-security.md)

[← До змісту курсу](README.md)
