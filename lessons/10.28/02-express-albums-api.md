# REST API «Фонотеки» на Express.js і PostgreSQL: покроковий сценарій для лекцій 11–13

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Лекції:** [11. Node.js: середовище виконання](../../lectures/11-nodejs-runtime.md) ·
> [12. Express.js: маршрутизація, middleware, архітектура](../../lectures/12-express-middleware-architecture.md) ·
> [13. REST API та PostgreSQL](../../lectures/13-rest-api-postgresql.md)
> **Інструменти:** WebStorm 2026.2, Node.js 24 LTS, Express 5.3, PostgreSQL 18 (Docker), `pg` 8, `node-pg-migrate` 9
> **Готовий проєкт:** папка [`albums-api/`](albums-api/) поруч із цим файлом

Цей файл — **сценарій живого кодування** для трьох лекцій. Крок за кроком
будуємо бекенд для **«Фонотеки»** — тієї самої предметної області, що й у
прикладі [Завдання №3](../../additiona-tutorials/assignment-3-music-catalog.md):
альбоми, виконавці, жанри. Кожен крок прив'язаний до розділів лекцій і показує
**в коді** те, про що в лекції сказано словами.

Логіка всього сценарію — **«спершу без, потім з»**:

1. **Лекція 11.** Сервер на голому `node:http` — щоб побачити, скільки роботи
   доводиться робити вручну і чому один повільний запит зупиняє всіх.
2. **Лекція 12.** Той самий API на Express: middleware, обробка помилок,
   шари routes → controllers → services → repositories. Дані поки **в
   пам'яті** — база ще не потрібна.
3. **Лекція 13.** Підключаємо PostgreSQL: Docker, міграції, пул з'єднань,
   параметризовані запити, транзакції. Замінюємо **репозиторії** (плюс
   перевірка бази в `/health` і перетворення помилок PostgreSQL в одному
   місці) — сервіси, контролери, валідатори й маршрути ресурсів не
   змінюються жодним рядком. Це й є головний аргумент на користь шарової
   архітектури.

---

## Як користуватися сценарієм

| Позначка | Що означає |
|---|---|
| 📄 **`шлях/до/файлу`** | повний вміст файлу — можна копіювати цілком; якщо файл уже є, він **замінюється повністю** |
| 🎤 **На лекції** | що показати й на чому наголосити студентам |
| 📚 **Теорія** | коротке нагадування з лекції — щоб не перемикатися між файлами |
| 🤔 **Чому так** | чому обрано саме таке рішення і які є альтернативи |
| ✅ **Контрольна точка** | що має вийти; якщо виходить інше — не йдіть далі |
| 🧪 **Експеримент** | навмисна поломка, щоб побачити, навіщо потрібне рішення. **Після кожного експерименту поверніть код** (`⌘Z` / `Ctrl+Z` або **Local History**) |

**Якщо часу на лекції мало.** Кожна частина самодостатня: можна відкрити
готовий проєкт [`albums-api/`](albums-api/) і пройти лише контрольні точки та
експерименти. Готовий проєкт відповідає **кінцю частини 3**; версії файлів
для частин 1–2 — у тексті кроків.

**Запити.** Усі запити є у файлі [`albums-api/requests.http`](albums-api/requests.http)
для вбудованого **HTTP Client** у WebStorm (зелена стрілка ▶ ліворуч від
запиту). Для показу в терміналі під кожною контрольною точкою є команди
`curl` (у Windows — у **Git Bash**: у PowerShell інші правила лапок і
перенесення рядків, а в Windows PowerShell 5.1 `curl` — це взагалі псевдонім
`Invoke-WebRequest`).

---

## Зміст

