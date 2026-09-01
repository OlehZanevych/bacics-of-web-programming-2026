# Лекція 12. Express.js: маршрутизація, middleware, архітектура

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №4 «RESTful web service на Node.js + PostgreSQL»
> **Попередня лекція:** [Лекція 11](11-nodejs-runtime.md)

---

## Про що ця лекція

У попередній лекції ми написали HTTP-сервер вручну й побачили, скільки
рутинної роботи він вимагає: розбір URL, читання тіла, заголовки, обробка
помилок у кожній гілці. **Express** прибирає цю рутину.

Але головна тема лекції — не синтаксис Express (він простий), а
**архітектура**: як розкласти серверний застосунок на шари так, щоб через
місяць у ньому можна було розібратися, а через семестр — розширити.

---

## Зміст

1. [Перший застосунок](#1-перший-застосунок)
2. [Маршрутизація](#2-маршрутизація)
3. [Об'єкти `req` і `res`](#3-обєкти-req-і-res)
4. [Middleware](#4-middleware)
5. [Router: модульна структура](#5-router-модульна-структура)
6. [Обробка помилок](#6-обробка-помилок)
7. [Шарова архітектура](#7-шарова-архітектура)
8. [Впровадження залежностей](#8-впровадження-залежностей)
9. [Стандартні middleware](#9-стандартні-middleware)
10. [Статичні файли й завантаження](#10-статичні-файли-й-завантаження)
11. [Express 5: що змінилося](#11-express-5-що-змінилося)
12. [Альтернативи Express](#12-альтернативи-express)
13. [Типові помилки](#13-типові-помилки)
14. [Контрольні запитання](#14-контрольні-запитання)
15. [Практичні вправи](#15-практичні-вправи)
16. [Корисні посилання](#16-корисні-посилання)
17. [Література](#17-література)
18. [Глосарій](#18-глосарій)

---

## 1. Перший застосунок

```bash
npm install express
```

```js
// src/app.js
import express from 'express';

const app = express();

app.use(express.json());          // розбір JSON-тіла

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default app;
```

```js
// src/server.js
import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`Сервер запущено на http://localhost:${config.port}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
```

🔑 **Розділяйте `app.js` і `server.js`.** У першому — налаштування застосунку
без запуску, у другому — запуск. Це знадобиться для тестування: тести
підключають `app` і виконують запити без реального прослуховування порту.

---

## 2. Маршрутизація

```js
app.get('/api/movies', handler);
app.post('/api/movies', handler);
app.put('/api/movies/:id', handler);
app.patch('/api/movies/:id', handler);
app.delete('/api/movies/:id', handler);
app.all('/api/movies', handler);        // будь-який метод
```

### 2.1. Параметри

```js
// Параметр шляху
app.get('/api/movies/:id', (req, res) => {
  const { id } = req.params;
});

// Кілька параметрів
app.get('/api/users/:userId/movies/:movieId', (req, res) => {
  const { userId, movieId } = req.params;
});

// Query-параметри: /api/movies?search=земля&limit=10
app.get('/api/movies', (req, res) => {
  const { search, limit = 20, offset = 0 } = req.query;
});
```

⚠️ **Усе, що приходить у `req.params` і `req.query`, — рядки.** Числа треба
приводити явно й перевіряти:

```js
const limit = Number.parseInt(req.query.limit ?? '20', 10);
if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
  return res.status(400).json({ message: 'limit має бути числом від 1 до 100' });
}
```

⚠️ `req.query` може містити **масив** замість рядка: `?id=1&id=2` дасть
`['1','2']`. Це джерело помилок і потенційна вразливість, якщо код очікує
рядок. Валідація (лекція 15) розв'язує це системно.

### 2.2. Порядок має значення

Express перевіряє маршрути **згори вниз** і зупиняється на першому збігу.

```js
// ❌ '/api/movies/popular' потрапить у ':id' з id = 'popular'
app.get('/api/movies/:id', getById);
app.get('/api/movies/popular', getPopular);

// ✅ Конкретні маршрути — перед параметризованими
app.get('/api/movies/popular', getPopular);
app.get('/api/movies/:id', getById);
```

---

## 3. Об'єкти `req` і `res`

### 3.1. Запит

```js
req.params        // { id: '42' }
req.query         // { search: 'земля', limit: '10' }
req.body          // тіло (потрібен express.json())
req.headers       // усі заголовки (у нижньому регістрі)
req.get('Content-Type')
req.method        // 'GET'
req.path          // '/api/movies'
req.originalUrl   // '/api/movies?search=земля'
req.ip
req.cookies       // потрібен cookie-parser
```

### 3.2. Відповідь

```js
res.status(200).json({ data });
res.status(201).location(`/api/movies/${movie.id}`).json(movie);
res.status(204).end();                    // без тіла
res.set('X-Total-Count', String(total));
res.type('application/json');
res.send('текст');
res.sendFile(absolutePath);
res.redirect(302, '/api/movies');
```

🔑 **Правило одного завершення.** Кожен маршрут має завершитися **рівно
одним** викликом `res.json()`, `res.send()`, `res.end()` або `next()`. Два
завершення дадуть помилку `Cannot set headers after they are sent`.

```js
// ❌ Забули return
if (!movie) res.status(404).json({ message: 'Не знайдено' });
res.json(movie);                          // виконається теж!

// ✅
if (!movie) return res.status(404).json({ message: 'Не знайдено' });
res.json(movie);
```

### 3.3. Коди станів для REST

| Ситуація | Код |
|---|---|
| Успішне читання | `200 OK` |
| Успішне створення | `201 Created` + заголовок `Location` |
| Успішне оновлення/видалення без тіла | `204 No Content` |
| Некоректні дані | `400 Bad Request` |
| Немає автентифікації | `401 Unauthorized` |
| Немає прав | `403 Forbidden` |
| Ресурс не знайдено | `404 Not Found` |
| Конфлікт (дублювання) | `409 Conflict` |
| Забагато запитів | `429 Too Many Requests` |
| Помилка сервера | `500 Internal Server Error` |

---

## 4. Middleware

**Middleware** — функція, що виконується між отриманням запиту й відповіддю.
Має сигнатуру `(req, res, next)`.

```
Запит
  ↓
[ логування ] → [ CORS ] → [ розбір JSON ] → [ автентифікація ] → [ обробник ]
  ↓                                                                    ↓
Відповідь ←──────────────── [ обробник помилок ] ←─────────────────────┘
```

### 4.1. Власний middleware

```js
// Логування часу виконання
function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} — ${duration}ms`);
  });

  next();                     // ← ОБОВ'ЯЗКОВО, інакше запит «зависне»
}

app.use(requestLogger);
```

⚠️ **Забути `next()` — найпоширеніша помилка з middleware.** Запит просто
ніколи не отримає відповіді, і клієнт чекатиме до тайм-ауту. Симптом: запит
«крутиться» вічно без жодних помилок у консолі.

### 4.2. Три способи підключення

```js
// 1. Глобально — для всіх запитів
app.use(requestLogger);

// 2. Для шляху й усього, що під ним
app.use('/api/admin', requireAdmin);

// 3. Для конкретного маршруту (можна кілька поспіль)
app.post('/api/movies', requireAuth, validateMovie, moviesController.create);
```

### 4.3. Порядок виконання

Middleware виконуються **в порядку оголошення**.

```js
// ❌ req.body буде undefined — express.json() ще не спрацював
app.post('/api/movies', createMovie);
app.use(express.json());

// ✅
app.use(express.json());
app.post('/api/movies', createMovie);
```

### 4.4. Передавання даних далі

```js
function attachRequestId(req, res, next) {
  req.id = crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}

function authenticate(req, res, next) {
  const token = req.get('Authorization')?.replace('Bearer ', '');
  if (!token) return next(new UnauthorizedError('Потрібна автентифікація'));

  try {
    req.user = verifyToken(token);      // ← доступно в усіх наступних
    next();
  } catch {
    next(new UnauthorizedError('Недійсний токен'));
  }
}
```

### 4.5. Middleware-фабрики

Коли потрібна параметризація:

```js
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Недостатньо прав'));
    }
    next();
  };
}

app.delete('/api/movies/:id', authenticate, requireRole('ADMIN'), controller.remove);
```

---

## 5. Router: модульна структура

Тримати всі маршрути в одному файлі неможливо. `express.Router()` — окремий
«міні-застосунок».

```js
// src/routes/movies.routes.js
import { Router } from 'express';
import * as controller from '../controllers/movies.controller.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createMovieSchema, updateMovieSchema, listQuerySchema } from '../validators/movie.schema.js';

const router = Router();

router.get('/',        validate(listQuerySchema, 'query'), controller.list);
router.get('/count',   validate(listQuerySchema, 'query'), controller.count);
router.get('/:id',     controller.getById);

router.post('/',       authenticate, validate(createMovieSchema), controller.create);
router.put('/:id',     authenticate, validate(updateMovieSchema), controller.update);
router.patch('/:id',   authenticate, controller.patch);
router.delete('/:id',  authenticate, requireRole('ADMIN'), controller.remove);

export default router;
```

```js
// src/routes/index.js
import { Router } from 'express';
import moviesRoutes from './movies.routes.js';
import genresRoutes from './genres.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/movies', moviesRoutes);
router.use('/genres', genresRoutes);
router.use('/auth', authRoutes);

export default router;
```

```js
// src/app.js
import routes from './routes/index.js';

app.use('/api/v1', routes);
```

🔑 Версія в базовому шляху (`/api/v1`) — дешева страховка: коли доведеться
зробити несумісну зміну, ви додасте `/api/v2`, не ламаючи старих клієнтів.

---

## 6. Обробка помилок

### 6.1. Власні класи помилок

```js
// src/errors/index.js
export class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.isOperational = true;      // очікувана помилка, а не баг
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Ресурс') {
    super(`${resource} не знайдено`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(errors) {
    super('Помилка валідації', 400, errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфлікт даних') {
    super(message, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Потрібна автентифікація') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Недостатньо прав') {
    super(message, 403);
  }
}
```

### 6.2. Централізований обробник

Middleware з **чотирма** параметрами Express розпізнає як обробник помилок:

```js
// src/middlewares/errorHandler.js
import { AppError } from '../errors/index.js';
import { config } from '../config/index.js';

export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, req, res, next) {
  // Помилка вже після початку відповіді — делегуємо Express
  if (res.headersSent) return next(error);

  const isOperational = error instanceof AppError;
  const status = isOperational ? error.status : 500;

  // Логуємо: очікувані — коротко, неочікувані — з трасуванням
  if (isOperational) {
    console.warn(`[${req.id}] ${status} ${error.message}`);
  } else {
    console.error(`[${req.id}] Неочікувана помилка:`, error);
  }

  res.status(status).json({
    status,
    message: isOperational ? error.message : 'Внутрішня помилка сервера',
    ...(error.details ? { errors: error.details } : {}),
    // Стек — ЛИШЕ в розробці
    ...(config.isProduction ? {} : { stack: error.stack }),
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
```

```js
// src/app.js — обробники помилок ЗАВЖДИ останні
app.use('/api/v1', routes);
app.use(notFoundHandler);
app.use(errorHandler);
```

⚠️ **Стек викликів ніколи не повертається клієнту в продакшені** — це видає
структуру проєкту й версії бібліотек потенційному зловмиснику.

### 6.3. Асинхронні помилки

**В Express 4** помилки з асинхронних обробників не потрапляли в обробник
автоматично:

```js
// ❌ В Express 4 сервер «зависне»
app.get('/api/movies/:id', async (req, res) => {
  const movie = await service.getById(req.params.id);   // кине помилку
  res.json(movie);
});
```

Рішення — обгортка:

```js
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/movies/:id', asyncHandler(async (req, res) => {
  const movie = await service.getById(req.params.id);
  res.json(movie);
}));
```

🔑 **Express 5 обробляє відхилені проміси автоматично** — обгортка більше не
потрібна. Але ви зустрінете `asyncHandler` у більшості наявних проєктів, тому
знати про нього треба.

---

## 7. Шарова архітектура

Це ядро лекції й прямá вимога Завдання №4.

```
        HTTP-запит
             ↓
    ┌────────────────┐
    │     Routes     │  «які URL існують»
    └───────┬────────┘
            ↓
    ┌────────────────┐
    │  Middlewares   │  автентифікація, валідація, логування
    └───────┬────────┘
            ↓
    ┌────────────────┐
    │  Controllers   │  HTTP: читає req, віддає res
    └───────┬────────┘  ← НЕ містить бізнес-логіки
            ↓
    ┌────────────────┐
    │    Services    │  бізнес-логіка, правила, транзакції
    └───────┬────────┘  ← НЕ знає про HTTP
            ↓
    ┌────────────────┐
    │  Repositories  │  SQL, доступ до даних
    └───────┬────────┘  ← НЕ знає ні про HTTP, ні про бізнес-правила
            ↓
        PostgreSQL
```

### 7.1. Репозиторій

Знає **лише** про базу даних.

```js
// src/repositories/movies.repository.js
import { pool } from '../db/pool.js';

const ALLOWED_SORT_FIELDS = new Set(['title', 'year', 'rating', 'created_at']);

function buildWhere(filters) {
  const conditions = [];
  const params = [];

  if (filters.search) {
    params.push(`%${filters.search}%`);
    conditions.push(`title ILIKE $${params.length}`);
  }
  if (filters.genreId) {
    params.push(filters.genreId);
    conditions.push(`genre_id = $${params.length}`);
  }
  if (filters.yearFrom) {
    params.push(filters.yearFrom);
    conditions.push(`year >= $${params.length}`);
  }
  if (filters.yearTo) {
    params.push(filters.yearTo);
    conditions.push(`year <= $${params.length}`);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
}

export async function findAll({ filters = {}, sort = 'title', order = 'asc', limit = 20, offset = 0 }) {
  // Білий список полів сортування — захист від SQL-ін'єкції
  const sortField = ALLOWED_SORT_FIELDS.has(sort) ? sort : 'title';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  const { clause, params } = buildWhere(filters);
  params.push(limit, offset);

  const { rows } = await pool.query(
    `SELECT m.*, g.name AS genre_name
       FROM movies m
       LEFT JOIN genres g ON g.id = m.genre_id
       ${clause}
      ORDER BY m.${sortField} ${sortOrder}
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return rows;
}

export async function count(filters = {}) {
  const { clause, params } = buildWhere(filters);
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM movies ${clause}`, params);
  return rows[0].total;
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM movies WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function findByTitle(title) {
  const { rows } = await pool.query('SELECT * FROM movies WHERE LOWER(title) = LOWER($1)', [title]);
  return rows[0] ?? null;
}

export async function create(data) {
  const { rows } = await pool.query(
    `INSERT INTO movies (title, year, description, genre_id, rating)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.title, data.year, data.description, data.genreId, data.rating]
  );
  return rows[0];
}

export async function update(id, data) { /* … */ }

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM movies WHERE id = $1', [id]);
  return rowCount > 0;
}
```

🔑 Зверніть увагу на дві речі, які повторимо в лекції 13:
**параметризовані запити** (`$1`, `$2`) і **білий список** полів сортування.
Це не стиль — це безпека.

### 7.2. Сервіс

Знає бізнес-правила. **Не знає про HTTP.**

```js
// src/services/movies.service.js
import * as repository from '../repositories/movies.repository.js';
import { NotFoundError, ConflictError } from '../errors/index.js';
import { toMovieResponse } from '../mappers/movie.mapper.js';

export async function list(query) {
  const { search, genreId, yearFrom, yearTo, sort, order, limit, offset } = query;
  const filters = { search, genreId, yearFrom, yearTo };

  const [rows, total] = await Promise.all([
    repository.findAll({ filters, sort, order, limit, offset }),
    repository.count(filters),
  ]);

  return { data: rows.map(toMovieResponse), total, limit, offset };
}

export async function getById(id) {
  const movie = await repository.findById(id);
  if (!movie) throw new NotFoundError('Фільм');
  return toMovieResponse(movie);
}

export async function create(data) {
  const existing = await repository.findByTitle(data.title);
  if (existing) throw new ConflictError('Фільм із такою назвою вже існує');

  const movie = await repository.create(data);
  return toMovieResponse(movie);
}

export async function update(id, data) {
  const existing = await repository.findById(id);
  if (!existing) throw new NotFoundError('Фільм');

  if (data.title && data.title.toLowerCase() !== existing.title.toLowerCase()) {
    const duplicate = await repository.findByTitle(data.title);
    if (duplicate) throw new ConflictError('Фільм із такою назвою вже існує');
  }

  return toMovieResponse(await repository.update(id, data));
}

export async function remove(id) {
  const deleted = await repository.remove(id);
  if (!deleted) throw new NotFoundError('Фільм');
}
```

### 7.3. Контролер

Тонкий шар: читає `req`, викликає сервіс, віддає `res`.

```js
// src/controllers/movies.controller.js
import * as service from '../services/movies.service.js';

export async function list(req, res) {
  const result = await service.list(req.validatedQuery);
  res.set('X-Total-Count', String(result.total));
  res.json(result);
}

export async function count(req, res) {
  res.json({ total: await service.count(req.validatedQuery) });
}

export async function getById(req, res) {
  res.json(await service.getById(req.params.id));
}

export async function create(req, res) {
  const movie = await service.create(req.validatedBody);
  res.status(201).location(`/api/v1/movies/${movie.id}`).json(movie);
}

export async function update(req, res) {
  await service.update(req.params.id, req.validatedBody);
  res.status(204).end();
}

export async function remove(req, res) {
  await service.remove(req.params.id);
  res.status(204).end();
}
```

🔑 **Контролер має вміщатися в 5 рядків.** Якщо в ньому з'явився `if` із
бізнес-правилом чи SQL — щось лежить не на своєму місці.

### 7.4. Мапер

Відокремлює внутрішнє подання від того, що бачить клієнт:

```js
// src/mappers/movie.mapper.js
export function toMovieResponse(row) {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    description: row.description,
    rating: row.rating === null ? null : Number(row.rating),
    genre: row.genre_id ? { id: row.genre_id, name: row.genre_name } : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

Це дає: `snake_case` у базі → `camelCase` у API; приховування внутрішніх полів
(наприклад, `password_hash` чи `is_deleted`); стабільний контракт API при зміні
схеми бази.

### 7.5. Навіщо все це

| Без шарів | З шарами |
|---|---|
| Логіка в контролері, дублюється | Логіка в одному місці |
| Неможливо протестувати без HTTP | Сервіс тестується як функція |
| Зміна SQL зачіпає контролер | Змінюється лише репозиторій |
| Однакову операцію з двох маршрутів дублюють | Виклик одного сервісу |

⚠️ Для навчального проєкту це може здатися надлишковим. Але саме таку
структуру перевірятимуть у Завданні №4 — і саме її ви побачите в будь-якому
робочому проєкті.

### 7.6. Повна структура проєкту

```
src/
├── server.js                  ← запуск
├── app.js                     ← налаштування Express
├── config/
│   └── index.js               ← конфігурація зі змінних середовища
├── db/
│   ├── pool.js                ← пул з'єднань PostgreSQL
│   └── migrations/
├── routes/
│   ├── index.js
│   ├── movies.routes.js
│   ├── genres.routes.js
│   └── auth.routes.js
├── controllers/
├── services/
├── repositories/
├── mappers/
├── middlewares/
│   ├── auth.js
│   ├── validate.js
│   ├── errorHandler.js
│   └── requestId.js
├── validators/
├── errors/
└── utils/
```

---

## 8. Впровадження залежностей

Прямі імпорти між шарами прості, але ускладнюють тестування. Альтернатива —
передавати залежності явно:

```js
// src/services/movies.service.js
export function createMoviesService({ repository }) {
  return {
    async getById(id) {
      const movie = await repository.findById(id);
      if (!movie) throw new NotFoundError('Фільм');
      return toMovieResponse(movie);
    },
    // …
  };
}
```

```js
// Складання застосунку
import * as moviesRepository from './repositories/movies.repository.js';
const moviesService = createMoviesService({ repository: moviesRepository });
```

```js
// У тесті — підставляємо підробку, база не потрібна
const fakeRepository = { findById: async () => null };
const service = createMoviesService({ repository: fakeRepository });

await assert.rejects(() => service.getById('x'), NotFoundError);
```

Для Завдання №4 достатньо прямих імпортів. Але знати цей підхід корисно — у
курсі «Проєктування web застосунків» Spring побудований саме на ньому.

---

## 9. Стандартні middleware

```bash
npm install cors helmet morgan compression express-rate-limit
```

```js
// src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';

const app = express();

app.set('trust proxy', 1);              // за проксі (Render, Railway, nginx)

app.use(helmet());                       // безпечні HTTP-заголовки
app.use(cors({
  origin: config.corsOrigin,             // конкретний домен, НЕ '*'
  credentials: true,
}));
app.use(compression());                  // стиснення відповідей
app.use(express.json({ limit: '1mb' })); // розбір JSON з обмеженням
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isProduction ? 'combined' : 'dev'));

// Обмеження частоти для автентифікації
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Забагато спроб. Спробуйте через 15 хвилин.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api/v1/auth', authLimiter);
```

| Middleware | Що робить |
|---|---|
| `helmet` | встановлює захисні заголовки (CSP, HSTS, X-Frame-Options…) |
| `cors` | дозволяє запити з інших походжень |
| `compression` | стискає відповіді (gzip/brotli) |
| `express.json` | розбирає JSON-тіло |
| `morgan` | логує запити |
| `express-rate-limit` | обмежує частоту запитів |

⚠️ **`cors({ origin: '*' })` — не для продакшену.** Вказуйте конкретні домени.
Разом із `credentials: true` зірочка взагалі не працює за специфікацією.

⚠️ **`express.json({ limit })` обов'язковий.** Без обмеження зловмисник
надішле тіло на гігабайт і вичерпає пам'ять.

---

## 10. Статичні файли й завантаження

```js
app.use(express.static('public', {
  maxAge: '1d',
  etag: true,
}));

// Роздача завантажених файлів
app.use('/uploads', express.static(path.join(import.meta.dirname, '../uploads')));
```

**Завантаження файлів** через `multer`:

```bash
npm install multer
```

```js
import multer from 'multer';

const upload = multer({
  storage: multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${crypto.randomUUID()}${ext}`);     // ← НЕ оригінальне ім'я!
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },            // 2 МБ
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.post('/:id/poster', authenticate, upload.single('poster'), controller.uploadPoster);
```

⚠️ Три обов'язкові запобіжники: **не використовувати оригінальне ім'я файлу**
(там може бути `../../`), **обмежити розмір** і **перевірити тип**.
Перевірка `mimetype` не є надійною (його надсилає клієнт) — для критичних
випадків перевіряють сигнатуру файлу.

---

## 11. Express 5: що змінилося

Express 5 — актуальна стабільна гілка (5.2.x станом на 2026 рік).

| Зміна | Було (4) | Стало (5) |
|---|---|---|
| Асинхронні помилки | губилися, потрібен `asyncHandler` | **обробляються автоматично** |
| Шаблони маршрутів | `path-to-regexp` v0 | v8: `*` став `*name`, `:id?` став `{/:id}` |
| `req.query` | завжди розбирався `qs` | простіший розбір, налаштовується |
| Мінімальна версія Node | 0.10+ | 18+ |
| Викинуті методи | `res.send(status)`, `app.del()` | видалено |

Зміна шаблонів найпомітніша:

```js
// Express 4
app.get('/files/*', handler);
app.get('/movies/:id?', handler);

// Express 5
app.get('/files/*path', handler);        // req.params.path
app.get('/movies{/:id}', handler);
```

📚 Повний перелік — у [посібнику з міграції](https://expressjs.com/en/guide/migrating-5.html).

---

## 12. Альтернативи Express

| Фреймворк | Особливості | Коли обрати |
|---|---|---|
| **Express** | найпоширеніший, мінімалістичний, величезна екосистема | навчання, більшість проєктів |
| **Fastify** | у 2–3 рази швидший, вбудована валідація схемами й генерація OpenAPI | коли важлива продуктивність |
| **Koa** | від авторів Express, сучасніший, дуже мінімальний | коли хочеться будувати все самому |
| **NestJS** | повноцінний фреймворк: DI, декоратори, модулі, TypeScript | великі команди; ідейно схожий на Spring |
| **Hono** | ультралегкий, працює на Node, Deno, Bun, edge-середовищах | serverless, edge |

🔑 У курсі беремо Express, бо він найпростіший для розуміння **механізму**:
middleware видно, магії немає. NestJS, який ви фактично побачите у вигляді
Spring у наступному курсі, ховає багато чого за декораторами.

---

## 13. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Забутий `next()` у middleware | Запит «зависає» назавжди | Завжди викликати |
| 2 | Немає `return` перед `res.json()` | `Cannot set headers after they are sent` | `return res.status(…)` |
| 3 | `express.json()` після маршрутів | `req.body` = `undefined` | Реєструвати раніше |
| 4 | `/:id` перед конкретним маршрутом | `'popular'` потрапляє в `id` | Конкретні — першими |
| 5 | Обробник помилок не останній | Не спрацьовує | `app.use(errorHandler)` в кінці |
| 6 | Обробник помилок із трьома параметрами | Express не розпізнає його | Рівно чотири |
| 7 | Стек викликів у відповіді продакшену | Витік інформації | Лише в розробці |
| 8 | Бізнес-логіка в контролері | Дублювання, неможливо тестувати | Шар сервісів |
| 9 | SQL у контролері | Змішання відповідальностей | Шар репозиторіїв |
| 10 | `cors({ origin: '*' })` у продакшені | Будь-який сайт може звертатися | Конкретний домен |
| 11 | Немає `limit` у `express.json()` | Вичерпання пам'яті | `{ limit: '1mb' }` |
| 12 | Оригінальне ім'я завантаженого файлу | Path traversal, перезапис | Згенероване ім'я |
| 13 | Немає обмеження частоти на вхід | Перебір паролів | `express-rate-limit` |
| 14 | Немає версії в шляху API | Неможливо змінити контракт | `/api/v1` |
| 15 | `app.js` і `server.js` в одному файлі | Складно тестувати | Розділити |

---

## 14. Контрольні запитання

1. Навіщо розділяти `app.js` і `server.js`?
2. Що таке middleware і яка його сигнатура?
3. Що станеться, якщо забути `next()`?
4. Чому порядок реєстрації middleware має значення? Наведіть приклад помилки.
5. Чому Express розпізнає обробник помилок за кількістю параметрів?
6. Чим `/api/movies/popular` небезпечний після `/api/movies/:id`?
7. Що поверне `req.params.id` за типом? А `req.query.limit`?
8. Що таке «правило одного завершення» і як його порушення виглядає?
9. Опишіть чотири шари архітектури й відповідальність кожного.
10. Чому контролер не повинен містити SQL?
11. Навіщо потрібен мапер?
12. Що дає впровадження залежностей для тестування?
13. Чому `cors({ origin: '*' })` погано в продакшені?
14. Що змінилося в обробці асинхронних помилок в Express 5?
15. Три обов'язкові запобіжники при завантаженні файлів.

---

## 15. Практичні вправи

**Вправа 1 (перший сервер, 25 хв).** Створіть застосунок Express із
розділеними `app.js`/`server.js`, маршрутом `/api/health` і логувальним
middleware, що виводить метод, шлях, код і час виконання.

**Вправа 2 (маршрути, 35 хв).** Перепишіть ручний сервер із лекції 11 на
Express: усі сім методів CRUD, коректні коди станів, заголовок `Location`
для `201`. Дані поки в пам'яті.

**Вправа 3 (middleware, 30 хв).** Напишіть чотири middleware: `requestId`
(додає `X-Request-Id`), `requestLogger`, `authenticate` (перевіряє заголовок
`X-API-Key`), `requireRole('ADMIN')`. Застосуйте їх вибірково до маршрутів.

**Вправа 4 (помилки, 35 хв).** Реалізуйте ієрархію `AppError` і
централізований обробник. Перевірте: 404 для неіснуючого `id`, 409 для
дублювання, 400 для некоректних даних, 500 для навмисно кинутої помилки.
Переконайтеся, що в продакшен-режимі стек не потрапляє у відповідь.

**Вправа 5 (шари, 60 хв).** Розкладіть застосунок на `routes` →
`controllers` → `services` → `repositories` (поки з масивом у пам'яті замість
бази). Перевірте себе: у контролері немає жодного `if` із бізнес-правилом; у
сервісі немає жодної згадки `req` чи `res`.

**Вправа 6 (стандартні middleware, 25 хв).** Додайте `helmet`, `cors` із
конкретним доменом, `compression`, `morgan` і обмеження частоти для
`/api/v1/auth`. Перевірте заголовки відповіді в DevTools.

**Вправа 7 (тестування, 30 хв).** Напишіть три тести сервісу з підробленим
репозиторієм (без бази й без HTTP): успішне отримання, `NotFoundError`,
`ConflictError` при дублюванні назви.

---

## 16. Корисні посилання

- [Express — офіційна документація](https://expressjs.com/) — почніть із
  [Routing](https://expressjs.com/en/guide/routing.html),
  [Using middleware](https://expressjs.com/en/guide/using-middleware.html),
  [Error handling](https://expressjs.com/en/guide/error-handling.html).
- [Express: Production Best Practices — Performance](https://expressjs.com/en/advanced/best-practice-performance.html)
  та [Security](https://expressjs.com/en/advanced/best-practice-security.html).
- [Migrating to Express 5](https://expressjs.com/en/guide/migrating-5.html).
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) —
  розділи «Project Structure Practices» та «Error Handling Practices».
- [Helmet](https://helmetjs.github.io/) — які саме заголовки й навіщо.
- [express-rate-limit](https://express-rate-limit.mintlify.app/).
- [multer](https://github.com/expressjs/multer).
- [OWASP: REST Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).
- [Fastify](https://fastify.dev/) · [NestJS](https://docs.nestjs.com/) —
  подивіться, щоб порівняти підходи.

---

## 17. Література

1. **Brown, E.** *Web Development with Node and Express.* 2nd ed. —
   O'Reilly, 2019. — Основна книга саме про Express: маршрути, middleware,
   структура, тестування, розгортання.
2. **Buna, S.** *Efficient Node.js.* — O'Reilly, 2025. — Продуктивність
   серверних застосунків, робота з навантаженням.
3. **Martin, R. C.** *Clean Architecture.* — Prentice Hall, 2017. — Чому шари
   й напрямок залежностей мають саме такий вигляд. Приклади не на JS, ідеї
   універсальні.
4. **Fowler, M.** *Patterns of Enterprise Application Architecture.* —
   Addison-Wesley, 2002. — Першоджерело понять «репозиторій», «сервісний
   шар», «маппер даних».

---

## 18. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Проміжне ПЗ | middleware | Функція між запитом і відповіддю |
| Маршрутизатор | router | Модуль із групою маршрутів |
| Обробник | handler | Функція, що формує відповідь |
| Ланцюжок middleware | middleware chain | Послідовність обробки запиту |
| Контролер | controller | Шар, що працює з HTTP |
| Сервіс | service | Шар бізнес-логіки |
| Репозиторій | repository | Шар доступу до даних |
| Мапер | mapper | Перетворення між поданнями даних |
| Впровадження залежностей | dependency injection | Передавання залежностей ззовні |
| Обробник помилок | error handler | Middleware з чотирма параметрами |
| Операційна помилка | operational error | Очікувана помилка (404, 409) |
| Обмеження частоти | rate limiting | Захист від надмірної кількості запитів |
| Версіонування API | API versioning | Підтримка кількох версій контракту |

---

**Попередня:** [Лекція 11. Node.js: середовище виконання та екосистема](11-nodejs-runtime.md)
**Наступна:** [Лекція 13. Проєктування REST API та робота з PostgreSQL](13-rest-api-postgresql.md)

[← До змісту курсу](README.md)
