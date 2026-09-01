# Лекція 15. Node.js: якість, надійність і документація API

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язані завдання:** №4 (завершення), №5
> **Попередня лекція:** [Лекція 14](14-auth-security.md)

---

## Про що ця лекція

API, яке працює «у щасливому сценарії», — це половина роботи. Друга половина —
те, що відрізняє навчальний проєкт від робочого: **валідація** вхідних даних,
**логування**, **тестування**, **документація** й **моніторинг стану**.

Це остання лекція про серверну частину. Після неї у вас буде все, щоб
завершити Завдання №4 на повний бал.

---

## Зміст

1. [Валідація вхідних даних](#1-валідація-вхідних-даних)
2. [Схеми валідації](#2-схеми-валідації)
3. [Middleware валідації](#3-middleware-валідації)
4. [Логування](#4-логування)
5. [Наскрізний ідентифікатор запиту](#5-наскрізний-ідентифікатор-запиту)
6. [Моніторинг стану](#6-моніторинг-стану)
7. [Тестування: піраміда](#7-тестування-піраміда)
8. [Юніт-тести](#8-юніт-тести)
9. [Інтеграційні тести API](#9-інтеграційні-тести-api)
10. [Тести з реальною базою](#10-тести-з-реальною-базою)
11. [Покриття коду](#11-покриття-коду)
12. [Документація OpenAPI](#12-документація-openapi)
13. [Продуктивність](#13-продуктивність)
14. [Готовність до продакшену](#14-готовність-до-продакшену)
15. [Типові помилки](#15-типові-помилки)
16. [Контрольні запитання](#16-контрольні-запитання)
17. [Практичні вправи](#17-практичні-вправи)
18. [Корисні посилання](#18-корисні-посилання)
19. [Література](#19-література)
20. [Глосарій](#20-глосарій)

---

## 1. Валідація вхідних даних

🔑 **Головний принцип: ніколи не довіряйте даним від клієнта.** Навіть якщо ви
самі написали цей клієнт — запит можна надіслати з Postman, `curl` чи скрипта.

Клієнтська валідація (лекція 9) — для зручності користувача.
Серверна — для **безпеки та цілісності даних**. Вони не замінюють одна одну.

### 1.1. Що перевіряти

| Аспект | Приклад |
|---|---|
| Присутність | `title` обов'язковий |
| Тип | `year` — число, а не рядок |
| Формат | `email` схожий на пошту; `id` — коректний UUID |
| Діапазон | `year` між 1888 і 2100 |
| Довжина | `title` від 2 до 200 символів |
| Належність до набору | `format` ∈ {digital, disc, film} |
| Зв'язки | вказаний `genreId` існує в базі |
| **Невідомі поля** | відкидати те, чого немає у схемі |

Останній пункт розв'язує вразливість mass assignment із лекції 14.

### 1.2. Валідувати треба все

```js
req.body      // тіло
req.params    // { id: '42' } — а якщо там 'DROP TABLE'?
req.query     // ?limit=999999999 або ?sort=password
req.headers   // рідше, але буває
```

⚠️ Про `req.query` часто забувають. Саме звідти приходять `limit`, `offset`,
`sort` — і саме вони найчастіше стають вектором атаки або причиною падіння
сервера.

---

## 2. Схеми валідації

Писати перевірки вручну в кожному контролері — шлях до дублювання й
пропущених випадків. Використовуємо **схеми**.

```bash
npm install zod
```

```js
// src/validators/movie.schema.js
import { z } from 'zod';

export const createMovieSchema = z.object({
  title: z.string()
    .trim()
    .min(2, 'Мінімум 2 символи')
    .max(200, 'Максимум 200 символів'),

  year: z.coerce.number()
    .int('Має бути цілим числом')
    .min(1888, 'Не раніше 1888 року')
    .max(2100, 'Не пізніше 2100 року'),

  description: z.string().trim().max(2000).optional().nullable(),

  rating: z.coerce.number().min(0).max(10).optional().nullable(),

  posterUrl: z.string().url('Некоректне посилання').optional().nullable(),

  format: z.enum(['digital', 'disc', 'film'], {
    errorMap: () => ({ message: 'Формат: digital, disc або film' }),
  }).default('digital'),

  isPublished: z.boolean().default(false),

  genreId: z.coerce.number().int().positive().optional().nullable(),

  releaseDate: z.coerce.date().optional().nullable(),
}).strict();      // ← відкидає невідомі поля: захист від mass assignment

// Оновлення: усі поля необов'язкові, але хоча б одне має бути
export const updateMovieSchema = createMovieSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'Потрібно передати хоча б одне поле для оновлення',
  });

// Query-параметри списку
export const listQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  genreId: z.coerce.number().int().positive().optional(),
  yearFrom: z.coerce.number().int().min(1888).max(2100).optional(),
  yearTo: z.coerce.number().int().min(1888).max(2100).optional(),
  isPublished: z.enum(['true', 'false']).transform(v => v === 'true').optional(),

  sort: z.enum(['title', 'year', 'rating', 'created_at']).default('title'),
  order: z.enum(['asc', 'desc']).default('asc'),

  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})
.refine(d => !d.yearFrom || !d.yearTo || d.yearFrom <= d.yearTo, {
  message: 'yearFrom не може бути більшим за yearTo',
  path: ['yearFrom'],
});

// Параметр шляху
export const idParamSchema = z.object({
  id: z.string().uuid('Некоректний ідентифікатор'),
});
```

🔑 Три речі, які схема дає безкоштовно:

1. **`.strict()`** — невідомі поля відкидаються з помилкою. Mass assignment
   стає неможливим.
2. **`z.enum(['title', 'year', …])` для `sort`** — це і є білий список полів
   сортування з лекції 13, тільки декларативний.
3. **`z.coerce`** — автоматичне приведення рядків із query до чисел і дат.

**Альтернативи:** `joi` (популярна, зріла), `yup`, `express-validator`,
`valibot` (легша за Zod), `ajv` (за стандартом JSON Schema — зручно, якщо
потрібна ще й генерація OpenAPI).

---

## 3. Middleware валідації

```js
// src/middlewares/validate.js
import { ValidationError } from '../errors/index.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.') || source,
        message: issue.message,
      }));
      return next(new ValidationError(errors));
    }

    // Кладемо ОЧИЩЕНІ дані в окреме поле,
    // щоб випадково не використати сирий req.body
    const target = {
      body: 'validatedBody',
      query: 'validatedQuery',
      params: 'validatedParams',
    }[source];

    req[target] = result.data;
    next();
  };
}
```

```js
// Використання
router.get('/',
  validate(listQuerySchema, 'query'),
  controller.list);

router.get('/:id',
  validate(idParamSchema, 'params'),
  controller.getById);

router.post('/',
  authenticate,
  validate(createMovieSchema),
  controller.create);

router.put('/:id',
  authenticate,
  validate(idParamSchema, 'params'),
  validate(updateMovieSchema),
  controller.update);
```

Відповідь при помилці:

```json
{
  "status": 400,
  "message": "Помилка валідації",
  "errors": [
    { "field": "title", "message": "Мінімум 2 символи" },
    { "field": "year", "message": "Не раніше 1888 року" }
  ],
  "path": "/api/v1/movies",
  "timestamp": "2026-09-01T10:15:30.000Z"
}
```

🔑 **Усі помилки повертаються одразу**, а не по одній. Інакше користувач
виправлятиме форму по одному полю за запит — типовий приклад поганого API.

---

## 4. Логування

### 4.1. Чому не `console.log`

| `console.log` | Структурований логер |
|---|---|
| Рядки, які важко шукати | JSON, за яким можна фільтрувати |
| Немає рівнів | `debug`, `info`, `warn`, `error`, `fatal` |
| Немає часу й контексту | автоматичні `time`, `pid`, `requestId` |
| Синхронний | асинхронний, не блокує |

```bash
npm install pino pino-http
npm install -D pino-pretty
```

```js
// src/utils/logger.js
import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isProduction ? 'info' : 'debug',

  // Читабельний вивід у розробці
  transport: config.isProduction ? undefined : {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'HH:MM:ss' },
  },

  // Приховування чутливих полів — критично важливо
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.passwordConfirm',
      '*.password',
      '*.token',
      '*.password_hash',
    ],
    censor: '[ПРИХОВАНО]',
  },
});
```

```js
// src/app.js
import pinoHttp from 'pino-http';

app.use(pinoHttp({
  logger,
  genReqId: (req) => req.id ?? crypto.randomUUID(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
}));
```

### 4.2. Рівні

| Рівень | Коли |
|---|---|
| `fatal` | застосунок не може продовжувати роботу |
| `error` | операція провалилася (500, помилка бази) |
| `warn` | щось підозріле, але працює (400, 404, повільний запит) |
| `info` | значущі події: старт, вхід користувача, створення запису |
| `debug` | подробиці для розробки |
| `trace` | дуже детально (SQL-запити) |

### 4.3. Що логувати

```js
// ✅ Структуровано, з контекстом
logger.info({ userId, movieId, action: 'movie.created' }, 'Створено фільм');
logger.warn({ ip: req.ip, email: maskEmail(email) }, 'Невдала спроба входу');
logger.error({ err, requestId: req.id }, 'Помилка запиту до бази');

// ❌ Без контексту — неможливо знайти причину
console.log('помилка');
console.log('ok');
```

⚠️ **Ніколи не логуйте** паролі, повні токени, номери карток, повні тіла
запитів автентифікації. Налаштування `redact` — не додаткова опція, а
обов'язковий запобіжник.

---

## 5. Наскрізний ідентифікатор запиту

Коли в логах тисячі рядків, потрібно вміти зібрати всі записи **одного**
запиту.

```js
// src/middlewares/requestContext.js
import { AsyncLocalStorage } from 'node:async_hooks';
import crypto from 'node:crypto';

export const requestContext = new AsyncLocalStorage();

export function requestContextMiddleware(req, res, next) {
  const requestId = req.get('X-Request-Id') ?? crypto.randomUUID();

  req.id = requestId;
  res.set('X-Request-Id', requestId);

  requestContext.run({ requestId, userId: null }, next);
}
```

```js
// Будь-де глибше — без передавання параметром
const { requestId } = requestContext.getStore() ?? {};
logger.debug({ requestId, sql }, 'Виконання запиту до бази');
```

🔑 Повернення `X-Request-Id` клієнту дуже корисне: користувач надсилає вам
цей ідентифікатор із скріншота помилки, і ви за секунду знаходите весь
ланцюжок у логах.

---

## 6. Моніторинг стану

```js
// src/routes/health.routes.js
import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

// Проста перевірка: чи живий процес
router.get('/live', (req, res) => {
  res.json({ status: 'ok' });
});

// Глибока: чи готовий обслуговувати запити
router.get('/ready', async (req, res) => {
  const checks = {};
  let healthy = true;

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    checks.database = { status: 'ok', responseTime: Date.now() - start };
  } catch (error) {
    checks.database = { status: 'error', message: error.message };
    healthy = false;
  }

  const memory = process.memoryUsage();

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    memory: {
      heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      rssMb: Math.round(memory.rss / 1024 / 1024),
    },
    checks,
  });
});

export default router;
```

🔑 Розділення `live` і `ready` — стандарт для Kubernetes і хмарних платформ:
`live` каже «не перезапускай мене», `ready` — «можеш слати трафік».

⚠️ Ендпоінт стану **не повинен** повертати версії бібліотек, рядки
підключення чи внутрішні адреси — це підказка для зловмисника.

---

## 7. Тестування: піраміда

```
          ╱╲
         ╱E2E╲          мало: повільні, крихкі, дорогі
        ╱──────╲
       ╱ Інтегр.╲       середньо: перевіряють взаємодію
      ╱──────────╲
     ╱   Юніт     ╲     багато: швидкі, дешеві, точні
    ╱──────────────╲
```

| Рівень | Що перевіряє | Швидкість | Що використовуємо |
|---|---|---|---|
| Юніт | окрема функція/сервіс | мілісекунди | `node:test` або Vitest |
| Інтеграційний | маршрут + сервіс + база | секунди | `supertest` |
| E2E | увесь застосунок у браузері | десятки секунд | Playwright (поза курсом) |

🔑 **Найцінніші тести для нашого проєкту** — юніт-тести **сервісів** і
**валідаторів** та інтеграційні тести **маршрутів**. Тестувати контролери
окремо сенсу мало: вони й так тонкі.

---

## 8. Юніт-тести

Node.js має вбудований тестовий раннер — окремий фреймворк не обов'язковий.

```js
// tests/unit/movies.service.test.js
import { test, describe, beforeEach, mock } from 'node:test';
import assert from 'node:assert/strict';

import { createMoviesService } from '../../src/services/movies.service.js';
import { NotFoundError, ConflictError } from '../../src/errors/index.js';

describe('moviesService', () => {
  let repository;
  let service;

  beforeEach(() => {
    // Підроблений репозиторій — база не потрібна
    repository = {
      findById: mock.fn(async () => null),
      findByTitle: mock.fn(async () => null),
      create: mock.fn(async (data) => ({ id: 'new-id', ...data })),
      remove: mock.fn(async () => true),
    };
    service = createMoviesService({ repository });
  });

  describe('getById', () => {
    test('повертає фільм, якщо він існує', async () => {
      repository.findById = mock.fn(async () => ({ id: '1', title: 'Земля', year: 1930 }));

      const movie = await service.getById('1');

      assert.equal(movie.title, 'Земля');
      assert.equal(repository.findById.mock.callCount(), 1);
    });

    test('кидає NotFoundError, якщо фільму немає', async () => {
      await assert.rejects(
        () => service.getById('missing'),
        (error) => error instanceof NotFoundError
      );
    });
  });

  describe('create', () => {
    test('кидає ConflictError при дублюванні назви', async () => {
      repository.findByTitle = mock.fn(async () => ({ id: 'existing' }));

      await assert.rejects(
        () => service.create({ title: 'Земля', year: 1930 }),
        (error) => error instanceof ConflictError
      );

      assert.equal(repository.create.mock.callCount(), 0);   // не намагався створити
    });

    test('створює фільм, якщо назва вільна', async () => {
      const movie = await service.create({ title: 'Нове кіно', year: 2026 });

      assert.equal(movie.title, 'Нове кіно');
      assert.equal(repository.create.mock.callCount(), 1);
    });
  });
});
```

```bash
node --test
node --test --watch
node --test tests/unit/
```

**Валідатори тестуються ще простіше:**

```js
test('відкидає невідомі поля', () => {
  const result = createMovieSchema.safeParse({
    title: 'Земля', year: 1930, role: 'ADMIN',
  });

  assert.equal(result.success, false);
});

test('приводить рядок з query до числа', () => {
  const result = listQuerySchema.safeParse({ limit: '50' });

  assert.equal(result.success, true);
  assert.equal(result.data.limit, 50);
  assert.equal(typeof result.data.limit, 'number');
});
```

---

## 9. Інтеграційні тести API

```bash
npm install -D supertest
```

```js
// tests/integration/movies.test.js
import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

import app from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { resetDatabase, seedTestData, createTestToken } from '../helpers.js';

describe('API /api/v1/movies', () => {
  let token;

  before(async () => {
    await resetDatabase();
    token = createTestToken({ id: 1, role: 'ADMIN' });
  });

  beforeEach(async () => {
    await seedTestData();
  });

  after(async () => {
    await pool.end();
  });

  describe('GET /api/v1/movies', () => {
    test('повертає список із метаданими', async () => {
      const response = await request(app)
        .get('/api/v1/movies')
        .expect(200)
        .expect('Content-Type', /json/);

      assert.ok(Array.isArray(response.body.data));
      assert.equal(typeof response.body.total, 'number');
      assert.equal(response.body.limit, 20);
    });

    test('фільтрує за пошуком', async () => {
      const response = await request(app)
        .get('/api/v1/movies?search=земля')
        .expect(200);

      assert.ok(response.body.data.every(m => /земля/i.test(m.title)));
    });

    test('відхиляє некоректний limit', async () => {
      const response = await request(app)
        .get('/api/v1/movies?limit=999999')
        .expect(400);

      assert.ok(response.body.errors.some(e => e.field === 'limit'));
    });

    test('відхиляє невідоме поле сортування', async () => {
      await request(app)
        .get('/api/v1/movies?sort=password_hash')
        .expect(400);
    });
  });

  describe('POST /api/v1/movies', () => {
    test('створює фільм і повертає 201 із Location', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Новий фільм', year: 2026 })
        .expect(201);

      assert.ok(response.headers.location.includes(response.body.id));
      assert.equal(response.body.title, 'Новий фільм');
    });

    test('повертає 401 без токена', async () => {
      await request(app)
        .post('/api/v1/movies')
        .send({ title: 'Новий фільм', year: 2026 })
        .expect(401);
    });

    test('повертає 400 з переліком помилок полів', async () => {
      const response = await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'A', year: 1800 })
        .expect(400);

      const fields = response.body.errors.map(e => e.field);
      assert.ok(fields.includes('title'));
      assert.ok(fields.includes('year'));
    });

    test('повертає 409 при дублюванні назви', async () => {
      const payload = { title: 'Унікальна назва', year: 2026 };

      await request(app).post('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`).send(payload).expect(201);

      await request(app).post('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`).send(payload).expect(409);
    });

    test('ігнорує спробу передати заборонене поле', async () => {
      await request(app)
        .post('/api/v1/movies')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Тест', year: 2026, id: 'підроблений', createdBy: 999 })
        .expect(400);                    // .strict() відхиляє невідомі поля
    });
  });

  describe('DELETE /api/v1/movies/:id', () => {
    test('повертає 403 для ролі USER', async () => {
      const userToken = createTestToken({ id: 2, role: 'USER' });

      await request(app)
        .delete('/api/v1/movies/00000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('повертає 404 для неіснуючого id', async () => {
      await request(app)
        .delete('/api/v1/movies/00000000-0000-0000-0000-0000000000ff')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
```

🔑 `supertest` піднімає застосунок **у пам'яті** — реальний порт не потрібен.
Саме тому ми розділили `app.js` і `server.js` (лекція 12).

---

## 10. Тести з реальною базою

```js
// tests/helpers.js
import { pool } from '../src/db/pool.js';
import jwt from 'jsonwebtoken';
import { config } from '../src/config/index.js';

export async function resetDatabase() {
  await pool.query('TRUNCATE movies, genres, users RESTART IDENTITY CASCADE');
}

export async function seedTestData() {
  await resetDatabase();

  const { rows: [genre] } = await pool.query(
    `INSERT INTO genres (name, slug) VALUES ('Драма', 'drama') RETURNING id`
  );

  await pool.query(
    `INSERT INTO movies (id, title, year, genre_id) VALUES
       ('00000000-0000-0000-0000-000000000001', 'Земля', 1930, $1),
       ('00000000-0000-0000-0000-000000000002', 'Тіні забутих предків', 1965, $1)`,
    [genre.id]
  );
}

export function createTestToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '1h',
    issuer: 'movies-api',
  });
}
```

```
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://movies:movies_dev_password@localhost:5433/movies_test
JWT_SECRET=test-secret-not-for-production-use-only
```

```yaml
# docker-compose.yml — окрема база для тестів
  db-test:
    image: postgres:18-alpine
    environment:
      POSTGRES_USER: movies
      POSTGRES_PASSWORD: movies_dev_password
      POSTGRES_DB: movies_test
    ports:
      - "5433:5432"                    # інший порт!
    tmpfs:
      - /var/lib/postgresql/data       # у пам'яті — швидше, дані не зберігаються
```

```json
"scripts": {
  "test": "node --env-file=.env.test --test tests/",
  "test:watch": "node --env-file=.env.test --test --watch tests/",
  "test:coverage": "node --env-file=.env.test --test --experimental-test-coverage tests/"
}
```

**Три правила тестів із базою:**

1. **Окрема тестова база.** Ніколи не запускайте тести проти бази розробки —
   `TRUNCATE` знищить ваші дані.
2. **Незалежність тестів.** Кожен готує собі дані; порядок виконання не має
   значення.
3. **Чистий стан.** `beforeEach` скидає базу — інакше тести починають
   впливати один на одного, і поламані тести з'являються «випадково».

📚 Просунутіший підхід — **Testcontainers**: бібліотека сама піднімає
контейнер із базою на час тестів. Це те, що ви робитимете в курсі
«Проєктування web застосунків».

---

## 11. Покриття коду

```bash
node --test --experimental-test-coverage
```

```
ℹ file                       | line % | branch % | funcs %
ℹ src/services/movies.js     |  94.12 |    88.24 | 100.00
ℹ src/validators/movie.js    | 100.00 |   100.00 | 100.00
ℹ src/repositories/movies.js |  72.41 |    61.90 |  85.71
```

🔑 **Покриття показує, який код виконувався під час тестів — не те, чи він
правильний.** 100% покриття з тестами без жодного `assert` не варте нічого.

Розумні орієнтири: бізнес-логіка (сервіси, валідатори) — 80–90%; контролери й
конфігурація — не критично.

⚠️ Не «дотягуйте відсоток» тестами, що лише викликають функцію. Це створює
ілюзію безпеки, гіршу за її відсутність.

---

## 12. Документація OpenAPI

**OpenAPI** (раніше Swagger) — стандарт машинозчитуваного опису REST API.
Що це дає: інтерактивна документація, генерація клієнтів, тестування прямо в
браузері, автоматична перевірка контракту.

```bash
npm install swagger-ui-express
```

### 12.1. Опис

```yaml
# docs/openapi.yaml
openapi: 3.1.0

info:
  title: Movies API
  version: 1.0.0
  description: Навчальний REST API каталогу фільмів (ЛНУ, ФПМІ)
  contact:
    name: Ім'я Прізвище
    email: student@lnu.edu.ua

servers:
  - url: http://localhost:3000/api/v1
    description: Локальна розробка
  - url: https://movies-api.onrender.com/api/v1
    description: Продакшен

tags:
  - name: Movies
    description: Операції з фільмами
  - name: Auth
    description: Автентифікація

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Movie:
      type: object
      required: [id, title, year]
      properties:
        id: { type: string, format: uuid }
        title: { type: string, example: "Тіні забутих предків" }
        year: { type: integer, minimum: 1888, maximum: 2100, example: 1965 }
        rating: { type: number, nullable: true, minimum: 0, maximum: 10 }
        description: { type: string, nullable: true }
        genre:
          type: object
          nullable: true
          properties:
            id: { type: integer }
            name: { type: string }
        createdAt: { type: string, format: date-time }

    MovieCreate:
      type: object
      required: [title, year]
      properties:
        title: { type: string, minLength: 2, maxLength: 200 }
        year: { type: integer, minimum: 1888, maximum: 2100 }
        genreId: { type: integer, nullable: true }

    Error:
      type: object
      properties:
        status: { type: integer, example: 400 }
        message: { type: string }
        errors:
          type: array
          items:
            type: object
            properties:
              field: { type: string }
              message: { type: string }

  responses:
    NotFound:
      description: Ресурс не знайдено
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }
    Unauthorized:
      description: Потрібна автентифікація
      content:
        application/json:
          schema: { $ref: '#/components/schemas/Error' }

paths:
  /movies:
    get:
      tags: [Movies]
      summary: Список фільмів
      parameters:
        - name: search
          in: query
          schema: { type: string }
          description: Частковий збіг за назвою
        - name: genreId
          in: query
          schema: { type: integer }
        - name: sort
          in: query
          schema: { type: string, enum: [title, year, rating, created_at], default: title }
        - name: order
          in: query
          schema: { type: string, enum: [asc, desc], default: asc }
        - name: limit
          in: query
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
        - name: offset
          in: query
          schema: { type: integer, minimum: 0, default: 0 }
      responses:
        '200':
          description: Успіх
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items: { $ref: '#/components/schemas/Movie' }
                  total: { type: integer }
                  limit: { type: integer }
                  offset: { type: integer }
        '400':
          description: Некоректні параметри
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Error' }

    post:
      tags: [Movies]
      summary: Створити фільм
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/MovieCreate' }
      responses:
        '201':
          description: Створено
          headers:
            Location:
              schema: { type: string }
              description: URL створеного ресурсу
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Movie' }
        '400': { description: Помилка валідації }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '409': { description: Фільм із такою назвою вже існує }

  /movies/{id}:
    get:
      tags: [Movies]
      summary: Отримати фільм за ідентифікатором
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        '200':
          description: Успіх
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Movie' }
        '404': { $ref: '#/components/responses/NotFound' }
```

### 12.2. Підключення Swagger UI

```js
// src/app.js
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'node:fs';

const spec = YAML.parse(
  readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8')
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
  customSiteTitle: 'Movies API',
}));

app.get('/api-docs.json', (req, res) => res.json(spec));
```

Тепер за адресою `http://localhost:3000/api-docs` є інтерактивна документація,
у якій можна виконувати запити прямо з браузера, зокрема з токеном
(кнопка «Authorize»).

### 12.3. Генерація зі схем

Щоб не підтримувати схему двічі, є `zod-to-openapi`:

```js
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

export const MovieSchema = z.object({
  id: z.string().uuid().openapi({ example: 'a1b2c3d4-…' }),
  title: z.string().openapi({ example: 'Земля' }),
}).openapi('Movie');
```

Схема стає **єдиним джерелом істини** й для валідації, і для документації.

---

## 13. Продуктивність

### 13.1. Що зазвичай гальмує

| Причина | Виявлення | Виправлення |
|---|---|---|
| Відсутній індекс | `EXPLAIN ANALYZE`, `Seq Scan` | `CREATE INDEX` |
| Проблема N+1 | багато однакових запитів у логах | `JOIN` або `ANY($1)` |
| Синхронний код | подія «зависання» сервера | асинхронні аналоги |
| Немає пагінації | великий обсяг відповіді | `limit`/`offset` |
| Немає стиснення | великий трафік | `compression` |

### 13.2. Кешування

```js
// Найпростіший кеш для довідників
const cache = new Map();

export async function getGenres() {
  const key = 'genres';
  const entry = cache.get(key);

  if (entry && Date.now() - entry.time < 60_000) return entry.value;

  const value = await genresRepository.findAll();
  cache.set(key, { value, time: Date.now() });
  return value;
}
```

**HTTP-кешування** для відповідей, що рідко змінюються:

```js
res.set('Cache-Control', 'public, max-age=300');
res.set('ETag', etag);
```

⚠️ Ніколи не кешуйте відповіді, що залежать від користувача, без
`Cache-Control: private`.

### 13.3. Вимірювання

```bash
npx autocannon -c 50 -d 10 http://localhost:3000/api/v1/movies
```

Показує кількість запитів за секунду, затримку (p50, p99) та помилки. Робіть
заміри **до** й **після** оптимізації — інакше ви не оптимізуєте, а гадаєте.

---

## 14. Готовність до продакшену

### 14.1. Чек-лист

**Конфігурація**
- [ ] Усі налаштування зі змінних середовища
- [ ] Валідація обов'язкових змінних при старті
- [ ] `NODE_ENV=production`
- [ ] `.env` не в git, є `.env.example`

**Безпека** (див. лекцію 14)
- [ ] `helmet`, CORS із конкретними доменами, rate limiting
- [ ] Паролі хешовані, секрет JWT надійний
- [ ] Стек викликів не у відповіді

**Надійність**
- [ ] Централізований обробник помилок
- [ ] `uncaughtException` і `unhandledRejection` оброблені
- [ ] Коректне завершення по `SIGTERM`
- [ ] `/health/live` і `/health/ready`

**Дані**
- [ ] Міграції застосовуються автоматично при деплої
- [ ] Індекси створені
- [ ] Пул з'єднань налаштований
- [ ] Транзакції там, де змінюється кілька таблиць

**Спостережуваність**
- [ ] Структуроване логування без чутливих даних
- [ ] `X-Request-Id` наскрізний
- [ ] Логуються 4xx (warn) і 5xx (error)

**Якість**
- [ ] `npm run lint` чистий
- [ ] Тести проходять
- [ ] `npm audit` без критичних вразливостей
- [ ] OpenAPI доступний і актуальний

### 14.2. Найпростіший CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:18-alpine
        env:
          POSTGRES_USER: movies
          POSTGRES_PASSWORD: test
          POSTGRES_DB: movies_test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 5s
          --health-timeout 5s --health-retries 5

    env:
      DATABASE_URL: postgresql://movies:test@localhost:5432/movies_test
      JWT_SECRET: ci-test-secret-value-not-for-production

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run migrate:up
      - run: npm test
```

---

## 15. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Валідація лише на клієнті | Будь-які дані через Postman | Обов'язкова серверна |
| 2 | Не валідується `req.query` | Падіння від `?limit=999999999` | Схема для query |
| 3 | Схема без `.strict()` | Mass assignment | Відкидати невідомі поля |
| 4 | Помилки повертаються по одній | Погана взаємодія | Усі одразу |
| 5 | `console.log` замість логера | Неможливо шукати в логах | `pino` |
| 6 | Паролі/токени в логах | Витік | `redact` |
| 7 | Немає `X-Request-Id` | Неможливо зібрати ланцюжок | Наскрізний ідентифікатор |
| 8 | Тести проти бази розробки | Втрата даних | Окрема тестова база |
| 9 | Тести залежать від порядку | «Випадкові» падіння | `beforeEach` із очищенням |
| 10 | Тести без `assert` | Покриття є, користі немає | Перевіряти поведінку |
| 11 | Гонитва за 100% покриття | Ілюзія якості | Тестувати логіку |
| 12 | Немає документації API | Клієнт «здогадується» | OpenAPI + Swagger UI |
| 13 | Документація розходиться з кодом | Гірше, ніж її відсутність | Генерація зі схем |
| 14 | Ендпоінт стану видає версії й адреси | Підказка зловмиснику | Мінімум інформації |
| 15 | Оптимізація без вимірювання | Марна робота | `EXPLAIN`, `autocannon` |

---

## 16. Контрольні запитання

1. Чому серверна валідація обов'язкова, навіть якщо є клієнтська?
2. Що, крім тіла запиту, потрібно валідувати?
3. Як `.strict()` у схемі захищає від mass assignment?
4. Як схема замінює ручний білий список полів сортування?
5. Чому всі помилки валідації повертають одразу?
6. Назвіть чотири переваги структурованого логера над `console.log`.
7. Що обов'язково приховувати в логах?
8. Навіщо `X-Request-Id` і чому його варто повертати клієнту?
9. Чим `/health/live` відрізняється від `/health/ready`?
10. Опишіть піраміду тестування. Чому юніт-тестів має бути найбільше?
11. Навіщо розділяти `app.js` і `server.js` для тестування?
12. Три правила тестів, що працюють із базою.
13. Що насправді показує покриття коду?
14. Що дає OpenAPI, крім гарної сторінки з документацією?
15. Як уникнути розходження документації з реальним API?

---

## 17. Практичні вправи

**Вправа 1 (схеми, 40 хв).** Опишіть схемами Zod: створення, оновлення,
query-параметри списку й параметр `id`. Обов'язково `.strict()` та
`z.coerce`. Перевірте: некоректний рік, надто короткий `title`, невідоме поле,
`limit=999999`, `sort=password_hash`.

**Вправа 2 (middleware, 25 хв).** Реалізуйте `validate(schema, source)`.
Переконайтеся, що контролери використовують `req.validatedBody`, а не
`req.body`.

**Вправа 3 (логування, 30 хв).** Підключіть `pino` з `redact` і `pino-http`.
Перевірте, що при спробі входу пароль у логах замінено на `[ПРИХОВАНО]`, а
кожен запит має `X-Request-Id`.

**Вправа 4 (стан, 20 хв).** Реалізуйте `/health/live` і `/health/ready`.
Зупиніть базу (`docker compose stop db`) і переконайтеся, що `ready`
повертає 503, а `live` — 200.

**Вправа 5 (юніт-тести, 45 хв).** Напишіть 10 тестів сервісу з підробленим
репозиторієм: успішні сценарії, `NotFoundError`, `ConflictError`, перевірка
кількості викликів репозиторію.

**Вправа 6 (інтеграційні тести, 60 хв).** Налаштуйте окрему тестову базу.
Напишіть тести для всіх семи ендпоінтів, включно з 400, 401, 403, 404, 409.
Мінімум 15 тестів.

**Вправа 7 (покриття, 20 хв).** Запустіть із `--experimental-test-coverage`.
Знайдіть найменш покритий модуль і допишіть тести для **значущих** гілок
(не заради відсотка).

**Вправа 8 (OpenAPI, 50 хв).** Опишіть усе своє API у `openapi.yaml`:
схеми, усі шляхи, коди відповідей, `bearerAuth`. Підключіть Swagger UI.
Перевірте, що через нього можна виконати повний сценарій: вхід → створення →
отримання → видалення.

**Вправа 9 (навантаження, 25 хв).** Виміряйте `autocannon` продуктивність
списку до й після додавання індексу на поле пошуку. Запишіть RPS і затримку
p99 в обох випадках.

---

## 18. Корисні посилання

- [Zod](https://zod.dev/) · [Joi](https://joi.dev/api/) ·
  [express-validator](https://express-validator.github.io/).
- [Pino](https://getpino.io/) — документація й рецепти.
- [Node.js: Test runner](https://nodejs.org/api/test.html) — вбудований
  тестовий фреймворк.
- [supertest](https://github.com/ladjs/supertest).
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html) ·
  [Swagger Editor](https://editor.swagger.io/) — редактор із перевіркою.
- [swagger-ui-express](https://github.com/scottie1984/swagger-ui-express).
- [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi).
- [autocannon](https://github.com/mcollina/autocannon) — навантажувальне
  тестування.
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) —
  розділи «Testing», «Going To Production», «Error Handling».
- [Martin Fowler: The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html).
- [Testcontainers for Node.js](https://node.testcontainers.org/) —
  знадобиться в наступному курсі.

---

## 19. Література

1. **Buna, S.** *Efficient Node.js.* — O'Reilly, 2025. — Логування,
   моніторинг, профілювання, підготовка до продакшену.
2. **Brown, E.** *Web Development with Node and Express.* 2nd ed. —
   O'Reilly, 2019. — Розділи про тестування й розгортання.
3. **Fowler, M.** *The Practical Test Pyramid* (стаття) та
   *Refactoring.* 2nd ed. — Addison-Wesley, 2018. — Про роль тестів як
   страховки при зміні коду.
4. **Beyer, B. та ін.** *Site Reliability Engineering.* — O'Reilly, 2016. —
   Розділи про моніторинг і «золоті сигнали»; безкоштовно на
   [sre.google/books](https://sre.google/books/).
5. **Sturgeon, P.** *Build APIs You Won't Hate.* — 2015. — Документація,
   версіонування, обробка помилок з погляду споживача API.

---

## 20. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Валідація | validation | Перевірка коректності вхідних даних |
| Схема | schema | Декларативний опис структури даних |
| Приведення | coercion | Перетворення типу під час валідації |
| Структуроване логування | structured logging | Логи у машинозчитуваному форматі |
| Приховування | redaction | Заміна чутливих значень у логах |
| Рівень логування | log level | Ступінь важливості повідомлення |
| Ідентифікатор запиту | request ID | Наскрізна позначка для трасування |
| Перевірка живучості | liveness probe | «Чи живий процес» |
| Перевірка готовності | readiness probe | «Чи готовий обслуговувати трафік» |
| Піраміда тестування | test pyramid | Співвідношення типів тестів |
| Юніт-тест | unit test | Тест окремої одиниці коду |
| Інтеграційний тест | integration test | Тест взаємодії компонентів |
| Підробка / мок | mock / stub | Замінник залежності в тесті |
| Покриття коду | code coverage | Частка коду, виконаного тестами |
| Специфікація API | API specification | Формальний опис контракту |
| Навантажувальне тестування | load testing | Перевірка під навантаженням |
| Спостережуваність | observability | Здатність зрозуміти стан системи ззовні |

---

**Попередня:** [Лекція 14. Автентифікація, авторизація та безпека](14-auth-security.md)
**Наступна:** [Лекція 16. Інтеграція, розгортання та підсумки курсу](16-integration-deployment.md)

[← До змісту курсу](README.md)