0. [Огляд: що будуємо](#0-огляд-що-будуємо)

**Частина 1. Node.js без фреймворку (лекція 11)**

1. [Проєкт у WebStorm](#1-проєкт-у-webstorm)
2. [Цикл подій: порядок виконання](#2-цикл-подій-порядок-виконання)
3. [HTTP-сервер на `node:http`](#3-http-сервер-на-nodehttp)
4. [Конфігурація та змінні середовища](#4-конфігурація-та-змінні-середовища)

**Частина 2. Express: middleware і шари (лекція 12)**

5. [Перший застосунок на Express](#5-перший-застосунок-на-express)
6. [Middleware](#6-middleware)
7. [Обробка помилок](#7-обробка-помилок)
8. [Валідація вхідних даних](#8-валідація-вхідних-даних)
9. [Репозиторії: дані в пам'яті](#9-репозиторії-дані-в-памяті)
10. [Мапери й сервіси](#10-мапери-й-сервіси)
11. [Контролери, маршрути й перший повний API](#11-контролери-маршрути-й-перший-повний-api)

**Частина 3. PostgreSQL (лекція 13)**

12. [PostgreSQL у Docker](#12-postgresql-у-docker)
13. [Міграції: схема бази в коді](#13-міграції-схема-бази-в-коді)
14. [Пул з'єднань і запуск сервера](#14-пул-зєднань-і-запуск-сервера)
15. [Seed-дані](#15-seed-дані)
16. [Репозиторії на SQL](#16-репозиторії-на-sql)
17. [Експерименти з базою](#17-експерименти-з-базою)

**Підсумок**

18. [Що де лежить: карта проєкту й лекцій](#18-що-де-лежить-карта-проєкту-й-лекцій)
19. [Питання для обговорення](#19-питання-для-обговорення)
20. [Корисні посилання](#20-корисні-посилання)

---

## 0. Огляд: що будуємо

### 0.1. Ресурси й зв'язки

| Ресурс | Зв'язок | У базі |
|---|---|---|
| **Альбом** (`albums`) — головна сутність, повний CRUD | — | `id` — UUID |
| **Виконавець** (`artists`) | **багато-до-одного**: в альбому один виконавець | `albums.artist_id → artists.id` |
| **Жанр** (`genres`) | **багато-до-багатьох**: в альбому кілька жанрів | зв'язувальна таблиця `album_genres` |

```mermaid
erDiagram
    artists ||--o{ albums : "має"
    albums ||--o{ album_genres : ""
    genres ||--o{ album_genres : ""
    artists {
        int id PK
        varchar name UK
        timestamptz created_at
    }
    albums {
        uuid id PK
        varchar title UK
        text description
        int artist_id FK
        date release_date
        smallint track_count
        smallint rating
        varchar format
        boolean in_collection
        timestamptz created_at
        timestamptz updated_at
    }
    genres {
        int id PK
        varchar name UK
    }
    album_genres {
        uuid album_id PK,FK
        int genre_id PK,FK
    }
```

### 0.2. Ендпоїнти

Базовий шлях — **`/api/v1`** (версія в шляху, [лекція 13, §6](../../lectures/13-rest-api-postgresql.md)).

| Метод | Шлях | Дія | Успіх | Помилки |
|---|---|---|---|---|
| `GET` | `/health` | стан сервера й бази | 200 | 503 |
| `GET` | `/albums` | список із пошуком, фільтрами, сортуванням, пагінацією | 200 | 400 |
| `GET` | `/albums/:id` | один альбом | 200 | 400, 404 |
| `POST` | `/albums` | створити | 201 + `Location` | 400, 409 |
| `PUT` | `/albums/:id` | замінити повністю | 204 | 400, 404, 409 |
| `PATCH` | `/albums/:id` | змінити частково | 204 | 400, 404, 409 |
| `DELETE` | `/albums/:id` | видалити | 204 | 400, 404 |
| `GET` | `/artists`, `/artists/:id` | виконавці з кількістю альбомів | 200 | 400, 404 |
| `POST` | `/artists` | додати виконавця | 201 + `Location` | 400, 409 |
| `DELETE` | `/artists/:id` | видалити виконавця **без** альбомів | 204 | 400, 404, 409 |
| `GET` | `/genres` | жанри з кількістю альбомів | 200 | — |

Коди успіху (`201` + `Location`, `204` для `PUT`/`PATCH`/`DELETE`) — як у
таблиці [лекції 13, §3.1](../../lectures/13-rest-api-postgresql.md). Коди
`401`/`403` з'являться в лекції 14 разом з автентифікацією; `400` для
`GET`/`DELETE` — це некоректний `id` у шляху.

**Query-параметри списку:** `search` (назва або виконавець), `artistId`,
`genreId`, `format` (`vinyl` / `cd` / `digital`), `inCollection`
(`true` / `false`), `yearFrom`, `yearTo`, `sort` (`title` / `releaseDate` /
`rating` / `createdAt`), `order` (`asc` / `desc`), `limit` (1–100, за
замовчуванням 20), `offset`.

**Альбом у відповіді:**

```json
{
  "id": "1f9c5a1e-6d0b-4c1e-9a55-0b7e8d1c2a3f",
  "title": "Гірська весна",
  "description": "Дебютний альбом гурту: трембіта, електрогітари й пісні, записані наживо в Яремчі.",
  "artist": { "id": 1, "name": "Карпатський вітер" },
  "genres": [{ "id": 1, "name": "Рок" }, { "id": 2, "name": "Фолк" }],
  "releaseDate": "2014-04-18",
  "trackCount": 11,
  "rating": 5,
  "format": "vinyl",
  "inCollection": true,
  "createdAt": "2026-10-27T09:00:00.000Z",
  "updatedAt": "2026-10-27T09:00:00.000Z"
}
```

**Помилка** — завжди в одному форматі ([лекція 13, §5.1](../../lectures/13-rest-api-postgresql.md)):

```json
{
  "status": 400,
  "message": "Помилка валідації",
  "errors": [
    { "field": "title", "message": "Назва обов'язкова" },
    { "field": "trackCount", "message": "Кількість треків — ціле число від 1 до 999" }
  ],
  "path": "/api/v1/albums",
  "timestamp": "2026-10-27T10:15:30.000Z"
}
```

### 0.3. Шлях запиту крізь застосунок

```mermaid
flowchart LR
    C([Клієнт]) --> M["Middleware<br/>requestId → logger → helmet → cors → json"]
    M --> R["Router<br/>/api/v1/albums"]
    R --> V["validate()<br/>req.validatedBody"]
    V --> CT["Controller<br/>req → res"]
    CT --> S["Service<br/>бізнес-правила"]
    S --> RP["Repository<br/>SQL"]
    RP --> DB[(PostgreSQL)]
    V -. "ValidationError" .-> EH["errorHandler<br/>JSON-помилка"]
    S -. "NotFoundError, ConflictError,<br/>ValidationError" .-> EH
    RP -. "коди 23505, 23503…" .-> EH
    EH --> C
```

### 0.4. Підсумкова структура

```
albums-api/
├── docker-compose.yml         ← PostgreSQL 18 для розробки
├── package.json
├── .env.example               ← шаблон налаштувань (у git)
├── .env                       ← ваші налаштування (НЕ в git)
├── requests.http              ← запити для HTTP Client у WebStorm
├── examples/                  ← демонстрації лекції 11
│   ├── event-loop-order.js / .cjs
│   └── node-http-server.js
├── scripts/
│   └── seed.js                ← наповнення бази демо-даними
├── tests/
│   └── album.validators.test.js
└── src/
    ├── server.js              ← запуск і коректне завершення
    ├── app.js                 ← налаштування Express
    ├── config/index.js        ← конфігурація зі змінних середовища
    ├── data/                  ← демо-дані (і сховище в пам'яті для частини 2)
    ├── db/
    │   ├── pool.js            ← пул з'єднань, транзакції
    │   ├── pgErrors.js        ← коди помилок PostgreSQL → помилки API
    │   └── migrations/        ← схема бази
    ├── errors/index.js        ← власні класи помилок
    ├── middlewares/           ← requestId, requestLogger, validate, errorHandler
    ├── validators/            ← перевірка тіла, query й параметрів шляху
    ├── routes/                ← які URL існують
    ├── controllers/           ← HTTP: req → res
    ├── services/              ← бізнес-правила
    ├── repositories/          ← доступ до даних (SQL)
    └── mappers/               ← snake_case бази → camelCase API
```

---

# Частина 1. Node.js без фреймворку (лекція 11)

## 1. Проєкт у WebStorm

> Лекція 11: [§1.2 Версії](../../lectures/11-nodejs-runtime.md),
> [§4.2 ESM](../../lectures/11-nodejs-runtime.md), [§5 npm і `package.json`](../../lectures/11-nodejs-runtime.md)

### 1.1. Перевіряємо Node.js

```bash
node -v    # v24.x (або новіша LTS)
npm -v     # 11.x
```

Якщо версія нижча за 22 — встановіть LTS з [nodejs.org](https://nodejs.org/)
або через `nvm install 24`.

### 1.2. Створюємо проєкт

1. WebStorm → **File → New → Project…** → ліворуч **Empty Project**.
2. **Location:** `…/albums-api` → **Create**.
3. Відкрийте термінал WebStorm (**View → Tool Windows → Terminal**,
   `⌥F12` / `Alt+F12`) і виконайте:

```bash
npm init -y
mkdir -p examples scripts tests src/{config,data,db/migrations,errors,middlewares,validators,routes,controllers,services,repositories,mappers}
```

> У Windows (PowerShell) фігурні дужки в `mkdir` не працюють — створіть
> папки через **New → Directory** у WebStorm або виконайте команду в Git Bash.

4. **Settings → Languages & Frameworks → Node.js:** переконайтеся, що вибрано
   інтерпретатор Node.js 24. Тоді WebStorm підказуватиме вбудовані модулі
   `node:*` і глобальні об'єкти (`process`, `Buffer`).

### 1.3. `package.json`

Замініть згенерований файл:

```json
{
  "name": "albums-api",
  "version": "1.0.0",
  "private": true,
  "description": "REST API для «Фонотеки»: альбоми, виконавці, жанри",
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js",
    "test": "node --test",
    "demo:http": "node examples/node-http-server.js"
  }
}
```

> 📚 **Теорія** ([лекція 11, §4–5](../../lectures/11-nodejs-runtime.md))
>
> - **`"type": "module"`** вмикає ES-модулі (`import`/`export`) для всіх `.js`
>   файлів. Без нього Node.js вважає `.js` модулями CommonJS (`require`).
> - **`"private": true`** — захист від випадкового `npm publish`.
> - **`engines`** — мінімальна версія Node.js. Для самого проєкту це
>   передусім документація: `npm` перевіряє її під час встановлення лише з
>   налаштуванням `engine-strict=true` (наприклад, у файлі `.npmrc`).
> - **`node --watch`** перезапускає сервер при зміні файлів — `nodemon` не
>   потрібен. **`--env-file=.env`** читає змінні середовища з файлу — `dotenv`
>   теж не потрібен (обидва вбудовані в Node.js 20+).
> - **`start`** без `--env-file`: у продакшені змінні середовища задає
>   хостинг, файлу `.env` там немає.

📄 **`.nvmrc`**

```
24
```

📄 **`.gitignore`**

```
node_modules/
.env
```

> 🎤 **На лекції.** Звернути увагу: `.env` потрапляє в `.gitignore` **до
> першого коміту** — секрет, що потрапив в історію git, треба вважати
> скомпрометованим, навіть якщо файл потім видалити.

### ✅ Контрольна точка 1

- У проєкті є `package.json` з `"type": "module"`, `.nvmrc`, `.gitignore` і
  порожні папки `examples`, `scripts`, `tests`, `src/…`.
- `node -v` показує версію 22 або новішу.

---

## 2. Цикл подій: порядок виконання

> Лекція 11: [§2 Цикл подій на сервері](../../lectures/11-nodejs-runtime.md)

Короткий експеримент на дві хвилини, з якого зручно почати розмову про
однопотоковість.

📄 **`examples/event-loop-order.js`**

```js
// Порядок виконання в циклі подій. Запуск: node examples/event-loop-order.js
// Порівняйте з: node examples/event-loop-order.cjs (той самий код у CommonJS)

console.log('1: синхронно');

setTimeout(() => console.log('2: timers'), 0);
setImmediate(() => console.log('3: check'));

Promise.resolve().then(() => console.log('4: мікрозадача (проміс)'));
process.nextTick(() => console.log('5: nextTick'));

console.log('6: синхронно');
```

📄 **`examples/event-loop-order.cjs`** — той самий код, але CommonJS:

```js
// Той самий код, але як CommonJS-модуль (розширення .cjs).
// Запуск: node examples/event-loop-order.cjs

console.log('1: синхронно');

setTimeout(() => console.log('2: timers'), 0);
setImmediate(() => console.log('3: check'));

Promise.resolve().then(() => console.log('4: мікрозадача (проміс)'));
process.nextTick(() => console.log('5: nextTick'));

console.log('6: синхронно');
```

```bash
node examples/event-loop-order.js
node examples/event-loop-order.cjs
```

### ✅ Контрольна точка 2

```
# ES-модуль (.js при "type": "module")    # CommonJS (.cjs)
1: синхронно                              1: синхронно
6: синхронно                              6: синхронно
4: мікрозадача (проміс)                   5: nextTick
5: nextTick                               4: мікрозадача (проміс)
3: check   ← порядок 2 і 3 може           3: check
2: timers  ← змінюватися між запусками    2: timers
```

> 🎤 **На лекції.** Три речі, які видно з виводу:
>
> 1. Синхронний код (`1`, `6`) завжди виконується **першим і до кінця** —
>    жоден колбек не перерве його посередині.
> 2. Мікрозадачі (`4`, `5`) виконуються **раніше** за будь-який таймер.
> 3. ES-модуль виконується всередині вже запущеної черги мікрозадач, тому
>    проміс встигає раніше за `nextTick` — на відміну від CommonJS. Саме тому
>    в лекції показано обидва варіанти.
>
> Порядок `2` і `3` на верхньому рівні модуля не гарантований: запустіть
> кілька разів.

---

## 3. HTTP-сервер на `node:http`

> Лекція 11: [§8 HTTP-сервер без фреймворку](../../lectures/11-nodejs-runtime.md),
> [§3 Блокуючі операції](../../lectures/11-nodejs-runtime.md),
> [§7 Потоки](../../lectures/11-nodejs-runtime.md)

Пишемо маленький REST API **без жодної бібліотеки**: список, пошук, один
альбом, створення. Мета — відчути, скільки рутини бере на себе фреймворк.

📄 **`examples/node-http-server.js`**

```js
// REST-сервер БЕЗ фреймворку — лише вбудований модуль node:http.
// Не для продакшену: щоб побачити, що саме Express зробить за нас.
// Запуск: npm run demo:http   (порт 3001, щоб не заважати основному серверу)

import http from 'node:http';

const PORT = 3001;

// «Сховище» в пам'яті: зникає після перезапуску
const albums = [
  { id: '1', title: 'Гірська весна', year: 2014 },
  { id: '2', title: 'Остання зупинка', year: 2012 },
  { id: '3', title: 'Тиша між нотами', year: 2010 },
];

// Відповідь JSON: статус, заголовки, тіло — усе вручну
function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

// Тіло запиту приходить ПОТОКОМ шматків (chunks) — збираємо й розбираємо самі
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      // захист від величезного тіла: зайве не зберігаємо в пам'яті
      if (size <= 100_000) chunks.push(chunk);
    });

    req.on('end', () => {
      if (size > 100_000) {
        reject(Object.assign(new Error('Завелике тіло запиту'), { status: 413 }));
        return;
      }
      const raw = Buffer.concat(chunks).toString('utf8');
      try {
        resolve(raw ? JSON.parse(raw) : null);
      } catch {
        reject(Object.assign(new Error('Некоректний JSON'), { status: 400 }));
      }
    });

    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;
  console.log(req.method, url.pathname + url.search);

  try {
    // GET /api/albums?search=…
    if (req.method === 'GET' && pathname === '/api/albums') {
      const search = url.searchParams.get('search')?.toLowerCase() ?? '';
      const data = albums.filter((album) => album.title.toLowerCase().includes(search));
      return sendJson(res, 200, { data, total: data.length });
    }

    // GET /api/albums/:id — параметр шляху витягуємо регулярним виразом
    const match = pathname.match(/^\/api\/albums\/([\w-]+)$/);
    if (req.method === 'GET' && match) {
      const album = albums.find((item) => item.id === match[1]);
      if (!album) return sendJson(res, 404, { message: 'Альбом не знайдено' });
      return sendJson(res, 200, album);
    }

    // POST /api/albums
    if (req.method === 'POST' && pathname === '/api/albums') {
      const body = await readJsonBody(req);

      if (typeof body?.title !== 'string' || body.title.trim() === '') {
        return sendJson(res, 400, { message: "Поле title обов'язкове" });
      }
      const title = body.title.trim();
      if (albums.some((album) => album.title.toLowerCase() === title.toLowerCase())) {
        return sendJson(res, 409, { message: 'Альбом із такою назвою вже є' });
      }

      const album = { id: crypto.randomUUID(), title, year: body.year ?? null };
      albums.push(album);
      res.setHeader('Location', `/api/albums/${album.id}`);
      return sendJson(res, 201, album);
    }

    // GET /api/slow — БЛОКУЄ цикл подій на 5 секунд синхронними обчисленнями
    if (req.method === 'GET' && pathname === '/api/slow') {
      const end = Date.now() + 5000;
      while (Date.now() < end) {
        // «важкі обчислення»: увесь сервер чекає
      }
      return sendJson(res, 200, { message: 'Нарешті!' });
    }

    return sendJson(res, 404, { message: `Маршрут ${req.method} ${pathname} не знайдено` });
  } catch (error) {
    if (error.status) return sendJson(res, error.status, { message: error.message });
    console.error(error);
    return sendJson(res, 500, { message: 'Внутрішня помилка сервера' });
  }
});

server.listen(PORT, () => {
  console.log(`Сервер без фреймворку: http://localhost:${PORT}/api/albums`);
});
```

> 📚 **Теорія.**
>
> - **`req` — це потік (stream).** Тіло запиту приходить шматками
>   (`'data'`), кінець позначає подія `'end'`. Тому `readJsonBody` повертає
>   проміс, який «збирає» шматки.
> - **Ліміт розміру тіла** — обов'язковий: без нього клієнт може надіслати
>   гігабайт і вичерпати пам'ять сервера. Зайві байти ми не зберігаємо, але
>   дочитуємо, щоб відповісти коректним `413`.
> - **Маршрутизація** — набір `if` і регулярний вираз для `:id`.
> - **`Content-Length` у байтах**, а не в символах: `Buffer.byteLength`
>   рахує, що «Гірська весна» займає 25 байтів, а не 13 символів.

Запуск:

```bash
npm run demo:http
```

### ✅ Контрольна точка 3

```bash
curl -i http://localhost:3001/api/albums
curl "http://localhost:3001/api/albums?search=%D1%82%D0%B8%D1%88%D0%B0"   # search=тиша
curl -i http://localhost:3001/api/albums/2
curl -i http://localhost:3001/api/albums/99                 # 404
curl -i -X POST http://localhost:3001/api/albums \
  -H "Content-Type: application/json" -d '{"title":"Нова платівка","year":2026}'   # 201 + Location
curl -i -X POST http://localhost:3001/api/albums \
  -H "Content-Type: application/json" -d '{"title": '      # 400 — битий JSON
curl -i -X DELETE http://localhost:3001/api/albums/1        # 404 — DELETE ми не реалізували (строго за HTTP тут мав би бути 405)
```

У терміналі сервера — рядок на кожен запит (`GET /api/albums` тощо).

> 🎤 **На лекції.** Відкрити код і разом порахувати, **що довелося писати
> вручну**: розбір URL і query, маршрутизацію `if`-ами, збирання тіла з
> потоку, `JSON.parse` з обробкою помилки, заголовки й `Content-Length`,
> однаковий `try/catch` для всіх маршрутів. Таблиця «Що тут погано (і що
> виправить Express)» з [лекції 11, §8](../../lectures/11-nodejs-runtime.md) —
> якраз про це.

### 🧪 Експеримент 3.1. Один повільний запит зупиняє всіх

Маршрут `/api/slow` 5 секунд виконує синхронний цикл. Відкрийте **два**
термінали (у WebStorm — кнопка **+** у вікні Terminal):

```bash
# термінал 1
curl http://localhost:3001/api/slow

# термінал 2 — одразу після першого
time curl http://localhost:3001/api/albums
```

**Результат:** звичайний список альбомів, який зазвичай приходить за
мілісекунди, чекає ~5 секунд — поки не завершиться цикл у `/api/slow`.
Сервер обробляє всіх користувачів **в одному потоці**, і синхронний код
блокує його повністю.

> 🎤 **На лекції.** Головна думка [§3](../../lectures/11-nodejs-runtime.md):
> «одна повільна синхронна операція зупиняє обслуговування ВСІХ
> користувачів». Звідси правила: асинхронні API (`fs/promises`, а не
> `readFileSync`) в обробниках запитів; важкі обчислення — у
> `worker_threads` або окремий сервіс. А **очікування** (база, мережа, диск)
> сервер не блокує — це і є сильна сторона Node.js.

### 🧪 Експеримент 3.2. Ліміт тіла запиту

```bash
node -e "console.log(JSON.stringify({ title: 'x'.repeat(200000) }))" > big.json
curl -i -X POST http://localhost:3001/api/albums -H "Content-Type: application/json" --data-binary @big.json
rm big.json
```

**Результат:** `413 Payload Too Large` — тіло понад 100 КБ відхилено.

Зупиніть сервер: `Ctrl+C` у терміналі.

---

## 4. Конфігурація та змінні середовища

> Лекція 11: [§9 Конфігурація та змінні середовища](../../lectures/11-nodejs-runtime.md)

Порт, адресу фронтенду, а згодом — рядок підключення до бази не пишуть у
код: вони різні на ноутбуці розробника, на сервері тестування й у продакшені.

📄 **`.env.example`** — шаблон, **потрапляє в git**:

```ini
# Шаблон налаштувань. Скопіюйте у .env і заповніть значення.
# .env НЕ потрапляє в git, .env.example — потрапляє.
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
```

Скопіюйте шаблон у робочий файл (він у `.gitignore`):

```bash
cp .env.example .env
```

📄 **`src/config/index.js`** (тимчасова версія — у кроці 12 додамо базу даних)

```js
// Уся конфігурація — в одному місці й лише зі змінних середовища.
// Решта коду імпортує config і не звертається до process.env напряму.

const env = process.env.NODE_ENV ?? 'development';

export const config = {
  env,
  isProduction: env === 'production',
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
};
```

> 🤔 **Чому так.** Решта коду **не читає `process.env` напряму** — лише
> `config`. Тоді всі налаштування видно в одному файлі, у них є значення за
> замовчуванням, а рядки перетворено на потрібні типи (`Number(...)`): усе,
> що приходить зі змінних середовища, — **рядки**.

### ✅ Контрольна точка 4

```bash
node --env-file=.env -e "import('./src/config/index.js').then(m => console.log(m.config))"
```

```
{
  env: 'development',
  isProduction: false,
  port: 3000,
  corsOrigin: 'http://localhost:5173'
}
```

### 🧪 Експеримент 4.1. Змінна з командного рядка

```bash
PORT=4000 node -e "import('./src/config/index.js').then(m => console.log(m.config.port))"
```

**Результат:** `4000` — значення приходить із середовища, код не змінювався.
(У PowerShell: `$env:PORT=4000; node -e "…"` — але змінна залишиться до
кінця сесії термінала, і `npm run dev` теж стартуватиме на порту 4000, бо
`--env-file` не перезаписує вже задані змінні. Після експерименту виконайте
`Remove-Item Env:PORT` або відкрийте новий термінал.)

---

# Частина 2. Express: middleware і шари (лекція 12)

## 5. Перший застосунок на Express

> Лекція 12: [§1 Перший застосунок](../../lectures/12-express-middleware-architecture.md),
> [§2 Маршрутизація](../../lectures/12-express-middleware-architecture.md),
> [§3 Об'єкти `req` і `res`](../../lectures/12-express-middleware-architecture.md);
> лекція 11: [§10.2 Коректне завершення](../../lectures/11-nodejs-runtime.md)

```bash
npm install express
```

📄 **`src/app.js`** (тимчасова версія)

```js
// Налаштування Express: middleware і маршрути.
// Тут НЕМАЄ app.listen() — запуск окремо, у server.js (так app зручно тестувати).
import express from 'express';

const app = express();

app.use(express.json()); // розбирає JSON-тіло запиту в req.body

// Перевірка стану сервера
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Тимчасовий маршрут для знайомства з req: GET /api/v1/echo/42?sort=title
app.get('/api/v1/echo/:id', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    params: req.params, // з шаблону шляху :id — ЗАВЖДИ рядки
    query: req.query, // з ?sort=title — теж рядки
    userAgent: req.get('User-Agent'),
  });
});

// POST /api/v1/echo — що прийшло в тілі
app.post('/api/v1/echo', (req, res) => {
  res.status(201).json({ received: req.body });
});

export default app;
```

📄 **`src/server.js`** (тимчасова версія — у кроці 14 додамо перевірку бази)

```js
// Точка входу: запускаємо HTTP-сервер і коректно завершуємося.
import app from './app.js';
import { config } from './config/index.js';

const server = app.listen(config.port, () => {
  console.log(`API «Фонотеки»: http://localhost:${config.port}/api/v1 (${config.env})`);
});

async function shutdown(signal) {
  console.log(`Отримано ${signal}, завершуємо роботу…`);

  // Перестаємо приймати нові з'єднання; колбек — коли завершаться поточні запити
  server.close(() => {
    console.log('Завершено коректно');
    process.exit(0);
  });

  // Якщо за 10 секунд не встигли — виходимо примусово
  setTimeout(() => {
    console.error('Не вдалося завершити коректно, вихід примусово');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

> 🤔 **Чому два файли.** `app.js` лише **налаштовує** застосунок, `server.js`
> його **запускає**. У тестах (лекція 15) `app` імпортують і виконують запити
> без реального порту, а `server.js` не чіпають.

> 📚 **Теорія: коректне завершення** ([лекція 11, §10.2](../../lectures/11-nodejs-runtime.md)).
> Хостинг, Docker і `node --watch` зупиняють процес сигналом `SIGTERM`,
> `Ctrl+C` у терміналі надсилає `SIGINT`. `server.close()` перестає приймати
> нові з'єднання, але **дає завершитися** запитам, що вже виконуються. Таймер
> на 10 секунд — страховка, якщо щось «зависло»; `.unref()` означає, що сам
> таймер не тримає процес живим.

```bash
npm run dev
```

### ✅ Контрольна точка 5

У терміналі: `API «Фонотеки»: http://localhost:3000/api/v1 (development)`.

```bash
curl -i http://localhost:3000/api/v1/health
curl "http://localhost:3000/api/v1/echo/42?sort=title&order=desc"
curl -i -X POST http://localhost:3000/api/v1/echo \
  -H "Content-Type: application/json" -d '{"title":"Полонина","trackCount":9}'
```

- `/health` → `200` з `{"status":"ok","uptime":…}`;
- `/echo/42` → `"params":{"id":"42"}` — **рядок**, а не число;
  `"query":{"sort":"title","order":"desc"}`;
- `POST /echo` → `201` і `{"received":{"title":"Полонина","trackCount":9}}`.

Збережіть `app.js` (наприклад, додайте порожній рядок) — у терміналі
з'явиться:

```
Restarting 'src/server.js'
Отримано SIGTERM, завершуємо роботу…
Завершено коректно
API «Фонотеки»: http://localhost:3000/api/v1 (development)
```

> 🎤 **На лекції.** Порівняти з кроком 3: `res.json()` сам ставить
> `Content-Type` і `Content-Length`, `express.json()` сам збирає й розбирає
> тіло, шаблон `/:id` замінює регулярний вираз. А ще видно, що
> `node --watch` перезапускає сервер **через `SIGTERM`** — тобто наш
> обробник коректного завершення працює щоразу при збереженні файлу.

### 🧪 Експеримент 5.1. Невідомий маршрут

```bash
curl -i http://localhost:3000/api/v1/songs
```

**Результат:** `404` і **HTML-сторінка** `Cannot GET /api/v1/songs` —
стандартна відповідь Express. Для JSON API це незручно: клієнт очікує JSON.
Виправимо в кроці 7.

### 🧪 Експеримент 5.2. Порядок `express.json()`

Перенесіть рядок `app.use(express.json());` **під** маршрут `POST /api/v1/echo`
і повторіть `POST`.

**Результат:** `{}` замість переданих даних — тіло ще не розібране, і
`req.body` дорівнює `undefined` (а `JSON.stringify` пропускає поля зі
значенням `undefined`). Middleware виконуються **в порядку оголошення**
([лекція 12, §4.3](../../lectures/12-express-middleware-architecture.md)).
Поверніть рядок на місце.

---

## 6. Middleware

> Лекція 12: [§4 Middleware](../../lectures/12-express-middleware-architecture.md),
> [§9 Стандартні middleware](../../lectures/12-express-middleware-architecture.md)

**Middleware** — функція `(req, res, next)`, що виконується між отриманням
запиту й відповіддю. Вона може: змінити `req`/`res`, відповісти сама або
передати керування далі викликом `next()`.

📄 **`src/middlewares/requestId.js`**

```js
import { randomUUID } from 'node:crypto';

// Кожен запит отримує унікальний ідентифікатор: його видно в логах
// і в заголовку відповіді X-Request-Id — легко знайти «той самий» запит.
export function requestId(req, res, next) {
  req.id = randomUUID();
  res.set('X-Request-Id', req.id);
  next(); // ← без цього запит «зависне» назавжди
}
```

📄 **`src/middlewares/requestLogger.js`**

```js
// Логує кожен запит ПІСЛЯ відповіді: метод, адреса, статус і тривалість.
export function requestLogger(req, res, next) {
  const start = performance.now();

  // 'finish' — подія потоку відповіді: спрацює, коли відповідь віддано
  res.on('finish', () => {
    const ms = (performance.now() - start).toFixed(1);
    console.log(`[${req.id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} — ${ms} мс`);
  });

  next();
}
```

```bash
npm install helmet cors
```

📄 **`src/app.js`** (тимчасова версія)

```js
// Налаштування Express: middleware і маршрути.
// Тут НЕМАЄ app.listen() — запуск окремо, у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { requestLogger } from './middlewares/requestLogger.js';

const app = express();

// Порядок має значення: middleware виконуються в порядку оголошення
app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(requestLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(cors({ origin: config.corsOrigin })); // 4. доступ із фронтенду (Vite: 5173)
app.use(express.json({ limit: '100kb' })); // 5. розбір JSON-тіла з обмеженням розміру

// Перевірка стану сервера
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Тимчасовий маршрут для знайомства з req: GET /api/v1/echo/42?sort=title
app.get('/api/v1/echo/:id', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    params: req.params, // з шаблону шляху :id — ЗАВЖДИ рядки
    query: req.query, // з ?sort=title — теж рядки
    userAgent: req.get('User-Agent'),
  });
});

// POST /api/v1/echo — що прийшло в тілі
app.post('/api/v1/echo', (req, res) => {
  res.status(201).json({ received: req.body });
});

export default app;
```

> 📚 **Теорія: стандартні middleware.**
>
> | Middleware | Що робить |
> |---|---|
> | `helmet()` | захисні заголовки: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`…; прибирає `X-Powered-By: Express` |
> | `cors({ origin })` | дозволяє браузеру робити запити з **іншого походження** (фронтенд на `localhost:5173` → API на `localhost:3000`). Вказуйте конкретний домен, а не `'*'` |
> | `express.json({ limit })` | розбирає JSON; **ліміт обов'язковий** — інакше гігабайтне тіло вичерпає пам'ять |

> 🤔 **Чому `requestId` перший.** Усі наступні middleware й обробники
> (логер, обробник помилок) уже бачать `req.id`. Коли користувач скаже «у
> мене помилка», заголовок `X-Request-Id` з відповіді дозволить знайти саме
> його запит у логах.

### ✅ Контрольна точка 6

```bash
curl -i http://localhost:3000/api/v1/health
```

У заголовках відповіді:

- `X-Request-Id: 3f0c…` — новий UUID на кожен запит;
- `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff` — від `helmet`;
- **немає** `X-Powered-By: Express`;
- `Access-Control-Allow-Origin: http://localhost:5173` — від `cors`.

У терміналі сервера:

```
[3f0c7a1e] GET /api/v1/health 200 — 1.4 мс
```

### 🧪 Експеримент 6.1. Забутий `next()`

У `requestId.js` закоментуйте рядок `next();` і виконайте запит:

```bash
curl -i --max-time 5 http://localhost:3000/api/v1/health
```

**Результат:** відповіді немає; через 5 секунд `curl` припиняє
очікування з помилкою `Operation timed out`. У консолі сервера — **жодної** помилки: ланцюжок
middleware просто обірвався. Це найпоширеніша помилка з middleware
([лекція 12, §4.1](../../lectures/12-express-middleware-architecture.md)).
Без `--max-time` браузер чи HTTP Client чекали б до власного тайм-ауту.
Поверніть `next();`.

### 🧪 Експеримент 6.2. Ліміт тіла

```bash
node -e "console.log(JSON.stringify({ title: 'x'.repeat(200000) }))" > big.json
curl -i -X POST http://localhost:3000/api/v1/echo -H "Content-Type: application/json" --data-binary @big.json
rm big.json
```

**Результат:** `413 Payload Too Large` — і знову HTML-сторінка з англійським
текстом та **стеком викликів**. Express сам знайшов помилку, але відповідь
не та, що потрібна API. Час для власного обробника помилок.

---

## 7. Обробка помилок

> Лекція 12: [§6 Обробка помилок](../../lectures/12-express-middleware-architecture.md),
> [§11 Express 5: що змінилося](../../lectures/12-express-middleware-architecture.md);
> лекція 13: [§5.1 Єдиний формат помилки](../../lectures/13-rest-api-postgresql.md)

Ідея: код, що знайшов проблему, **кидає помилку** відповідного класу, а
перетворює її на HTTP-відповідь **одне місце** — обробник помилок.

📄 **`src/errors/index.js`**

```js
// Власні класи помилок. Сервіси кидають їх, не знаючи нічого про HTTP-відповідь;
// обробник помилок (middlewares/errorHandler.js) перетворює їх на JSON.

export class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.isOperational = true; // очікувана помилка, а не баг у коді
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Ресурс') {
    super(`${resource} не знайдено`, 404);
  }
}

/** errors — масив { field, message } */
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
```

📄 **`src/middlewares/errorHandler.js`** (тимчасова версія — у кроці 16 додамо помилки PostgreSQL)

```js
import { AppError, NotFoundError } from '../errors/index.js';
import { config } from '../config/index.js';

// Помилки express.json() мають англійські повідомлення — даємо свої
const PARSER_MESSAGES = {
  'entity.parse.failed': 'Некоректний JSON у тілі запиту',
  'entity.too.large': 'Завелике тіло запиту',
};

// Жоден маршрут не підійшов → 404 у загальному форматі помилки
export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl}`));
}

// ЧОТИРИ параметри — саме так Express відрізняє обробник помилок від звичайного middleware
// (тому next тут обов'язковий, навіть якщо ним майже не користуємося).
export function errorHandler(error, req, res, next) {
  // Відповідь уже почали надсилати — змінити статус неможливо, делегуємо Express
  if (res.headersSent) return next(error);

  // expose: true мають помилки express.json(): битий JSON → 400, завелике тіло → 413
  const isOperational = error instanceof AppError || error.expose === true;
  const status = isOperational ? error.status : 500;

  // Очікувані помилки — коротко, неочікувані — з повним стеком
  if (isOperational) {
    console.warn(`[${req.id.slice(0, 8)}] ${status} ${error.message}`);
  } else {
    console.error(`[${req.id.slice(0, 8)}] Неочікувана помилка:`, error);
  }

  res.status(status).json({
    status,
    message: isOperational ? (PARSER_MESSAGES[error.type] ?? error.message) : 'Внутрішня помилка сервера',
    ...(error.details ? { errors: error.details } : {}),
    // Стек — ЛИШЕ в розробці: у продакшені він розкриває структуру проєкту
    ...(config.isProduction || isOperational ? {} : { stack: error.stack }),
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
```

📄 **`src/app.js`** (тимчасова версія — з демонстраційними маршрутами)

```js
// Налаштування Express: middleware і маршрути.
// Тут НЕМАЄ app.listen() — запуск окремо, у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { NotFoundError } from './errors/index.js';

const app = express();

// Порядок має значення: middleware виконуються в порядку оголошення
app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(requestLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(cors({ origin: config.corsOrigin })); // 4. доступ із фронтенду (Vite: 5173)
app.use(express.json({ limit: '100kb' })); // 5. розбір JSON-тіла з обмеженням розміру

// Перевірка стану сервера
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Тимчасовий маршрут для знайомства з req: GET /api/v1/echo/42?sort=title
app.get('/api/v1/echo/:id', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    params: req.params, // з шаблону шляху :id — ЗАВЖДИ рядки
    query: req.query, // з ?sort=title — теж рядки
    userAgent: req.get('User-Agent'),
  });
});

// POST /api/v1/echo — що прийшло в тілі
app.post('/api/v1/echo', (req, res) => {
  res.status(201).json({ received: req.body });
});

// Тимчасові маршрути для перевірки обробки помилок
app.get('/api/v1/demo/not-found', () => {
  throw new NotFoundError('Альбом'); // синхронна помилка → обробник помилок
});

app.get('/api/v1/demo/async-crash', async () => {
  await new Promise((resolve) => setTimeout(resolve, 100));
  throw new Error('Щось зламалося в асинхронному коді'); // Express 5 перехопить сам
});

// Обробники помилок — ЗАВЖДИ останні
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

> 📚 **Теорія.**
>
> - Express відрізняє обробник помилок від звичайного middleware **за
>   кількістю параметрів**: їх має бути **чотири** `(error, req, res, next)`.
> - Помилку до обробника доносять або `throw` (у синхронному чи
>   **async**-обробнику), або `next(error)`.
> - **Express 5 сам перехоплює відхилені проміси** з async-обробників. В
>   Express 4 для цього потрібна була обгортка `asyncHandler`, а без неї
>   процес падав з `unhandledRejection`.
> - **`isOperational`** розділяє помилки на очікувані (неіснуючий альбом,
>   невалідні дані: повідомлення можна показати клієнту) і баги (помилка
>   в коді: клієнт бачить лише «Внутрішня помилка сервера», деталі — у
>   логах).

> 🤔 **Чому стек лише для 500 і лише поза продакшеном.** Стек допомагає
> розробнику знайти баг, але видає структуру проєкту й версії бібліотек.
> Для очікуваних помилок (`400`, `404`, `409`) він не потрібен — причина й
> так зрозуміла з повідомлення. (У лекції стек додається до всіх помилок у
> розробці — тут ми трохи зменшили «шум» у відповідях.)

### ✅ Контрольна точка 7

```bash
curl -i http://localhost:3000/api/v1/songs
curl -i http://localhost:3000/api/v1/demo/not-found
curl -i http://localhost:3000/api/v1/demo/async-crash
curl -i -X POST http://localhost:3000/api/v1/echo -H "Content-Type: application/json" -d '{"title": '
```

| Запит | Статус | `message` |
|---|---|---|
| `/songs` | 404 | `Маршрут GET /api/v1/songs не знайдено` |
| `/demo/not-found` | 404 | `Альбом не знайдено` |
| `/demo/async-crash` | 500 | `Внутрішня помилка сервера` + `stack` |
| битий JSON | 400 | `Некоректний JSON у тілі запиту` |

Усі відповіді — **JSON одного формату**: `status`, `message`, `path`,
`timestamp`. У консолі сервера для `async-crash` — повний стек
(`Неочікувана помилка: Error: Щось зламалося…`), для решти — короткий рядок.

> 🎤 **На лекції.** На `async-crash` наголосити: помилка виникла **після
> `await`**, в асинхронному коді — і Express 5 доніс її до обробника сам.
> Сервер продовжує працювати.

### 🧪 Експеримент 7.1. Три параметри замість чотирьох

У `errorHandler.js` приберіть параметр `next` із сигнатури `errorHandler`
(залиште `error, req, res`) і повторіть `curl -i …/demo/not-found`.

**Результат:** знову HTML `NotFoundError: Альбом не знайдено` зі стеком —
функцію з трьома параметрами Express вважає **звичайним** middleware й
пропускає, коли передає помилку. Поверніть `next`.

### 🧪 Експеримент 7.2. Продакшен-режим

Зупиніть сервер і запустіть так:

```bash
NODE_ENV=production node --env-file=.env src/server.js
```

`curl …/demo/async-crash` → тепер **без** `stack`. Зверніть увагу:
`--env-file` не перезаписує змінні, які вже задано в середовищі, тому
`NODE_ENV=production` перемагає `NODE_ENV=development` з `.env`. Зупиніть
сервер (`Ctrl+C`) і знову запустіть `npm run dev`.

---

## 8. Валідація вхідних даних

> Лекція 13: [§3.2 `PUT` проти `PATCH`](../../lectures/13-rest-api-postgresql.md),
> [§4.3 Обов'язкові запобіжники](../../lectures/13-rest-api-postgresql.md),
> [§4.5 Сортування](../../lectures/13-rest-api-postgresql.md);
> лекція 12: [§4.5 Middleware-фабрики](../../lectures/12-express-middleware-architecture.md)

**Ніколи не довіряйте даним від клієнта.** Перевіряємо три джерела:

| Джерело | Приклад | Особливість |
|---|---|---|
| тіло `req.body` | `{"title": "…", "trackCount": 9}` | типи JSON: числа, булеві, `null`, масиви |
| query `req.query` | `?limit=5&inCollection=true` | **завжди рядки** (або масив рядків, якщо параметр повторено) |
| шлях `req.params` | `/albums/:id` | **завжди рядки** |

Валідатор — **чиста функція**: дані → `{ data, errors }`. Middleware
`validate` під'єднує її до Express і кладе очищені дані в окреме поле
(`req.validatedBody`, `req.validatedQuery`, `req.validatedParams`).

📄 **`src/middlewares/validate.js`**

```js
import { ValidationError } from '../errors/index.js';

// Куди класти очищені дані залежно від джерела
const TARGETS = {
  body: 'validatedBody',
  query: 'validatedQuery',
  params: 'validatedParams',
};

/**
 * Middleware-фабрика: validate(validator, 'body' | 'query' | 'params').
 * validator(input) повертає { data, errors }, де errors — масив { field, message }.
 */
export function validate(validator, source = 'body') {
  return (req, res, next) => {
    const { data, errors } = validator(req[source]);

    if (errors.length > 0) return next(new ValidationError(errors));

    // Окреме поле, щоб контролер випадково не взяв «сирий» req.body
    req[TARGETS[source]] = data;
    next();
  };
}
```

📄 **`src/validators/common.js`**

```js
// Дрібні перевірки, з яких складаються валідатори ресурсів.
// Кожна функція — чиста: вхід → результат, без Express і без бази.

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const isPositiveInt = (value) => Number.isInteger(value) && value > 0;

/** Рядок 'YYYY-MM-DD', що є справжньою датою календаря (не 2023-02-30) */
export function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

/** Невідомі поля — помилка: захист від mass assignment */
export function checkUnknownFields(input, allowed, errors) {
  for (const key of Object.keys(input)) {
    if (!allowed.includes(key)) errors.push({ field: key, message: 'Невідоме поле' });
  }
}

/** Параметр шляху :id для ресурсів з UUID (альбоми) */
export function validateUuidParam(params) {
  if (!UUID_PATTERN.test(params.id)) {
    return { data: null, errors: [{ field: 'id', message: 'Некоректний ідентифікатор' }] };
  }
  return { data: { id: params.id.toLowerCase() }, errors: [] };
}

/** Параметр шляху :id для ресурсів з цілочисельним id (виконавці) */
export function validateIntIdParam(params) {
  const id = Number(params.id);
  if (!/^\d+$/.test(params.id) || !isPositiveInt(id) || id > 2_147_483_647) {
    return { data: null, errors: [{ field: 'id', message: 'Некоректний ідентифікатор' }] };
  }
  return { data: { id }, errors: [] };
}
```

📄 **`src/validators/album.validators.js`**

```js
import { checkUnknownFields, isIsoDate, isPlainObject, isPositiveInt } from './common.js';

export const FORMATS = ['vinyl', 'cd', 'digital'];
export const SORT_FIELDS = ['title', 'releaseDate', 'rating', 'createdAt'];
export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 20;

const ALBUM_FIELDS = [
  'title', 'description', 'artistId', 'genreIds',
  'releaseDate', 'trackCount', 'rating', 'format', 'inCollection',
];

/**
 * Тіло альбому. partial: false — POST і PUT (повний ресурс, не передане → значення
 * за замовчуванням); partial: true — PATCH (перевіряємо й повертаємо лише передані поля).
 */
function validateAlbum(body, { partial }) {
  if (!isPlainObject(body)) {
    return { data: null, errors: [{ field: 'body', message: "Очікується JSON-об'єкт" }] };
  }

  const errors = [];
  const data = {};
  const has = (key) => Object.hasOwn(body, key); // саме hasOwn: null і 0 — теж «передано»
  const check = (key) => !partial || has(key);

  checkUnknownFields(body, ALBUM_FIELDS, errors);

  if (check('title')) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (title.length === 0) errors.push({ field: 'title', message: "Назва обов'язкова" });
    else if (title.length > 200) errors.push({ field: 'title', message: 'Максимум 200 символів' });
    else data.title = title;
  }

  if (check('description')) {
    const { description = null } = body;
    if (description !== null && typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Опис має бути рядком або null' });
    } else if (description && description.length > 2000) {
      errors.push({ field: 'description', message: 'Максимум 2000 символів' });
    } else {
      data.description = description?.trim() || null; // порожній рядок → null
    }
  }

  if (check('artistId')) {
    if (!isPositiveInt(body.artistId)) {
      errors.push({ field: 'artistId', message: 'Потрібен id виконавця (ціле число > 0)' });
    } else data.artistId = body.artistId;
  }

  if (check('genreIds')) {
    const { genreIds = [] } = body;
    if (!Array.isArray(genreIds) || !genreIds.every(isPositiveInt)) {
      errors.push({ field: 'genreIds', message: 'Очікується масив id жанрів' });
    } else if (genreIds.length > 10) {
      errors.push({ field: 'genreIds', message: 'Не більше 10 жанрів' });
    } else data.genreIds = [...new Set(genreIds)];
  }

  if (check('releaseDate')) {
    if (!isIsoDate(body.releaseDate)) {
      errors.push({ field: 'releaseDate', message: 'Дата у форматі РРРР-ММ-ДД' });
    } else if (body.releaseDate < '1900-01-01') {
      errors.push({ field: 'releaseDate', message: 'Не раніше 1900 року' });
    } else data.releaseDate = body.releaseDate;
  }

  if (check('trackCount')) {
    const { trackCount } = body;
    if (!Number.isInteger(trackCount) || trackCount < 1 || trackCount > 999) {
      errors.push({ field: 'trackCount', message: 'Кількість треків — ціле число від 1 до 999' });
    } else data.trackCount = trackCount;
  }

  if (check('rating')) {
    const { rating = null } = body;
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      errors.push({ field: 'rating', message: 'Оцінка — ціле число від 1 до 5 або null' });
    } else data.rating = rating;
  }

  if (check('format')) {
    if (!FORMATS.includes(body.format)) {
      errors.push({ field: 'format', message: `Формат: ${FORMATS.join(', ')}` });
    } else data.format = body.format;
  }

  if (check('inCollection')) {
    const { inCollection = false } = body;
    if (typeof inCollection !== 'boolean') {
      errors.push({ field: 'inCollection', message: 'Очікується true або false' });
    } else data.inCollection = inCollection;
  }

  if (partial && errors.length === 0 && Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'Потрібно передати хоча б одне поле для оновлення' });
  }

  return { data, errors };
}

export const validateAlbumCreate = (body) => validateAlbum(body, { partial: false });
export const validateAlbumPatch = (body) => validateAlbum(body, { partial: true });

/** Query-параметри списку: рядки → числа/булеві, значення за замовчуванням, межі */
export function validateAlbumListQuery(query) {
  const errors = [];
  const data = {};

  // ?genreId=1&genreId=2 Express перетворює на масив — тут такого не підтримуємо
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) errors.push({ field: key, message: 'Параметр вказано кілька разів' });
  }
  if (errors.length > 0) return { data: null, errors };

  const int = (key, min, max) => {
    if (query[key] === undefined || query[key] === '') return undefined; // порожній = не застосовано
    const value = Number(query[key]);
    if (!/^\d+$/.test(query[key]) || value < min || value > max) {
      errors.push({ field: key, message: `Ціле число від ${min} до ${max}` });
      return undefined;
    }
    return value;
  };

  const search = query.search?.trim();
  if (search && search.length > 100) errors.push({ field: 'search', message: 'Максимум 100 символів' });
  else if (search) data.search = search;

  data.artistId = int('artistId', 1, 2_147_483_647);
  data.genreId = int('genreId', 1, 2_147_483_647);
  data.yearFrom = int('yearFrom', 1900, 2100);
  data.yearTo = int('yearTo', 1900, 2100);
  if (data.yearFrom && data.yearTo && data.yearFrom > data.yearTo) {
    errors.push({ field: 'yearFrom', message: 'yearFrom не може бути більшим за yearTo' });
  }

  if (query.format) {
    if (FORMATS.includes(query.format)) data.format = query.format;
    else errors.push({ field: 'format', message: `Формат: ${FORMATS.join(', ')}` });
  }

  if (query.inCollection) {
    if (['true', 'false'].includes(query.inCollection)) data.inCollection = query.inCollection === 'true';
    else errors.push({ field: 'inCollection', message: 'Очікується true або false' });
  }

  data.sort = query.sort || 'title';
  if (!SORT_FIELDS.includes(data.sort)) {
    errors.push({ field: 'sort', message: `Сортування: ${SORT_FIELDS.join(', ')}` });
  }
  data.order = query.order || 'asc';
  if (!['asc', 'desc'].includes(data.order)) {
    errors.push({ field: 'order', message: 'Напрямок: asc або desc' });
  }

  data.limit = int('limit', 1, MAX_LIMIT) ?? DEFAULT_LIMIT;
  data.offset = int('offset', 0, 1_000_000) ?? 0;

  // Прибираємо не задані фільтри, щоб далі не тягнути undefined
  for (const key of Object.keys(data)) if (data[key] === undefined) delete data[key];

  return { data, errors };
}
```

📄 **`src/validators/artist.validators.js`**

```js
import { checkUnknownFields, isPlainObject } from './common.js';

export function validateArtistCreate(body) {
  if (!isPlainObject(body)) {
    return { data: null, errors: [{ field: 'body', message: "Очікується JSON-об'єкт" }] };
  }

  const errors = [];
  checkUnknownFields(body, ['name'], errors);

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2) errors.push({ field: 'name', message: 'Мінімум 2 символи' });
  else if (name.length > 120) errors.push({ field: 'name', message: 'Максимум 120 символів' });

  return { data: { name }, errors };
}
```

> 🤔 **Чому так.**
>
> - **`partial`** — одна функція для `POST`/`PUT` і для `PATCH`. Для повної
>   заміни не передане поле отримує значення за замовчуванням (`rating` →
>   `null`), для `PATCH` — **не чіпається**. Розрізняємо «не передано» і
>   «передано `null`» через `Object.hasOwn`, а не через перевірку істинності:
>   `if (body.rating)` помилився б і на `null`, і на `0`.
> - **Невідомі поля — помилка.** Інакше клієнт міг би надіслати
>   `{"isAdmin": true}` і, якби ми колись копіювали тіло в базу «як є»,
>   змінити поле, яке не мав права змінювати (*mass assignment*).
> - **`sort` перевіряється за білим списком** уже тут. У кроці 16 побачимо,
>   чому для SQL це питання безпеки, а не зручності.
> - **`limit` обмежено зверху** (100). Без цього `?limit=999999999` змусить
>   сервер читати й серіалізувати всю таблицю.
> - Чому не бібліотека: у [лекції 15](../../lectures/15-nodejs-quality-testing-openapi.md)
>   ці самі перевірки описуються схемами **Zod** — коротше й декларативно.
>   Сигнатура `validate(schema, source)` там така сама, тож заміна торкнеться
>   лише файлів у `validators/`. Написати валідатор руками один раз корисно,
>   щоб розуміти, що саме робить бібліотека.

Валідатори не залежать ні від Express, ні від бази — їх легко тестувати
вбудованим `node:test` ([лекція 11, §11.3](../../lectures/11-nodejs-runtime.md)).

📄 **`tests/album.validators.test.js`**

```js
// Модульні тести валідаторів: npm test
// Валідатор — чиста функція, тому тестується без сервера, без HTTP і без бази.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateAlbumCreate,
  validateAlbumListQuery,
  validateAlbumPatch,
} from '../src/validators/album.validators.js';

const validAlbum = {
  title: '  Перший сніг ',
  artistId: 3,
  releaseDate: '2026-01-15',
  trackCount: 9,
  format: 'vinyl',
};

describe('validateAlbumCreate', () => {
  test('очищає дані й підставляє значення за замовчуванням', () => {
    const { data, errors } = validateAlbumCreate(validAlbum);
    assert.deepEqual(errors, []);
    assert.equal(data.title, 'Перший сніг');
    assert.deepEqual(data.genreIds, []);
    assert.equal(data.rating, null);
    assert.equal(data.inCollection, false);
  });

  test('відхиляє неіснуючу дату й невідоме поле', () => {
    const { errors } = validateAlbumCreate({ ...validAlbum, releaseDate: '2023-02-30', isAdmin: true });
    assert.deepEqual(errors.map((error) => error.field).sort(), ['isAdmin', 'releaseDate']);
  });
});

describe('validateAlbumPatch', () => {
  test('повертає лише передані поля, null — теж «передано»', () => {
    const { data, errors } = validateAlbumPatch({ rating: null });
    assert.deepEqual(errors, []);
    assert.deepEqual(data, { rating: null });
  });

  test('порожнє тіло — помилка', () => {
    const { errors } = validateAlbumPatch({});
    assert.equal(errors[0].field, 'body');
  });
});

describe('validateAlbumListQuery', () => {
  test('перетворює рядки query на числа й булеві', () => {
    const { data } = validateAlbumListQuery({ genreId: '3', inCollection: 'true', limit: '5' });
    assert.deepEqual(data, { genreId: 3, inCollection: true, sort: 'title', order: 'asc', limit: 5, offset: 0 });
  });

  test('обмежує limit і перевіряє поле сортування за білим списком', () => {
    const { errors } = validateAlbumListQuery({ limit: '1000', sort: 'title; DROP TABLE albums' });
    assert.deepEqual(errors.map((error) => error.field).sort(), ['limit', 'sort']);
  });
});
```

### ✅ Контрольна точка 8

```bash
npm test
```

```
▶ validateAlbumCreate
  ✔ очищає дані й підставляє значення за замовчуванням
  ✔ відхиляє неіснуючу дату й невідоме поле
…
ℹ tests 6
ℹ pass 6
ℹ fail 0
```

`node --test` без аргументів сам знаходить файли `*.test.js`.

### 🧪 Експеримент 8.1. Тест, що падає

У `isIsoDate` (файл `common.js`) приберіть умову
`&& date.toISOString().startsWith(value)` і запустіть `npm test`.

**Результат:** тест «відхиляє неіснуючу дату…» падає: `2023-02-30` тепер
проходить, бо `new Date('2023-02-30')` **мовчки** перетворюється на 2 березня.
Поверніть умову.

---

## 9. Репозиторії: дані в пам'яті

> Лекція 12: [§7 Шарова архітектура](../../lectures/12-express-middleware-architecture.md),
> [§7.1 Репозиторій](../../lectures/12-express-middleware-architecture.md)

Бази даних ще немає — і це добре: шари можна побудувати й перевірити на
даних у пам'яті, а в частині 3 замінити **лише** репозиторії.

| Шар | Знає про | Не знає про |
|---|---|---|
| **Routes** | URL, методи, які middleware застосувати | бізнес-правила, SQL |
| **Controllers** | `req`, `res`, статуси HTTP | бізнес-правила, SQL |
| **Services** | бізнес-правила («назва унікальна», «не можна видалити виконавця з альбомами») | HTTP, SQL |
| **Repositories** | як отримати й зберегти дані | HTTP, бізнес-правила |

### 9.1. Демо-дані

Ті самі вигадані виконавці й альбоми, що й у фронтенді «Фонотеки». Зв'язки
задано **назвами**, а не `id`: ідентифікатори призначатиме сховище (згодом —
база даних). Цей файл використаємо ще раз у кроці 15 для наповнення бази.

📄 **`src/data/seed-data.js`**

```js
// Демо-дані «Фонотеки» (виконавці й альбоми вигадані).
// Використовуються двічі: сховищем у пам'яті (частина 2) і скриптом scripts/seed.js (частина 3).
// Зв'язки задано НАЗВАМИ, а не id: id призначає сховище (або база даних).

export const artists = [
  'Карпатський вітер',
  'Нічний трамвай',
  'Тихий квартет',
  'Пульсар',
  'Соняшникове поле',
];

export const genres = [
  'Рок',
  'Фолк',
  'Джаз',
  'Електроніка',
  'Інді',
  'Поп',
];

const album = (title, artist, genres, releaseDate, trackCount, rating, format, inCollection, description) => ({
  title, artist, genres, releaseDate, trackCount, rating, format, inCollection, description,
});

export const albums = [
  album('Гірська весна', 'Карпатський вітер', ['Фолк', 'Рок'], '2014-04-18', 11, 5, 'vinyl', true,
    'Дебютний альбом гурту: трембіта, електрогітари й пісні, записані наживо в Яремчі.'),
  album('Полонина', 'Карпатський вітер', ['Фолк'], '2016-09-02', 9, 4, 'cd', true,
    'Камерний акустичний альбом — лише голоси, скрипка й цимбали.'),
  album('Смереки в тумані', 'Карпатський вітер', ['Фолк', 'Рок'], '2019-03-15', 12, 4, 'digital', false,
    'Найважчий за звучанням альбом гурту з довгими інструментальними частинами.'),
  album('Вітер змін', 'Карпатський вітер', ['Рок'], '2022-11-11', 10, null, 'digital', false,
    'Рок-альбом про дорогу додому. Записаний у трьох містах за один місяць.'),
  album('Остання зупинка', 'Нічний трамвай', ['Рок', 'Інді'], '2012-06-01', 13, 5, 'vinyl', true,
    'Гаражний рок, записаний у підвалі колишнього трамвайного депо.'),
  album('Нічні маршрути', 'Нічний трамвай', ['Рок'], '2015-10-23', 10, 3, 'cd', false,
    'Пісні про місто після опівночі: ліхтарі, порожні проспекти й останні рейси.'),
  album('Кільцева', 'Нічний трамвай', ['Інді', 'Поп'], '2018-02-14', 8, 4, 'digital', true,
    'Найпопулярніший альбом гурту з трьома радіосинглами.'),
  album('Депо', 'Нічний трамвай', ['Рок', 'Інді'], '2021-05-07', 11, 4, 'vinyl', false,
    'Повернення до сирого звуку перших записів.'),
  album('Акустика', 'Нічний трамвай', ['Інді'], '2024-08-30', 7, null, 'digital', false,
    'Старі пісні гурту в акустичних аранжуваннях.'),
  album('Тиша між нотами', 'Тихий квартет', ['Джаз'], '2010-01-20', 8, 5, 'cd', true,
    'Класичний джазовий квартет: фортепіано, контрабас, барабани й саксофон.'),
  album('Осінній свінг', 'Тихий квартет', ['Джаз'], '2013-10-01', 9, 4, 'vinyl', true,
    'Власні композиції в стилі свінгу 1940-х.'),
  album('Нічне кафе', 'Тихий квартет', ['Джаз', 'Поп'], '2017-12-08', 10, 3, 'cd', false,
    'Джазові версії відомих поп-пісень.'),
  album('Імпровізації', 'Тихий квартет', ['Джаз'], '2020-04-24', 6, 5, 'digital', false,
    'Шість довгих імпровізацій, записаних за один вечір без жодного дубля.'),
  album('Сигнал', 'Пульсар', ['Електроніка'], '2011-07-15', 12, 4, 'digital', false,
    'Мінімалістичне техно, натхненне звуками радіотелескопів.'),
  album('Орбіта', 'Пульсар', ['Електроніка', 'Поп'], '2014-03-03', 10, 3, 'cd', false,
    'Найбільш танцювальний альбом проєкту.'),
  album('Темна матерія', 'Пульсар', ['Електроніка'], '2017-09-29', 9, 5, 'vinyl', true,
    'Повільна атмосферна електроніка для навушників.'),
  album('Квазар', 'Пульсар', ['Електроніка', 'Інді'], '2020-11-20', 11, 4, 'digital', true,
    'Електроніка з живими гітарами й вокалом запрошених музикантів.'),
  album('Гравітація', 'Пульсар', ['Електроніка'], '2023-06-16', 8, null, 'digital', false,
    'Останній на сьогодні альбом проєкту — коротший і жорсткіший за попередні.'),
  album('Жовте літо', 'Соняшникове поле', ['Поп', 'Інді'], '2013-05-31', 10, 4, 'cd', true,
    'Легкий інді-поп про канікули, велосипеди й море.'),
  album('Під небом', 'Соняшникове поле', ['Поп'], '2015-08-14', 11, 3, 'digital', false,
    'Альбом із найвідомішою піснею гурту «Небо над полем».'),
  album('Насіння', 'Соняшникове поле', ['Інді', 'Фолк'], '2018-09-21', 9, 5, 'vinyl', true,
    'Інді-поп із фолковими мелодіями та сопілкою.'),
  album('Серпень', 'Соняшникове поле', ['Поп'], '2021-08-24', 10, 4, 'digital', false,
    'Пісні, написані протягом одного серпня в селі під Полтавою.'),
  album('Жнива', 'Соняшникове поле', ['Інді', 'Поп'], '2024-10-04', 12, null, 'cd', false,
    'Найдовший альбом гурту, записаний із камерним оркестром.'),
  album('Колискові', 'Тихий квартет', ['Джаз', 'Фолк'], '2022-02-18', 10, 4, 'cd', false,
    'Українські колискові в джазових аранжуваннях.'),
  album('Живий звук', 'Карпатський вітер', ['Фолк', 'Рок'], '2025-07-11', 14, 5, 'vinyl', false,
    'Концертний запис ювілейного туру гурту.'),
];
```

### 9.2. «Таблиці» в пам'яті

📄 **`src/data/memory-store.js`**

```js
import { randomUUID } from 'node:crypto';
import * as seed from './seed-data.js';

// «База даних» у пам'яті: ті самі таблиці й ті самі назви стовпців (snake_case),
// що будуть у PostgreSQL. Тому заміна сховища в частині 3 не зачепить сервіси.
// Дані живуть, доки працює процес: після перезапуску — знову демо-набір.

const now = () => new Date();

export const db = {
  artists: [],
  genres: [],
  albums: [],
  albumGenres: [], // зв'язувальна таблиця «багато-до-багатьох»: { album_id, genre_id }
  nextArtistId: 1,
  nextGenreId: 1,
};

for (const name of seed.artists) {
  db.artists.push({ id: db.nextArtistId++, name, created_at: now() });
}
for (const name of seed.genres) {
  db.genres.push({ id: db.nextGenreId++, name });
}

const idByName = (table, name) => table.find((row) => row.name === name).id;

for (const album of seed.albums) {
  const row = {
    id: randomUUID(),
    title: album.title,
    description: album.description,
    artist_id: idByName(db.artists, album.artist),
    release_date: album.releaseDate,
    track_count: album.trackCount,
    rating: album.rating,
    format: album.format,
    in_collection: album.inCollection,
    created_at: now(),
    updated_at: now(),
  };
  db.albums.push(row);
  for (const genreName of album.genres) {
    db.albumGenres.push({ album_id: row.id, genre_id: idByName(db.genres, genreName) });
  }
}
```

> 🤔 **Чому snake_case.** Сховище в пам'яті навмисно імітує **таблиці бази**:
> ті самі назви стовпців (`artist_id`, `release_date`), окрема зв'язувальна
> таблиця `albumGenres`. Тоді й репозиторій у пам'яті, і репозиторій на SQL
> повертають **однакові рядки**, а перетворення на camelCase для API —
> робота мапера (крок 10).

### 9.3. Репозиторії

📄 **`src/repositories/albums.repository.js`** (версія в пам'яті — у кроці 16 її замінить SQL)

```js
// Репозиторій альбомів — ВЕРСІЯ В ПАМ'ЯТІ.
// Знає лише про сховище: ні про HTTP, ні про бізнес-правила.
// Повертає «рядки» у вигляді таблиці бази (snake_case) — так само, як згодом SQL.
import { randomUUID } from 'node:crypto';
import { db } from '../data/memory-store.js';

const SORT_COLUMNS = {
  title: 'title',
  releaseDate: 'release_date',
  rating: 'rating',
  createdAt: 'created_at',
};

const collator = new Intl.Collator('uk'); // українська абетка: Г, Ґ, Д, Е, Є, …

// Аналог «JOIN»: додаємо до альбому назву виконавця й масив жанрів
function withRelations(album) {
  const artist = db.artists.find((item) => item.id === album.artist_id);
  const genres = db.albumGenres
    .filter((link) => link.album_id === album.id)
    .map((link) => db.genres.find((genre) => genre.id === link.genre_id))
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => collator.compare(a.name, b.name));
  return { ...album, artist_name: artist.name, genres };
}

// Аналог WHERE
function matches(album, filters) {
  if (filters.search) {
    const search = filters.search.toLowerCase();
    if (!album.title.toLowerCase().includes(search) && !album.artist_name.toLowerCase().includes(search)) {
      return false;
    }
  }
  if (filters.artistId && album.artist_id !== filters.artistId) return false;
  if (filters.genreId && !album.genres.some((genre) => genre.id === filters.genreId)) return false;
  if (filters.format && album.format !== filters.format) return false;
  if (filters.inCollection !== undefined && album.in_collection !== filters.inCollection) return false;
  const year = Number(album.release_date.slice(0, 4));
  if (filters.yearFrom && year < filters.yearFrom) return false;
  if (filters.yearTo && year > filters.yearTo) return false;
  return true;
}

// Аналог ORDER BY <поле> <напрямок> NULLS LAST, id
function compare(a, b, column, direction) {
  const x = a[column];
  const y = b[column];
  if (x === null && y === null) return a.id.localeCompare(b.id);
  if (x === null) return 1; // порожні оцінки — завжди в кінці
  if (y === null) return -1;
  let result;
  if (typeof x === 'string') result = collator.compare(x, y);
  else result = x - y; // числа й дати (Date - Date дає мілісекунди)
  return result * direction || a.id.localeCompare(b.id);
}

function filtered(filters = {}) {
  return db.albums.map(withRelations).filter((album) => matches(album, filters));
}

export async function findAll({ filters, sort, order, limit, offset }) {
  const column = SORT_COLUMNS[sort] ?? 'title';
  const direction = order === 'desc' ? -1 : 1;
  return filtered(filters)
    .sort((a, b) => compare(a, b, column, direction))
    .slice(offset, offset + limit);
}

export async function count(filters) {
  return filtered(filters).length;
}

export async function findById(id) {
  const album = db.albums.find((item) => item.id === id);
  return album ? withRelations(album) : null;
}

export async function findByTitle(title) {
  return db.albums.find((item) => item.title.toLowerCase() === title.toLowerCase()) ?? null;
}

// поле API (camelCase) → стовпець (snake_case); заодно білий список
const COLUMNS = {
  title: 'title',
  description: 'description',
  artistId: 'artist_id',
  releaseDate: 'release_date',
  trackCount: 'track_count',
  rating: 'rating',
  format: 'format',
  inCollection: 'in_collection',
};

function setGenres(albumId, genreIds) {
  db.albumGenres = db.albumGenres.filter((link) => link.album_id !== albumId);
  for (const genreId of genreIds) db.albumGenres.push({ album_id: albumId, genre_id: genreId });
}

export async function create(data) {
  const album = { id: randomUUID(), created_at: new Date(), updated_at: new Date() };
  for (const [key, column] of Object.entries(COLUMNS)) album[column] = data[key];
  db.albums.push(album);
  setGenres(album.id, data.genreIds);
  return withRelations(album);
}

/** Оновлює лише ПЕРЕДАНІ поля (для PUT валідатор передає всі) */
export async function update(id, data) {
  const album = db.albums.find((item) => item.id === id);
  if (!album) return null;
  for (const [key, column] of Object.entries(COLUMNS)) {
    if (Object.hasOwn(data, key)) album[column] = data[key];
  }
  if (Object.hasOwn(data, 'genreIds')) setGenres(id, data.genreIds);
  album.updated_at = new Date();
  return withRelations(album);
}

export async function remove(id) {
  const index = db.albums.findIndex((item) => item.id === id);
  if (index === -1) return false;
  db.albums.splice(index, 1);
  db.albumGenres = db.albumGenres.filter((link) => link.album_id !== id); // як ON DELETE CASCADE
  return true;
}
```

📄 **`src/repositories/artists.repository.js`** (версія в пам'яті)

```js
// Репозиторій виконавців — ВЕРСІЯ В ПАМ'ЯТІ.
import { db } from '../data/memory-store.js';

const collator = new Intl.Collator('uk');

const withAlbumCount = (artist) => ({
  ...artist,
  album_count: db.albums.filter((album) => album.artist_id === artist.id).length,
});

export async function findAll() {
  return db.artists.map(withAlbumCount).sort((a, b) => collator.compare(a.name, b.name));
}

export async function findById(id) {
  const artist = db.artists.find((item) => item.id === id);
  return artist ? withAlbumCount(artist) : null;
}

export async function findByName(name) {
  return db.artists.find((item) => item.name.toLowerCase() === name.toLowerCase()) ?? null;
}

export async function create({ name }) {
  const artist = { id: db.nextArtistId++, name, created_at: new Date() };
  db.artists.push(artist);
  return withAlbumCount(artist);
}

export async function remove(id) {
  const index = db.artists.findIndex((item) => item.id === id);
  if (index === -1) return false;
  db.artists.splice(index, 1);
  return true;
}
```

📄 **`src/repositories/genres.repository.js`** (версія в пам'яті)

```js
// Репозиторій жанрів — ВЕРСІЯ В ПАМ'ЯТІ.
import { db } from '../data/memory-store.js';

const collator = new Intl.Collator('uk');

export async function findAll() {
  return db.genres
    .map((genre) => ({
      ...genre,
      album_count: db.albumGenres.filter((link) => link.genre_id === genre.id).length,
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
}

export async function findByIds(ids) {
  return db.genres.filter((genre) => ids.includes(genre.id));
}
```

> 📚 **Теорія.** Кожна функція репозиторію — `async`, хоча дані в пам'яті
> можна повернути й синхронно. Це **контракт**: сервіс завжди робить
> `await repository.findById(id)`, і йому байдуже, звідки прийшли дані —
> з масиву чи з PostgreSQL через мережу.

> 🎤 **На лекції.** Показати, що функції репозиторію вже «думають SQL-ем»:
> `withRelations` — це `JOIN`, `matches` — `WHERE`, `compare` — `ORDER BY …
> NULLS LAST, id`, `slice` — `LIMIT/OFFSET`, видалення зв'язків у `remove` —
> `ON DELETE CASCADE`. У кроці 16 кожну з цих функцій замінить один рядок SQL.

### ✅ Контрольна точка 9

```bash
node -e "import('./src/repositories/albums.repository.js').then(async (r) => {
  const rows = await r.findAll({ filters: { genreId: 3 }, sort: 'releaseDate', order: 'desc', limit: 3, offset: 0 });
  console.log(await r.count({ genreId: 3 }), rows.map((row) => [row.title, row.release_date, row.artist_name]));
})"
```

```
5 [
  [ 'Колискові', '2022-02-18', 'Тихий квартет' ],
  [ 'Імпровізації', '2020-04-24', 'Тихий квартет' ],
  [ 'Нічне кафе', '2017-12-08', 'Тихий квартет' ]
]
```

---

## 10. Мапери й сервіси

> Лекція 12: [§7.2 Сервіс](../../lectures/12-express-middleware-architecture.md),
> [§7.4 Мапер](../../lectures/12-express-middleware-architecture.md);
> лекція 13: [§5.3 Іменування полів](../../lectures/13-rest-api-postgresql.md)

### 10.1. Мапери

📄 **`src/mappers/album.mapper.js`**

```js
// Мапер: внутрішній «рядок таблиці» (snake_case) → те, що бачить клієнт API (camelCase).
// Контракт API не залежить від того, як названо стовпці в базі.

export function toAlbumResponse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    artist: { id: row.artist_id, name: row.artist_name },
    genres: row.genres,
    releaseDate: row.release_date,
    trackCount: row.track_count,
    rating: row.rating,
    format: row.format,
    inCollection: row.in_collection,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

📄 **`src/mappers/artist.mapper.js`**

```js
export function toArtistResponse(row) {
  return {
    id: row.id,
    name: row.name,
    albumCount: row.album_count,
    createdAt: row.created_at,
  };
}
```

📄 **`src/mappers/genre.mapper.js`**

```js
export function toGenreResponse(row) {
  return { id: row.id, name: row.name, albumCount: row.album_count };
}
```

> 🤔 **Навіщо мапер, якщо поля майже ті самі.** Він фіксує **контракт API**:
> `snake_case` бази → `camelCase` JSON, плоскі `artist_id` + `artist_name` →
> вкладений об'єкт `artist`. Перейменуєте стовпець у базі — зміниться лише
> мапер, клієнти не помітять. І жодне внутрішнє поле (у лекції 14 це буде
> `password_hash`) не потрапить у відповідь випадково.

### 10.2. Сервіси

📄 **`src/services/albums.service.js`**

```js
// Сервіс альбомів: бізнес-правила. НЕ знає про HTTP (жодних req, res, статусів).
import * as albumsRepository from '../repositories/albums.repository.js';
import * as artistsRepository from '../repositories/artists.repository.js';
import * as genresRepository from '../repositories/genres.repository.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors/index.js';
import { toAlbumResponse } from '../mappers/album.mapper.js';

export async function list(query) {
  const { sort, order, limit, offset, ...filters } = query;

  // Сторінка даних і загальна кількість — два незалежні запити, виконуємо паралельно
  const [rows, total] = await Promise.all([
    albumsRepository.findAll({ filters, sort, order, limit, offset }),
    albumsRepository.count(filters),
  ]);

  return { data: rows.map(toAlbumResponse), total, limit, offset };
}

export async function getById(id) {
  const album = await albumsRepository.findById(id);
  if (!album) throw new NotFoundError('Альбом');
  return toAlbumResponse(album);
}

// Правило: назва альбому унікальна (без урахування регістру)
async function ensureTitleIsFree(title, exceptId = null) {
  const existing = await albumsRepository.findByTitle(title);
  if (existing && existing.id !== exceptId) {
    throw new ConflictError(`Альбом «${existing.title}» уже є у фонотеці`);
  }
}

// Правило: виконавець і жанри, на які посилається альбом, мають існувати
async function ensureReferencesExist(data) {
  const errors = [];

  if (data.artistId !== undefined && !(await artistsRepository.findById(data.artistId))) {
    errors.push({ field: 'artistId', message: `Виконавця з id ${data.artistId} не існує` });
  }

  if (data.genreIds?.length) {
    const found = await genresRepository.findByIds(data.genreIds);
    const missing = data.genreIds.filter((id) => !found.some((genre) => genre.id === id));
    if (missing.length > 0) {
      errors.push({ field: 'genreIds', message: `Жанрів з id ${missing.join(', ')} не існує` });
    }
  }

  if (errors.length > 0) throw new ValidationError(errors);
}

export async function create(data) {
  await ensureTitleIsFree(data.title);
  await ensureReferencesExist(data);
  return toAlbumResponse(await albumsRepository.create(data));
}

/** І PUT (усі поля), і PATCH (лише передані) — різницю забезпечує валідатор */
export async function update(id, data) {
  const existing = await albumsRepository.findById(id);
  if (!existing) throw new NotFoundError('Альбом');

  if (data.title !== undefined) await ensureTitleIsFree(data.title, id);
  await ensureReferencesExist(data);

  return toAlbumResponse(await albumsRepository.update(id, data));
}

export async function remove(id) {
  const deleted = await albumsRepository.remove(id);
  if (!deleted) throw new NotFoundError('Альбом');
}
```

📄 **`src/services/artists.service.js`**

```js
import * as artistsRepository from '../repositories/artists.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';
import { toArtistResponse } from '../mappers/artist.mapper.js';

export async function list() {
  const rows = await artistsRepository.findAll();
  return { data: rows.map(toArtistResponse), total: rows.length };
}

export async function getById(id) {
  const artist = await artistsRepository.findById(id);
  if (!artist) throw new NotFoundError('Виконавця');
  return toArtistResponse(artist);
}

export async function create({ name }) {
  if (await artistsRepository.findByName(name)) {
    throw new ConflictError(`Виконавець «${name}» уже існує`);
  }
  return toArtistResponse(await artistsRepository.create({ name }));
}

export async function remove(id) {
  const artist = await artistsRepository.findById(id);
  if (!artist) throw new NotFoundError('Виконавця');

  // Правило: не можна видалити виконавця, у якого є альбоми
  if (artist.album_count > 0) {
    throw new ConflictError(`У виконавця є альбоми (${artist.album_count}): спершу видаліть їх`);
  }
  await artistsRepository.remove(id);
}
```

📄 **`src/services/genres.service.js`**

```js
import * as genresRepository from '../repositories/genres.repository.js';
import { toGenreResponse } from '../mappers/genre.mapper.js';

export async function list() {
  const rows = await genresRepository.findAll();
  return { data: rows.map(toGenreResponse), total: rows.length };
}
```

> 📚 **Теорія.** Сервіс **не знає про HTTP**: у ньому немає `req`, `res`,
> `res.status(404)`. Він кидає `NotFoundError` чи `ConflictError`, а який це
> статус — вирішує обробник помилок. Тому той самий сервіс можна викликати з
> контролера, зі скрипту, з тесту чи з черги задач.

> 🤔 **Чому `ValidationError` для неіснуючого `artistId`, а не `NotFoundError`.**
> `404` означає «не знайдено ресурс за **цією адресою**». Адреса `/albums`
> існує — помилка в **даних** запиту, тому `400` із полем `artistId`.

> 🤔 **Чому `Promise.all` у `list`.** Сторінка даних і загальна кількість не
> залежать одна від одної. Послідовні `await` чекали б їх по черзі, а
> `Promise.all` — паралельно. На базі даних це два одночасні запити з пулу.

### ✅ Контрольна точка 10

```bash
node -e "import('./src/services/albums.service.js').then(async (s) => {
  const page = await s.list({ search: 'ніч', sort: 'title', order: 'asc', limit: 2, offset: 0 });
  console.log(page.total, page.data.map((a) => a.title + ' — ' + a.artist.name));
  await s.getById('00000000-0000-4000-8000-000000000000').catch((e) => console.log(e.name, e.status, e.message));
})"
```

```
6 [ 'Акустика — Нічний трамвай', 'Депо — Нічний трамвай' ]
NotFoundError 404 Альбом не знайдено
```

`search: 'ніч'` знаходить і альбоми з «ніч» у назві («Нічне кафе»), і всі
альбоми гурту «Нічний трамвай».

---

## 11. Контролери, маршрути й перший повний API

> Лекція 12: [§5 Router](../../lectures/12-express-middleware-architecture.md),
> [§7.3 Контролер](../../lectures/12-express-middleware-architecture.md);
> лекція 13: [§1–§4](../../lectures/13-rest-api-postgresql.md)

### 11.1. Контролери

📄 **`src/controllers/albums.controller.js`**

```js
// Контролер — тонкий шар: читає req, викликає сервіс, формує res. Жодної бізнес-логіки.
import * as albumsService from '../services/albums.service.js';

export async function list(req, res) {
  const result = await albumsService.list(req.validatedQuery);
  res.set('X-Total-Count', String(result.total));
  res.json(result);
}

export async function getById(req, res) {
  res.json(await albumsService.getById(req.validatedParams.id));
}

export async function create(req, res) {
  const album = await albumsService.create(req.validatedBody);
  res.status(201).location(`${req.baseUrl}/${album.id}`).json(album);
}

// PUT і PATCH: 204 No Content — тіло не потрібне, клієнт і так знає, що надіслав
export async function update(req, res) {
  await albumsService.update(req.validatedParams.id, req.validatedBody);
  res.status(204).end();
}

export async function remove(req, res) {
  await albumsService.remove(req.validatedParams.id);
  res.status(204).end();
}
```

📄 **`src/controllers/artists.controller.js`**

```js
import * as artistsService from '../services/artists.service.js';

export async function list(req, res) {
  res.json(await artistsService.list());
}

export async function getById(req, res) {
  res.json(await artistsService.getById(req.validatedParams.id));
}

export async function create(req, res) {
  const artist = await artistsService.create(req.validatedBody);
  res.status(201).location(`${req.baseUrl}/${artist.id}`).json(artist);
}

export async function remove(req, res) {
  await artistsService.remove(req.validatedParams.id);
  res.status(204).end();
}
```

📄 **`src/controllers/genres.controller.js`**

```js
import * as genresService from '../services/genres.service.js';

export async function list(req, res) {
  res.json(await genresService.list());
}
```

> 🔑 Контролер вміщається в кілька рядків. З'явився `if` із бізнес-правилом
> чи SQL — щось лежить не на своєму місці.

> 🤔 **`req.baseUrl`** — шлях, до якого під'єднано роутер
> (`/api/v1/albums`). Заголовок `Location` не залежить від того, під яким
> префіксом змонтовано роутер.

### 11.2. Маршрути

📄 **`src/routes/albums.routes.js`**

```js
import { Router } from 'express';
import * as controller from '../controllers/albums.controller.js';
import { validate } from '../middlewares/validate.js';
import { validateUuidParam } from '../validators/common.js';
import {
  validateAlbumCreate,
  validateAlbumListQuery,
  validateAlbumPatch,
} from '../validators/album.validators.js';

const router = Router();
const validId = validate(validateUuidParam, 'params');

router.get('/', validate(validateAlbumListQuery, 'query'), controller.list);
router.get('/:id', validId, controller.getById);
router.post('/', validate(validateAlbumCreate), controller.create);
router.put('/:id', validId, validate(validateAlbumCreate), controller.update); // повна заміна
router.patch('/:id', validId, validate(validateAlbumPatch), controller.update); // часткова
router.delete('/:id', validId, controller.remove);

export default router;
```

📄 **`src/routes/artists.routes.js`**

```js
import { Router } from 'express';
import * as controller from '../controllers/artists.controller.js';
import { validate } from '../middlewares/validate.js';
import { validateIntIdParam } from '../validators/common.js';
import { validateArtistCreate } from '../validators/artist.validators.js';

const router = Router();
const validId = validate(validateIntIdParam, 'params');

router.get('/', controller.list);
router.get('/:id', validId, controller.getById);
router.post('/', validate(validateArtistCreate), controller.create);
router.delete('/:id', validId, controller.remove);

export default router;
```

📄 **`src/routes/genres.routes.js`**

```js
import { Router } from 'express';
import * as controller from '../controllers/genres.controller.js';

const router = Router();

router.get('/', controller.list);

export default router;
```

📄 **`src/routes/health.routes.js`** (тимчасова версія — у кроці 14 додамо перевірку бази)

```js
import { Router } from 'express';

const router = Router();

// Перевірка стану: її опитують Docker, хостинг, моніторинг
router.get('/', (req, res) => {
  res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

export default router;
```

📄 **`src/routes/index.js`**

```js
import { Router } from 'express';
import healthRoutes from './health.routes.js';
import albumsRoutes from './albums.routes.js';
import artistsRoutes from './artists.routes.js';
import genresRoutes from './genres.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/albums', albumsRoutes);
router.use('/artists', artistsRoutes);
router.use('/genres', genresRoutes);

export default router;
```

📄 **`src/app.js`** — остаточна версія: тимчасові маршрути `echo` і `demo` прибрано

```js
// Налаштування Express: middleware, маршрути, обробники помилок.
// Тут НЕМАЄ app.listen() — запуск окремо, у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Порядок має значення: middleware виконуються в порядку оголошення
app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(requestLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(cors({ origin: config.corsOrigin })); // 4. доступ із фронтенду (Vite: 5173)
app.use(express.json({ limit: '100kb' })); // 5. розбір JSON-тіла з обмеженням розміру

app.use('/api/v1', routes);

// Обробники помилок — ЗАВЖДИ останні
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

> 📚 **Теорія: ланцюжок обробників.** `router.put('/:id', validId,
> validate(validateAlbumCreate), controller.update)` — три функції поспіль.
> Кожна або викликає `next()` (далі), або `next(error)` (до обробника
> помилок). Контролер виконається, **лише якщо** обидві перевірки пройдено.

> 🤔 **PUT і PATCH — один контролер і один сервіс.** Різниця лише у
> валідаторі: для `PUT` перевіряється **повний** ресурс (і не передані поля
> отримують значення за замовчуванням), для `PATCH` — лише передані поля.

### 11.3. Запити для HTTP Client

📄 **`requests.http`**

```http
# Запити до API «Фонотеки» для HTTP Client у WebStorm.
# Запуск: зелена стрілка ▶ ліворуч від запиту (або Ctrl+Enter / ⌘+Enter на рядку запиту).
# Блок > {% … %} виконується ПІСЛЯ відповіді: зберігає id у змінну для наступних запитів.

@baseUrl = http://localhost:3000/api/v1

### Стан сервера
GET {{baseUrl}}/health

### Жанри (з кількістю альбомів)
GET {{baseUrl}}/genres

### Виконавці
GET {{baseUrl}}/artists

### Один виконавець
GET {{baseUrl}}/artists/3

### Список альбомів: перша сторінка (зберігаємо id першого альбому)
GET {{baseUrl}}/albums?limit=5

> {%
  client.global.set('albumId', response.body.data[0].id);
  client.test('статус 200 і заголовок X-Total-Count', () => {
    client.assert(response.status === 200);
    client.assert(response.headers.valueOf('X-Total-Count') === String(response.body.total));
  });
%}

### Друга сторінка, найновіші спочатку
GET {{baseUrl}}/albums?limit=5&offset=5&sort=releaseDate&order=desc

### Пошук (назва або виконавець, без урахування регістру)
GET {{baseUrl}}/albums?search=ніч

### Фільтри: джаз, починаючи з 2015 року
GET {{baseUrl}}/albums?genreId=3&yearFrom=2015

### Помилки валідації query → 400
GET {{baseUrl}}/albums?limit=1000&sort=price&format=mp3

### Один альбом
GET {{baseUrl}}/albums/{{albumId}}

### Неіснуючий альбом → 404
GET {{baseUrl}}/albums/00000000-0000-4000-8000-000000000000

### Некоректний id → 400
GET {{baseUrl}}/albums/abc

### Створити альбом → 201 + Location
POST {{baseUrl}}/albums
Content-Type: application/json

{
  "title": "Перший сніг",
  "artistId": 3,
  "genreIds": [3, 2],
  "releaseDate": "2026-01-15",
  "trackCount": 9,
  "format": "vinyl",
  "description": "Зимовий джаз із фолковими мотивами."
}

> {%
  client.global.set('newAlbumId', response.body.id);
  client.test('створено', () => client.assert(response.status === 201));
%}

### Повторно та сама назва → 409
POST {{baseUrl}}/albums
Content-Type: application/json

{
  "title": "перший СНІГ",
  "artistId": 3,
  "releaseDate": "2026-01-15",
  "trackCount": 9,
  "format": "cd"
}

### Невалідне тіло → 400 з переліком помилок
POST {{baseUrl}}/albums
Content-Type: application/json

{
  "title": "",
  "artistId": 99,
  "releaseDate": "2026-02-30",
  "trackCount": 0,
  "format": "mp3",
  "isAdmin": true
}

### Битий JSON → 400
POST {{baseUrl}}/albums
Content-Type: application/json

{ "title": "Без закривальної дужки"

### PATCH: змінити лише оцінку → 204
PATCH {{baseUrl}}/albums/{{newAlbumId}}
Content-Type: application/json

{ "rating": 5 }

### PUT: замінити повністю → 204 (не передані поля стають порожніми: rating → null)
PUT {{baseUrl}}/albums/{{newAlbumId}}
Content-Type: application/json

{
  "title": "Перший сніг (перевидання)",
  "artistId": 3,
  "genreIds": [3],
  "releaseDate": "2026-02-01",
  "trackCount": 10,
  "format": "cd"
}

### Перевірити результат
GET {{baseUrl}}/albums/{{newAlbumId}}

### Видалити → 204
DELETE {{baseUrl}}/albums/{{newAlbumId}}

### Видалити ще раз → 404
DELETE {{baseUrl}}/albums/{{newAlbumId}}

### Створити виконавця
POST {{baseUrl}}/artists
Content-Type: application/json

{ "name": "Нова хвиля" }

> {% client.global.set('newArtistId', response.body.id); %}

### Видалити виконавця з альбомами → 409
DELETE {{baseUrl}}/artists/3

### Видалити нового виконавця (без альбомів) → 204
DELETE {{baseUrl}}/artists/{{newArtistId}}

### Неіснуючий маршрут → 404
GET {{baseUrl}}/songs
```

> 📚 **HTTP Client у WebStorm.** Запити розділяє рядок `###` (текст після
> нього — назва запиту). `@baseUrl = …` — змінна файлу, `{{baseUrl}}` —
> підстановка. Блок `> {% … %}` виконується **після** відповіді: тут ми
> зберігаємо `id` у глобальну змінну (`client.global.set`), щоб наступні
> запити могли на неї посилатися, і пишемо маленькі перевірки
> `client.test(…)`. Результати перевірок — на вкладці **Tests** у вікні
> **Services**.

### ✅ Контрольна точка 11

`npm run dev`, потім у `requests.http` виконайте запити **згори вниз** (або
**Run All Requests in File** — подвійна зелена стрілка вгорі файлу).

| Запит | Очікувано |
|---|---|
| `GET /health` | `200`, `{"status":"ok",…}` |
| `GET /genres` | 6 жанрів за абеткою: Джаз, Електроніка, Інді, Поп, Рок, Фолк |
| `GET /albums?limit=5` | 5 альбомів, `"total": 25`, заголовок `X-Total-Count: 25`; тести ✅ |
| `GET /albums?limit=1000&sort=price&format=mp3` | `400`, три помилки: `limit`, `format`, `sort` |
| `GET /albums/abc` | `400`, `Некоректний ідентифікатор` |
| `POST /albums` | `201`, `Location: /api/v1/albums/<uuid>`, жанри «Джаз», «Фолк» |
| повторний `POST` з назвою `перший СНІГ` | `409`, `Альбом «Перший сніг» уже є у фонотеці` |
| невалідне тіло | `400`, п'ять помилок: `isAdmin`, `title`, `releaseDate`, `trackCount`, `format` (неіснуючий `artistId: 99` валідатор пропускає — це перевірить сервіс, коли решта даних буде правильною) |
| `PATCH { "rating": 5 }` | `204` |
| `PUT` | `204`; наступний `GET` показує `"rating": null` — поле не передали |
| `DELETE`, ще раз `DELETE` | `204`, потім `404` |
| `DELETE /artists/3` | `409`, `У виконавця є альбоми (5): спершу видаліть їх` |

Те саме з терміналу:

```bash
curl -i "http://localhost:3000/api/v1/albums?limit=2&sort=releaseDate&order=desc"
curl "http://localhost:3000/api/v1/albums?genreId=3&yearFrom=2015"
curl -i -X POST http://localhost:3000/api/v1/albums -H "Content-Type: application/json" \
  -d '{"title":"Перший сніг","artistId":3,"genreIds":[3,2],"releaseDate":"2026-01-15","trackCount":9,"format":"vinyl"}'
```

> 💡 Якщо проєкт у git — саме час для коміту: `git init && git add . &&
> git commit -m "Частина 2: API в пам'яті"`. У кроці 16 `git diff` покаже,
> що саме змінилося з переходом на PostgreSQL.

> 🎤 **На лекції.** Перезапустіть сервер (збережіть будь-який файл у `src/`) і
> виконайте `GET /albums` ще раз: створений альбом **зник**, а `id` усіх
> альбомів змінилися. Дані в пам'яті живуть, доки живе процес. Це й
> мотивація частини 3.

### 🧪 Експеримент 11.1. Порядок маршрутів

Тимчасово додайте в `albums.routes.js` **після** `router.get('/:id', …)`:

```js
router.get('/stats', (req, res) => res.json({ total: 25 }));
```

`curl -i http://localhost:3000/api/v1/albums/stats` → `400 Некоректний
ідентифікатор`: запит перехопив `/:id`, бо `stats` теж підходить під шаблон.
Перенесіть рядок **вище** за `/:id` — тепер `200`. Маршрути перевіряються
**в порядку оголошення** ([лекція 12, §2.2](../../lectures/12-express-middleware-architecture.md)).
Видаліть тимчасовий маршрут.

### 🧪 Експеримент 11.2. Сервіс без валідатора

У `albums.routes.js` приберіть `validate(validateAlbumCreate)` із маршруту
`POST /` і надішліть невалідне тіло з `requests.http`.

**Результат:** `500` і `TypeError: Cannot read properties of undefined
(reading 'title')` у консолі — `req.validatedBody` не заповнено.
Контролер розраховує, що дані перевірено **до** нього. Поверніть валідатор.

---

# Частина 3. PostgreSQL (лекція 13)

## 12. PostgreSQL у Docker

> Лекція 13: [§7 PostgreSQL: чому саме він](../../lectures/13-rest-api-postgresql.md),
> [§8 Запуск бази в Docker](../../lectures/13-rest-api-postgresql.md)

Потрібен **Docker Desktop** (Windows, macOS) або Docker Engine (Linux).
Перевірка: `docker --version` і `docker compose version`.

📄 **`docker-compose.yml`**

```yaml
# PostgreSQL для розробки.
#   docker compose up -d      — запустити у фоні
#   docker compose down       — зупинити (дані збережуться в томі pgdata)
#   docker compose down -v    — зупинити й ВИДАЛИТИ дані
services:
  db:
    image: postgres:18-alpine
    container_name: albums-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: albums
      POSTGRES_PASSWORD: albums_dev_password
      POSTGRES_DB: albums
      # Українське сортування (Ґ після Г, Є після Е, І після И) через ICU.
      # Діє лише під час ПЕРШОГО створення бази (порожній том).
      POSTGRES_INITDB_ARGS: --locale-provider=icu --icu-locale=uk-UA
    ports:
      - '5432:5432'
    volumes:
      # Для образів 18+ — саме /var/lib/postgresql (для ≤17 було …/postgresql/data)
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U albums -d albums']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

> 🤔 **Чому `POSTGRES_INITDB_ARGS`.** Образи `-alpine` побудовано на бібліотеці
> musl, яка не вміє сортувати за правилами української мови: без ICU
> `ORDER BY title` поставить «Імпровізації» **перед** «Акустикою» (порівнюються
> коди символів, а `І` в Unicode стоїть раніше за `А`). ICU-локаль `uk-UA`
> дає правильну абетку. Налаштування спрацьовує лише під час **першого**
> створення бази: якщо том `pgdata` уже є, виконайте `docker compose down -v`
> і запустіть знову.

```bash
docker compose up -d
docker compose ps        # STATUS: Up … (healthy)
```

📄 **`.env.example`** — остаточна версія

```ini
# Шаблон налаштувань. Скопіюйте у .env і заповніть значення.
# .env НЕ потрапляє в git, .env.example — потрапляє.
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://albums:albums_dev_password@localhost:5432/albums
CORS_ORIGIN=http://localhost:5173
# true — друкувати кожен SQL-запит у консоль
LOG_SQL=false
```

Перенесіть нові рядки (`DATABASE_URL`, `LOG_SQL`) у свій `.env` (або
скопіюйте шаблон ще раз: `cp .env.example .env`).

📄 **`src/config/index.js`** — остаточна версія

```js
// Уся конфігурація — в одному місці й лише зі змінних середовища.
// Решта коду імпортує config і не звертається до process.env напряму.

function required(name) {
  const value = process.env[name];
  if (!value) {
    // Краще впасти одразу з ясним повідомленням, ніж через годину роботи
    console.error(`✖ Відсутня обов'язкова змінна середовища: ${name}`);
    process.exit(1);
  }
  return value;
}

const env = process.env.NODE_ENV ?? 'development';

export const config = {
  env,
  isProduction: env === 'production',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  logSql: process.env.LOG_SQL === 'true', // друкувати кожен SQL-запит (для навчання)
};
```

> 📚 **Теорія: `required()`** ([лекція 11, §9](../../lectures/11-nodejs-runtime.md)).
> Без `DATABASE_URL` застосунок не має сенсу, тому краще **одразу** впасти з
> ясним повідомленням, ніж за годину отримати незрозумілу помилку з
> глибини драйвера.

### ✅ Контрольна точка 12

```bash
docker compose exec db psql -U albums -d albums -c "SELECT version();"
docker compose exec db psql -U albums -d albums -c "SELECT datlocprovider, datlocale FROM pg_database WHERE datname = 'albums';"
```

- версія — `PostgreSQL 18.x`;
- `datlocprovider` = `i` (ICU), `datlocale` = `uk-UA`.

Сервер (`npm run dev`) перезапуститься й працюватиме як раніше: конфігурація
читає `DATABASE_URL`, але база в коді ще не використовується.

### 🧪 Експеримент 12.1. Обов'язкова змінна

Закоментуйте в `.env` рядок `DATABASE_URL` (`#` на початку).

**Результат:** у терміналі
`✖ Відсутня обов'язкова змінна середовища: DATABASE_URL`, процес завершився.
Розкоментуйте рядок.

---

## 13. Міграції: схема бази в коді

> Лекція 13: [§9 Проєктування схеми](../../lectures/13-rest-api-postgresql.md),
> [§10 Зв'язки між таблицями](../../lectures/13-rest-api-postgresql.md),
> [§11 Міграції](../../lectures/13-rest-api-postgresql.md),
> [§15 Індекси](../../lectures/13-rest-api-postgresql.md)

```bash
npm install pg node-pg-migrate
```

Додайте скрипти в `package.json` (секція `"scripts"`):

```json
"migrate": "node --env-file=.env node_modules/node-pg-migrate/bin/node-pg-migrate.js -m src/db/migrations",
"migrate:up": "npm run migrate -- up",
"migrate:down": "npm run migrate -- down",
"migrate:create": "npm run migrate -- create",
"seed": "node --env-file=.env scripts/seed.js"
```

> 🤔 **Чому такий довгий `migrate`.** `node-pg-migrate` бере рядок
> підключення зі змінної `DATABASE_URL`. Сам він уміє читати `.env` лише через
> пакет `dotenv`, якого в нас немає. Тому запускаємо його через `node
> --env-file=.env` — так само, як і сервер. Короткий виклик
> `node-pg-migrate …` з лекції працює, якщо `DATABASE_URL` уже є в
> середовищі (так буде на хостингу).

Створіть файл міграції:

```bash
npm run migrate:create -- initial-schema
```

З'явиться `src/db/migrations/<позначка часу>_initial-schema.js` (позначка в
кожного своя — вона й задає порядок міграцій). Замініть його вміст:

📄 **`src/db/migrations/1793000000000_initial-schema.js`**

```js
// Початкова схема «Фонотеки». Ім'я файлу (позначка часу) задає порядок міграцій.
// Правило: застосовану міграцію НЕ редагують — кожна зміна схеми йде новою міграцією.

/** @param pgm {import('node-pg-migrate').MigrationBuilder} */
export const up = (pgm) => {
  // Виконавці: читабельний автоінкрементний id — INTEGER GENERATED ALWAYS AS IDENTITY
  const identityId = { type: 'integer', primaryKey: true, sequenceGenerated: { precedence: 'ALWAYS' } };

  pgm.createTable('artists', {
    id: identityId,
    name: { type: 'varchar(120)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('genres', {
    id: identityId,
    name: { type: 'varchar(60)', notNull: true, unique: true },
  });

  // Альбоми: UUID — не розкриває кількість записів, не вгадується перебором
  pgm.createTable(
    'albums',
    {
      id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
      title: { type: 'varchar(200)', notNull: true },
      description: { type: 'text' },
      artist_id: {
        type: 'integer',
        notNull: true,
        references: 'artists',
        onDelete: 'RESTRICT', // не можна видалити виконавця, поки є його альбоми
      },
      release_date: { type: 'date', notNull: true },
      track_count: { type: 'smallint', notNull: true },
      rating: { type: 'smallint' }, // NULL — ще не оцінено
      format: { type: 'varchar(10)', notNull: true, default: 'digital' },
      in_collection: { type: 'boolean', notNull: true, default: false },
      created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
      updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    },
    {
      // Обмеження в базі — остання лінія оборони, навіть якщо валідацію в коді обійдуть
      constraints: {
        check: [
          'track_count BETWEEN 1 AND 999',
          'rating BETWEEN 1 AND 5',
          "format IN ('vinyl', 'cd', 'digital')",
          "release_date >= '1900-01-01'",
        ],
      },
    },
  );

  // Зв'язувальна таблиця «багато-до-багатьох»: складений первинний ключ
  pgm.createTable('album_genres', {
    album_id: { type: 'uuid', notNull: true, references: 'albums', onDelete: 'CASCADE', primaryKey: true },
    genre_id: { type: 'integer', notNull: true, references: 'genres', onDelete: 'CASCADE', primaryKey: true },
  });

  // Унікальність БЕЗ урахування регістру — як і правило в сервісі («Сніг» = «сніг»).
  // Індекс за виразом lower(...) заодно пришвидшує пошук WHERE LOWER(title) = LOWER($1).
  pgm.createIndex('artists', 'lower(name)', { unique: true, name: 'artists_name_lower_unique' });
  pgm.createIndex('albums', 'lower(title)', { unique: true, name: 'albums_title_lower_unique' });

  // Зовнішні ключі PostgreSQL САМ не індексує (на відміну від PRIMARY KEY і UNIQUE)
  pgm.createIndex('albums', 'artist_id');
  pgm.createIndex('album_genres', 'genre_id');

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
  pgm.dropTable('album_genres');
  pgm.dropTable('albums');
  pgm.dropTable('genres');
  pgm.dropTable('artists');
  pgm.sql('DROP FUNCTION set_updated_at()');
};
```

> 📚 **Теорія.**
>
> - **`GENERATED ALWAYS AS IDENTITY`** — стандартна сучасна заміна `SERIAL`,
>   яку радить вікі PostgreSQL. `ALWAYS` забороняє вставляти `id` вручну:
>   лічильник не «розсинхронізується» з даними. (Скорочення `id: 'id'` з
>   лекції в `node-pg-migrate` досі дає `serial`.)
> - **UUID для альбомів** — не розкриває кількість записів і не вгадується
>   перебором (`/albums/1`, `/albums/2`…). Для довідників зручні читабельні
>   цілі `id`.
> - **`ON DELETE`:** `RESTRICT` для виконавця (видалити, поки є альбоми, не
>   можна), `CASCADE` для зв'язків (зв'язок без альбому чи жанру не має
>   сенсу).
> - **Унікальність без урахування регістру** — унікальний індекс за виразом
>   `lower(title)`. Звичайний `UNIQUE (title)` пропустив би «Сніг» і «сніг»,
>   хоча сервіс вважає їх однаковими. Заодно цей індекс пришвидшує
>   `WHERE LOWER(title) = LOWER($1)` у `findByTitle`.
> - **`CHECK`** дублює валідацію в коді. Це не надлишковість: у базу пишуть
>   і міграції, і скрипти, і ви вручну через `psql`.
> - **Індекси на зовнішні ключі** PostgreSQL сам не створює — на відміну від
>   `PRIMARY KEY` і `UNIQUE`. Для `album_genres(album_id)` окремий індекс не
>   потрібен: він перший у складеному первинному ключі.

```bash
npm run migrate:up
```

### ✅ Контрольна точка 13

У терміналі — згенерований SQL (`CREATE TABLE "artists" …`, `CREATE TABLE
"albums" …`) і `Migrations complete!`.

```bash
docker compose exec db psql -U albums -d albums -c "\dt"
docker compose exec db psql -U albums -d albums -c "\d albums"
```

`\dt` показує п'ять таблиць: `album_genres`, `albums`, `artists`, `genres` і
службову `pgmigrations` — у ній `node-pg-migrate` записує, які міграції вже
застосовано.

### 🧪 Експеримент 13.1. Відкат і повтор

```bash
npm run migrate:down     # DROP TABLE … у зворотному порядку
npm run migrate:up       # схема знову на місці
```

> 🎤 **На лекції.** Правила з [§11](../../lectures/13-rest-api-postgresql.md):
> **застосовану міграцію не редагують** (колеги та продакшен її вже
> виконали — ваші зміни до них не дійдуть); кожна зміна схеми — нова
> міграція; `down` пишуть завжди. Порожня база + `npm run migrate:up` =
> повна схема.

---

## 14. Пул з'єднань і запуск сервера

> Лекція 13: [§12 Підключення з Node.js](../../lectures/13-rest-api-postgresql.md),
> [§16 Транзакції](../../lectures/13-rest-api-postgresql.md);
> лекція 11: [§10.2 Коректне завершення](../../lectures/11-nodejs-runtime.md)

📄 **`src/db/pool.js`**

```js
// Пул з'єднань PostgreSQL — один на весь застосунок.
import pg from 'pg';
import { config } from '../config/index.js';

const { Pool, types } = pg;

// Тип DATE (OID 1082) за замовчуванням стає JS Date опівночі ЛОКАЛЬНОГО часу —
// і в JSON '2014-04-18' перетворюється на '2014-04-17T21:00:00.000Z' (у Києві).
// Дата без часу має лишатися рядком 'YYYY-MM-DD'.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10, // максимум одночасних з'єднань
  idleTimeoutMillis: 30_000, // закривати з'єднання, що простоюють
  connectionTimeoutMillis: 5_000, // не чекати вільного з'єднання вічно
});

// Помилка неактивного з'єднання з пулу (наприклад, базу перезапустили) — інакше процес впаде
pool.on('error', (error) => {
  console.error('Несподівана помилка пулу PostgreSQL:', error.message);
});

// LOG_SQL=true у .env — друкуємо кожен pool.query: видно, скільки запитів іде на один виклик API
if (config.logSql) {
  const query = pool.query.bind(pool);
  pool.query = (text, params) => {
    console.log(`  SQL: ${String(text).replace(/\s+/g, ' ').trim().slice(0, 110)}`);
    return query(text, params);
  };
}

export async function checkConnection() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

export async function closePool() {
  await pool.end();
}

/** Виконує callback(client) у транзакції: усе або нічого */
export async function withTransaction(callback) {
  const client = await pool.connect(); // окреме з'єднання: BEGIN…COMMIT мають іти через нього
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
```

> 📚 **Теорія: чому пул.** Нове з'єднання з PostgreSQL — це мережеве
> рукостискання, автентифікація й окремий процес на сервері бази. Пул тримає
> до 10 відкритих з'єднань і видає їх запитам по черзі. `pool.query()` сам
> бере з'єднання й повертає його; для транзакції потрібне **одне й те саме**
> з'єднання для `BEGIN`, запитів і `COMMIT` — тому `pool.connect()` і
> обов'язковий `release()`.

📄 **`src/routes/health.routes.js`** — остаточна версія

```js
import { Router } from 'express';
import { checkConnection } from '../db/pool.js';

const router = Router();

// Перевірка стану: її опитують Docker, хостинг, моніторинг
router.get('/', async (req, res) => {
  const database = await checkConnection().then(() => 'up', () => 'down');
  res.status(database === 'up' ? 200 : 503).json({
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    uptime: Math.round(process.uptime()),
  });
});

export default router;
```

📄 **`src/server.js`** — остаточна версія

```js
// Точка входу: перевіряємо базу, запускаємо HTTP-сервер, коректно завершуємося.
import app from './app.js';
import { config } from './config/index.js';
import { checkConnection, closePool } from './db/pool.js';

try {
  await checkConnection(); // await на верхньому рівні — можна в ES-модулях
} catch (error) {
  console.error("✖ Немає з'єднання з PostgreSQL. Чи запущено docker compose up -d?");
  console.error(`  ${error.message || error.code}`); // AggregateError буває з порожнім message
  process.exit(1);
}

const server = app.listen(config.port, () => {
  console.log(`API «Фонотеки»: http://localhost:${config.port}/api/v1 (${config.env})`);
});

async function shutdown(signal) {
  console.log(`Отримано ${signal}, завершуємо роботу…`);

  // Перестаємо приймати нові з'єднання; колбек — коли завершаться поточні запити
  server.close(async () => {
    await closePool();
    console.log('Завершено коректно');
    process.exit(0);
  });

  // Якщо за 10 секунд не встигли — виходимо примусово
  setTimeout(() => {
    console.error('Не вдалося завершити коректно, вихід примусово');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### ✅ Контрольна точка 14

Сервер перезапустився:

```
  SQL: SELECT 1 AS ok                  ← лише якщо LOG_SQL=true
API «Фонотеки»: http://localhost:3000/api/v1 (development)
```

```bash
curl -i http://localhost:3000/api/v1/health
```

`200` і `{"status":"ok","database":"up","uptime":…}`.

### 🧪 Експеримент 14.1. База недоступна

```bash
docker compose stop db
curl -i http://localhost:3000/api/v1/health      # одразу: 503, "database":"down"
```

Одразу після зупинки бази в консолі може з'явитися
`Несподівана помилка пулу PostgreSQL: terminating connection due to
administrator command` — це закрилося неактивне з'єднання з пулу; сервер
працює далі (саме для цього `pool.on('error', …)`).

Збережіть будь-який файл у `src/`, щоб сервер перезапустився: тепер він
**не стартує** —
`✖ Немає з'єднання з PostgreSQL. Чи запущено docker compose up -d?` і
причина (`connect ECONNREFUSED 127.0.0.1:5432` або просто `ECONNREFUSED`).
`node --watch` пише `Failed running 'src/server.js'. Waiting for file
changes before restarting...`

```bash
docker compose start db
```

Знову збережіть файл у `src/` — сервер стартує.

> 🎤 **На лекції.** Дві різні ситуації: база впала **під час** роботи —
> сервер живий і чесно відповідає `503`, коли його питає моніторинг; бази
> немає **під час старту** — сервер навіть не починає приймати запити.
> Відмова в з'єднанні (`ECONNREFUSED`) приходить миттєво; якби база «мовчала»
> (мережа, файрвол), пул чекав би `connectionTimeoutMillis` — 5 секунд.

---

## 15. Seed-дані

> Лекція 13: [§18 Seed-дані](../../lectures/13-rest-api-postgresql.md)

📄 **`scripts/seed.js`**

```js
// Наповнення бази демо-даними: npm run seed
// ⚠️ СПЕРШУ ОЧИЩАЄ таблиці — лише для розробки!
import { pool, withTransaction } from '../src/db/pool.js';
import * as seed from '../src/data/seed-data.js';

// Багаторядкова вставка: VALUES ($1, $2), ($3, $4), … — один запит замість сотні
function multiRowInsert(rows) {
  const params = [];
  const values = rows.map((row) => {
    const placeholders = row.map((value) => {
      params.push(value);
      return `$${params.length}`;
    });
    return `(${placeholders.join(', ')})`;
  });
  return { values: values.join(', '), params };
}

async function insertMany(client, table, columns, rows) {
  const { values, params } = multiRowInsert(rows);
  const { rows: inserted } = await client.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values} RETURNING *`,
    params,
  );
  return inserted;
}

async function main() {
  console.log('Наповнення бази…');

  await withTransaction(async (client) => {
    // RESTART IDENTITY — лічильники id знову з 1; CASCADE — разом із залежними таблицями
    await client.query('TRUNCATE album_genres, albums, artists, genres RESTART IDENTITY CASCADE');

    const artists = await insertMany(client, 'artists', ['name'], seed.artists.map((name) => [name]));
    const genres = await insertMany(client, 'genres', ['name'], seed.genres.map((name) => [name]));

    const artistId = new Map(artists.map((row) => [row.name, row.id]));
    const genreId = new Map(genres.map((row) => [row.name, row.id]));

    const albums = await insertMany(
      client,
      'albums',
      ['title', 'description', 'artist_id', 'release_date', 'track_count', 'rating', 'format', 'in_collection'],
      seed.albums.map((album) => [
        album.title, album.description, artistId.get(album.artist), album.releaseDate,
        album.trackCount, album.rating, album.format, album.inCollection,
      ]),
    );

    const albumId = new Map(albums.map((row) => [row.title, row.id]));
    const links = seed.albums.flatMap((album) =>
      album.genres.map((name) => [albumId.get(album.title), genreId.get(name)]),
    );
    await insertMany(client, 'album_genres', ['album_id', 'genre_id'], links);

    console.log(
      `✔ Виконавців: ${artists.length}, жанрів: ${genres.length}, альбомів: ${albums.length}, зв'язків: ${links.length}`,
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
```

> 🤔 **Чому так.**
>
> - **Той самий `seed-data.js`**, що наповнював сховище в пам'яті, — дані
>   описано один раз.
> - **Багаторядкова вставка** `VALUES (…), (…), …` — один запит на таблицю
>   замість 25 окремих.
> - **`RETURNING *`** повертає вставлені рядки разом зі згенерованими `id` —
>   з них будуємо `Map` «назва → id» для зв'язків.
> - **Транзакція:** якщо щось зламається посередині, `ROLLBACK` поверне базу
>   до стану «до seed», а не залишить половину даних.
> - **`process.exitCode = 1`** замість `process.exit(1)`: скрипт спершу
>   закриє пул у `finally`, а потім завершиться з кодом помилки.

```bash
npm run seed
```

### ✅ Контрольна точка 15

```
Наповнення бази…
✔ Виконавців: 5, жанрів: 6, альбомів: 25, зв'язків: 38
```

```bash
docker compose exec db psql -U albums -d albums -c "SELECT title, release_date FROM albums ORDER BY title LIMIT 5;"
```

Перші п'ять за українською абеткою: Акустика, Вітер змін, Гірська весна,
Гравітація, Депо.

---

## 16. Репозиторії на SQL

> Лекція 13: [§13 SQL-ін'єкції та параметризовані запити](../../lectures/13-rest-api-postgresql.md),
> [§14 Динамічні запити](../../lectures/13-rest-api-postgresql.md),
> [§10.3 `JOIN`](../../lectures/13-rest-api-postgresql.md),
> [§16 Транзакції](../../lectures/13-rest-api-postgresql.md),
> [§17 Проблема N+1](../../lectures/13-rest-api-postgresql.md)

Головний момент усього сценарію: **замінюємо три файли в `repositories/`**
і додаємо одне місце, що перетворює помилки PostgreSQL на помилки API.
Сервіси, контролери, валідатори й маршрути ресурсів не змінюються.

📄 **`src/repositories/albums.repository.js`** — остаточна версія

```js
// Репозиторій альбомів — ВЕРСІЯ POSTGRESQL.
// Ті самі функції й той самий формат рядків, що й у версії в пам'яті,
// тому сервіс не змінюється жодним рядком.
import { pool, withTransaction } from '../db/pool.js';

// Білий список: поле API → стовпець. Назву стовпця НЕМОЖЛИВО передати параметром $n,
// вона потрапляє в текст SQL — тому лише зі списку, інакше SQL-ін'єкція.
const SORT_COLUMNS = {
  title: 'a.title',
  releaseDate: 'a.release_date',
  rating: 'a.rating',
  createdAt: 'a.created_at',
};

// Альбом + назва виконавця (JOIN) + масив жанрів (json_agg) — ОДНИМ запитом, без N+1
const SELECT_ALBUMS = `
  SELECT a.*,
         ar.name AS artist_name,
         COALESCE(
           json_agg(json_build_object('id', g.id, 'name', g.name) ORDER BY g.name)
             FILTER (WHERE g.id IS NOT NULL),
           '[]'
         ) AS genres
    FROM albums a
    JOIN artists ar ON ar.id = a.artist_id
    LEFT JOIN album_genres ag ON ag.album_id = a.id
    LEFT JOIN genres g ON g.id = ag.genre_id`;

// % і _ у LIKE — спецсимволи; екрануємо, щоб пошук «100%» шукав саме «100%»
const escapeLike = (text) => text.replace(/[\\%_]/g, '\\$&');

// Динамічний WHERE: умови додаються лише для заданих фільтрів, значення — лише параметрами
function buildFilters(filters = {}) {
  const conditions = [];
  const params = [];

  const add = (sql, value) => {
    params.push(value);
    conditions.push(sql.replaceAll('?', `$${params.length}`));
  };

  if (filters.search) add('(a.title ILIKE ? OR ar.name ILIKE ?)', `%${escapeLike(filters.search)}%`);
  if (filters.artistId) add('a.artist_id = ?', filters.artistId);
  if (filters.genreId) {
    add('EXISTS (SELECT 1 FROM album_genres x WHERE x.album_id = a.id AND x.genre_id = ?)', filters.genreId);
  }
  if (filters.format) add('a.format = ?', filters.format);
  if (filters.inCollection !== undefined) add('a.in_collection = ?', filters.inCollection);
  if (filters.yearFrom) add('a.release_date >= make_date(?, 1, 1)', filters.yearFrom);
  if (filters.yearTo) add('a.release_date <= make_date(?, 12, 31)', filters.yearTo);

  return {
    where: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '',
    params,
  };
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
      GROUP BY a.id, ar.name
      ORDER BY ${column} ${direction} NULLS LAST, a.id
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  return rows;
}

export async function count(filters) {
  const { where, params } = buildFilters(filters);
  // COUNT(*) повертає bigint, який pg віддає РЯДКОМ ('25') — тому ::int
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS total
       FROM albums a
       JOIN artists ar ON ar.id = a.artist_id
      ${where}`,
    params,
  );
  return rows[0].total;
}

export async function findById(id, db = pool) {
  const { rows } = await db.query(`${SELECT_ALBUMS} WHERE a.id = $1 GROUP BY a.id, ar.name`, [id]);
  return rows[0] ?? null;
}

export async function findByTitle(title) {
  const { rows } = await pool.query('SELECT * FROM albums WHERE LOWER(title) = LOWER($1)', [title]);
  return rows[0] ?? null;
}

// поле API (camelCase) → стовпець (snake_case); заодно білий список для UPDATE
const COLUMNS = {
  title: 'title',
  description: 'description',
  artistId: 'artist_id',
  releaseDate: 'release_date',
  trackCount: 'track_count',
  rating: 'rating',
  format: 'format',
  inCollection: 'in_collection',
};

async function setGenres(client, albumId, genreIds) {
  await client.query('DELETE FROM album_genres WHERE album_id = $1', [albumId]);
  if (genreIds.length > 0) {
    // unnest($2::int[]) — масив id одним параметром замість циклу з INSERT
    await client.query(
      'INSERT INTO album_genres (album_id, genre_id) SELECT $1, unnest($2::int[])',
      [albumId, genreIds],
    );
  }
}

// Альбом і його жанри — у ТРАНЗАКЦІЇ: або все, або нічого
export async function create(data) {
  return withTransaction(async (client) => {
    const columns = Object.values(COLUMNS);
    const values = Object.keys(COLUMNS).map((key) => data[key]);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const { rows } = await client.query(
      `INSERT INTO albums (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING id`,
      values,
    );
    await setGenres(client, rows[0].id, data.genreIds);
    return findById(rows[0].id, client); // читаємо через те саме з'єднання транзакції
  });
}

/** Оновлює лише ПЕРЕДАНІ поля (для PUT валідатор передає всі) */
export async function update(id, data) {
  return withTransaction(async (client) => {
    const sets = [];
    const params = [];
    for (const [key, column] of Object.entries(COLUMNS)) {
      if (Object.hasOwn(data, key)) {
        params.push(data[key]);
        sets.push(`${column} = $${params.length}`);
      }
    }

    if (sets.length > 0) {
      params.push(id);
      const { rowCount } = await client.query(
        `UPDATE albums SET ${sets.join(', ')} WHERE id = $${params.length}`,
        params,
      );
      if (rowCount === 0) return null;
    } else {
      // Змінюються лише жанри: оновлюємо updated_at, щоб спрацював тригер
      const { rowCount } = await client.query('UPDATE albums SET updated_at = now() WHERE id = $1', [id]);
      if (rowCount === 0) return null;
    }

    if (Object.hasOwn(data, 'genreIds')) await setGenres(client, id, data.genreIds);
    return findById(id, client);
  });
}

export async function remove(id) {
  // Зв'язки з жанрами видалить сама база: ON DELETE CASCADE
  const { rowCount } = await pool.query('DELETE FROM albums WHERE id = $1', [id]);
  return rowCount > 0;
}
```

📄 **`src/repositories/artists.repository.js`** — остаточна версія

```js
// Репозиторій виконавців — ВЕРСІЯ POSTGRESQL.
import { pool } from '../db/pool.js';

// Кількість альбомів — агрегацією в самій базі (LEFT JOIN залишає виконавців без альбомів)
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

export async function findByName(name) {
  const { rows } = await pool.query('SELECT * FROM artists WHERE LOWER(name) = LOWER($1)', [name]);
  return rows[0] ?? null;
}

export async function create({ name }) {
  const { rows } = await pool.query(
    'INSERT INTO artists (name) VALUES ($1) RETURNING *, 0 AS album_count',
    [name],
  );
  return rows[0];
}

export async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM artists WHERE id = $1', [id]);
  return rowCount > 0;
}
```

📄 **`src/repositories/genres.repository.js`** — остаточна версія

```js
// Репозиторій жанрів — ВЕРСІЯ POSTGRESQL.
import { pool } from '../db/pool.js';

export async function findAll() {
  const { rows } = await pool.query(`
    SELECT g.*, COUNT(ag.album_id)::int AS album_count
      FROM genres g
      LEFT JOIN album_genres ag ON ag.genre_id = g.id
     GROUP BY g.id
     ORDER BY g.name`);
  return rows;
}

export async function findByIds(ids) {
  // = ANY($1) — перевірка «входить у масив» одним параметром
  const { rows } = await pool.query('SELECT * FROM genres WHERE id = ANY($1::int[])', [ids]);
  return rows;
}
```

> 📚 **Теорія.**
>
> - **Параметри `$1, $2…`** — драйвер надсилає текст запиту й значення
>   **окремо**. Сервер бази спершу розбирає структуру запиту, а значення
>   підставляє потім: вони фізично не можуть змінити структуру. Це не
>   «екранування», а інший механізм.
> - **Параметром не можна передати назву стовпця чи `ASC/DESC`** — лише
>   значення. Тому `SORT_COLUMNS` — білий список, а напрямок вибирається
>   тернарним оператором з двох констант.
> - **`json_agg … FILTER (WHERE g.id IS NOT NULL)`** — жанри одним
>   запитом разом з альбомами. `FILTER` прибирає `[{id: null}]` в альбомів
>   без жанрів, `COALESCE(…, '[]')` дає порожній масив.
> - **`EXISTS` для `genreId`**, а не `WHERE g.id = …`: інакше `json_agg`
>   зібрав би лише відфільтрований жанр, і альбом «Фолк + Рок» показав би
>   тільки «Фолк».
> - **`COUNT(*)::int`** — `COUNT` повертає `bigint`, а `pg` віддає `bigint`
>   **рядком** (`"25"`), бо JavaScript `number` не вміщує всіх його значень.
> - **`findById(id, client)`** — у транзакції читаємо через **те саме**
>   з'єднання: інший клієнт пулу ще не бачить незафіксованих змін.

Коди помилок PostgreSQL перетворимо на помилки API в одному місці.

📄 **`src/db/pgErrors.js`**

```js
import { ConflictError, ValidationError } from '../errors/index.js';

// Обмеження бази — остання лінія оборони. Якщо порушення «проскочило» повз
// перевірки сервісу (наприклад, два однакові POST одночасно), перетворюємо
// код помилки PostgreSQL на зрозумілу помилку API замість 500.
export function translatePgError(error) {
  switch (error.code) {
    case '23505': // порушення UNIQUE
      return new ConflictError('Запис із таким значенням уже існує');
    case '23503': // порушення зовнішнього ключа
      return new ConflictError("Операція порушує зв'язок між записами");
    case '23514': // порушення CHECK
      return new ValidationError([{ field: 'body', message: `Порушено обмеження ${error.constraint}` }]);
    case '22P02': // некоректний формат значення (наприклад, не-UUID)
      return new ValidationError([{ field: 'id', message: 'Некоректний формат значення' }]);
    default:
      return error;
  }
}
```

📄 **`src/middlewares/errorHandler.js`** — остаточна версія

```js
import { AppError, NotFoundError } from '../errors/index.js';
import { config } from '../config/index.js';
import { translatePgError } from '../db/pgErrors.js';

// Помилки express.json() мають англійські повідомлення — даємо свої
const PARSER_MESSAGES = {
  'entity.parse.failed': 'Некоректний JSON у тілі запиту',
  'entity.too.large': 'Завелике тіло запиту',
};

// Жоден маршрут не підійшов → 404 у загальному форматі помилки
export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Маршрут ${req.method} ${req.originalUrl}`));
}

// ЧОТИРИ параметри — саме так Express відрізняє обробник помилок від звичайного middleware
// (тому next тут обов'язковий, навіть якщо ним майже не користуємося).
export function errorHandler(rawError, req, res, next) {
  // Відповідь уже почали надсилати — змінити статус неможливо, делегуємо Express
  if (res.headersSent) return next(rawError);

  // Коди помилок PostgreSQL (23505, 23503, …) → помилки API; решта — без змін
  const error = translatePgError(rawError);

  // expose: true мають помилки express.json(): битий JSON → 400, завелике тіло → 413
  const isOperational = error instanceof AppError || error.expose === true;
  const status = isOperational ? error.status : 500;

  // Очікувані помилки — коротко, неочікувані — з повним стеком
  if (isOperational) {
    console.warn(`[${req.id.slice(0, 8)}] ${status} ${error.message}`);
  } else {
    console.error(`[${req.id.slice(0, 8)}] Неочікувана помилка:`, error);
  }

  res.status(status).json({
    status,
    message: isOperational ? (PARSER_MESSAGES[error.type] ?? error.message) : 'Внутрішня помилка сервера',
    ...(error.details ? { errors: error.details } : {}),
    // Стек — ЛИШЕ в розробці: у продакшені він розкриває структуру проєкту
    ...(config.isProduction || isOperational ? {} : { stack: error.stack }),
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
```

> 🤔 **Навіщо, якщо сервіс уже перевіряє назву й посилання.** Між перевіркою
> `findByTitle` і `INSERT` минає кілька мілісекунд — два однакові `POST`
> одночасно обидва пройдуть перевірку. Обмеження `UNIQUE` у базі зупинить
> другий, а `translatePgError` перетворить код `23505` на `409`, а не `500`.
> У [лекції 13, §13](../../lectures/13-rest-api-postgresql.md) та сама ідея
> (розбір `error.code`) записана в сервісі — тут вона централізована, щоб не
> повторювати її в кожному методі. Відмінність: `23503` ми перетворюємо на
> `409`, а не на `400`, — у нашому API цей код виникає, коли видаляють
> виконавця, у якого ще є альбоми (`ON DELETE RESTRICT`), тобто це конфлікт
> стану, а не помилка в даних запиту.

> 🤔 **Чому транзакція в репозиторії, а не в сервісі.** У
> [лекції 12, §7.2](../../lectures/12-express-middleware-architecture.md)
> транзакції — відповідальність сервісу. Тут «альбом + його жанри» — один
> агрегат, який зберігає один виклик репозиторію, тому транзакція не виходить
> за його межі. Коли бізнес-операція зачіпає **кілька** репозиторіїв
> (наприклад, створити замовлення й зменшити залишок товару), `withTransaction`
> викликає сервіс і передає `client` у кожен репозиторій.

### ✅ Контрольна точка 16

1. Сервер перезапустився без помилок.
2. Виконайте **весь** `requests.http` (**Run All Requests in File**).
   Результати — **ті самі**, що й у кроці 11: та сама кількість, ті самі
   коди, ті самі повідомлення; змінилися лише UUID.
3. Створіть альбом (`POST`), перезапустіть сервер і зробіть `GET` за тим
   самим `id` — альбом **на місці**.
4. Перевірте, що сервіси не змінилися. Якщо ви закомітили проєкт наприкінці
   кроку 11 (`git init && git add . && git commit -m "Частина 2: API в пам'яті"`),
   ця команда нічого не виведе:

```bash
git diff --stat src/services src/controllers src/validators src/mappers
```

> 🎤 **На лекції.** Це кульмінація: сховище змінилося з масивів на
> PostgreSQL, а **сервіси, контролери, маршрути й валідатори не змінилися
> жодним рядком**. Саме для цього потрібні шари
> ([лекція 12, §7.5](../../lectures/12-express-middleware-architecture.md)).
> Увімкніть `LOG_SQL=true` у `.env` і покажіть, скільки SQL-запитів
> породжує один виклик API: `GET /albums` — два (сторінка + кількість),
> `POST /albums` — запити перевірок сервісу, а потім `INSERT` у транзакції
> (`client.query` у логах не друкується — пишемо лише `pool.query`).

---

## 17. Експерименти з базою

> Лекція 13: [§13](../../lectures/13-rest-api-postgresql.md),
> [§16](../../lectures/13-rest-api-postgresql.md),
> [§17](../../lectures/13-rest-api-postgresql.md),
> [§19 Типові помилки](../../lectures/13-rest-api-postgresql.md)

Кожен експеримент — навмисна помилка з лекції, яку видно наживо. **Після
кожного поверніть код** і переконайтеся, що сервер знову працює.

Перед початком поверніть базу до демо-набору (альбоми, створені в
контрольній точці 16, змінили б числа нижче):

```bash
npm run seed
```

### 🧪 17.1. SQL-ін'єкція

У `albums.repository.js` у функції `buildFilters` замініть рядок із
`filters.search` на «наївний» варіант — значення вклеєно в текст SQL:

```js
// ❌ ЕКСПЕРИМЕНТ: значення в тексті SQL
if (filters.search) conditions.push(`(a.title ILIKE '%${filters.search}%' OR ar.name ILIKE '%${filters.search}%')`);
```

Виконайте три запити:

```bash
curl "http://localhost:3000/api/v1/albums?search=zzz&limit=1"
curl -G "http://localhost:3000/api/v1/albums" --data-urlencode "search=zzz' OR '%'='" --data-urlencode "limit=1"
curl -G "http://localhost:3000/api/v1/albums" --data-urlencode "search=пам'ять"
```

| Запит | Результат |
|---|---|
| `search=zzz` | `"total": 0` — як і має бути |
| `search=zzz' OR '%'='` | `"total": 25` — **усі** альбоми: умова перетворилася на `a.title ILIKE '%zzz' OR '%'='%'`, а це завжди істина |
| `search=пам'ять` | `500`, у консолі `syntax error at or near "ять"` — **звичайний український апостроф** ламає запит |

> 🎤 **На лекції.** Апостроф — найкращий аргумент для україномовної
> аудиторії: ін'єкція — це не лише «хакери», а й «Пам'ять», «В'язанка» чи
> «О'Коннор» у пошуку, які ламають запит (`500`). З `OR '%'='` так само можна
> дописати `UNION SELECT …` і читати інші таблиці. Поверніть параметризований
> рядок — і всі три запити працюють коректно (`0`, `0`, `0` результатів).

### 🧪 17.2. Назва стовпця параметром

У `findAll` замініть `params.push(limit, offset);` і рядки з `ORDER BY` /
`LIMIT` на:

```js
params.push(column, limit, offset); // ❌ ЕКСПЕРИМЕНТ: назва стовпця параметром
// …
      ORDER BY $${params.length - 2} ${direction} NULLS LAST, a.id
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
```

```bash
curl "http://localhost:3000/api/v1/albums?sort=title&limit=4"
curl "http://localhost:3000/api/v1/albums?sort=releaseDate&limit=4"
```

**Результат:** помилки **немає**, але обидва запити повертають однаковий
порядок, і він не за назвою й не за датою. `$1` став рядком-константою
`'a.title'` — однаковим для всіх рядків, тож працює лише запасне `, a.id`.
Найпідступніший варіант помилки: тести «відповідь 200» пройдуть.

### 🧪 17.3. Проблема N+1

Увімкніть у `.env` `LOG_SQL=true`. Тимчасово замініть `findAll` в
`albums.repository.js` на версію «запит у циклі»:

```js
export async function findAll({ filters, sort, order, limit, offset }) {
  const { where, params } = buildFilters(filters);
  const column = SORT_COLUMNS[sort] ?? 'a.title';
  const direction = order === 'desc' ? 'DESC' : 'ASC';
  params.push(limit, offset);

  // ❌ ЕКСПЕРИМЕНТ N+1: 1 запит за альбомами…
  const { rows } = await pool.query(
    `SELECT a.*, ar.name AS artist_name
       FROM albums a
       JOIN artists ar ON ar.id = a.artist_id
      ${where}
      ORDER BY ${column} ${direction} NULLS LAST, a.id
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  );
  // …і ще по одному запиту за жанрами для КОЖНОГО альбому
  for (const album of rows) {
    const { rows: genres } = await pool.query(
      `SELECT g.id, g.name FROM genres g
         JOIN album_genres ag ON ag.genre_id = g.id
        WHERE ag.album_id = $1 ORDER BY g.name`,
      [album.id],
    );
    album.genres = genres;
  }
  return rows;
}
```

```bash
curl -s "http://localhost:3000/api/v1/albums?limit=5" > /dev/null
```

**Результат у консолі сервера:** один `SELECT a.*…`, один `SELECT COUNT…` і
**п'ять** однакових `SELECT g.id, g.name … WHERE ag.album_id = $1`. Для
`limit=20` їх буде 20, для `limit=100` — 100. Відповідь та сама, що й з
`json_agg`, тому проблему видно лише в логах.

> 🎤 **На лекції.** Ознака N+1 — `await` із запитом до бази **всередині
> циклу**. Розв'язки з [§17](../../lectures/13-rest-api-postgresql.md):
> `JOIN` (наш `json_agg`) або другий запит `WHERE album_id = ANY($1)` за
> всіма id одразу. Поверніть остаточну версію `findAll`, `LOG_SQL=false`.

### 🧪 17.4. Забутий `release()`

У `src/db/pool.js` у `withTransaction` закоментуйте `client.release();`.
Візьміть `id` будь-якого альбому й 11 разів виконайте `PATCH`:

```bash
ID=$(curl -s "http://localhost:3000/api/v1/albums?limit=1" | node -e "process.stdin.on('data', (d) => console.log(JSON.parse(d).data[0].id))")
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "$i: %{http_code} %{time_total}s\n" -X PATCH "http://localhost:3000/api/v1/albums/$ID" \
    -H "Content-Type: application/json" -d '{"rating":4}'
done
curl -s -o /dev/null -w "health: %{http_code} %{time_total}s\n" http://localhost:3000/api/v1/health
```

```
1: 204 0.019s
…
10: 204 0.014s
11: 500 5.003s
health: 503 5.006s
```

Кожен `PATCH` «забирає» з пулу одне з'єднання назавжди. Після 10 запитів
(`max: 10`) пул порожній: **будь-який** запит — навіть `GET /genres` чи
`/health` — чекає 5 секунд і отримує `timeout exceeded when trying to
connect`. Сервер «живий», але не працює.

Поверніть `release()` і збережіть файл. Зверніть увагу на консоль:

```
Отримано SIGTERM, завершуємо роботу…
Не вдалося завершити коректно, вихід примусово
```

`pool.end()` чекає, доки всі з'єднання повернуться в пул, — а вони не
повернуться ніколи. Через 10 секунд спрацьовує запасний таймер із
`shutdown`. «Загублені» з'єднання звільняє лише перезапуск процесу.

### 🧪 17.5. Дата, що «з'їжджає» на день

У `src/db/pool.js` закоментуйте рядок `types.setTypeParser(1082, …)`.

```bash
curl -G "http://localhost:3000/api/v1/albums" --data-urlencode "search=Гірська"
```

**Результат:** `"releaseDate": "2014-04-17T21:00:00.000Z"` замість
`"2014-04-18"`. Драйвер перетворив `DATE` на `Date` **опівночі за місцевим
часом** (Київ, UTC+3 влітку), а JSON записує момент в UTC — попередній день,
21:00. Клієнт, який бере перші 10 символів рядка (`slice(0, 10)`), чи
браузер у часовому поясі західніше за Київ покаже **17 квітня**; ламаються й
порівняння та групування за датою.

> Якщо часовий пояс вашого комп'ютера — UTC, зсуву не буде. Зупиніть
> `npm run dev` (`Ctrl+C`) і запустіть сервер так: `TZ=Europe/Kyiv npm run dev`.

Поверніть рядок.

### 🧪 17.6. `COUNT` без `::int`

У функції `count` приберіть `::int` у `COUNT(*)::int`.

```bash
curl -s -G "http://localhost:3000/api/v1/albums" --data-urlencode "search=Гірська"
```

**Результат:** `"total": "1"` — **рядок**. На фронтенді `total / limit`
ще спрацює (JavaScript перетворить рядок), а `total + 1` дасть `"11"`.
Поверніть `::int`.

### 🧪 17.7. Дві лінії оборони

**(а) Некоректний UUID.** У `albums.routes.js` приберіть `validId` з
маршруту `GET /:id`, а в `albums.controller.js` у `getById` тимчасово
візьміть `req.params.id` замість `req.validatedParams.id`.

```bash
curl -i http://localhost:3000/api/v1/albums/abc
```

Валідатор уже не зупиняє запит — і до бази доходить `WHERE a.id = 'abc'`.
PostgreSQL відповідає кодом `22P02` (`invalid input syntax for type uuid`),
а `translatePgError` перетворює його на `400` «Некоректний формат значення».
Тепер у `errorHandler.js` замініть `translatePgError(rawError)` просто на
`rawError` — і отримаєте `500`. Поверніть усе.

**(б) Обмеження `UNIQUE`.** У `albums.service.js` у `create` закоментуйте
`await ensureTitleIsFree(data.title);` і створіть альбом з наявною назвою:

```bash
curl -i -X POST http://localhost:3000/api/v1/albums -H "Content-Type: application/json" \
  -d '{"title":"Полонина","artistId":1,"releaseDate":"2020-01-01","trackCount":3,"format":"cd"}'
```

Перевірку сервісу пропущено, але `409` усе одно повертається —
`Запис із таким значенням уже існує`: спрацювало обмеження бази (код
`23505`). Повідомлення менш дружнє, ніж у сервісу, але дані залишилися
цілими. Поверніть перевірку.

> 🎤 **На лекції.** Валідація в застосунку — для **користувача** (зрозумілі
> повідомлення), обмеження в базі — для **цілісності даних** (захист від
> помилок у коді й одночасних запитів). Потрібні обидві
> ([лекція 13, §9.2](../../lectures/13-rest-api-postgresql.md)).

---

# Підсумок

## 18. Що де лежить: карта проєкту й лекцій

| Тема лекції | Де в проєкті | Крок |
|---|---|---|
| **Лекція 11** | | |
| ESM, `package.json`, `engines`, `.nvmrc` (§1.2, §4, §5) | `package.json`, `.nvmrc` | 1 |
| Цикл подій, мікрозадачі (§2) | `examples/event-loop-order.js`, `.cjs` | 2 |
| Блокуючі операції (§3) | `/api/slow` у `examples/node-http-server.js` | 3 |
| Потоки, HTTP без фреймворку (§7, §8) | `examples/node-http-server.js` | 3 |
| Змінні середовища, `--env-file`, перевірка при старті (§9) | `.env.example`, `src/config/index.js` | 4, 12 |
| Коректне завершення (§10.2) | `src/server.js` | 5, 14 |
| `--watch`, `node:test` (§11) | `npm run dev`, `tests/` | 5, 8 |
| **Лекція 12** | | |
| `app.js` / `server.js` (§1) | `src/app.js`, `src/server.js` | 5 |
| Маршрути, `req`, `res`, порядок маршрутів (§2, §3) | `src/routes/*.js` | 5, 11 |
| Власні middleware, `next()`, порядок (§4) | `src/middlewares/requestId.js`, `requestLogger.js` | 6 |
| Middleware-фабрики (§4.5) | `validate(validator, source)` | 8 |
| Router, `/api/v1` (§5) | `src/routes/index.js` | 11 |
| Класи помилок, централізований обробник, async-помилки (§6) | `src/errors/`, `src/middlewares/errorHandler.js` | 7 |
| Шари: репозиторій, сервіс, контролер, мапер (§7) | `src/repositories/`, `services/`, `controllers/`, `mappers/` | 9–11 |
| `helmet`, `cors`, `express.json({ limit })` (§9) | `src/app.js` | 6 |
| **Лекція 13** | | |
| Коди станів, `PUT` проти `PATCH` (§3) | контролери, `album.validators.js` | 8, 11 |
| Пагінація, фільтри, сортування, запобіжники (§4) | `validateAlbumListQuery`, `buildFilters` | 8, 16 |
| Формат відповіді й помилок (§5) | `errorHandler.js`, `albums.service.js` | 7, 10 |
| Docker (§8) | `docker-compose.yml` | 12 |
| Схема, типи, обмеження, `updated_at` (§9) | міграція | 13 |
| Зв'язки, `ON DELETE`, `JOIN` (§10) | міграція, `SELECT_ALBUMS` | 13, 16 |
| Міграції (§11) | `src/db/migrations/` | 13 |
| Пул (§12) | `src/db/pool.js` | 14 |
| Параметризовані запити, білий список, коди помилок (§13) | `albums.repository.js`, `pgErrors.js` | 16, 17 |
| Динамічні запити (§14) | `buildFilters` | 16 |
| Індекси (§15) | `createIndex` у міграції | 13 |
| Транзакції (§16) | `withTransaction`, `create`, `update`, `seed.js` | 14–16 |
| N+1 (§17) | `json_agg` у `SELECT_ALBUMS` | 16, 17 |
| Seed-дані (§18) | `scripts/seed.js` | 15 |

**Що буде далі:** у [лекції 14](../../lectures/14-auth-security.md)
додамо реєстрацію, вхід, `authenticate` для `POST`/`PUT`/`PATCH`/`DELETE`
і `requireRole('ADMIN')` для `DELETE`; у
[лекції 15](../../lectures/15-nodejs-quality-testing-openapi.md) — Zod
замість ручних валідаторів, інтеграційні тести через `supertest` і
документацію OpenAPI; у [лекції 16](../../lectures/16-integration-deployment.md) —
з'єднаємо React-клієнт з API (наприклад, «Фонотеку» з Завдання №3 замість
`localStorage`) і розгорнемо обидві частини.

---

## 19. Питання для обговорення

1. Чому `/api/slow` блокує **всіх** користувачів, а запит до бази, що
   виконується 5 секунд, — ні? *(Синхронний цикл займає єдиний потік;
   очікування відповіді бази — це асинхронне I/O, потік вільний.)*
2. Що станеться, якщо `errorHandler` під'єднати **перед** маршрутами?
   *(Він ніколи не отримає помилок із маршрутів: middleware виконуються в
   порядку оголошення, а помилка йде лише до обробників, оголошених
   **після** місця, де її кинули.)*
3. Чому контролер повертає `204`, а не оновлений альбом, після `PATCH`?
   *(Так домовлено в API курсу — клієнт знає, що надіслав. Повертати `200` з
   оновленим ресурсом — теж поширений і коректний варіант; головне —
   однаково для всього API.)*
4. Чому `NotFoundError` для `/albums/<неіснуючий uuid>`, але
   `ValidationError` для `"artistId": 99` у тілі? *(404 — про ресурс за
   адресою запиту; неіснуючий виконавець — помилка в даних запиту.)*
5. Валідатор уже перевіряє `sort` — навіщо ще й `SORT_COLUMNS` у
   репозиторії? *(Глибокий захист: репозиторій не повинен покладатися на те,
   що його викличуть лише з перевіреними даними. Скрипт, тест чи інший сервіс
   можуть викликати його напряму.)*
6. Чому в транзакції `findById` викликається з `client`, а не з `pool`?
   *(Інше з'єднання не бачить незафіксованих змін — повернули б старі дані.)*
7. Що зламається, якщо видалити альбом, а `album_genres` не має
   `ON DELETE CASCADE`? *(DELETE відхилиться з кодом 23503: на альбом ще
   посилаються рядки зв'язувальної таблиці.)*
8. Чому `TRUNCATE … RESTART IDENTITY` у seed, а не `DELETE FROM`?
   *(`TRUNCATE` швидший і скидає лічильники `id` до 1 — демо-дані щоразу
   отримують ті самі `id` виконавців і жанрів.)*

---

## 20. Корисні посилання

- [Node.js: документація API](https://nodejs.org/api/) ·
  [`--watch`](https://nodejs.org/api/cli.html#--watch) ·
  [`--env-file`](https://nodejs.org/api/cli.html#--env-filefile) ·
  [`node:test`](https://nodejs.org/api/test.html)
- [Express 5: посібник](https://expressjs.com/en/guide/routing.html) ·
  [обробка помилок](https://expressjs.com/en/guide/error-handling.html) ·
  [міграція з 4 на 5](https://expressjs.com/en/guide/migrating-5.html)
- [helmet](https://helmetjs.github.io/) · [cors](https://github.com/expressjs/cors)
- [node-postgres (`pg`)](https://node-postgres.com/) ·
  [пул](https://node-postgres.com/apis/pool) ·
  [транзакції](https://node-postgres.com/features/transactions) ·
  [типи даних](https://node-postgres.com/features/types)
- [node-pg-migrate](https://salsita.github.io/node-pg-migrate/)
- [PostgreSQL 18: документація](https://www.postgresql.org/docs/18/) ·
  [коди помилок](https://www.postgresql.org/docs/18/errcodes-appendix.html) ·
  [Don't Do This](https://wiki.postgresql.org/wiki/Don%27t_Do_This)
- [Образ `postgres` на Docker Hub](https://hub.docker.com/_/postgres)
- [HTTP Client у WebStorm](https://www.jetbrains.com/help/webstorm/http-client-in-product-code-editor.html)
