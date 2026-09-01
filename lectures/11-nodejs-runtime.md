# Лекція 11. Node.js: середовище виконання та екосистема

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №4 «RESTful web service на Node.js + PostgreSQL»
> **Попередня лекція:** [Лекція 10](10-react-api-architecture.md)

---

## Про що ця лекція

Досі весь наш JavaScript виконувався у браузері. Тепер він переїжджає на
**сервер**. Node.js — це те саме середовище виконання, що й у Chrome (двигун
V8), але з іншим набором можливостей: замість DOM і `fetch` — файлова система,
мережеві сокети, процеси.

Це перша з п'яти лекцій про серверну частину. Тут ми розберемо **саме
середовище**: як воно влаштоване, чому однопотокове, як працюють модулі й
npm, і напишемо HTTP-сервер без жодного фреймворку — щоб у наступній лекції
зрозуміти, що саме Express робить за нас.

---

## Зміст

1. [Що таке Node.js](#1-що-таке-nodejs)
2. [Цикл подій на сервері](#2-цикл-подій-на-сервері)
3. [Блокуючі операції](#3-блокуючі-операції)
4. [Модулі: ESM і CommonJS](#4-модулі-esm-і-commonjs)
5. [npm і `package.json`](#5-npm-і-packagejson)
6. [Вбудовані модулі](#6-вбудовані-модулі)
7. [Потоки](#7-потоки)
8. [HTTP-сервер без фреймворку](#8-http-сервер-без-фреймворку)
9. [Конфігурація та змінні середовища](#9-конфігурація-та-змінні-середовища)
10. [Асинхронність і помилки на сервері](#10-асинхронність-і-помилки-на-сервері)
11. [Інструменти розробки](#11-інструменти-розробки)
12. [Типові помилки](#12-типові-помилки)
13. [Контрольні запитання](#13-контрольні-запитання)
14. [Практичні вправи](#14-практичні-вправи)
15. [Корисні посилання](#15-корисні-посилання)
16. [Література](#16-література)
17. [Глосарій](#17-глосарій)

---

## 1. Що таке Node.js

**Node.js** — середовище виконання JavaScript поза браузером, побудоване на
двигуні **V8** (той самий, що в Chrome) і бібліотеці **libuv** (асинхронне
введення-виведення).

```
┌─────────────────────────────────────────┐
│           Ваш JavaScript-код            │
├─────────────────────────────────────────┤
│    Стандартна бібліотека Node.js        │
│    (fs, http, path, crypto, stream…)    │
├──────────────────┬──────────────────────┤
│       V8         │        libuv         │
│  (виконання JS)  │  (event loop, пул    │
│                  │   потоків, I/O)      │
├──────────────────┴──────────────────────┤
│           Операційна система            │
└─────────────────────────────────────────┘
```

### 1.1. Чим відрізняється від браузера

| | Браузер | Node.js |
|---|---|---|
| Глобальний об'єкт | `window` | `globalThis`, `global` |
| DOM | є | немає |
| Файлова система | немає (крім File API) | повний доступ (`fs`) |
| Мережа | `fetch`, обмежений CORS | `http`, `net`, `fetch` без CORS |
| Модулі | ESM | ESM і CommonJS |
| Пісочниця | сувора | немає — доступ до всієї системи |

🔑 CORS у Node.js **не діє**: це механізм браузера. Сервер може звертатися
куди завгодно.

### 1.2. Версії

Node.js має чіткий графік випусків: парні мажорні версії стають LTS
(Long Term Support) і підтримуються ~30 місяців.

Станом на 2026 рік: **Node.js 24 (Krypton)** і **22 (Jod)** — Active LTS,
20 — Maintenance, 26 — Current.

🔑 **Для навчальних і бойових проєктів беріть Active LTS** (зараз — 24).
Версію проєкту фіксують у `package.json`:

```json
{ "engines": { "node": ">=22" } }
```

і у файлі `.nvmrc`:

```
24
```

Перемикатися між версіями зручно через **nvm** (`nvm install 24`,
`nvm use`), **fnm** або **Volta**.

---

## 2. Цикл подій на сервері

Node.js — **однопотоковий** для вашого коду. Один потік обробляє **всі**
запити всіх користувачів. Це звучить як обмеження, але для веб-серверів
працює чудово: типовий сервер більшість часу **чекає** — на базу даних, на
диск, на іншу службу. Поки він чекає, потік вільний для інших запитів.

### 2.1. Фази циклу

```
   ┌───────────────────────────┐
┌─►│         timers            │  setTimeout, setInterval
│  ├───────────────────────────┤
│  │    pending callbacks      │  відкладені системні колбеки
│  ├───────────────────────────┤
│  │      idle, prepare        │  внутрішні
│  ├───────────────────────────┤     ┌─────────────────┐
│  │          poll             │◄────┤  вхідні події   │
│  ├───────────────────────────┤     │  (I/O)          │
│  │          check            │  setImmediate
│  ├───────────────────────────┤
│  │     close callbacks       │  socket.on('close')
│  └─────────────┬─────────────┘
└────────────────┘

Між КОЖНИМИ фазами виконуються всі мікрозадачі:
process.nextTick() → черга промісів
```

### 2.2. Порядок виконання

```js
console.log('1: синхронно');

setTimeout(() => console.log('2: timers'), 0);
setImmediate(() => console.log('3: check'));

Promise.resolve().then(() => console.log('4: мікрозадача'));
process.nextTick(() => console.log('5: nextTick'));

console.log('6: синхронно');
```

Виведе: `1, 6, 5, 4` — далі `2` і `3` у порядку, що може відрізнятися між
запусками (на верхньому рівні модуля таймери й `setImmediate` не мають
гарантованого порядку; усередині циклу I/O `setImmediate` завжди раніший).

🔑 `process.nextTick` має **вищий пріоритет за проміси**. Зловживати ним не
варто: нескінченна черга `nextTick` заблокує цикл подій повністю.

### 2.3. Пул потоків

Хоча ваш код однопотоковий, libuv має **пул потоків** (за замовчуванням 4)
для операцій, які не можна зробити неблокуючими на рівні ОС:

- файлові операції (`fs`);
- DNS-резолв (`dns.lookup`);
- частина криптографічних функцій (`crypto.pbkdf2`, `scrypt`);
- стиснення (`zlib`).

Розмір пулу керується змінною `UV_THREADPOOL_SIZE`.

Мережеві операції (сокети) **не** використовують пул — вони справді
неблокуючі на рівні ОС.

---

## 3. Блокуючі операції

🔑 **Головний ризик Node.js: одна повільна синхронна операція зупиняє
обслуговування ВСІХ користувачів.**

```js
// ❌ Катастрофа: поки читається файл, сервер не відповідає нікому
import { readFileSync } from 'node:fs';
const data = readFileSync('./huge.json', 'utf8');

// ✅ Асинхронно: потік вільний
import { readFile } from 'node:fs/promises';
const data = await readFile('./huge.json', 'utf8');
```

```js
// ❌ Важке обчислення блокує все на 2 секунди
function hashPassword(password) {
  return crypto.pbkdf2Sync(password, salt, 1_000_000, 64, 'sha512');
}

// ✅ Асинхронна версія використовує пул потоків
const hash = await promisify(crypto.pbkdf2)(password, salt, 1_000_000, 64, 'sha512');
```

**Синхронні операції прийнятні лише** під час запуску застосунку (читання
конфігурації, завантаження сертифікатів) — коли сервер ще нікого не обслуговує.

### Важкі обчислення

Якщо потрібно обробити велике зображення, порахувати щось складне чи
розібрати гігантський файл — виносьте це з головного потоку:

```js
// worker.js
import { parentPort, workerData } from 'node:worker_threads';
const result = heavyComputation(workerData);
parentPort.postMessage(result);
```

```js
// main.js
import { Worker } from 'node:worker_threads';

function runInWorker(data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', { workerData: data });
    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`Worker завершився з кодом ${code}`));
    });
  });
}
```

📚 Альтернативи: черга задач (BullMQ + Redis), окремий мікросервіс, або просто
інша мова для цієї частини системи.

---

## 4. Модулі: ESM і CommonJS

Node.js історично мав власну систему модулів — **CommonJS**. Пізніше з'явилася
стандартна — **ES-модулі**. Обидві працюють, але писати новий код треба на ESM.

### 4.1. Порівняння

```js
// CommonJS (старий)
const express = require('express');
const { readFile } = require('fs/promises');

module.exports = { myFunction };
module.exports.other = other;
```

```js
// ES Modules (сучасний)
import express from 'express';
import { readFile } from 'node:fs/promises';

export { myFunction };
export default class Server { }
```

| | CommonJS | ESM |
|---|---|---|
| Завантаження | синхронне | асинхронне |
| `require` в умові | можна | ні (є `await import()`) |
| Статичний аналіз | обмежений | повний (tree-shaking) |
| `__dirname`, `__filename` | є | немає (див. нижче) |
| `await` на верхньому рівні | ні | **так** |
| Розширення в імпорті | необов'язкове | **обов'язкове** |

### 4.2. Як увімкнути ESM

```json
// package.json
{
  "type": "module"
}
```

Після цього всі `.js` файли трактуються як ES-модулі. (Файли `.cjs` лишаються
CommonJS, `.mjs` — завжди ESM.)

### 4.3. Заміна `__dirname`

```js
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Або коротше в сучасних версіях:
const dir = import.meta.dirname;
const file = import.meta.filename;
```

### 4.4. Префікс `node:`

```js
import { readFile } from 'node:fs/promises';   // ✅ явно вбудований модуль
import { readFile } from 'fs/promises';        // працює, але гірше
```

Префікс `node:` робить очевидним, що це вбудований модуль, і захищає від
підміни пакетом із таким самим іменем із npm.

### 4.5. Динамічний імпорт

```js
if (process.env.NODE_ENV === 'development') {
  const { setupDevTools } = await import('./dev-tools.js');
  setupDevTools(app);
}
```

---

## 5. npm і `package.json`

### 5.1. Ініціалізація

```bash
npm init -y
npm install express pg dotenv
npm install --save-dev nodemon eslint prettier
```

### 5.2. Анатомія `package.json`

```json
{
  "name": "movies-api",
  "version": "1.0.0",
  "description": "RESTful web service для каталогу фільмів",
  "type": "module",
  "main": "src/server.js",
  "engines": { "node": ">=22" },
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch --env-file=.env src/server.js",
    "lint": "eslint src",
    "format": "prettier --write .",
    "migrate": "node-pg-migrate up",
    "seed": "node scripts/seed.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^5.2.1",
    "pg": "^8.13.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "eslint": "^9.17.0",
    "prettier": "^3.4.0"
  }
}
```

🔑 **`dependencies` проти `devDependencies`.** Перші потрібні для роботи
застосунку в продакшені, другі — лише для розробки (лінтери, тестові
фреймворки, збірники). На сервері встановлюють лише перші
(`npm ci --omit=dev`), що зменшує розмір і поверхню атаки.

### 5.3. Семантичне версіонування

```
    МАЖОРНА . МІНОРНА . ПАТЧ
       │        │        └── виправлення, сумісні
       │        └─────────── нові можливості, сумісні
       └──────────────────── несумісні зміни
```

| Запис | Що дозволяє оновити |
|---|---|
| `^5.2.1` | до `<6.0.0` — мінорні й патчі (за замовчуванням) |
| `~5.2.1` | до `<5.3.0` — лише патчі |
| `5.2.1` | нічого, точна версія |
| `*` | будь-що ⚠️ ніколи так не робіть |

### 5.4. `package-lock.json`

Фіксує **точні** версії всього дерева залежностей.

🔑 **Обов'язково комітьте `package-lock.json` у git.** Без нього різні
розробники (і продакшен) отримають різні версії, і з'явиться класичне «у мене
працює».

```bash
npm install   # може оновити lock-файл
npm ci        # ✅ встановлює СУВОРО за lock-файлом; для CI та продакшену
```

### 5.5. Безпека залежностей

```bash
npm audit                # перевірити відомі вразливості
npm audit fix            # виправити автоматично
npm outdated             # які пакети застаріли
npm ls express           # звідки прийшла залежність
```

⚠️ **Обережно з залежностями.** Кожен пакет — це чужий код із повними правами
у вашому процесі. Перед встановленням подивіться: скільки завантажень, коли
останнє оновлення, скільки в нього власних залежностей, чи є відкриті
проблеми безпеки. Дрібні утиліти на кшталт «перевірити, чи парне число» краще
написати самому.

### 5.6. `npx`

```bash
npx eslint src           # запустити локально встановлений пакет
npx create-vite@latest   # запустити без встановлення
```

---

## 6. Вбудовані модулі

### 6.1. `node:fs` — файлова система

```js
import { readFile, writeFile, mkdir, readdir, stat, rm } from 'node:fs/promises';

const text = await readFile('./data.json', 'utf8');
const data = JSON.parse(text);

await writeFile('./out.json', JSON.stringify(data, null, 2), 'utf8');
await mkdir('./uploads', { recursive: true });

const files = await readdir('./uploads');
const info = await stat('./uploads/photo.jpg');
console.log(info.size, info.isDirectory());

await rm('./tmp', { recursive: true, force: true });
```

🔑 Завжди імпортуйте з `node:fs/promises` — це проміс-версія. Модуль
`node:fs` дає колбек-API, а `readFileSync` блокує потік.

### 6.2. `node:path` — робота зі шляхами

```js
import path from 'node:path';

path.join('src', 'api', 'users.js');        // 'src/api/users.js'
path.resolve('./data');                     // абсолютний шлях
path.extname('photo.jpeg');                 // '.jpeg'
path.basename('/a/b/photo.jpeg');           // 'photo.jpeg'
path.basename('/a/b/photo.jpeg', '.jpeg');  // 'photo'
path.dirname('/a/b/photo.jpeg');            // '/a/b'
path.parse('/a/b/photo.jpeg');              // { root, dir, base, ext, name }
```

⚠️ **Ніколи не склеюйте шляхи через `+` і `'/'`** — на Windows роздільник
інший, і код зламається. Завжди `path.join`.

⚠️ **Загроза обходу шляху (path traversal):**

```js
// ❌ Користувач передасть '../../etc/passwd' і прочитає що завгодно
const filePath = path.join(UPLOADS_DIR, req.params.filename);

// ✅ Перевіряємо, що результат лишився всередині дозволеної теки
const filePath = path.resolve(UPLOADS_DIR, req.params.filename);
if (!filePath.startsWith(path.resolve(UPLOADS_DIR) + path.sep)) {
  throw new Error('Неприпустимий шлях');
}
```

### 6.3. `node:crypto`

```js
import crypto from 'node:crypto';

crypto.randomUUID();                           // 'f47ac10b-58cc-…'
crypto.randomBytes(32).toString('hex');        // секретний ключ
crypto.createHash('sha256').update(text).digest('hex');

// Порівняння секретів БЕЗ витоку через час виконання
crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
```

⚠️ Для **паролів** ці функції не годяться — потрібні `bcrypt` або `argon2`
(лекція 14).

### 6.4. `node:events`

```js
import { EventEmitter } from 'node:events';

class JobQueue extends EventEmitter {
  add(job) {
    this.emit('job:added', job);
  }
}

const queue = new JobQueue();
queue.on('job:added', job => console.log('Нова задача:', job.id));
queue.once('job:added', job => console.log('Тільки перший раз'));
```

Багато вбудованих об'єктів Node.js (сервер, потоки, сокети) — це
`EventEmitter`.

### 6.5. `node:url`

```js
const url = new URL('https://example.com/api/movies?page=2');
url.pathname;                   // '/api/movies'
url.searchParams.get('page');   // '2'
```

### 6.6. Інші корисні

```js
import os from 'node:os';
os.cpus().length;               // кількість ядер
os.freemem();
os.platform();                  // 'darwin' | 'linux' | 'win32'

process.env.NODE_ENV;
process.argv;                   // аргументи командного рядка
process.exit(1);
process.memoryUsage();
process.uptime();
```

---

## 7. Потоки

**Потік (stream)** дозволяє обробляти дані **частинами**, не завантажуючи все
в пам'ять.

```js
// ❌ Файл на 2 ГБ повністю в пам'яті → процес «падає»
const data = await readFile('huge.csv');

// ✅ Обробка порціями, пам'ять стала
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

await pipeline(
  createReadStream('huge.csv'),
  createGzip(),
  createWriteStream('huge.csv.gz')
);
```

Чотири типи потоків: **Readable** (читання), **Writable** (запис),
**Duplex** (обидва), **Transform** (перетворення на льоту, як `createGzip`).

🔑 `pipeline` із `node:stream/promises` кращий за `.pipe()`: він коректно
обробляє помилки й закриває всі потоки.

У Завданні №4 потоки не потрібні, але знати про них варто: HTTP-запит і
відповідь у Node.js — теж потоки.

---

## 8. HTTP-сервер без фреймворку

Напишемо REST-сервер «руками». Це не для продакшену — це щоб зрозуміти, що
саме робить Express у наступній лекції.

```js
// server.js
import http from 'node:http';
import { URL } from 'node:url';

const PORT = process.env.PORT ?? 3000;

// Тимчасове «сховище» в пам'яті
let movies = [
  { id: '1', title: 'Тіні забутих предків', year: 1965 },
  { id: '2', title: 'Земля', year: 1930 },
];

const json = (res, status, data) => {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
};

const readBody = (req) => new Promise((resolve, reject) => {
  const chunks = [];
  let size = 0;

  req.on('data', chunk => {
    size += chunk.length;
    if (size > 1_000_000) {                  // захист від величезного тіла
      reject(new Error('Payload too large'));
      req.destroy();
      return;
    }
    chunks.push(chunk);
  });

  req.on('end', () => {
    const raw = Buffer.concat(chunks).toString('utf8');
    if (!raw) return resolve(null);
    try { resolve(JSON.parse(raw)); }
    catch { reject(new Error('Invalid JSON')); }
  });

  req.on('error', reject);
});

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  try {
    // GET /api/movies?search=…
    if (req.method === 'GET' && pathname === '/api/movies') {
      const search = url.searchParams.get('search')?.toLowerCase();
      const result = search
        ? movies.filter(m => m.title.toLowerCase().includes(search))
        : movies;
      return json(res, 200, { data: result, total: result.length });
    }

    // GET /api/movies/:id
    const match = pathname.match(/^\/api\/movies\/([\w-]+)$/);
    if (req.method === 'GET' && match) {
      const movie = movies.find(m => m.id === match[1]);
      if (!movie) return json(res, 404, { message: 'Фільм не знайдено' });
      return json(res, 200, movie);
    }

    // POST /api/movies
    if (req.method === 'POST' && pathname === '/api/movies') {
      const body = await readBody(req);

      if (!body?.title?.trim()) {
        return json(res, 400, { message: 'Поле title обов\'язкове' });
      }
      if (movies.some(m => m.title.toLowerCase() === body.title.toLowerCase())) {
        return json(res, 409, { message: 'Фільм із такою назвою вже існує' });
      }

      const movie = { id: crypto.randomUUID(), title: body.title.trim(), year: body.year ?? null };
      movies.push(movie);

      res.setHeader('Location', `/api/movies/${movie.id}`);
      return json(res, 201, movie);
    }

    // DELETE /api/movies/:id
    if (req.method === 'DELETE' && match) {
      const index = movies.findIndex(m => m.id === match[1]);
      if (index === -1) return json(res, 404, { message: 'Фільм не знайдено' });
      movies.splice(index, 1);
      res.writeHead(204);
      return res.end();
    }

    return json(res, 404, { message: 'Маршрут не знайдено' });
  } catch (error) {
    console.error(error);
    return json(res, 500, { message: 'Внутрішня помилка сервера' });
  }
});

server.listen(PORT, () => {
  console.log(`Сервер запущено: http://localhost:${PORT}`);
});
```

### Що тут погано (і що виправить Express)

| Проблема | Рішення в Express |
|---|---|
| Маршрутизація регулярними виразами | `app.get('/api/movies/:id', …)` |
| Ручне читання й розбір тіла | `express.json()` |
| Ручне встановлення заголовків | `res.status(200).json(data)` |
| Обробка помилок у кожному місці | централізований обробник |
| Немає повторного використання логіки | middleware |
| Немає роздачі статики, CORS, логування | готові middleware |

🔑 Це і є відповідь на питання «навіщо фреймворк»: не заради магії, а заради
того, щоб не писати цей код у кожному проєкті заново.

---

## 9. Конфігурація та змінні середовища

```js
// ❌ Ніколи так
const pool = new Pool({ password: 'my-secret-123' });

// ✅ З середовища
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
```

**Node.js 20.6+ читає `.env` вбудовано** — пакет `dotenv` уже не обов'язковий:

```bash
node --env-file=.env src/server.js
```

```
# .env  (у .gitignore!)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/movies
JWT_SECRET=довгий-випадковий-рядок
CORS_ORIGIN=http://localhost:5173
```

```
# .env.example  (у git — це шаблон без значень)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=
CORS_ORIGIN=http://localhost:5173
```

**Валідація конфігурації при старті** — дуже корисна практика: краще впасти
одразу з ясним повідомленням, ніж через годину роботи:

```js
// config/index.js
const required = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`✖ Відсутня обов'язкова змінна середовища: ${name}`);
    process.exit(1);
  }
  return value;
};

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
};
```

⚠️ **`.env` ніколи не потрапляє в git.** Додайте його в `.gitignore` **до
першого коміту**. Якщо секрет уже потрапив в історію — його треба вважати
скомпрометованим і замінити (видалення файлу не прибирає його з історії).

---

## 10. Асинхронність і помилки на сервері

### 10.1. Необроблені помилки «валять» процес

```js
process.on('uncaughtException', (error) => {
  console.error('Необроблений виняток:', error);
  process.exit(1);       // ⚠️ так, вийти — правильно
});

process.on('unhandledRejection', (reason) => {
  console.error('Необроблене відхилення проміса:', reason);
  process.exit(1);
});
```

🔑 Здається дивним «навмисно завершувати процес», але це правильна практика:
після невідомої помилки стан застосунку непередбачуваний. Менеджер процесів
(systemd, PM2, Docker, платформа хостингу) перезапустить сервер за секунду.
Продовжувати роботу в зламаному стані — гірше.

### 10.2. Коректне завершення

```js
const server = app.listen(config.port);

async function shutdown(signal) {
  console.log(`Отримано ${signal}, завершуємо роботу…`);

  server.close(async () => {          // припиняємо приймати нові з'єднання
    await pool.end();                 // закриваємо пул БД
    console.log('Завершено коректно');
    process.exit(0);
  });

  // Якщо за 10 секунд не завершилося — виходимо примусово
  setTimeout(() => {
    console.error('Не вдалося завершити коректно, вихід примусово');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

Без цього при перезапуску втрачаються запити, що виконуються, і не
закриваються з'єднання з базою.

### 10.3. `AsyncLocalStorage`

Дозволяє «протягнути» контекст (наприклад, ідентифікатор запиту) через увесь
асинхронний ланцюжок без передавання параметром:

```js
import { AsyncLocalStorage } from 'node:async_hooks';

export const requestContext = new AsyncLocalStorage();

// У middleware
app.use((req, res, next) => {
  requestContext.run({ requestId: crypto.randomUUID() }, next);
});

// Будь-де глибше
const { requestId } = requestContext.getStore() ?? {};
logger.info({ requestId }, 'Запит до бази');
```

Дуже зручно для наскрізного логування (лекція 15).

---

## 11. Інструменти розробки

### 11.1. Автоперезапуск

Node.js має вбудований режим спостереження:

```bash
node --watch src/server.js
node --watch --env-file=.env src/server.js
```

Пакет `nodemon` більше не обов'язковий.

### 11.2. Налагодження

```bash
node --inspect src/server.js
node --inspect-brk src/server.js     # зупинитися на першому рядку
```

Відкрийте `chrome://inspect` у Chrome — отримаєте повноцінний налагоджувач із
точками зупину. У VS Code достатньо натиснути F5 із конфігурацією Node.

### 11.3. Вбудований тестовий фреймворк

```js
// tests/format.test.js
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/utils/format.js';

describe('slugify', () => {
  test('перетворює українську назву на латиницю', () => {
    assert.equal(slugify('Тіні забутих предків'), 'tini-zabutykh-predkiv');
  });

  test('прибирає зайві символи', () => {
    assert.equal(slugify('  Привіт,  світ!  '), 'pryvit-svit');
  });
});
```

```bash
node --test
node --test --watch
node --test --experimental-test-coverage
```

Зовнішні фреймворки (Vitest, Jest) дають більше можливостей, але для простих
випадків вистачає вбудованого.

### 11.4. ESLint і Prettier

```bash
npm install -D eslint @eslint/js prettier
npx eslint --init
```

```js
// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
];
```

---

## 12. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | `readFileSync` під час обробки запиту | Сервер не відповідає нікому | `fs/promises` |
| 2 | Важкі обчислення в головному потоці | Блокування всіх користувачів | Worker threads, черга |
| 3 | Секрети в коді | Витік при публікації репозиторію | Змінні середовища |
| 4 | `.env` у git | Компрометація | `.gitignore` + `.env.example` |
| 5 | `package-lock.json` не в git | «У мене працює» | Комітити завжди |
| 6 | `npm install` у продакшені | Непередбачувані версії | `npm ci --omit=dev` |
| 7 | Забутий `node:` префікс | Ризик підміни пакетом | `import … from 'node:fs'` |
| 8 | Немає розширення в імпорті ESM | `ERR_MODULE_NOT_FOUND` | `'./utils.js'` |
| 9 | Склеювання шляхів через `+ '/'` | Ламається на Windows | `path.join` |
| 10 | Немає перевірки path traversal | Читання довільних файлів | Перевірка префікса |
| 11 | Немає обмеження розміру тіла запиту | Вичерпання пам'яті | Ліміт у 1 МБ |
| 12 | Немає обробки `unhandledRejection` | Тихі збої | Обробники + вихід |
| 13 | Немає коректного завершення | Втрачені запити при деплої | `SIGTERM` + `server.close` |
| 14 | Багато дрібних залежностей | Ризики безпеки, довгий `npm ci` | Мінімум залежностей |
| 15 | `"*"` як версія залежності | Раптові поломки | `^` або точна версія |

---

## 13. Контрольні запитання

1. З яких двох головних компонентів складається Node.js і за що кожен
   відповідає?
2. Назвіть чотири відмінності Node.js від браузерного середовища.
3. Чому однопотоковий сервер може обслуговувати тисячі одночасних з'єднань?
4. Що станеться, якщо в обробнику запиту виконати цикл на 3 секунди?
5. Для яких операцій використовується пул потоків libuv?
6. Що виведе код із розділу 2.2 і чому?
7. Назвіть п'ять відмінностей ESM від CommonJS.
8. Як отримати аналог `__dirname` в ES-модулі?
9. Навіщо префікс `node:` в іменах вбудованих модулів?
10. Чим `npm install` відрізняється від `npm ci`?
11. Що означає `^5.2.1` і чим відрізняється від `~5.2.1`?
12. Навіщо комітити `package-lock.json`?
13. Що таке path traversal і як від нього захиститися?
14. Чому при `uncaughtException` правильно завершити процес?
15. Навіщо потрібне коректне завершення (graceful shutdown)?
16. Чому потоки (streams) економлять пам'ять?

---

## 14. Практичні вправи

**Вправа 1 (середовище, 20 хв).** Встановіть Node.js LTS через nvm або fnm.
Створіть проєкт із `"type": "module"`, напишіть скрипт, що виводить версію
Node, кількість ядер і вільну пам'ять.

**Вправа 2 (цикл подій, 20 хв).** Напишіть код, що демонструє порядок:
синхронний → `process.nextTick` → проміс → `setTimeout` → `setImmediate`.
Поясніть результат.

**Вправа 3 (блокування, 25 хв).** Зробіть сервер із двома маршрутами:
`/fast` (відповідає одразу) і `/slow` (синхронний цикл на 5 секунд).
Відкрийте `/slow`, а потім у сусідній вкладці `/fast`. Опишіть, що сталося.
Перепишіть `/slow` на асинхронну версію й повторіть.

**Вправа 4 (файли, 30 хв).** Скрипт, що: читає всі `.json` із теки, об'єднує
їх у масив, сортує за полем `title` з `localeCompare(…, 'uk')`, записує в
`merged.json` із відступами. Обробіть відсутність теки й некоректний JSON.

**Вправа 5 (HTTP-сервер, 50 хв).** Реалізуйте сервер із розділу 8 самостійно,
додавши `PUT /api/movies/:id` та `GET /api/movies/count`. Перевірте всі
маршрути в Postman, зокрема негативні сценарії (400, 404, 409).

**Вправа 6 (конфігурація, 25 хв).** Винесіть налаштування в `.env`, додайте
`.env.example` і `.gitignore`, реалізуйте валідацію обов'язкових змінних при
старті. Перевірте, що без `DATABASE_URL` сервер не запускається й пише
зрозуміле повідомлення.

**Вправа 7 (стійкість, 25 хв).** Додайте обробники `uncaughtException`,
`unhandledRejection` і коректне завершення по `SIGINT`/`SIGTERM`.
Перевірте: `Ctrl+C` має вивести повідомлення про завершення, а не обірвати
процес мовчки.

---

## 15. Корисні посилання

- [Node.js — офіційна документація](https://nodejs.org/docs/latest/api/) —
  довідник з усіх модулів.
- [Node.js: Learn](https://nodejs.org/en/learn) — офіційні навчальні статті,
  зокрема
  [The Node.js Event Loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick)
  і [Don't Block the Event Loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop).
- [Node.js Releases](https://nodejs.org/en/about/previous-releases) — які
  версії LTS зараз.
- [nodejs/node — GitHub](https://github.com/nodejs/node).
- [npm Docs](https://docs.npmjs.com/) — зокрема
  [package.json](https://docs.npmjs.com/cli/configuring-npm/package-json).
- [Semantic Versioning](https://semver.org/lang/uk/) — специфікація
  українською.
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices) —
  великий перевірений збірник практик; читайте розділи «Project Structure» та
  «Error Handling».
- [OWASP Node.js Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html).
- [nvm](https://github.com/nvm-sh/nvm) · [fnm](https://github.com/Schniz/fnm) —
  менеджери версій Node.

---

## 16. Література

1. **Buna, S.** *Efficient Node.js.* — O'Reilly, 2025. — Найсвіжіша книга про
   продуктивність і надійність Node.js: цикл подій, потоки, профілювання,
   масштабування. Прямо до цієї лекції.
2. **Cantelon, M., Harter, M., Holowaychuk, T., Rajlich, N.** *Node.js in
   Action.* 2nd ed. — Manning, 2017. — Класичний вступ; частина API
   застаріла, концепції — ні.
3. **Brown, E.** *Web Development with Node and Express.* 2nd ed. —
   O'Reilly, 2019. — Розділи 1–4 про середовище й основи сервера.
4. **Wiggins, A.** *The Twelve-Factor App.* — [12factor.net](https://12factor.net/) —
   фактори I–V: кодова база, залежності, конфігурація, сторонні служби, збірка.

---

## 17. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Середовище виконання | runtime | Оточення, у якому виконується код |
| Двигун | engine | Компонент, що виконує JavaScript (V8) |
| Цикл подій | event loop | Механізм чергування асинхронних задач |
| Пул потоків | thread pool | Потоки для операцій, що блокують |
| Блокуюча операція | blocking operation | Зупиняє головний потік |
| Робочий потік | worker thread | Окремий потік для обчислень |
| Модуль | module | Файл із власною областю видимості |
| Залежність | dependency | Зовнішній пакет, потрібний застосунку |
| Семантичне версіонування | semantic versioning | Схема `major.minor.patch` |
| Файл блокування | lock file | Фіксація точних версій дерева залежностей |
| Потік | stream | Обробка даних частинами |
| Змінна середовища | environment variable | Налаштування поза кодом |
| Коректне завершення | graceful shutdown | Завершення без втрати запитів |
| Обхід шляху | path traversal | Атака доступу за межі дозволеної теки |

---

**Попередня:** [Лекція 10. React: робота з API, архітектура та якість застосунку](10-react-api-architecture.md)
**Наступна:** [Лекція 12. Express.js: маршрутизація, middleware, архітектура](12-express-middleware-architecture.md)

[← До змісту курсу](README.md)
