# Завдання №4 і №5 крок за кроком: REST API «Фонотеки» на Node.js і повний застосунок на React

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Завдання:** №4. REST API на Node.js + PostgreSQL · №5. Клієнт-серверний застосунок (React + API) і розгортання
> **Інструменти:** WebStorm 2026.2, Node.js 24 LTS, Docker Desktop, PostgreSQL 18, Express 5, Zod 4, React 19, React Router 8, Vite 8
> **Готові проєкти:** [`assignment-4/`](assignment-4/) (сервер у стані здачі №4) і [`assignment-5/`](assignment-5/) (сервер + клієнт у стані здачі №5) — поруч із цим файлом
> **Обсяг:** близько 10–12 годин на частину I і 12–15 годин на частину II, якщо виконувати всі кроки й експерименти

Цей посібник — повний робочий приклад двох останніх завдань курсу. Крок за
кроком ви створите:

- **у частині I** — REST API «Фонотеки» на Express і PostgreSQL: CRUD,
  пошук, фільтри, сортування й пагінація **в SQL**, валідація, JWT і ролі,
  єдиний формат помилок, логування, документація OpenAPI й автоматичні тести;
- **у частині II** — клієнт на React, який працює з цим API: вхід і захищені
  маршрути, список із debounce-пошуком і станом в адресі, форма з
  серверними помилками, видалення лише для адміністратора, три різні макети
  для телефона, планшета й комп'ютера, — а також розгортання всього
  застосунку в інтернеті.

Предметна область та сама, що й у [прикладі Завдання №3](../../additiona-tutorials/assignment-3-music-catalog.md):
**альбоми** й **виконавці**. Тільки тепер дані живуть не в `localStorage`, а
в справжній базі даних на сервері.

Посібник **самодостатній**: перед кожним кроком є теорія, потрібна саме для
нього, — що це, навіщо й **чому зроблено саме так, а не інакше**. Лекції
11–16 допоможуть зрозуміти глибше, але щоб виконати приклад, вони не
обов'язкові. Окремо поруч лежить [збірка кращих практик](02-best-practices-node-react-api.md) —
коротка шпаргалка правил, яку зручно тримати відкритою під час роботи над
власним проєктом.

> ⚠️ **Тему «Музичні альбоми» для свого завдання брати не можна** — вона
> зайнята цим прикладом. Мета посібника — щоб ви зрозуміли кожне рішення і
> потім **так само** реалізували застосунок для власної предметної області.
> Як перенести приклад на свої сутності — у [розділі 26](#26-як-перенести-приклад-на-свою-тему).

---

## Як працювати з посібником

1. **Читайте теорію перед кодом.** Блоки «📚 Теорія» пояснюють поняття, які
   зустрінуться в коді кроку. Блоки «🤔 Чому так» — чому обрано саме таке
   рішення і які в нього альтернативи.
2. **Код кожного кроку — повний вміст файлу.** Позначка 📄 **`шлях/до/файлу`**
   означає: створіть файл (або **повністю замініть** наявний) таким вмістом.
   Файли з позначкою «тимчасова версія» пізніше буде замінено. Але не просто
   копіюйте: **читайте коментарі в коді** — вони теж частина пояснення.
3. **✅ Контрольна точка** після кроку — що ви маєте побачити. Бачите інше —
   не йдіть далі, спершу знайдіть розбіжність (підказки — у
   [розділі 27](#27-типові-помилки)).
4. **🧪 Експерименти** — навмисні поломки, щоб побачити, навіщо потрібне те
   чи інше рішення. **Після кожного експерименту поверніть код як було**
   (`⌘Z` / `Ctrl+Z` або **Local History** у WebStorm).
5. **Питання для самоперевірки** зібрано в [розділі 28](#28-питання-для-самоперевірки-й-захисту).
   Спершу дайте відповідь самі, потім читайте відповідь у дужках. Схожі
   питання ставитимуть на захисті.
6. **Команди терміналу** наведено для macOS/Linux і **Git Bash** у Windows.
   У PowerShell інші правила лапок і перенесення рядків, тому для `curl`
   використовуйте Git Bash або вбудований **HTTP Client** WebStorm (файл
   `requests.http`, крок 14).

| Позначка | Що означає |
|---|---|
| 📄 **`шлях`** | повний вміст файлу — створити або замінити цілком |
| 📚 **Теорія** | поняття, потрібні для кроку |
| 🤔 **Чому так** | обґрунтування рішення й альтернативи |
| ✅ **Контрольна точка** | що має вийти |
| 🧪 **Експеримент** | навмисна поломка, після неї — повернути код |
| ⚠️ | типова пастка |
| 🔑 | головна думка |

---

## Зміст

0. [Огляд: що й як ми будуємо](#0-огляд-що-й-як-ми-будуємо)

**Частина I. Завдання №4 — REST API**

1. [Інструменти й новий проєкт](#1-інструменти-й-новий-проєкт)
2. [Конфігурація і логер](#2-конфігурація-і-логер)
3. [PostgreSQL у Docker](#3-postgresql-у-docker)
4. [Схема бази: міграції](#4-схема-бази-міграції)
5. [Пул з'єднань і власні класи помилок](#5-пул-зєднань-і-власні-класи-помилок)
6. [Express-застосунок: middleware, health, обробка помилок](#6-express-застосунок-middleware-health-обробка-помилок)
7. [Демо-дані (seed)](#7-демо-дані-seed)
8. [Валідація вхідних даних](#8-валідація-вхідних-даних)
9. [Репозиторії й мапери: увесь SQL в одному місці](#9-репозиторії-й-мапери-увесь-sql-в-одному-місці)
10. [Сервіси й контролери](#10-сервіси-й-контролери)
11. [Маршрути: перший повний CRUD](#11-маршрути-перший-повний-crud)
12. [Автентифікація й авторизація](#12-автентифікація-й-авторизація)
13. [Документація OpenAPI і Swagger UI](#13-документація-openapi-і-swagger-ui)
14. [Файл запитів, автоматичні тести, README](#14-файл-запитів-автоматичні-тести-readme)

**Частина II. Завдання №5 — клієнт-серверний застосунок**

15. [Монорепозиторій: сервер і клієнт разом](#15-монорепозиторій-сервер-і-клієнт-разом)
16. [Зміни на сервері](#16-зміни-на-сервері)
17. [Клієнт: проєкт Vite і глобальні стилі](#17-клієнт-проєкт-vite-і-глобальні-стилі)
18. [Шар API: єдина точка спілкування з сервером](#18-шар-api-єдина-точка-спілкування-з-сервером)
19. [Автентифікація в клієнті, сповіщення й макет](#19-автентифікація-в-клієнті-сповіщення-й-макет)
20. [Список альбомів: пошук, фільтри, сортування, пагінація, три макети](#20-список-альбомів-пошук-фільтри-сортування-пагінація-три-макети)
21. [Сторінка альбому й видалення](#21-сторінка-альбому-й-видалення)
22. [Форма створення й редагування](#22-форма-створення-й-редагування)
23. [Довідник виконавців і остаточні маршрути](#23-довідник-виконавців-і-остаточні-маршрути)
24. [Якість: консоль, доступність, Lighthouse](#24-якість-консоль-доступність-lighthouse)
25. [Розгортання: Neon + Render + Netlify](#25-розгортання-neon--render--netlify)

**Частина III. Підсумки**

26. [Як перенести приклад на свою тему](#26-як-перенести-приклад-на-свою-тему)
27. [Типові помилки](#27-типові-помилки)
28. [Питання для самоперевірки й захисту](#28-питання-для-самоперевірки-й-захисту)
29. [Корисні посилання](#29-корисні-посилання)

---

## 0. Огляд: що й як ми будуємо

| Телефон | Планшет |
|---|---|
| ![Телефон](assignment-5/docs/screenshots/fonoteka-mobile.png) | ![Планшет](assignment-5/docs/screenshots/fonoteka-tablet.png) |

![Комп'ютер: бічна панель фільтрів і таблиця з сортуванням](assignment-5/docs/screenshots/fonoteka-desktop.png)

| Сторінка альбому | Форма з помилками сервера | Вхід |
|---|---|---|
| ![Деталі](assignment-5/docs/screenshots/fonoteka-details.png) | ![Форма](assignment-5/docs/screenshots/fonoteka-form.png) | ![Вхід](assignment-5/docs/screenshots/fonoteka-login.png) |

### 0.1. Предметна область

| Роль | Сутність | Таблиця | Зв'язок |
|---|---|---|---|
| Головна | **Альбом** | `albums` | — |
| Довідник | **Виконавець** | `artists` | **багато-до-одного**: в альбому рівно один виконавець, у виконавця — багато альбомів (`albums.artist_id → artists.id`) |
| Службова | **Користувач** | `users` | ролі `USER` і `ADMIN` |

**Поля альбому** — різних типів, кожне з власними правилами:

| Поле API | Стовпець | Тип | Правила |
|---|---|---|---|
| `id` | `id` | UUID | генерує база |
| `title` | `title` | рядок ≤ 200 | обов'язкове, **унікальне без урахування регістру** |
| `description` | `description` | довгий текст ≤ 2000 | необов'язкове |
| `artistId` → `artist` | `artist_id` | зовнішній ключ | обов'язкове, виконавець має існувати |
| `releaseDate` | `release_date` | дата `РРРР-ММ-ДД` | обов'язкова, не раніше 1900 |
| `trackCount` | `track_count` | ціле 1–999 | обов'язкове |
| `durationMinutes` | `duration_minutes` | ціле 1–600 | необов'язкове |
| `rating` | `rating` | ціле 1–5 | необов'язкове |
| `format` | `format` | enum: `vinyl`, `cd`, `cassette`, `digital` | обов'язкове |
| `inCollection` | `in_collection` | логічне | за замовчуванням `false` |
| `coverUrl` | `cover_url` | URL `http(s)` ≤ 500 | необов'язкове |
| `createdAt`, `updatedAt` | `created_at`, `updated_at` | дата й час | заповнює база |

Зверніть увагу на дві колонки назв: **API говорить camelCase** (так прийнято
в JavaScript), **база — snake_case** (так прийнято в SQL). Перетворення між
ними відбувається в одному місці — у **мапері** (крок 9).

### 0.2. Ендпоїнти

Усі шляхи API починаються з `/api/v1` (версія в адресі — щоб колись додати
`/api/v2`, не зламавши старих клієнтів).

| Метод | Шлях | Доступ | Успіх | Типові помилки |
|---|---|---|---|---|
| `GET` | `/albums` | усі | 200 | 400 |
| `GET` | `/albums/count` | усі | 200 `{ total }` | 400 |
| `GET` | `/albums/:id` | усі | 200 | 400, 404 |
| `POST` | `/albums` | з токеном | 201 + `Location` | 400, 401, 409 |
| `PUT` | `/albums/:id` | з токеном | 204 | 400, 401, 404, 409 |
| `PATCH` | `/albums/:id` | з токеном | 204 | 400, 401, 404, 409 |
| `DELETE` | `/albums/:id` | лише `ADMIN` | 204 | 401, 403, 404 |
| `GET` | `/artists` | усі | 200 | — |
| `POST` | `/auth/sign-up` | усі | 201 `{ user, token }` | 400, 409, 429 |
| `POST` | `/auth/sign-in` | усі | 200 `{ user, token }` | 400, 401, 429 |
| `POST` | `/auth/refresh-token` | з токеном | 200 `{ user, token }` | 401 |
| `GET` | `/auth/me` | з токеном | 200 | 401 |
| `GET` | `/health` | усі | 200 / 503 | — |

У Завданні №4 `GET /albums` повертає **масив**, а загальну кількість — у
заголовку `X-Total-Count` і на окремому `/albums/count`. У Завданні №5
відповідь списку стає об'єктом `{ data, total, limit, offset }` (крок 16), а
довідник виконавців отримує `GET /artists/:id` і `POST /artists`.

**Параметри списку:** `search` (частина назви), `artistId`, `format`,
`inCollection`, `yearFrom`, `yearTo`, `ratingMin` — фільтри; `sort`
(`title`, `releaseDate`, `rating`, `trackCount`, `createdAt`) і `order`
(`asc`, `desc`) — сортування; `limit` (1–100, за замовчуванням 20) і
`offset` — пагінація. **Усе це виконує база даних** — сервер ніколи не
вибирає всі рядки, щоб відфільтрувати їх у JavaScript.

### 0.3. Шарова архітектура — найважливіше рішення частини I

Запит проходить крізь кілька шарів. **Кожен шар знає лише про сусідній** і
має одну відповідальність:

```mermaid
flowchart LR
    C([Клієнт]) -->|HTTP| M[middleware<br/>id запиту, лог, helmet,<br/>CORS, JSON, токен]
    M --> R[routes<br/>метод + шлях<br/>+ валідація]
    R --> Ctl[controllers<br/>req → виклик → res]
    Ctl --> S[services<br/>бізнес-правила]
    S --> Rep[repositories<br/>SQL]
    Rep --> DB[(PostgreSQL)]
    S -.->|помилка| EH[errorHandler<br/>єдиний формат]
    Rep -.->|помилка| EH
    EH -->|JSON| C
```

| Шар | Знає про | **Не** знає про | Приклад рядка |
|---|---|---|---|
| routes | URL, методи, middleware | SQL, бізнес-правила | `router.delete('/:id', authenticate, requireRole('ADMIN'), …)` |
| controllers | `req`, `res`, статуси HTTP | SQL | `res.status(201).location(…).json(album)` |
| services | бізнес-правила | `req`, `res`, SQL | «назва альбому унікальна» |
| repositories | SQL і таблиці | HTTP, правила | `SELECT … WHERE a.id = $1` |
| mappers | рядок таблиці ↔ JSON | усе інше | `release_date → releaseDate` |

🤔 **Чому так, а не весь код в обробнику маршруту?** Бо кожну частину тоді
можна змінити, не чіпаючи інших. У лекції 13 ми замінили сховище «масив у
пам'яті» на PostgreSQL, переписавши **лише репозиторії**. Помилку можна
шукати в одному шарі, а не в одному файлі на 500 рядків. А на захисті ви
завжди знаєте, куди дивитися: «де перевіряється унікальність назви?» — у
сервісі; «де SQL?» — у репозиторії.

### 0.4. Структура проєкту Завдання №4

```text
assignment-4/
├── .env.example            ← шаблон налаштувань (у git); .env — ні
├── .env.test               ← налаштування для автотестів (у git, без секретів)
├── docker-compose.yml      ← PostgreSQL для розробки
├── docs/openapi.yaml       ← документація API
├── requests.http           ← запити для HTTP Client WebStorm
├── scripts/seed.js         ← наповнення бази демо-даними
├── tests/                  ← інтеграційні тести (node:test + supertest)
└── src/
    ├── server.js           ← точка входу: запуск і коректне завершення
    ├── app.js              ← налаштування Express (без listen — зручно тестувати)
    ├── config/             ← усі змінні середовища в одному місці
    ├── db/                 ← пул з'єднань, міграції, коди помилок PostgreSQL
    ├── errors/             ← власні класи помилок
    ├── middlewares/        ← id запиту, лог, валідація, токен, ліміти, помилки
    ├── validators/         ← схеми Zod
    ├── routes/             ← маршрути
    ├── controllers/        ← HTTP-шар
    ├── services/           ← бізнес-правила, JWT
    ├── repositories/       ← SQL
    ├── mappers/            ← рядок таблиці → JSON
    ├── data/               ← демо-дані для seed
    └── utils/              ← логер
```

### 0.5. Вимоги → де вони в прикладі

| Вимога | Де реалізовано | Крок |
|---|---|---|
| Express, шарова архітектура | `src/routes` → `controllers` → `services` → `repositories` | 9–11 |
| PostgreSQL, зв'язок «багато-до-одного», міграції | `docker-compose.yml`, `src/db/migrations` | 3–4 |
| Індекси на полях пошуку й зовнішніх ключах | та сама міграція | 4 |
| Seed на 50+ записів (у №5 — 200+) | `scripts/seed.js` | 7, 16 |
| CRUD із правильними кодами, `Location` при 201 | `albums.controller.js` | 10–11 |
| Пошук, фільтри, сортування, пагінація **у SQL** | `albums.repository.js` | 9 |
| Лише параметризовані запити | `albums.repository.js`, білий список сортування | 9 |
| Валідація тіла, query й параметрів шляху | `src/validators`, `middlewares/validate.js` | 8 |
| Єдиний формат помилок **без стеку** | `middlewares/errorHandler.js` | 6 |
| JWT, хешовані паролі, ролі USER/ADMIN | `services/token.service.js`, `auth.service.js`, `middlewares/auth.js` | 12 |
| `helmet`, CORS з конкретним джерелом, ліміт спроб входу | `app.js`, `middlewares/rateLimit.js` | 6, 12 |
| Налаштування через `.env` (`dotenv`) | `src/config/index.js` | 2 |
| Логування | `utils/logger.js`, `middlewares/httpLogger.js` | 2, 6 |
| Документація OpenAPI + Swagger UI | `docs/openapi.yaml`, `/api-docs` | 13 |
| Приклади запитів, README | `requests.http`, `README.md` | 14 |
| Відповідь списку `{ data, total, limit, offset }` (№5) | `albums.controller.js` | 16 |

### 0.6. Що додає Завдання №5

**Маршрути клієнта:**

| Адреса | Сторінка | Доступ |
|---|---|---|
| `/` | перенаправлення на `/albums` | усі |
| `/albums` | список: пошук, фільтри, сортування, сторінки — **стан в адресі** | усі |
| `/albums/:albumId` | деталі з виконавцем; «Видалити» — лише `ADMIN` | усі |
| `/albums/new`, `/albums/:albumId/edit` | одна форма для створення й редагування | після входу |
| `/artists` | довідник виконавців; форма додавання — після входу | усі |
| `/login`, `/register` | вхід і реєстрація | усі |
| `*` | 404 | усі |

**Як дані йдуть від сервера до екрана:**

```mermaid
flowchart LR
    URL["адреса<br/>?q=ніч&page=2"] --> Q[useListQuery]
    Q --> D[useDebounce]
    D --> A[useAsync]
    A --> API["api/albums.js → api/http.js"]
    API -->|fetch + токен| S[(REST API)]
    S --> API --> A
    A -->|"loading · error · data"| P["AlbumsPage<br/>картки або таблиця"]
    CTX[AuthContext] -.->|роль| P
```

**Структура клієнта:**

```text
client/src/
├── api/          ← єдина точка спілкування з сервером: fetch, токен, HttpError, 401
├── context/      ← AuthContext (хто увійшов), ToastContext (сповіщення)
├── hooks/        ← useAsync, useDebounce, useListQuery, useMediaQuery, useAlbumForm…
├── utils/        ← форматування, стан списку ↔ адреса, правила валідації
├── components/   ← Layout, ProtectedRoute, Field, Pagination, ConfirmDialog, стани
├── features/     ← компоненти альбомів і виконавців
└── pages/        ← сторінки-маршрути
```

---

# Частина I. Завдання №4 — REST API
## 1. Інструменти й новий проєкт

### 📚 Теорія: Node.js, npm і модулі

**Node.js** — середовище, яке виконує JavaScript поза браузером. Рушій той
самий (V8), але замість `window` і DOM є доступ до файлів, мережі й процесів.
Саме тому на Node.js пишуть сервери.

**npm** — менеджер пакетів. Файл `package.json` описує проєкт: назву,
**скрипти** (`npm run dev`) і **залежності**. `dependencies` потрібні для
роботи застосунку, `devDependencies` — лише розробникові (лінтер,
форматувальник, тести). Запис `"express": "^5.3.0"` означає «5.3.0 або новіша
**в межах 5.x**» (семантичне версіонування: мажорна версія ламає сумісність,
мінорна додає можливості, патч виправляє помилки). Точні встановлені версії
фіксує `package-lock.json` — його **комітять**, щоб у всіх були однакові
пакети.

**Модулі.** Рядок `"type": "module"` у `package.json` вмикає стандартні
**ES-модулі**: `import` / `export`, як у React. Без нього Node.js вважає файли
старими CommonJS-модулями (`require`). У ES-модулях:

- шлях до власного файлу пишеться **з розширенням**: `'./app.js'`, а не
  `'./app'`;
- `await` можна писати на верхньому рівні модуля (ми скористаємося цим у
  `server.js`).

### 1.1. Node.js 24 LTS

LTS (Long Term Support) — версія з довгою підтримкою; для навчальних і
робочих проєктів беруть саме її. Встановіть Node.js 24 з
[nodejs.org](https://nodejs.org/) або через менеджер версій (`nvm`, `fnm`,
`volta`) і перевірте:

```bash
node -v     # v24.x.x
npm -v      # 11.x
```

Приклад працює й на Node.js 22, але не на старіших версіях: Node.js 20 уже
не підтримується, а в `package.json` зазначено `"engines": { "node": ">=22" }`.

### 1.2. Docker Desktop

PostgreSQL ми запускатимемо в контейнері Docker (крок 3), тож встановіть
[Docker Desktop](https://www.docker.com/products/docker-desktop/) і
переконайтеся, що він запущений:

```bash
docker -v                # Docker version 2x.x
docker compose version   # Docker Compose version v2.x
```

### 1.3. Новий проєкт у WebStorm

1. **File → New → Project… → Empty Project** (або **Node.js**), назва —
   `fonoteka-api`, розташування — будь-яка ваша папка. **Create**.
2. Відкрийте вбудований термінал: **View → Tool Windows → Terminal**
   (`⌥F12` / `Alt+F12`). Усі команди далі виконуються в ньому, у корені
   проєкту.
3. Створіть `package.json` і встановіть залежності:

```bash
npm init -y

npm install express cors helmet dotenv pg node-pg-migrate zod \
  jsonwebtoken bcrypt express-rate-limit pino pino-http \
  swagger-ui-express yaml

npm install -D eslint @eslint/js globals eslint-config-prettier prettier \
  pino-pretty supertest
```

| Пакет | Навіщо |
|---|---|
| `express` | вебфреймворк: маршрути, middleware |
| `cors`, `helmet` | дозволи для інших джерел (CORS) і захисні HTTP-заголовки |
| `dotenv` | читає змінні середовища з файлу `.env` |
| `pg` | драйвер PostgreSQL |
| `node-pg-migrate` | міграції схеми бази |
| `zod` | валідація вхідних даних |
| `jsonwebtoken`, `bcrypt` | токени JWT і хешування паролів |
| `express-rate-limit` | обмеження кількості спроб входу |
| `pino`, `pino-http`, `pino-pretty` | структуроване логування (і гарний вивід у розробці) |
| `swagger-ui-express`, `yaml` | сторінка документації API |
| `eslint`, `prettier` (+ плагіни) | перевірка й форматування коду |
| `supertest` | HTTP-запити до застосунку в автотестах |

4. Відкрийте `package.json` і приведіть його до такого вигляду (версії у
   вас можуть бути новішими — **залиште свої**). Головне — `"type":
   "module"`, `"engines"` і блок `"scripts"`:

📄 **`package.json`**
```json
{
  "name": "fonoteka-api",
  "version": "1.0.0",
  "private": true,
  "description": "REST API «Фонотеки» — приклад до Завдання №4",
  "type": "module",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "migrate": "node-pg-migrate -m src/db/migrations",
    "migrate:up": "node-pg-migrate -m src/db/migrations up",
    "migrate:down": "node-pg-migrate -m src/db/migrations down",
    "migrate:create": "node-pg-migrate -m src/db/migrations create",
    "seed": "node scripts/seed.js",
    "test": "node --env-file=.env.test --test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^18.0.10",
    "express": "^5.3.0",
    "express-rate-limit": "^8.7.4",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.3",
    "node-pg-migrate": "^9.0.0",
    "pg": "^8.23.1",
    "pino": "^10.4.0",
    "pino-http": "^11.0.0",
    "swagger-ui-express": "^5.0.1",
    "yaml": "^2.9.1",
    "zod": "^4.6.7"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "eslint": "^10.14.0",
    "eslint-config-prettier": "^10.1.8",
    "globals": "^17.14.0",
    "pino-pretty": "^13.2.0",
    "prettier": "^3.9.10",
    "supertest": "^7.3.2"
  }
}
```

Частина скриптів посилається на файли, яких ще немає, — вони з'являться в
наступних кроках.

| Скрипт | Що робить | Коли знадобиться |
|---|---|---|
| `dev` | запуск із перезапуском після кожного збереження (`--watch` вбудований у Node.js, `nodemon` не потрібен) | крок 6 |
| `start` | запуск без перезапуску — для хостингу | крок 25 |
| `migrate:*` | міграції бази | крок 4 |
| `seed` | демо-дані | крок 7 |
| `test` | автоматичні тести з налаштуваннями з `.env.test` | крок 14 |
| `lint`, `format`, `format:check` | ESLint і Prettier | зараз |

5. Ще три маленькі файли:

📄 **`.nvmrc`**
```text
24
```

(Підказка для `nvm use` і для хостингу: «проєкт розрахований на Node.js 24».)

📄 **`.gitignore`**
```text
node_modules/
.env
*.log
```

⚠️ `.env` **ніколи** не потрапляє в репозиторій — у ньому секрети (крок 2).

### 1.4. ESLint і Prettier

**ESLint** шукає помилки й підозрілі місця (невикористана змінна, `==`
замість `===`). **Prettier** відповідає лише за **форматування** (лапки,
відступи, перенесення рядків). Щоб вони не сперечалися,
`eslint-config-prettier` вимикає в ESLint усі правила форматування.

📄 **`eslint.config.js`**
```js
// ESLint (flat config): рекомендовані правила + глобальні змінні Node.js.
// eslint-config-prettier вимикає правила форматування — ними займається Prettier.
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  { ignores: ['node_modules/'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // req, res, next часто потрібні лише заради сигнатури middleware
      'no-unused-vars': ['error', { argsIgnorePattern: '^(req|res|next|_)' }],
      eqeqeq: 'error',
      'prefer-const': 'error',
    },
  },
  prettier,
]);
```

📄 **`.prettierrc.json`**
```json
{
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

📄 **`.prettierignore`**
```text
node_modules/
package-lock.json
# Markdown форматуємо вручну: Prettier вирівнює таблиці пробілами
*.md
```

Увімкніть обидва інструменти в WebStorm:

- **Settings → Languages & Frameworks → JavaScript → Code Quality Tools →
  ESLint** → **Automatic ESLint configuration**, позначка **Run eslint --fix
  on save**;
- **Settings → Languages & Frameworks → JavaScript → Prettier** →
  **Automatic Prettier configuration**, позначка **Run on save**.

Тепер кожне збереження файлу (`⌘S` / `Ctrl+S`) форматує код і виправляє
дрібниці автоматично.

Нарешті, створіть репозиторій: **VCS → Create Git Repository…** (або
`git init` у терміналі).

### ✅ Контрольна точка 1

```bash
npm run lint           # без виводу — помилок немає
npm run format:check   # All matched files use Prettier code style!
```

Якщо `format:check` скаржиться на якийсь файл — виконайте `npm run format`.

---

## 2. Конфігурація і логер

### 📚 Теорія: змінні середовища

Налаштування, які **відрізняються між середовищами** (ваш ноутбук, ноутбук
одногрупника, хостинг), не пишуть у коді. Адреса бази, секрет для токенів,
порт — це **змінні середовища** (environment variables), доступні в
Node.js через `process.env`.

Під час розробки їх зручно тримати у файлі `.env`, а пакет **`dotenv`**
копіює їх у `process.env` під час запуску. Схема така:

| Файл | Що в ньому | У git? |
|---|---|---|
| `.env.example` | **шаблон**: усі змінні, без справжніх секретів, з коментарями | так |
| `.env` | ваші справжні значення | **ні** |

Новий розробник клонує репозиторій, виконує `cp .env.example .env`,
вписує свої значення — і все працює. На хостингу файлу `.env` немає взагалі:
змінні задають у налаштуваннях сервісу (крок 25).

🔑 Увесь код читає налаштування **з одного модуля** `src/config/index.js`, а
не з `process.env` у двадцяти місцях. Там же — перевірки: якщо обов'язкової
змінної немає, сервер **одразу** зупиняється зі зрозумілим повідомленням
(принцип **fail fast**), а не падає через годину на першому запиті до бази.

### 2.1. Шаблон і ваш `.env`

📄 **`.env.example`**
```ini
# Шаблон налаштувань: cp .env.example .env і заповніть значення.
# .env НЕ потрапляє в git, .env.example — потрапляє.
NODE_ENV=development
PORT=3000

# PostgreSQL (див. docker-compose.yml)
DATABASE_URL=postgresql://fonoteka:fonoteka_dev_password@localhost:5432/fonoteka

# JWT: секрет — щонайменше 32 символи; згенеруйте 64 випадкові байти командою:
# node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=
JWT_EXPIRES_IN=1h

# Дозволені джерела для CORS (через кому, без завершального слеша)
CORS_ORIGINS=http://localhost:5173

# Рівень логування: debug | info | warn | error
LOG_LEVEL=debug
```

Створіть свій `.env` і згенеруйте секрет:

```bash
cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(64).toString('hex'))"
```

Скопіюйте виведений рядок у `.env` після `JWT_SECRET=`.

🤔 **Чому секрет такий довгий?** Токен JWT підписується цим секретом (крок
12). Знаючи секрет, будь-хто підпише токен із `"role": "ADMIN"`. Короткий
секрет на кшталт `secret123` підбирається перебором за хвилини, 64 випадкові
байти — ніколи.

### 2.2. Модуль конфігурації

📄 **`src/config/index.js`**
```js
// Уся конфігурація — в одному місці й лише зі змінних середовища.
// dotenv читає файл .env і копіює значення в process.env (ті, що вже задані, не перезаписує).
import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`✖ Відсутня обов'язкова змінна середовища: ${name}`);
    process.exit(1);
  }
  return value;
}

const env = process.env.NODE_ENV ?? 'development';
const jwtSecret = required('JWT_SECRET');

// Короткий секрет підбирається перебором — і тоді будь-хто підпише токен із роллю ADMIN
if (jwtSecret.length < 32) {
  console.error('✖ JWT_SECRET закороткий: потрібно щонайменше 32 символи');
  process.exit(1);
}

export const config = {
  env,
  isProduction: env === 'production',
  isTest: env === 'test',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
  // 'http://localhost:5173,https://app.example.com' → ['http://localhost:5173', 'https://app.example.com']
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  logLevel: process.env.LOG_LEVEL ?? (env === 'production' ? 'info' : 'debug'),
  authRateLimit: Number(process.env.AUTH_RATE_LIMIT ?? 10),
};
```

Зверніть увагу на `import 'dotenv/config'` першим рядком: модуль
конфігурації імпортується раніше за все інше, тож до моменту читання
`process.env` файл `.env` уже прочитано.

### 📚 Теорія: логування

`console.log` для сервера замало: немає рівнів важливості, часу, id запиту;
у продакшені такі рядки неможливо шукати й фільтрувати. **Структурований
логер** пише кожен запис як JSON-об'єкт з полями (`level`, `time`, `msg`,
`reqId`…), а хостинг і системи моніторингу вміють такі записи шукати й
рахувати.

Рівні від найдокладнішого: `trace` → `debug` → `info` → `warn` → `error` →
`fatal`. Налаштування `LOG_LEVEL=info` означає «пиши `info` і все
важливіше».

Ми використовуємо **pino** — найшвидший логер для Node.js. У розробці
читати JSON незручно, тому `pino-pretty` перетворює його на кольоровий
короткий рядок. У продакшені (`NODE_ENV=production`) лишається чистий JSON.

⚠️ **У логи ніколи не потрапляють паролі й токени.** Логи читає багато
людей і сервісів, їх зберігають місяцями. Параметр `redact` замінює чутливі
поля на `[ПРИХОВАНО]`, навіть якщо хтось випадково передасть їх у логер.

📄 **`src/utils/logger.js`**
```js
// Структурований логер: JSON у продакшені, кольоровий читабельний вивід у розробці.
import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: config.isTest ? 'silent' : config.logLevel,
  transport: config.isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname,req,res,responseTime', // у розробці — один короткий рядок
        },
      },
  // Чутливі поля НІКОЛИ не потрапляють у логи
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.passwordHash',
      '*.token',
    ],
    censor: '[ПРИХОВАНО]',
  },
});
```

### ✅ Контрольна точка 2

```bash
node -e "import('./src/config/index.js').then(({ config }) => console.log(config.port, config.corsOrigins))"
```

Очікуваний результат: `3000 [ 'http://localhost:5173' ]`.

### 🧪 Експеримент: fail fast

1. Закоментуйте рядок `JWT_SECRET=…` у `.env` (`#` на початку) і повторіть
   команду. Має бути `✖ Відсутня обов'язкова змінна середовища: JWT_SECRET`
   і більше нічого.
2. Поставте `JWT_SECRET=short` — побачите повідомлення про закороткий
   секрет.

Поверніть справжній секрет.

---

## 3. PostgreSQL у Docker

### 📚 Теорія: навіщо Docker

Встановлювати PostgreSQL прямо в систему можна, але тоді в кожного студента
своя версія, свої налаштування й свої проблеми. **Docker** запускає
програму в **контейнері** — ізольованому середовищі, зібраному з готового
**образу** (image). Образ `postgres:18-alpine` однаковий на macOS, Windows і
Linux.

| Поняття | Що це | У нашому прикладі |
|---|---|---|
| образ (image) | «шаблон» програми з усім потрібним | `postgres:18-alpine` |
| контейнер | запущений екземпляр образу | `fonoteka-db` |
| том (volume) | сховище даних **поза** контейнером: контейнер можна видалити, дані лишаться | `pgdata` |
| порт `5432:5432` | «порт вашого комп'ютера : порт у контейнері» | сервер підключається до `localhost:5432` |

Файл `docker-compose.yml` описує все це декларативно, щоб не запам'ятовувати
довгу команду `docker run …`.

📄 **`docker-compose.yml`**
```yaml
# PostgreSQL для розробки.
#   docker compose up -d      — запустити у фоні
#   docker compose down       — зупинити (дані збережуться в томі pgdata)
#   docker compose down -v    — зупинити й ВИДАЛИТИ дані
services:
  db:
    image: postgres:18-alpine
    container_name: fonoteka-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: fonoteka
      POSTGRES_PASSWORD: fonoteka_dev_password
      POSTGRES_DB: fonoteka
      # Українське сортування (Ґ після Г, Є після Е, І після И) через ICU.
      # Діє лише під час ПЕРШОГО створення бази (порожній том).
      POSTGRES_INITDB_ARGS: --locale-provider=icu --icu-locale=uk-UA
    ports:
      - '5432:5432'
    volumes:
      # Для образів 18+ — саме /var/lib/postgresql (для ≤17 було …/postgresql/data)
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U fonoteka -d fonoteka']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

🤔 **Навіщо `POSTGRES_INITDB_ARGS` з ICU?** Щоб база сортувала українські
літери правильно. За замовчуванням у контейнері порядок визначається кодами
символів, і «Ґава» опиниться після «Ялти», а «Є» — перед «А». Провайдер ICU з
локаллю `uk-UA` знає український алфавіт. Сортування за назвою — одна з
вимог списку, тож це важливо.

⚠️ Параметри `POSTGRES_*` і `POSTGRES_INITDB_ARGS` діють **лише під час
першого запуску** з порожнім томом. Змінили їх пізніше — виконайте
`docker compose down -v` (видалить дані!) і `docker compose up -d`.

### 3.1. Запуск

```bash
docker compose up -d     # завантажить образ (перший раз — до хвилини) і запустить контейнер
docker compose ps        # STATUS: Up … (healthy)
```

Підключіться до бази консольним клієнтом `psql` усередині контейнера:

```bash
docker exec -it fonoteka-db psql -U fonoteka
```

```sql
SELECT version();
SELECT datlocprovider, datlocale FROM pg_database WHERE datname = 'fonoteka';
-- i | uk-UA   ← ICU з українською локаллю
\q
```

**База у WebStorm.** Відкрийте **View → Tool Windows → Database** →
**+ → Data Source → PostgreSQL**: Host `localhost`, Port `5432`, User
`fonoteka`, Password `fonoteka_dev_password`, Database `fonoteka`. Якщо
WebStorm запропонує завантажити драйвер — погодьтеся. **Test Connection →
OK.** Тепер таблиці видно в дереві, а SQL можна виконувати в консолі
(**QL**-кнопка або `⇧⌘L` / `Ctrl+Shift+L`).

⚠️ **Порт 5432 зайнятий** (`Bind for 0.0.0.0:5432 failed: port is already
allocated`)? Найчастіше — у системі вже встановлено PostgreSQL. Або
зупиніть його, або змініть рядок портів на `'5433:5432'` і в `.env` — порт у
`DATABASE_URL` на `5433`.

### ✅ Контрольна точка 3

`docker compose ps` показує контейнер `fonoteka-db` зі статусом `healthy`, а
запит `SELECT version();` повертає `PostgreSQL 18…`.

### 🧪 Експеримент: український алфавіт

Виконайте в `psql` або в консолі WebStorm:

```sql
SELECT w FROM unnest(ARRAY['Ґава', 'Гора', 'Єва', 'Есе', 'Іра', 'Ира', 'Їжак', 'Ялта', 'Арка']) AS w
ORDER BY w;
-- Арка, Гора, Ґава, Есе, Єва, Ира, Іра, Їжак, Ялта   ← правильний алфавітний порядок

SELECT w FROM unnest(ARRAY['Ґава', 'Гора', 'Єва', 'Есе', 'Іра', 'Ира', 'Їжак']) AS w
ORDER BY w COLLATE "C";
-- Єва, Іра, Їжак, Гора, Есе, Ира, Ґава   ← за кодами символів
```

---

## 4. Схема бази: міграції

### 📚 Теорія: що таке міграція

Схема бази (таблиці, стовпці, індекси) змінюється разом із кодом. Якщо
змінювати її вручну в консолі, за тиждень ніхто не скаже, яка схема на
хостингу, а яка — в одногрупника. **Міграція** — файл із кодом, який
переводить схему з однієї версії в наступну (`up`) і назад (`down`).

- Файли міграцій лежать у репозиторії й **виконуються по черзі**: порядок
  задає позначка часу в імені файлу.
- Інструмент записує застосовані міграції в службову таблицю
  `pgmigrations`, тому повторний `migrate:up` нічого не робить.
- 🔑 **Застосовану міграцію не редагують.** Потрібен новий стовпець —
  створюють **нову** міграцію. Інакше на машинах, де стара версія вже
  виконалася, схема розійдеться з кодом.

Ми використовуємо `node-pg-migrate`: міграція — це JavaScript-функція, яка
описує зміни через `pgm.createTable`, `pgm.createIndex` тощо, а для
особливих випадків дає `pgm.sql('…')`. Адресу бази інструмент бере зі змінної
`DATABASE_URL` і сам читає `.env`.

### 📚 Теорія: рішення в схемі

| Рішення | Чому |
|---|---|
| `albums.id` — **UUID** (`gen_random_uuid()`) | id альбому видно в адресі (`/albums/1f9c…`); послідовні числа 1, 2, 3 підказують, скільки записів і як перебрати чужі |
| `artists.id`, `users.id` — `GENERATED ALWAYS AS IDENTITY` | сучасна заміна `SERIAL`; `ALWAYS` забороняє вставляти власні id і ламати лічильник |
| `varchar(200)` для назви, `text` для опису | обмеження довжини — ще одна перевірка на рівні бази |
| `CHECK (rating BETWEEN 1 AND 5)` та інші | **база — остання лінія оборони**: навіть якщо в коді помилка, некоректні дані не збережуться |
| `REFERENCES artists ON DELETE RESTRICT` | не можна видалити виконавця, в якого є альбоми, — інакше альбоми «повиснуть» без виконавця |
| унікальний індекс на `lower(title)` | «Земля» і «ЗЕМЛЯ» — той самий альбом; звичайний `UNIQUE (title)` вважав би їх різними |
| індекс на `artist_id` | PostgreSQL **не** створює індекс для зовнішнього ключа сам, а фільтр «альбоми виконавця» і `JOIN` його потребують |
| GIN-індекс `pg_trgm` на `title` | пошук `ILIKE '%ніч%'` звичайний B-tree-індекс не прискорює (шаблон починається з `%`); триграмний — прискорює |
| індекс на `release_date` | сортування й фільтр за роками |
| тригер `set_updated_at` | `updated_at` оновлюється автоматично — не треба пам'ятати про нього в кожному `UPDATE` |

### 4.1. Перша міграція

Створіть заготовку командою (`--` передає аргумент самому скрипту):

```bash
npm run migrate:create -- initial-schema
```

З'явиться файл `src/db/migrations/<число>_initial-schema.js`. **Число у вас
буде інше** — це позначка часу створення, так і має бути. Замініть вміст
файлу повністю:

📄 **`src/db/migrations/1793000000000_initial-schema.js`**
```js
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
```

Застосуйте:

```bash
npm run migrate:up
```

У виводі буде весь згенерований SQL (`CREATE TABLE "artists" …`), а в кінці —
`Migrations complete!`.

### ✅ Контрольна точка 4

```bash
docker exec -it fonoteka-db psql -U fonoteka
```

```sql
\dt          -- albums, artists, users, pgmigrations
\d albums    -- стовпці, Check constraints, Foreign-key constraints, Indexes
\di          -- усі індекси, зокрема albums_title_trgm_index і albums_title_lower_unique
```

(У WebStorm: **Database → fonoteka → schemas → public → tables**; можливо,
доведеться натиснути **Refresh** `⌘R` / `Ctrl+F5`.)

Повторний `npm run migrate:up` пише `No migrations to run!`.

### 🧪 Експеримент: обмеження бази працюють без нашого коду

```sql
INSERT INTO artists (name) VALUES ('Тест');

INSERT INTO albums (title, artist_id, release_date, track_count, format)
VALUES ('Тест', 1, '2020-01-01', 0, 'cd');
-- ERROR: new row … violates check constraint "albums_track_count_check"

INSERT INTO albums (title, artist_id, release_date, track_count, format)
VALUES ('Тест', 999, '2020-01-01', 5, 'cd');
-- ERROR: … violates foreign key constraint "albums_artist_id_fkey"

INSERT INTO albums (title, artist_id, release_date, track_count, format)
VALUES ('Тест', 1, '2020-01-01', 5, 'cd'), ('ТЕСТ', 1, '2020-01-01', 5, 'cd');
-- ERROR: duplicate key value violates unique constraint "albums_title_lower_unique"

DELETE FROM artists;   -- прибираємо за собою
```

Потім спробуйте відкотити й повторити міграцію:

```bash
npm run migrate:down    # таблиці зникли
npm run migrate:up      # з'явилися знову
```

---

## 5. Пул з'єднань і власні класи помилок

### 📚 Теорія: пул з'єднань

Відкрити з'єднання з PostgreSQL — дорого (мережа, автентифікація, окремий
процес на сервері бази). Відкривати нове на кожен HTTP-запит — повільно, а
під навантаженням база просто вичерпає ліміт з'єднань.

**Пул** (`pg.Pool`) тримає кілька відкритих з'єднань і **видає їх у
тимчасове користування**: `pool.query()` бере вільне з'єднання, виконує
запит і повертає з'єднання в пул. Пул — **один на весь застосунок**, тому
він живе в окремому модулі, який усі імпортують.

**Транзакція** — кілька запитів, які виконуються «все або нічого»
(`BEGIN` … `COMMIT`, а при помилці — `ROLLBACK`). Усі запити транзакції
мають іти **через одне з'єднання**, тому для неї беремо клієнта з пулу явно
(`pool.connect()`) і обов'язково повертаємо (`client.release()`) у
`finally`. Функція `withTransaction` ховає цю рутину; знадобиться вона в
кроці 7.

📄 **`src/db/pool.js`**
```js
// Пул з'єднань PostgreSQL — один на весь застосунок.
import pg from 'pg';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const { Pool, types } = pg;

// DATE (OID 1082) за замовчуванням стає JS Date опівночі ЛОКАЛЬНОГО часу й «з'їжджає»
// на день при перетворенні в JSON. Дата без часу лишається рядком 'YYYY-MM-DD'.
types.setTypeParser(1082, (value) => value);

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

// Помилка неактивного з'єднання (наприклад, базу перезапустили) — інакше процес упаде
pool.on('error', (error) => {
  logger.error({ err: error }, 'Несподівана помилка пулу PostgreSQL');
});

export async function checkConnection() {
  const { rows } = await pool.query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

export async function closePool() {
  await pool.end();
}

/** Виконує callback(client) у транзакції: усе або нічого */
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
    client.release(); // ⚠️ ЗАВЖДИ повертаємо з'єднання в пул
  }
}
```

🤔 **Навіщо `types.setTypeParser(1082, …)`?** Стовпець `DATE` драйвер `pg`
за замовчуванням перетворює на JS-об'єкт `Date` **опівночі за місцевим
часом**. Для Києва влітку (UTC+3) `2014-04-18 00:00` — це
`2014-04-17T21:00:00Z`, і в JSON альбом «переїде» на день раніше. Дата без часу має лишатися рядком
`'2014-04-18'`.

### 📚 Теорія: очікувані й неочікувані помилки

| | Очікувані (операційні) | Неочікувані (баги) |
|---|---|---|
| Приклади | альбом не знайдено, назва зайнята, немає токена | `undefined is not a function`, впала база |
| Хто винен | запит клієнта або стан даних | код чи інфраструктура |
| Що відповідаємо | точний статус (400, 401, 403, 404, 409) і зрозуміле повідомлення | **500** і загальне «Внутрішня помилка сервера» |
| Що логуємо | достатньо рядка запиту | повний стек — для розробника |

Для очікуваних помилок створюємо **власні класи**. Сервіс пише
`throw new NotFoundError('Альбом')` — і не знає нічого про HTTP. Перетворити
помилку на відповідь — робота одного-єдиного обробника (крок 6).

📄 **`src/errors/index.js`**
```js
// Власні класи помилок. Сервіси кидають їх, не знаючи нічого про HTTP-відповідь;
// централізований обробник (middlewares/errorHandler.js) перетворює їх на JSON.

export class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.isOperational = true; // очікувана помилка, а не баг у коді
  }
}

/** 400: errors — масив { field, message } */
export class ValidationError extends AppError {
  constructor(errors, message = 'Помилка валідації') {
    super(message, 400, errors);
  }
}

/** 401: немає токена, він недійсний або прострочений */
export class UnauthorizedError extends AppError {
  constructor(message = 'Потрібна автентифікація') {
    super(message, 401);
  }
}

/** 403: користувача впізнано, але прав недостатньо */
export class ForbiddenError extends AppError {
  constructor(message = 'Недостатньо прав для цієї дії') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Ресурс') {
    super(`${resource} не знайдено`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфлікт даних') {
    super(message, 409);
  }
}
```

PostgreSQL повідомляє про порушення обмежень **кодами**: `23505` — унікальність,
`23503` — зовнішній ключ, `23514` — `CHECK`, `22P02` — неправильний формат
значення. Перетворюємо їх на наші помилки в одному місці:

📄 **`src/db/pgErrors.js`**
```js
import { ConflictError, ValidationError } from '../errors/index.js';

// Обмеження бази — остання лінія оборони. Якщо порушення «проскочило» повз перевірки
// сервісу (наприклад, два однакові POST одночасно), повертаємо зрозумілу помилку, а не 500.
export function translatePgError(error) {
  switch (error.code) {
    case '23505': // UNIQUE
      return new ConflictError('Запис із таким значенням уже існує');
    case '23503': // FOREIGN KEY
      return new ConflictError("Операція порушує зв'язок між записами");
    case '23514': // CHECK
      return new ValidationError([
        { field: 'body', message: `Порушено обмеження ${error.constraint}` },
      ]);
    case '22P02': // некоректний формат значення
      return new ValidationError([{ field: 'id', message: 'Некоректний формат значення' }]);
    default:
      return error;
  }
}
```

🤔 **Навіщо це, якщо сервіс і так перевіряє унікальність?** Через **гонку**:
два однакові `POST` можуть одночасно пройти перевірку «такої назви ще
немає», і другий `INSERT` впаде на унікальному індексі. Без перетворення
клієнт отримав би 500, а з ним — коректний 409.

### ✅ Контрольна точка 5

```bash
node -e "import('./src/db/pool.js').then(async ({ checkConnection, closePool }) => { console.log(await checkConnection()); await closePool(); })"
```

Очікуваний результат: `true`. Якщо `ECONNREFUSED` — контейнер не запущений
(`docker compose up -d`); якщо `password authentication failed` — перевірте
`DATABASE_URL` у `.env`.

---

## 6. Express-застосунок: middleware, health, обробка помилок

### 📚 Теорія: middleware

Express обробляє запит **ланцюжком функцій** `(req, res, next)`. Кожна
middleware-функція або **відповідає** (`res.json(…)`), або **передає далі**
(`next()`), або **повідомляє про помилку** (`next(error)` чи просто `throw`
в async-функції). Порядок `app.use(…)` — це порядок виконання.

```text
запит → requestId → httpLogger → helmet → cors → express.json → маршрути → notFound → errorHandler
```

- **id запиту** — першим, щоб його бачили всі наступні (і лог, і помилки).
- **Лог** — до маршрутів, щоб у лог потрапив кожен запит, навіть невдалий.
- **`helmet`** додає захисні заголовки (`Content-Security-Policy`,
  `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`…) і прибирає
  `X-Powered-By: Express`, який підказує зловмиснику, що атакувати.
- **CORS.** Браузер не дає сторінці з `http://localhost:5173` читати
  відповіді `http://localhost:3000` (інше **джерело**: схема + хост + порт),
  поки сервер явно не дозволить це заголовком `Access-Control-Allow-Origin`.
  Дозволяємо лише конкретні джерела зі списку, а не `*`. Заголовки
  `X-Total-Count`, `Location` тощо браузер за замовчуванням від JavaScript
  ховає — їх перелічуємо в `exposedHeaders`.
- **`express.json()`** розбирає тіло JSON у `req.body`. Обмеження `100kb`
  захищає від запитів на сотні мегабайтів.
- **`notFoundHandler`** спрацьовує, якщо жоден маршрут не підійшов.
- **`errorHandler`** має **чотири** параметри `(error, req, res, next)` —
  саме так Express відрізняє обробник помилок — і стоїть **останнім**.

🔑 **Express 5 сам ловить помилки async-функцій.** Якщо async-обробник
кинув виняток або його проміс відхилився, помилка потрапить в
`errorHandler`. В Express 4 для цього потрібна була обгортка
`asyncHandler` або `try/catch` у кожному обробнику; у нашому коді їх немає.

### 6.1. Middleware

📄 **`src/middlewares/requestId.js`**
```js
import { randomUUID } from 'node:crypto';

// Наскрізний ідентифікатор запиту: є в кожному рядку логу й у заголовку відповіді.
// Користувач надсилає його зі скріншота помилки — і ви за секунду знаходите запит у логах.
export function requestId(req, res, next) {
  req.id = req.get('X-Request-Id') ?? randomUUID();
  res.set('X-Request-Id', req.id);
  next();
}
```

📄 **`src/middlewares/httpLogger.js`**
```js
import { pinoHttp } from 'pino-http';
import { logger } from '../utils/logger.js';

// Один рядок логу на запит: метод, адреса, статус, тривалість; рівень — за статусом
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.id, // той самий id, що й у заголовку X-Request-Id
  customLogLevel: (req, res, error) => {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  customSuccessMessage: (req, res, responseTime) =>
    `[${req.id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode} — ${responseTime} мс`,
  customErrorMessage: (req, res) =>
    `[${req.id.slice(0, 8)}] ${req.method} ${req.originalUrl} ${res.statusCode}`,
  // У лог — лише корисне; заголовки (зокрема Authorization) не потрапляють узагалі
  serializers: {
    req: (req) => ({ id: req.id }),
    res: () => undefined,
  },
});
```

📄 **`src/middlewares/errorHandler.js`**
```js
import { AppError, NotFoundError } from '../errors/index.js';
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
export function errorHandler(rawError, req, res, next) {
  if (res.headersSent) return next(rawError);

  // Коди помилок PostgreSQL (23505, 23503, …) → помилки API; решта — без змін
  const error = translatePgError(rawError);

  // expose: true мають помилки express.json(): битий JSON → 400, завелике тіло → 413
  const isOperational = error instanceof AppError || error.expose === true;
  const status = isOperational ? error.status : 500;

  // Неочікувану помилку логуємо з повним стеком (req.log додає pino-http разом з id запиту).
  // Очікувані 4xx окремо не логуємо — їх і так видно в рядку запиту з рівнем warn.
  if (!isOperational) req.log.error({ err: error }, 'Неочікувана помилка');

  res.status(status).json({
    status,
    message: isOperational
      ? (PARSER_MESSAGES[error.type] ?? error.message)
      : 'Внутрішня помилка сервера',
    ...(error.details ? { errors: error.details } : {}),
    // Стек викликів НІКОЛИ не йде клієнту — він лише в логах (req.log.error вище)
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
}
```

🔑 **Єдиний формат помилки** — `{ status, message, errors?, path, timestamp }`
— для **будь-якої** помилки: валідації, 404, 500, битого JSON. Клієнт
(частина II) обробляє всі помилки одним кодом. І жодного `stack` у
відповіді: стек розкриває структуру файлів, версії бібліотек і логіку коду —
корисна інформація для атаки. Стек пишеться лише в лог.

### 6.2. Перевірка стану

**Health check** — маршрут, який відповідає, чи сервіс живий і чи доступна
база. Його опитують хостинг (Render перезапускає сервіс, якщо він не
відповідає), Docker і моніторинг.

📄 **`src/routes/health.routes.js`**
```js
import { Router } from 'express';
import { checkConnection } from '../db/pool.js';

const router = Router();

// Стан сервісу й бази: його опитують Docker, хостинг, моніторинг
router.get('/', async (req, res) => {
  const database = await checkConnection().then(
    () => 'up',
    () => 'down',
  );
  res.status(database === 'up' ? 200 : 503).json({
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// «Чи живий процес» — без звернення до бази (для health check хостингу)
router.get('/live', (req, res) => res.json({ status: 'ok' }));

export default router;
```

### 6.3. Застосунок і точка входу

🤔 **Чому `app.js` і `server.js` окремо?** `app.js` лише **налаштовує**
Express і експортує `app`. `server.js` **запускає** його (`app.listen`).
Автотести (крок 14) імпортують `app` і надсилають йому запити напряму, не
займаючи порт.

📄 **`src/app.js`** — тимчасова версія
```js
// Налаштування Express: middleware, маршрути, обробники помилок.
// ТИМЧАСОВА ВЕРСІЯ (крок 6): маршрути API додамо в кроці 11, документацію — у кроці 13.
// Тут НЕМАЄ app.listen() — запуск у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

// За проксі хостингу (Render, Railway, nginx) — щоб req.ip був IP клієнта, а не проксі
app.set('trust proxy', 1);

app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(httpLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(
  cors({
    origin: config.corsOrigins, // явний список дозволених джерел, а не '*'
    exposedHeaders: ['X-Total-Count', 'Location', 'X-Request-Id', 'Authorization'], // щоб клієнт їх бачив
  }),
);
app.use(express.json({ limit: '100kb' })); // 4. розбір JSON з обмеженням розміру

app.use('/health', healthRoutes);

// Обробники помилок — ЗАВЖДИ останні
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

📄 **`src/server.js`**
```js
// Точка входу: перевіряємо базу, запускаємо HTTP-сервер, коректно завершуємося.
import app from './app.js';
import { config } from './config/index.js';
import { checkConnection, closePool } from './db/pool.js';
import { logger } from './utils/logger.js';

try {
  await checkConnection();
} catch (error) {
  logger.fatal(
    `Немає з'єднання з PostgreSQL (${error.message || error.code}). Чи запущено docker compose up -d?`,
  );
  process.exit(1);
}

const server = app.listen(config.port, () => {
  logger.info(`API «Фонотеки»: http://localhost:${config.port}/api/v1 · документація: /api-docs`);
});

async function shutdown(signal) {
  logger.info(`Отримано ${signal}, завершуємо роботу…`);
  server.close(async () => {
    await closePool();
    logger.info('Завершено коректно');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref(); // запасний вихід
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

🤔 **Навіщо `shutdown`?** Хостинг зупиняє сервер сигналом `SIGTERM` (при
кожному розгортанні), а ви — `Ctrl+C` (`SIGINT`). Коректне завершення:
перестати приймати нові з'єднання, **дочекатися** відповідей на запити, що
вже виконуються, закрити пул з'єднань з базою, і лише тоді вийти. Без цього
користувач, чий запит був «у польоті», отримає обірване з'єднання.

Запустіть сервер:

```bash
npm run dev
```

У терміналі: `[12:00:00] INFO: API «Фонотеки»: http://localhost:3000/api/v1 · документація: /api-docs`
(документації поки немає — вона з'явиться в кроці 13).

**Запуск у WebStorm.** Замість терміналу можна відкрити `package.json` і
натиснути зелену стрілку ▶ біля скрипта `dev`. WebStorm створить
конфігурацію запуску, і в ній працюватиме **налагоджувач**: поставте точку
зупину (клік ліворуч від номера рядка) і запустіть **Debug** 🐞.

### ✅ Контрольна точка 6

У другому терміналі (кнопка **+** у вікні Terminal):

```bash
curl -i http://localhost:3000/health
```

```http
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';…
X-Content-Type-Options: nosniff
X-Request-Id: 6f1c0a52-…
Content-Type: application/json; charset=utf-8

{"status":"ok","database":"up","uptime":12,"timestamp":"2026-11-11T10:00:00.000Z"}
```

```bash
curl -i http://localhost:3000/nope
# 404 {"status":404,"message":"Маршрут GET /nope не знайдено","path":"/nope","timestamp":"…"}

curl -i -X POST http://localhost:3000/health -H 'Content-Type: application/json' -d '{"a":'
# 400 {"status":400,"message":"Некоректний JSON у тілі запиту",…}
```

У терміналі сервера на кожен запит — один рядок на кшталт
`INFO: [6f1c0a52] GET /health 200 — 3 мс` (жовтий `WARN` для 4xx).

### 🧪 Експерименти

1. **База впала.** `docker compose stop` → `curl -i http://localhost:3000/health`
   → `503` і `"database":"down"`. Сервер при цьому живий. `docker compose
   start` → знову `200`.
2. **Сервер без бази.** Зупиніть сервер (`Ctrl+C`), потім базу, і
   запустіть `npm run dev`: `FATAL: Немає з'єднання з PostgreSQL…` — сервер
   не стартує з напівробочим станом. Поверніть базу.
3. **Без обробника помилок.** Закоментуйте `app.use(errorHandler);` і
   надішліть битий JSON ще раз: Express відповість HTML-сторінкою **зі
   стеком викликів** — саме те, що заборонено показувати клієнту.
4. **Порядок middleware.** Перенесіть `app.use(notFoundHandler);` вище за
   `app.use('/health', …)`: тепер 404 віддається навіть на `/health`.

Поверніть код.

---

## 7. Демо-дані (seed)

### 📚 Теорія: seed

**Seed** («засів») — скрипт, який наповнює базу правдоподібними даними для
розробки й демонстрації. Без даних неможливо перевірити ні пагінацію, ні
пошук, ні сортування.

Наш seed:

- **детермінований**: 25 альбомів описано вручну, решту генерує простий
  генератор псевдовипадкових чисел із фіксованим початковим значенням —
  кожен запуск дає **той самий** набір (зручно для інструкцій і тестів);
- спершу **очищає** таблиці (`TRUNCATE … RESTART IDENTITY CASCADE`), тож
  його можна запускати скільки завгодно разів — лише в розробці!;
- вставляє всі рядки таблиці **одним** багаторядковим `INSERT … VALUES (…),
  (…), …` — у сотні разів швидше, ніж запит на кожен рядок;
- виконує все в **транзакції**: якщо щось упаде посередині, база лишиться
  такою, якою була;
- створює двох користувачів із **хешованими** паролями (`bcrypt`, крок 12) —
  у базі ніколи немає паролів у відкритому вигляді, навіть тестових.

📄 **`src/data/seed-data.js`**
```js
// Демо-дані «Фонотеки» (виконавці й альбоми вигадані).
// 25 альбомів описано вручну, решту генерує buildAlbums() — детерміновано,
// тому кожен запуск seed дає однаковий набір.

export const artists = [
  { name: 'Карпатський вітер', country: 'Україна' },
  { name: 'Нічний трамвай', country: 'Україна' },
  { name: 'Тихий квартет', country: 'Україна' },
  { name: 'Пульсар', country: 'Польща' },
  { name: 'Соняшникове поле', country: 'Україна' },
  { name: 'Північне сяйво', country: 'Норвегія' },
  { name: 'Срібні струни', country: 'Україна' },
  { name: 'Дельта', country: 'Чехія' },
  { name: 'Морська піна', country: 'Литва' },
  { name: 'Електрична ріка', country: 'Україна' },
  { name: 'Фарби осені', country: 'Україна' },
  { name: 'Вулиця Сонячна', country: 'Польща' },
];

const album = (
  title,
  artist,
  releaseDate,
  trackCount,
  rating,
  format,
  inCollection,
  description,
) => ({
  title,
  artist,
  releaseDate,
  trackCount,
  durationMinutes: trackCount * 4 + 3,
  rating,
  format,
  inCollection,
  description,
});

const handcrafted = [
  album(
    'Гірська весна',
    'Карпатський вітер',
    '2014-04-18',
    11,
    5,
    'vinyl',
    true,
    'Дебютний альбом гурту: трембіта, електрогітари й пісні, записані наживо в Яремчі.',
  ),
  album(
    'Полонина',
    'Карпатський вітер',
    '2016-09-02',
    9,
    4,
    'cd',
    true,
    'Камерний акустичний альбом — лише голоси, скрипка й цимбали.',
  ),
  album(
    'Смереки в тумані',
    'Карпатський вітер',
    '2019-03-15',
    12,
    4,
    'digital',
    false,
    'Найважчий за звучанням альбом гурту з довгими інструментальними частинами.',
  ),
  album(
    'Вітер змін',
    'Карпатський вітер',
    '2022-11-11',
    10,
    null,
    'digital',
    false,
    'Рок-альбом про дорогу додому. Записаний у трьох містах за один місяць.',
  ),
  album(
    'Остання зупинка',
    'Нічний трамвай',
    '2012-06-01',
    13,
    5,
    'vinyl',
    true,
    'Гаражний рок, записаний у підвалі колишнього трамвайного депо.',
  ),
  album(
    'Нічні маршрути',
    'Нічний трамвай',
    '2015-10-23',
    10,
    3,
    'cd',
    false,
    'Пісні про місто після опівночі: ліхтарі, порожні проспекти й останні рейси.',
  ),
  album(
    'Кільцева',
    'Нічний трамвай',
    '2018-02-14',
    8,
    4,
    'digital',
    true,
    'Найпопулярніший альбом гурту з трьома радіосинглами.',
  ),
  album(
    'Депо',
    'Нічний трамвай',
    '2021-05-07',
    11,
    4,
    'vinyl',
    false,
    'Повернення до сирого звуку перших записів.',
  ),
  album(
    'Акустика',
    'Нічний трамвай',
    '2024-08-30',
    7,
    null,
    'digital',
    false,
    'Старі пісні гурту в акустичних аранжуваннях.',
  ),
  album(
    'Тиша між нотами',
    'Тихий квартет',
    '2010-01-20',
    8,
    5,
    'cd',
    true,
    'Класичний джазовий квартет: фортепіано, контрабас, барабани й саксофон.',
  ),
  album(
    'Осінній свінг',
    'Тихий квартет',
    '2013-10-01',
    9,
    4,
    'vinyl',
    true,
    'Власні композиції в стилі свінгу 1940-х.',
  ),
  album(
    'Нічне кафе',
    'Тихий квартет',
    '2017-12-08',
    10,
    3,
    'cd',
    false,
    'Джазові версії відомих поп-пісень.',
  ),
  album(
    'Імпровізації',
    'Тихий квартет',
    '2020-04-24',
    6,
    5,
    'digital',
    false,
    'Шість довгих імпровізацій, записаних за один вечір без жодного дубля.',
  ),
  album(
    'Сигнал',
    'Пульсар',
    '2011-07-15',
    12,
    4,
    'digital',
    false,
    'Мінімалістичне техно, натхненне звуками радіотелескопів.',
  ),
  album(
    'Орбіта',
    'Пульсар',
    '2014-03-03',
    10,
    3,
    'cd',
    false,
    'Найбільш танцювальний альбом проєкту.',
  ),
  album(
    'Темна матерія',
    'Пульсар',
    '2017-09-29',
    9,
    5,
    'vinyl',
    true,
    'Повільна атмосферна електроніка для навушників.',
  ),
  album(
    'Квазар',
    'Пульсар',
    '2020-11-20',
    11,
    4,
    'digital',
    true,
    'Електроніка з живими гітарами й вокалом запрошених музикантів.',
  ),
  album(
    'Гравітація',
    'Пульсар',
    '2023-06-16',
    8,
    null,
    'digital',
    false,
    'Останній на сьогодні альбом проєкту — коротший і жорсткіший за попередні.',
  ),
  album(
    'Жовте літо',
    'Соняшникове поле',
    '2013-05-31',
    10,
    4,
    'cd',
    true,
    'Легкий інді-поп про канікули, велосипеди й море.',
  ),
  album(
    'Під небом',
    'Соняшникове поле',
    '2015-08-14',
    11,
    3,
    'digital',
    false,
    'Альбом із найвідомішою піснею гурту «Небо над полем».',
  ),
  album(
    'Насіння',
    'Соняшникове поле',
    '2018-09-21',
    9,
    5,
    'vinyl',
    true,
    'Інді-поп із фолковими мелодіями та сопілкою.',
  ),
  album(
    'Серпень',
    'Соняшникове поле',
    '2021-08-24',
    10,
    4,
    'digital',
    false,
    'Пісні, написані протягом одного серпня в селі під Полтавою.',
  ),
  album(
    'Жнива',
    'Соняшникове поле',
    '2024-10-04',
    12,
    null,
    'cd',
    false,
    'Найдовший альбом гурту, записаний із камерним оркестром.',
  ),
  album(
    'Колискові',
    'Тихий квартет',
    '2022-02-18',
    10,
    4,
    'cd',
    false,
    'Українські колискові в джазових аранжуваннях.',
  ),
  album(
    'Живий звук',
    'Карпатський вітер',
    '2025-07-11',
    14,
    5,
    'vinyl',
    false,
    'Концертний запис ювілейного туру гурту.',
  ),
];

// --- Генератор решти альбомів ---

// Простий детермінований генератор псевдовипадкових чисел (mulberry32):
// той самий seed → та сама послідовність, тож дані однакові на всіх комп'ютерах.
function createRandom(seed) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Прикметники в трьох родах, щоб узгоджувати з іменниками: «Тихий вітер», «Тиха ніч», «Тихі сни»
const ADJECTIVES = [
  ['Тихий', 'Тиха', 'Тихі'],
  ['Нічний', 'Нічна', 'Нічні'],
  ['Осінній', 'Осіння', 'Осінні'],
  ['Синій', 'Синя', 'Сині'],
  ['Далекий', 'Далека', 'Далекі'],
  ['Теплий', 'Тепла', 'Теплі'],
  ['Золотий', 'Золота', 'Золоті'],
  ['Срібний', 'Срібна', 'Срібні'],
  ['Старий', 'Стара', 'Старі'],
  ['Ранковий', 'Ранкова', 'Ранкові'],
  ['Зимовий', 'Зимова', 'Зимові'],
  ['Весняний', 'Весняна', 'Весняні'],
  ['Міський', 'Міська', 'Міські'],
  ['Лісовий', 'Лісова', 'Лісові'],
  ['Морський', 'Морська', 'Морські'],
  ['Гірський', 'Гірська', 'Гірські'],
];
const NOUNS = [
  [
    'світанок',
    'вітер',
    'берег',
    'вогонь',
    'сад',
    'потяг',
    'дощ',
    'маяк',
    'острів',
    'шлях',
    'ритм',
    'вальс',
    'блюз',
    'горизонт',
  ],
  [
    'ніч',
    'ріка',
    'дорога',
    'хвиля',
    'зоря',
    'пісня',
    'тиша',
    'гавань',
    'мелодія',
    'станція',
    'площа',
    'долина',
    'весна',
    'планета',
  ],
  ['вогні', 'мости', 'дахи', 'сни', 'кроки', 'двори', 'хмари', 'квіти', 'вулиці', 'птахи'],
];
const KINDS = [
  'Студійний альбом',
  'Концертний запис',
  'Акустична програма',
  'Збірка пісень',
  'Інструментальний альбом',
];
// Із комою — дієприкметникові звороти, без коми — решта
const MOODS = [
  ' про дорогу й повернення додому',
  ', записаний за один тиждень у маленькій студії',
  ' з камерним оркестром і живими барабанами',
  ' для неспішних вечорів і довгих розмов',
  ' із впливами джазу й електроніки',
  ', натхненний мандрівками Карпатами',
  ' про місто, що ніколи не спить',
];
const FORMATS = ['vinyl', 'cd', 'cassette', 'digital'];

const pick = (random, items) => items[Math.floor(random() * items.length)];

/** Повертає count альбомів: спершу 25 описаних вручну, далі — згенеровані */
export function buildAlbums(count) {
  const random = createRandom(2026);
  const result = handcrafted.slice(0, count);
  const used = new Set(result.map((item) => item.title.toLowerCase()));

  while (result.length < count) {
    const gender = Math.floor(random() * 3);
    const title = `${pick(random, ADJECTIVES)[gender]} ${pick(random, NOUNS[gender])}`;
    if (used.has(title.toLowerCase())) continue;
    used.add(title.toLowerCase());

    const year = 1995 + Math.floor(random() * 31); // 1995–2025
    const month = String(1 + Math.floor(random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(random() * 28)).padStart(2, '0');
    const trackCount = 6 + Math.floor(random() * 11);

    result.push({
      title,
      artist: pick(random, artists).name,
      releaseDate: `${year}-${month}-${day}`,
      trackCount,
      durationMinutes: trackCount * 4 + Math.floor(random() * 9),
      rating: random() < 0.15 ? null : 1 + Math.floor(random() * 5),
      format: pick(random, FORMATS),
      inCollection: random() < 0.35,
      description: `${pick(random, KINDS)}${pick(random, MOODS)}.`,
    });
  }
  return result;
}
```

📄 **`scripts/seed.js`**
```js
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
```

🤔 **Хіба `INSERT INTO ${table} (${columns…})` — не склеювання SQL?** Так,
але назви таблиць і стовпців тут — **константи з нашого коду**, а не дані
користувача. Усі **значення** йдуть параметрами `$1, $2, …`. Правило
«лише параметри» стосується даних, що приходять ззовні (крок 9).

### ✅ Контрольна точка 7

```bash
npm run seed
# Наповнення бази…
# ✔ Користувачів: 2, виконавців: 12, альбомів: 60
```

```sql
SELECT ar.name, COUNT(*) AS albums
  FROM albums a JOIN artists ar ON ar.id = a.artist_id
 GROUP BY ar.name ORDER BY albums DESC;

SELECT email, role, left(password_hash, 7) AS hash_start FROM users;
-- admin@fonoteka.test | ADMIN | $2b$12$   ← bcrypt, вартість 12
```

### 🧪 Експерименти

1. Запустіть `npm run seed` удруге й порівняйте назви перших альбомів
   (`SELECT title FROM albums ORDER BY title LIMIT 5;`) — вони ті самі.
2. `SEED_ALBUMS=200 npm run seed` — альбомів стане 200 (у Windows
   PowerShell: `$env:SEED_ALBUMS=200; npm run seed`).
3. Виконайте `EXPLAIN SELECT * FROM albums WHERE title ILIKE '%ніч%';` на 200
   альбомах. Після `SET enable_seqscan = off;` (лише для експерименту:
   на маленькій таблиці планувальник і так обирає повний перегляд) ви
   побачите `Bitmap Index Scan on albums_title_trgm_index` — триграмний
   індекс працює.

Після експериментів поверніть 60 альбомів — `npm run seed` (у PowerShell
спершу `Remove-Item Env:SEED_ALBUMS`): від цієї кількості залежать
результати наступних контрольних точок.

---
## 8. Валідація вхідних даних

### 📚 Теорія: чому валідація на сервері обов'язкова

У частині II клієнт теж перевірятиме форму. Але сервер **не може йому
довіряти**: запит можна надіслати з `curl`, Postman чи зміненого JavaScript
у DevTools. Перевірки клієнта — для зручності користувача, перевірки
сервера — для **безпеки й цілісності даних**.

Дані приходять із трьох джерел, і перевіряти треба всі:

| Джерело | Приклад | Особливість |
|---|---|---|
| `req.body` | `{ "title": "Земля", "trackCount": 12 }` | JSON: є числа, логічні значення, `null` |
| `req.query` | `?limit=20&inCollection=true` | **усе — рядки**: `'20'`, `'true'` (або масив, якщо параметр повторено) |
| `req.params` | `/albums/:id` | рядок з адреси |

### 📚 Теорія: Zod

**Zod** описує очікувану форму даних **схемою** і перевіряє дані проти неї:

```js
const schema = z.object({ title: z.string().trim().min(1), rating: z.number().int().optional() });
schema.safeParse({ title: '  Земля ' });  // { success: true, data: { title: 'Земля' } }
schema.safeParse({ title: 42 });          // { success: false, error: { issues: [...] } }
```

Схема не лише **перевіряє**, а й **очищає й перетворює** дані: обрізає
пробіли (`.trim()`), підставляє значення за замовчуванням (`.default()`),
перетворює типи (`.transform()`). Далі в коді ми працюємо лише з
результатом `data` — гарантовано правильної форми.

| Метод | Що робить |
|---|---|
| `.strict()` | **невідоме поле — помилка**. Захист від *mass assignment*: клієнт не протягне `"role": "ADMIN"` чи `"id"` |
| `.nullable()`, `.optional()`, `.default(x)` | дозволити `null` / відсутність поля / підставити значення |
| `.refine(fn, …)` | власне правило: «рік «від» не більший за рік «до»» |
| `.partial()` | усі поля необов'язкові — для `PATCH` |
| `z.preprocess(fn, schema)` | змінити значення **до** перевірки: рядок із query → число |
| `z.config(z.locales.uk())` | стандартні повідомлення — українською |

У Zod 4 текст помилки передається параметром `error`:
`z.string().min(1, { error: "Назва обов'язкова" })`. Готові формати —
`z.uuid()`, `z.email()`, `z.url()`, `z.iso.date()`.

### 8.1. Спільні схеми

📄 **`src/validators/common.js`**
```js
import { z } from 'zod';

// Повідомлення за замовчуванням — українською (для перевірок без власного тексту)
z.config(z.locales.uk());

/** Параметр шляху :id для альбомів (UUID) */
export const uuidParamSchema = z.object({
  // PostgreSQL повертає UUID малими літерами; приводимо й параметр, щоб порівняння id збігалися
  id: z.uuid({ error: 'Некоректний ідентифікатор' }).transform((value) => value.toLowerCase()),
});

/** Параметр шляху :id для довідників (ціле число > 0) */
export const intIdParamSchema = z.object({
  id: z.coerce
    .number({ error: 'Некоректний ідентифікатор' })
    .int({ error: 'Некоректний ідентифікатор' })
    .positive({ error: 'Некоректний ідентифікатор' })
    .max(2_147_483_647, { error: 'Некоректний ідентифікатор' }),
});

/**
 * Query-параметр → ціле число в межах [min, max]. У query усе — рядки (або масив, якщо
 * параметр повторено), тому перетворюємо самі: порожній рядок = «фільтр не задано».
 */
export function queryInt(min, max, message, defaultValue) {
  const number = z
    .number({ error: message })
    .int({ error: message })
    .min(min, { error: message })
    .max(max, { error: message });

  return z.preprocess(
    (value) => (value === undefined || String(value).trim() === '' ? undefined : Number(value)),
    defaultValue === undefined ? number.optional() : number.default(defaultValue),
  );
}
```

🤔 **Навіщо власний `queryInt`, якщо є `z.coerce.number()`?** `coerce`
перетворює порожній рядок на `0`: запит `?ratingMin=` (поле фільтра
очистили) означав би «оцінка ≥ 0», а `?limit=` — «нуль записів». Ми
вважаємо порожній рядок «параметр не задано».

### 8.2. Схеми альбому

📄 **`src/validators/album.schemas.js`**
```js
import { z } from 'zod';
import { queryInt } from './common.js';

export const FORMATS = ['vinyl', 'cd', 'cassette', 'digital'];
export const SORT_FIELDS = ['title', 'releaseDate', 'rating', 'trackCount', 'createdAt'];

const required = (message) => ({
  error: (issue) => (issue.input === undefined ? "Обов'язкове поле" : message),
});

// Тіло альбому для POST і PUT (повний ресурс).
// .strict() — невідомі поля відхиляються: захист від mass assignment.
export const albumCreateSchema = z
  .object({
    title: z
      .string(required('Назва має бути рядком'))
      .trim()
      .min(1, { error: "Назва обов'язкова" })
      .max(200, { error: 'Максимум 200 символів' }),
    description: z
      .string({ error: 'Опис має бути рядком' })
      .trim()
      .max(2000, { error: 'Максимум 2000 символів' })
      .nullable()
      .default(null)
      .transform((value) => value || null), // порожній рядок → null
    artistId: z
      .number(required('Потрібен id виконавця'))
      .int({ error: 'Потрібен id виконавця' })
      .positive({ error: 'Потрібен id виконавця' }),
    releaseDate: z.iso
      .date(required('Дата у форматі РРРР-ММ-ДД'))
      .refine((value) => value >= '1900-01-01', { error: 'Не раніше 1900 року' }),
    trackCount: z
      .number(required('Кількість треків — ціле число'))
      .int({ error: 'Кількість треків — ціле число' })
      .min(1, { error: 'Від 1 до 999 треків' })
      .max(999, { error: 'Від 1 до 999 треків' }),
    durationMinutes: z
      .number({ error: 'Тривалість — ціле число хвилин' })
      .int({ error: 'Тривалість — ціле число хвилин' })
      .min(1, { error: 'Від 1 до 600 хвилин' })
      .max(600, { error: 'Від 1 до 600 хвилин' })
      .nullable()
      .default(null),
    rating: z
      .number({ error: 'Оцінка — ціле число від 1 до 5' })
      .int({ error: 'Оцінка — ціле число від 1 до 5' })
      .min(1, { error: 'Оцінка — ціле число від 1 до 5' })
      .max(5, { error: 'Оцінка — ціле число від 1 до 5' })
      .nullable()
      .default(null),
    format: z.enum(FORMATS, required(`Формат: ${FORMATS.join(', ')}`)),
    inCollection: z.boolean({ error: 'Очікується true або false' }).default(false),
    coverUrl: z
      .url({ protocol: /^https?$/, error: 'Посилання має починатися з http:// або https://' })
      .max(500, { error: 'Максимум 500 символів' })
      .nullable()
      .default(null),
  })
  .strict();

// PATCH: усі поля необов'язкові, але хоча б одне має бути.
// Значення за замовчуванням прибираємо, інакше PATCH { rating: 5 } скинув би решту полів.
export const albumPatchSchema = z
  .object({
    title: albumCreateSchema.shape.title,
    description: z
      .string({ error: 'Опис має бути рядком' })
      .trim()
      .max(2000)
      .nullable()
      .transform((value) => value || null),
    artistId: albumCreateSchema.shape.artistId,
    releaseDate: albumCreateSchema.shape.releaseDate,
    trackCount: albumCreateSchema.shape.trackCount,
    durationMinutes: albumCreateSchema.shape.durationMinutes.unwrap(),
    rating: albumCreateSchema.shape.rating.unwrap(),
    format: albumCreateSchema.shape.format,
    inCollection: z.boolean({ error: 'Очікується true або false' }),
    coverUrl: albumCreateSchema.shape.coverUrl.unwrap(),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    error: 'Потрібно передати хоча б одне поле для оновлення',
    path: ['body'],
  });

// Query-параметри списку й /count: рядки → числа й булеві, межі, значення за замовчуванням
const filtersShape = {
  search: z.string().trim().max(100, { error: 'Максимум 100 символів' }).optional(),
  artistId: queryInt(1, 2_147_483_647, 'Ціле число > 0'),
  format: z.enum(FORMATS, { error: `Формат: ${FORMATS.join(', ')}` }).optional(),
  inCollection: z
    .enum(['true', 'false'], { error: 'Очікується true або false' })
    .transform((value) => value === 'true')
    .optional(),
  yearFrom: queryInt(1900, 2100, 'Рік від 1900 до 2100'),
  yearTo: queryInt(1900, 2100, 'Рік від 1900 до 2100'),
  ratingMin: queryInt(1, 5, 'Оцінка від 1 до 5'),
};

const yearRange = (data) => !data.yearFrom || !data.yearTo || data.yearFrom <= data.yearTo;
const yearRangeError = { error: 'yearFrom не може бути більшим за yearTo', path: ['yearFrom'] };

export const albumFiltersSchema = z.object(filtersShape).refine(yearRange, yearRangeError);

export const albumListQuerySchema = z
  .object({
    ...filtersShape,
    sort: z.enum(SORT_FIELDS, { error: `Сортування: ${SORT_FIELDS.join(', ')}` }).default('title'),
    order: z.enum(['asc', 'desc'], { error: 'Напрямок: asc або desc' }).default('asc'),
    limit: queryInt(1, 100, 'Ціле число від 1 до 100', 20),
    offset: queryInt(0, 1_000_000, 'Ціле число ≥ 0', 0),
  })
  .refine(yearRange, yearRangeError);
```

🤔 **PUT проти PATCH.** `PUT` **замінює** ресурс повністю: клієнт надсилає
всі поля, а не надіслані необов'язкові стають `null` (саме тому в
`albumCreateSchema` стоять `.default(null)`). `PATCH` змінює **лише
надіслане**, тому в `albumPatchSchema` значень за замовчуванням немає:
інакше `PATCH { "rating": 5 }` непомітно стер би опис і обкладинку.

🤔 **Навіщо `required(…)`?** Щоб для відсутнього поля було коротке
«Обов'язкове поле», а для поля неправильного типу (`"trackCount": "12"`) —
точніше «Кількість треків — ціле число».

### 8.3. Middleware валідації

Одна функція-**фабрика** для всіх маршрутів: `validate(схема, джерело)`
повертає middleware, яке перевіряє `req.body`, `req.query` або `req.params` і
кладе очищені дані в `req.validatedBody` / `validatedQuery` /
`validatedParams`. Помилки Zod перетворюються на масив `{ field, message }`
— той самий формат, що й у відповіді з помилкою.

📄 **`src/middlewares/validate.js`**
```js
import { ValidationError } from '../errors/index.js';

// Куди класти очищені дані залежно від джерела
const TARGETS = { body: 'validatedBody', query: 'validatedQuery', params: 'validatedParams' };

/** Перетворює помилки Zod на [{ field, message }] — формат, який чекає клієнт */
export function toFieldErrors(issues, source) {
  return issues.flatMap((issue) => {
    // Невідомі поля (.strict()) Zod повідомляє одним записом на весь об'єкт
    if (issue.code === 'unrecognized_keys') {
      return issue.keys.map((key) => ({ field: key, message: 'Невідоме поле' }));
    }
    return [{ field: issue.path.join('.') || source, message: issue.message }];
  });
}

/**
 * Middleware-фабрика: validate(schema, 'body' | 'query' | 'params').
 * Очищені й приведені до потрібних типів дані — у req.validatedBody / validatedQuery / validatedParams.
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(new ValidationError(toFieldErrors(result.error.issues, source)));
    }
    req[TARGETS[source]] = result.data;
    next();
  };
}
```

🤔 **Чому не перезаписати `req.query` очищеними даними?** В Express 5
`req.query` — **гетер** без сетера, який щоразу розбирає адресу заново;
присвоєння йому в ES-модулі (а вони завжди в строгому режимі) кидає
`TypeError`. Окреме поле
`req.validatedQuery` ще й явно показує в контролері: «ці дані вже
перевірено».

### ✅ Контрольна точка 8

Перевіримо схему без сервера:

```bash
node -e "import('./src/validators/album.schemas.js').then(({ albumListQuerySchema: s }) => { console.log(s.parse({ limit: '5', inCollection: 'true', search: '  ніч ' })); console.log(s.safeParse({ limit: '1000', sort: 'password_hash' }).error.issues.map((i) => i.path.join('.') + ': ' + i.message)); })"
```

```text
{ search: 'ніч', inCollection: true, sort: 'title', order: 'asc', limit: 5, offset: 0 }
[ 'sort: Сортування: title, releaseDate, rating, trackCount, createdAt',
  'limit: Ціле число від 1 до 100' ]
```

Рядки стали числами й логічним значенням, пробіли обрізано, відсутні
параметри отримали значення за замовчуванням, а неприпустимі — зрозумілі
помилки.

### 🧪 Експеримент: mass assignment

```bash
node -e "import('./src/validators/album.schemas.js').then(({ albumCreateSchema: s }) => console.log(s.safeParse({ title: 'Тест', artistId: 1, releaseDate: '2020-01-01', trackCount: 5, format: 'cd', id: 'hack' }).success))"
```

Результат `false`: поле `id` невідоме. Приберіть `.strict()` у
`albumCreateSchema`, повторіть — `true`, а `id` просто зникне з `data`
(Zod за замовчуванням відкидає невідомі поля **мовчки**). Безпечно, але
клієнт не дізнається, що надіслав зайве. `.strict()` робить помилку явною.
Поверніть `.strict()`.

---

## 9. Репозиторії й мапери: увесь SQL в одному місці

### 📚 Теорія: SQL-ін'єкція і параметризовані запити

Найнебезпечніша помилка серверного коду — **склеїти SQL із даними
користувача**:

```js
// ❌ НІКОЛИ
pool.query(`SELECT * FROM albums WHERE title ILIKE '%${search}%'`);
```

Пошук `zzz' OR '%'='` перетворить умову на `title ILIKE '%zzz' OR '%'='%'`, яка
істинна для всіх рядків, а хитріший рядок прочитає таблицю `users` чи
видалить дані. Навіть невинний апостроф у слові «пам'ять» зламає запит.

**Параметризований запит** надсилає текст SQL і значення **окремо**:

```js
// ✅ ЗАВЖДИ
pool.query('SELECT * FROM albums WHERE title ILIKE $1', [`%${search}%`]);
```

База отримує вже розібраний запит із «дірками» `$1, $2` і підставляє значення
як **дані**, а не як код. Жоден символ у значенні не змінить структуру
запиту.

⚠️ **Параметром не можна передати назву стовпця чи `ASC/DESC`** — лише
значення. Тому стовпець сортування беремо з **білого списку**
`SORT_COLUMNS`: у текст SQL потрапляє лише рядок із нашого коду. (Валідатор
уже відкинув інші значення `sort`, але репозиторій не покладається на це —
захист у два шари.)

### 📚 Теорія: список із фільтрами, сортуванням і пагінацією

```sql
SELECT a.*, ar.name AS artist_name, ar.country AS artist_country
  FROM albums a
  JOIN artists ar ON ar.id = a.artist_id      -- виконавець — тим самим запитом
 WHERE a.title ILIKE $1 AND a.format = $2      -- лише задані фільтри
 ORDER BY a.release_date DESC NULLS LAST, a.id -- стабільний порядок
 LIMIT $3 OFFSET $4;                           -- одна сторінка
```

| Деталь | Навіщо |
|---|---|
| `JOIN` замість окремого запиту на виконавця | інакше 20 альбомів = 1 + 20 запитів (**проблема N+1**) |
| умови додаються лише для заданих фільтрів | одна функція `buildFilters` для списку й для `/count` — результати не розійдуться |
| `ILIKE` | пошук без урахування регістру (PostgreSQL) |
| екранування `%` і `_` | у `LIKE` це спецсимволи; пошук «100%» має шукати саме «100%» |
| `NULLS LAST` | альбоми без оцінки — в кінці і при `ASC`, і при `DESC` |
| `, a.id` в `ORDER BY` | у багатьох альбомів однакова оцінка; без другого ключа база може віддати їх у різному порядку на різних сторінках — і запис з'явиться двічі або зникне |
| `LIMIT … OFFSET …` | сторінка 3 по 20 = `LIMIT 20 OFFSET 40` |
| `COUNT(*)::int` | `COUNT` повертає `bigint`, який `pg` віддає **рядком** `'60'` (щоб не втратити точність великих чисел); `::int` дає число |

### 9.1. Репозиторії

📄 **`src/repositories/albums.repository.js`**
```js
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
```

🤔 **Чому `update` повертає `true/false`, а не оновлений альбом?** Бо
`PUT`/`PATCH` відповідають `204 No Content` без тіла (крок 10). Зайвий
`SELECT` після оновлення не потрібен.

📄 **`src/repositories/artists.repository.js`**
```js
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
```

### 📚 Теорія: мапер

Рядок із бази має назви стовпців (`release_date`, `artist_name`), а клієнт
очікує camelCase і вкладений об'єкт `artist`. **Мапер** перетворює одне на
інше. Він же — **контракт API**: що не потрапило в мапер, назовні не
потрапить ніколи (саме так `password_hash` ніколи не піде клієнту, крок 12).
Перейменували стовпець у базі — змінюється один рядок мапера, а не клієнт.

📄 **`src/mappers/album.mapper.js`**
```js
// Мапер: рядок таблиці (snake_case) → те, що бачить клієнт (camelCase).
// Контракт API не залежить від назв стовпців у базі.
export function toAlbumResponse(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    artist: { id: row.artist_id, name: row.artist_name, country: row.artist_country },
    releaseDate: row.release_date,
    trackCount: row.track_count,
    durationMinutes: row.duration_minutes,
    rating: row.rating,
    format: row.format,
    inCollection: row.in_collection,
    coverUrl: row.cover_url,
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
    country: row.country,
    albumCount: row.album_count,
  };
}
```

### ✅ Контрольна точка 9

```bash
node -e "import('./src/repositories/albums.repository.js').then(async (repo) => { const rows = await repo.findAll({ filters: { search: 'ніч' }, sort: 'releaseDate', order: 'desc', limit: 3, offset: 0 }); console.log(rows.map((a) => a.release_date + ' ' + a.title + ' (' + a.artist_name + ')')); console.log(await repo.count({ search: 'ніч' })); process.exit(0); })"
```

```text
[ '2024-01-11 Нічні птахи (Тихий квартет)',
  '2022-09-12 Нічні мости (Електрична ріка)',
  '2017-12-08 Нічне кафе (Тихий квартет)' ]
6
```

(`process.exit(0)` потрібен лише тут: відкритий пул з'єднань не дає процесу
завершитися самому.)

---

## 10. Сервіси й контролери

### 📚 Теорія: бізнес-правила — у сервісі

**Сервіс** відповідає на питання «що можна робити з даними»:

- назва альбому унікальна (без урахування регістру);
- виконавець, на якого посилається альбом, має існувати;
- альбом, який редагують чи видаляють, має існувати.

Сервіс **не знає про HTTP**: у ньому немає `req`, `res` і статусів. Він
кидає наші помилки (`ConflictError`, `NotFoundError`) — а статус їм дасть
обробник помилок. Завдяки цьому той самий сервіс можна викликати з
консольного скрипта, з тесту чи з іншого сервісу.

`list` виконує два незалежні запити — сторінку і загальну кількість —
**паралельно** через `Promise.all`: час відповіді = найдовший із двох, а не
їхня сума.

📄 **`src/services/albums.service.js`**
```js
// Сервіс альбомів: бізнес-правила. НЕ знає про HTTP (жодних req, res, статусів).
import * as albumsRepository from '../repositories/albums.repository.js';
import * as artistsRepository from '../repositories/artists.repository.js';
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

export async function count(filters) {
  return albumsRepository.count(filters);
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

// Правило: виконавець, на якого посилається альбом, має існувати
async function ensureArtistExists(artistId) {
  if (artistId !== undefined && !(await artistsRepository.findById(artistId))) {
    throw new ValidationError([
      { field: 'artistId', message: `Виконавця з id ${artistId} не існує` },
    ]);
  }
}

export async function create(data) {
  await ensureTitleIsFree(data.title);
  await ensureArtistExists(data.artistId);
  return toAlbumResponse(await albumsRepository.create(data));
}

/** І PUT (усі поля), і PATCH (лише передані) — різницю забезпечує схема валідації */
export async function update(id, data) {
  const existing = await albumsRepository.findById(id);
  if (!existing) throw new NotFoundError('Альбом');

  if (data.title !== undefined) await ensureTitleIsFree(data.title, id);
  await ensureArtistExists(data.artistId);

  await albumsRepository.update(id, data);
}

export async function remove(id) {
  const deleted = await albumsRepository.remove(id);
  if (!deleted) throw new NotFoundError('Альбом');
}
```

🤔 **Чому перевірка виконавця дає 400, а не 404?** 404 означає «немає
ресурсу за **цією адресою**». Адреса `/albums` існує; неправильне саме
**значення поля** `artistId` у тілі. Тому — помилка валідації цього поля, і
клієнт покаже її біля потрібного поля форми.

📄 **`src/services/artists.service.js`**
```js
import * as artistsRepository from '../repositories/artists.repository.js';
import { toArtistResponse } from '../mappers/artist.mapper.js';

export async function list() {
  const rows = await artistsRepository.findAll();
  return rows.map(toArtistResponse);
}
```

### 📚 Теорія: коди відповідей REST

| Дія | Успіх | Чому |
|---|---|---|
| `GET` список / один | `200 OK` + дані | |
| `POST` (створення) | **`201 Created`** + заголовок **`Location: /api/v1/albums/<id>`** + створений ресурс | `Location` каже клієнту, де тепер живе новий ресурс |
| `PUT`, `PATCH` | **`204 No Content`** без тіла | клієнт і так знає, що надіслав |
| `DELETE` | **`204 No Content`** | |

**Контролер** — тонкий перекладач між HTTP і сервісом: взяти перевірені
дані з `req`, викликати сервіс, сформувати `res`. Жодного SQL і жодних
бізнес-правил. Зверніть увагу: у контролерах немає `try/catch` — помилки
сервісу Express 5 сам передасть в `errorHandler`.

📄 **`src/controllers/albums.controller.js`**
```js
// Контролер — тонкий шар: читає req, викликає сервіс, формує res. Жодної бізнес-логіки й SQL.
import * as albumsService from '../services/albums.service.js';

export async function list(req, res) {
  const { data, total } = await albumsService.list(req.validatedQuery);
  res.set('X-Total-Count', String(total));
  res.json(data); // Завдання №4: список — масив, кількість — у заголовку й на /count
}

export async function count(req, res) {
  res.json({ total: await albumsService.count(req.validatedQuery) });
}

export async function getById(req, res) {
  res.json(await albumsService.getById(req.validatedParams.id));
}

export async function create(req, res) {
  const album = await albumsService.create(req.validatedBody);
  res.status(201).location(`${req.baseUrl}/${album.id}`).json(album);
}

// PUT і PATCH: 204 No Content — тіло не потрібне
export async function update(req, res) {
  await albumsService.update(req.validatedParams.id, req.validatedBody);
  res.status(204).end();
}

export async function remove(req, res) {
  await albumsService.remove(req.validatedParams.id);
  res.status(204).end();
}
```

🤔 **Що таке `req.baseUrl`?** Префікс, за яким підключено роутер:
`/api/v1/albums`. Тож `Location` буде `/api/v1/albums/1f9c…`, і контролер не
дублює шлях, який уже задано в маршрутах.

📄 **`src/controllers/artists.controller.js`**
```js
import * as artistsService from '../services/artists.service.js';

export async function list(req, res) {
  res.json(await artistsService.list());
}
```

---

## 11. Маршрути: перший повний CRUD

### 📚 Теорія: роутер

`Router()` — «міні-застосунок» з власними маршрутами, який підключається
до основного за префіксом: `app.use('/api/v1', apiRoutes)` →
`router.use('/albums', albumsRoutes)` → `router.get('/:id', …)` дає
`GET /api/v1/albums/:id`.

Кожен маршрут — це **ланцюжок middleware**: спершу перевірки
(валідація, а з кроку 12 — токен і роль), потім контролер. Якщо будь-яка
перевірка викликала `next(error)`, контролер не виконається.

⚠️ **Порядок маршрутів важливий.** Express перевіряє їх згори вниз.
Маршрут `/count` мусить стояти **до** `/:id`, інакше слово `count`
сприйметься як `id`.

Цей крок робимо **без автентифікації**: спершу переконаємося, що CRUD
працює, а захист додамо в кроці 12.

📄 **`src/routes/albums.routes.js`** — тимчасова версія
```js
import { Router } from 'express';
import * as controller from '../controllers/albums.controller.js';
import { validate } from '../middlewares/validate.js';
import { uuidParamSchema } from '../validators/common.js';
import {
  albumCreateSchema,
  albumFiltersSchema,
  albumListQuerySchema,
  albumPatchSchema,
} from '../validators/album.schemas.js';

const router = Router();
const validId = validate(uuidParamSchema, 'params');

// ТИМЧАСОВА ВЕРСІЯ (крок 11): поки що без автентифікації — її додамо в кроці 12
router.get('/', validate(albumListQuerySchema, 'query'), controller.list);
router.get('/count', validate(albumFiltersSchema, 'query'), controller.count); // ← до /:id!
router.get('/:id', validId, controller.getById);
router.post('/', validate(albumCreateSchema), controller.create);
router.put('/:id', validId, validate(albumCreateSchema), controller.update);
router.patch('/:id', validId, validate(albumPatchSchema), controller.update);
router.delete('/:id', validId, controller.remove);

export default router;
```

📄 **`src/routes/artists.routes.js`**
```js
import { Router } from 'express';
import * as controller from '../controllers/artists.controller.js';

const router = Router();

router.get('/', controller.list);

export default router;
```

📄 **`src/routes/index.js`** — тимчасова версія
```js
import { Router } from 'express';
import albumsRoutes from './albums.routes.js';
import artistsRoutes from './artists.routes.js';

// ТИМЧАСОВА ВЕРСІЯ (крок 11): маршрути /auth додамо в кроці 12
const router = Router();

router.use('/albums', albumsRoutes);
router.use('/artists', artistsRoutes);

export default router;
```

📄 **`src/app.js`** — тимчасова версія
```js
// Налаштування Express: middleware, маршрути, обробники помилок.
// ТИМЧАСОВА ВЕРСІЯ (крок 11): документацію Swagger додамо в кроці 13.
// Тут НЕМАЄ app.listen() — запуск у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import apiRoutes from './routes/index.js';

const app = express();

// За проксі хостингу (Render, Railway, nginx) — щоб req.ip був IP клієнта, а не проксі
app.set('trust proxy', 1);

app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(httpLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(
  cors({
    origin: config.corsOrigins, // явний список дозволених джерел, а не '*'
    exposedHeaders: ['X-Total-Count', 'Location', 'X-Request-Id', 'Authorization'], // щоб клієнт їх бачив
  }),
);
app.use(express.json({ limit: '100kb' })); // 4. розбір JSON з обмеженням розміру

app.use('/health', healthRoutes);
app.use('/api/v1', apiRoutes);

// Обробники помилок — ЗАВЖДИ останні
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

Сервер, запущений через `npm run dev`, перезапуститься сам.

### ✅ Контрольна точка 10

```bash
# Список: 3 альбоми (масив), загальна кількість — у заголовку
curl -i "http://localhost:3000/api/v1/albums?limit=3&sort=rating&order=desc"
# X-Total-Count: 60
# [{"id":"…","title":"…","artist":{"id":…,"name":"…","country":"…"},"rating":5,…}, …]

# Фільтри й кількість за тими самими фільтрами
curl "http://localhost:3000/api/v1/albums?search=ніч&format=vinyl"
curl "http://localhost:3000/api/v1/albums/count?search=ніч&format=vinyl"   # {"total":…}

# Неприпустимі параметри → 400 з переліком полів
curl "http://localhost:3000/api/v1/albums?limit=1000&sort=password_hash"

curl http://localhost:3000/api/v1/artists                       # 12 виконавців з albumCount
curl -i http://localhost:3000/api/v1/albums/abc                 # 400 Некоректний ідентифікатор
curl -i http://localhost:3000/api/v1/albums/00000000-0000-4000-8000-000000000000   # 404
```

Створення, повторне створення, оновлення й видалення:

```bash
curl -i -X POST http://localhost:3000/api/v1/albums \
  -H 'Content-Type: application/json' \
  -d '{"title":"Тестовий альбом","artistId":1,"releaseDate":"2025-05-01","trackCount":8,"format":"cd"}'
# HTTP/1.1 201 Created
# Location: /api/v1/albums/4b0e…   ← скопіюйте цей id

curl -i -X POST http://localhost:3000/api/v1/albums \
  -H 'Content-Type: application/json' \
  -d '{"title":"ТЕСТОВИЙ АЛЬБОМ","artistId":1,"releaseDate":"2025-05-01","trackCount":8,"format":"cd"}'
# 409 {"message":"Альбом «Тестовий альбом» уже є у фонотеці",…}

curl -i -X POST http://localhost:3000/api/v1/albums -H 'Content-Type: application/json' \
  -d '{"title":"","trackCount":0,"format":"mp3","role":"ADMIN"}'
# 400, у errors — title, artistId, releaseDate, trackCount, format і role («Невідоме поле»)

curl -i -X PATCH http://localhost:3000/api/v1/albums/<id> \
  -H 'Content-Type: application/json' -d '{"rating":5}'          # 204
curl -i -X DELETE http://localhost:3000/api/v1/albums/<id>       # 204
curl -i -X DELETE http://localhost:3000/api/v1/albums/<id>       # 404 — вже видалено
```

Якщо все так — у вас працює повний REST API. Залишилось його захистити.

### 🧪 Експерименти

1. **SQL-ін'єкція.** У `albums.repository.js` тимчасово замініть рядок
   пошуку на склеювання:

   ```js
   if (filters.search) conditions.push(`a.title ILIKE '%${filters.search}%'`);
   ```

   ```bash
   curl -G --data-urlencode "search=zzz' OR '%'='" -i http://localhost:3000/api/v1/albums
   # X-Total-Count: 60 — «знайшлися» всі альбоми, хоча жоден не містить «zzz»
   curl -G --data-urlencode "search=пам'ять" -i http://localhost:3000/api/v1/albums
   # 500 — звичайний апостроф зламав SQL
   ```

   У терміналі сервера видно повний стек помилки синтаксису SQL, а клієнт
   отримав лише «Внутрішня помилка сервера». **Поверніть параметризований
   варіант.**

2. **Порядок маршрутів.** Перенесіть рядок з `/count` нижче за `/:id` і
   запитайте `/api/v1/albums/count` → `400 Некоректний ідентифікатор`.
   Поверніть.

3. **Контролер покладається на валідатор.** Приберіть
   `validate(albumListQuerySchema, 'query')` з маршруту списку й запитайте
   `/api/v1/albums` → 500: `req.validatedQuery` тепер не існує, і сервіс
   падає на `undefined`. У терміналі — `TypeError` зі стеком, клієнту —
   загальне повідомлення. Поверніть.

---
## 12. Автентифікація й авторизація

### 📚 Теорія: два різні питання

| | Автентифікація | Авторизація |
|---|---|---|
| Питання | **Хто ви?** | **Що вам можна?** |
| Як | пошта + пароль → токен; далі токен у кожному запиті | роль із токена порівнюється з правилами маршруту |
| Помилка | **401 Unauthorized** — немає токена, він підроблений чи прострочений | **403 Forbidden** — вас впізнали, але прав недостатньо |

Правила доступу «Фонотеки»: читати можуть усі; створювати й редагувати —
будь-який користувач із токеном; **видаляти — лише `ADMIN`**.

### 📚 Теорія: паролі зберігають лише як хеш

**Хеш** — одностороннє перетворення: з пароля легко отримати хеш, з хеша
пароль — неможливо (лише перебором). Під час входу сервер хешує введений
пароль і порівнює хеші.

Звичайні хеш-функції (SHA-256) для паролів **не годяться**: вони створені
бути швидкими, і відеокарта перебирає мільярди варіантів за секунду.
**bcrypt** спеціально **повільний**, а параметр вартості (`12` → 2¹²
ітерацій ≈ 0,2–0,3 с) можна підвищувати разом зі швидкістю комп'ютерів.
Крім того, bcrypt додає до кожного пароля випадкову **сіль**: однакові паролі
двох користувачів дають різні хеші, і заздалегідь пораховані таблиці
«пароль → хеш» марні. Сіль зберігається всередині рядка хеша
(`$2b$12$<сіль><хеш>`), окремий стовпець не потрібен.

Ще три правила з коду цього кроку:

1. **Роль ніколи не береться із запиту.** Реєстрація завжди створює `USER`;
   поле `role` у тілі — невідоме поле (`.strict()`) → 400.
2. **Однакова відповідь** для «немає такої пошти» і «неправильний пароль»:
   інакше зловмисник з'ясує, хто зареєстрований. З тієї ж причини для
   неіснуючої пошти ми все одно обчислюємо хеш — щоб час відповіді не видавав
   різниці.
3. **bcrypt обрізає пароль до 72 байтів** мовчки. Кирилична літера в UTF-8
   займає 2 байти, тож 40-літерний український пароль уже довший. Схема
   відхиляє такі паролі явно, щоб користувач не думав, що захищений
   довшим паролем, ніж насправді.

### 📚 Теорія: JWT

**JSON Web Token** — рядок із трьох частин, розділених крапками:
`заголовок.дані.підпис`.

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 . eyJzdWIiOiIxIiwicm9sZSI6IkFETUlOIiwiaWF0Ijox… . 3q2a9…
{ "alg": "HS256", "typ": "JWT" }        { "sub": "1", "role": "ADMIN", "iat": …, "exp": … }   HMAC-SHA256(…, JWT_SECRET)
```

- Перші дві частини — просто JSON у кодуванні **base64url**. Їх може
  прочитати будь-хто: ⚠️ **токен не шифрується**, тож жодних паролів чи
  персональних даних у ньому.
- **Підпис** обчислюється з перших двох частин і секрету `JWT_SECRET`. Змініть
  в даних хоч один символ (наприклад, `USER` → `ADMIN`) — підпис не
  збігнеться, і сервер відхилить токен. Підробити підпис без секрету
  неможливо.
- Поля: `sub` (subject — id користувача, рядок), `role`, `iat` (issued at —
  коли видано), `exp` (expires — до коли дійсний). Сервер **нічого не
  зберігає**: усе потрібне для перевірки — у самому токені.
- Клієнт надсилає токен у заголовку `Authorization: Bearer <токен>`.

🤔 **Навіщо явно `algorithms: ['HS256']` при перевірці?** Класична атака —
токен із заголовком `"alg": "none"` (без підпису) або з підміненим
алгоритмом. Явний перелік дозволених алгоритмів закриває обидві.

**Оновлення токена.** Токен живе годину (`JWT_EXPIRES_IN=1h`). Ендпоїнт
`POST /auth/refresh-token` обмінює **ще дійсний** токен на новий — це
спрощена схема без окремого refresh-токена (повна схема з довгоживучим
refresh-токеном у `httpOnly`-cookie розглядається в лекції 14). Відповіді
входу, реєстрації й оновлення містять токен і в тілі, і в заголовку
`Authorization` (так вимагає лекція 14 для Завдання №4). Зауважте:
`Authorization` — стандартно заголовок **запиту**; у відповіді це домовленість
нашого API, тож основне джерело токена для клієнта — тіло відповіді.

**Обмеження спроб.** Без нього пароль можна підбирати тисячами запитів за
хвилину. `express-rate-limit` дозволяє 10 **невдалих** спроб входу чи
реєстрації за 15 хвилин з однієї IP-адреси, далі — `429 Too Many Requests`.

### 12.1. Дані користувачів

📄 **`src/validators/auth.schemas.js`**
```js
import { z } from 'zod';

const email = z
  .email({ error: 'Некоректна адреса електронної пошти' })
  .max(255)
  .transform((value) => value.toLowerCase());

export const signUpSchema = z
  .object({
    email,
    password: z
      .string({ error: "Пароль обов'язковий" })
      .min(8, { error: 'Мінімум 8 символів' })
      // bcrypt мовчки обрізає все, що довше за 72 байти (кирилична літера — 2 байти)
      .refine((value) => Buffer.byteLength(value) <= 72, { error: 'Максимум 72 байти' }),
  })
  .strict();

export const signInSchema = z
  .object({
    email,
    password: z.string({ error: "Пароль обов'язковий" }).min(1, { error: "Пароль обов'язковий" }),
  })
  .strict();
```

📄 **`src/repositories/users.repository.js`**
```js
import { pool } from '../db/pool.js';

export async function findByEmail(email) {
  const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
  return rows[0] ?? null;
}

export async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  return rows[0] ?? null;
}

export async function create({ email, passwordHash, role }) {
  const { rows } = await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *',
    [email, passwordHash, role],
  );
  return rows[0];
}
```

📄 **`src/mappers/user.mapper.js`**
```js
// password_hash НЕ потрапляє назовні НІКОЛИ
export function toUserResponse(row) {
  return { id: row.id, email: row.email, role: row.role, createdAt: row.created_at };
}
```

### 12.2. Токени й сервіс автентифікації

📄 **`src/services/token.service.js`**
```js
// Видача й перевірка JWT. Payload: { sub, role, iat, exp } — iat і exp додає бібліотека.
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../errors/index.js';

export function generateToken(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, config.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  try {
    // algorithms — явно: захист від підміни алгоритму (alg: none, RS256 → HS256)
    return jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Термін дії токена вичерпано');
    }
    throw new UnauthorizedError('Недійсний токен');
  }
}
```

📄 **`src/services/auth.service.js`**
```js
import bcrypt from 'bcrypt';
import * as usersRepository from '../repositories/users.repository.js';
import { generateToken } from './token.service.js';
import { ConflictError, UnauthorizedError } from '../errors/index.js';
import { toUserResponse } from '../mappers/user.mapper.js';

// 2^12 ітерацій ≈ 200–300 мс на хеш: швидко для людини, дорого для перебору
const SALT_ROUNDS = 12;

export async function signUp({ email, password }) {
  if (await usersRepository.findByEmail(email)) {
    throw new ConflictError('Користувач із такою поштою вже існує');
  }

  // Сіль генерується автоматично й зберігається всередині хеша
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // ⚠️ Роль НІКОЛИ не береться з запиту — інакше кожен зареєструється як ADMIN
  const user = await usersRepository.create({ email, passwordHash, role: 'USER' });
  return { user: toUserResponse(user), token: generateToken(user) };
}

export async function signIn({ email, password }) {
  const user = await usersRepository.findByEmail(email);

  // Однакове повідомлення для «немає пошти» й «неправильний пароль» — не підказуємо зловмиснику
  if (!user) {
    await bcrypt.hash(password, SALT_ROUNDS); // вирівнюємо час відповіді (timing attack)
    throw new UnauthorizedError('Неправильна пошта або пароль');
  }
  if (!(await bcrypt.compare(password, user.password_hash))) {
    throw new UnauthorizedError('Неправильна пошта або пароль');
  }

  return { user: toUserResponse(user), token: generateToken(user) };
}

// Обмін ще дійсного токена на новий (спрощена схема без окремого refresh-токена).
// Роль беремо з бази, а не зі старого токена: якщо адміністратор змінив роль,
// новий токен уже міститиме актуальну
export async function refresh(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) throw new UnauthorizedError('Користувача не знайдено');
  return { user: toUserResponse(user), token: generateToken(user) };
}

export async function getProfile(userId) {
  const user = await usersRepository.findById(userId);
  if (!user) throw new UnauthorizedError('Користувача не знайдено');
  return toUserResponse(user);
}
```

### 12.3. Middleware: токен і роль

`authenticate` перевіряє токен і кладе в `req.user` id та роль. `requireRole`
— фабрика, як і `validate`: `requireRole('ADMIN')` повертає middleware, яке
пропускає далі лише потрібні ролі. Порядок у маршруті завжди
`authenticate → requireRole → validate → controller`.

📄 **`src/middlewares/auth.js`**
```js
import { verifyToken } from '../services/token.service.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

/** Перевіряє заголовок Authorization: Bearer <token> і кладе користувача в req.user */
export function authenticate(req, res, next) {
  const header = req.get('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Потрібна автентифікація'));
  }

  try {
    const payload = verifyToken(header.slice('Bearer '.length));
    req.user = { id: Number(payload.sub), role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}

/** Middleware-фабрика: requireRole('ADMIN') — після authenticate */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Недостатньо прав для цієї дії'));
    }
    next();
  };
}
```

📄 **`src/middlewares/rateLimit.js`**
```js
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/index.js';

// Захист входу й реєстрації від перебору паролів: 10 невдалих спроб за 15 хвилин з однієї IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.authRateLimit,
  skipSuccessfulRequests: true, // рахуємо лише невдалі спроби
  standardHeaders: 'draft-8', // заголовки RateLimit і RateLimit-Policy
  legacyHeaders: false,
  message: { status: 429, message: 'Забагато спроб. Спробуйте через 15 хвилин.' },
});
```

### 12.4. Контролер і маршрути

📄 **`src/controllers/auth.controller.js`**
```js
import * as authService from '../services/auth.service.js';

// Токен віддаємо і в тілі, і в заголовку Authorization — клієнт може взяти будь-який
function sendAuth(res, status, result) {
  res.set('Authorization', `Bearer ${result.token}`);
  res.status(status).json(result);
}

export async function signUp(req, res) {
  sendAuth(res, 201, await authService.signUp(req.validatedBody));
}

export async function signIn(req, res) {
  sendAuth(res, 200, await authService.signIn(req.validatedBody));
}

export async function refresh(req, res) {
  sendAuth(res, 200, await authService.refresh(req.user.id));
}

export async function me(req, res) {
  res.json(await authService.getProfile(req.user.id));
}
```

📄 **`src/routes/auth.routes.js`**
```js
import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { signInSchema, signUpSchema } from '../validators/auth.schemas.js';

const router = Router();

// Відповіді з токенами не кешуються ніде
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/sign-up', authLimiter, validate(signUpSchema), controller.signUp);
router.post('/sign-in', authLimiter, validate(signInSchema), controller.signIn);
router.post('/refresh-token', authenticate, controller.refresh);
router.get('/me', authenticate, controller.me);

export default router;
```

🤔 **Навіщо `Cache-Control: no-store`?** Щоб відповідь із токеном не
зберіг ні браузер, ні проміжний проксі.

Тепер захищаємо маршрути альбомів і підключаємо `/auth`:

📄 **`src/routes/albums.routes.js`**
```js
import { Router } from 'express';
import * as controller from '../controllers/albums.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { uuidParamSchema } from '../validators/common.js';
import {
  albumCreateSchema,
  albumFiltersSchema,
  albumListQuerySchema,
  albumPatchSchema,
} from '../validators/album.schemas.js';

const router = Router();
const validId = validate(uuidParamSchema, 'params');

// GET — публічні; змінювати дані — лише з токеном; видаляти — лише ADMIN
router.get('/', validate(albumListQuerySchema, 'query'), controller.list);
router.get('/count', validate(albumFiltersSchema, 'query'), controller.count); // ← до /:id!
router.get('/:id', validId, controller.getById);
router.post('/', authenticate, validate(albumCreateSchema), controller.create);
router.put('/:id', authenticate, validId, validate(albumCreateSchema), controller.update);
router.patch('/:id', authenticate, validId, validate(albumPatchSchema), controller.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), validId, controller.remove);

export default router;
```

📄 **`src/routes/index.js`**
```js
import { Router } from 'express';
import albumsRoutes from './albums.routes.js';
import artistsRoutes from './artists.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/albums', albumsRoutes);
router.use('/artists', artistsRoutes);
router.use('/auth', authRoutes);

export default router;
```

### ✅ Контрольна точка 11

```bash
API=http://localhost:3000/api/v1

# Вхід як USER: токен — у змінну оболонки
USER_TOKEN=$(curl -s -X POST $API/auth/sign-in -H 'Content-Type: application/json' \
  -d '{"email":"user@fonoteka.test","password":"UserPass123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Що всередині токена (дані читаються без секрету!)
node -e "console.log(JSON.parse(Buffer.from(process.argv[1].split('.')[1], 'base64url')))" $USER_TOKEN
# { sub: '2', role: 'USER', iat: 1794353704, exp: 1794357304 }

curl -i -X POST $API/albums -H 'Content-Type: application/json' \
  -d '{"title":"З токеном","artistId":1,"releaseDate":"2025-05-01","trackCount":8,"format":"cd"}'
# 401 Потрібна автентифікація

curl -i -X POST $API/albums -H "Authorization: Bearer $USER_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"З токеном","artistId":1,"releaseDate":"2025-05-01","trackCount":8,"format":"cd"}'
# 201 Created, Location: /api/v1/albums/<id>

curl -i -X DELETE $API/albums/<id> -H "Authorization: Bearer $USER_TOKEN"
# 403 Недостатньо прав для цієї дії

ADMIN_TOKEN=$(curl -s -X POST $API/auth/sign-in -H 'Content-Type: application/json' \
  -d '{"email":"admin@fonoteka.test","password":"AdminPass123"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')
curl -i -X DELETE $API/albums/<id> -H "Authorization: Bearer $ADMIN_TOKEN"
# 204 No Content

curl -i $API/auth/me -H "Authorization: Bearer $USER_TOKEN"
# 200 {"id":2,"email":"user@fonoteka.test","role":"USER","createdAt":"…"} — без password_hash

curl -i -X POST $API/auth/sign-up -H 'Content-Type: application/json' \
  -d '{"email":"hacker@lnu.edu.ua","password":"HackerPass1","role":"ADMIN"}'
# 400, errors: [{"field":"role","message":"Невідоме поле"}]
```

### 🧪 Експерименти

1. **Підробка токена.** Скопіюйте `USER_TOKEN`, змініть один символ у
   середній частині й надішліть `GET /auth/me` → `401 Недійсний токен`.
   Спробуйте закодувати власні дані з `"role":"ADMIN"` (наприклад, на
   [jwt.io](https://jwt.io/)) без справжнього секрету — той самий 401.
2. **Термін дії.** Поставте в `.env` `JWT_EXPIRES_IN=10s`, перезапустіть
   сервер, отримайте токен, зачекайте 10 секунд → `401 Термін дії токена
   вичерпано`. Поверніть `1h`.
3. **Перебір паролів.**

   ```bash
   for i in $(seq 1 11); do
     curl -s -o /dev/null -w "%{http_code} " -X POST $API/auth/sign-in \
       -H 'Content-Type: application/json' -d '{"email":"user@fonoteka.test","password":"wrong"}'
   done
   # 401 401 … 401 429   ← після 10 невдалих спроб
   ```

   Лічильник спільний для входу й реєстрації і рахує **всі** невдалі
   відповіді, зокрема 400 від спроби зареєструватися з `role` вище, — тож
   429 може з'явитися на запит-два раніше. Подивіться заголовки `RateLimit`, `RateLimit-Policy` і `Retry-After` у
   відповіді 429 (`curl -i`). Лічильник зберігається в пам'яті процесу,
   тож перезапуск сервера (збережіть будь-який файл із `src/`) його скидає.
4. **Без перевірки ролі.** Приберіть `requireRole('ADMIN')` з маршруту
   `DELETE` — тепер видаляти може будь-хто з токеном. Поверніть.

---

## 13. Документація OpenAPI і Swagger UI

### 📚 Теорія: OpenAPI

**OpenAPI** — стандартний формат опису HTTP API: які є шляхи, методи,
параметри, тіла запитів і відповідей, коди помилок, схема автентифікації.
Опис пишуть у YAML (або JSON), а інструменти роблять із нього інтерактивну
документацію, генерують клієнтів і тести.

Основні частини файлу:

| Розділ | Що там |
|---|---|
| `info`, `servers` | назва, версія, базова адреса (`/api/v1`) |
| `components.schemas` | форми даних (`Album`, `AlbumInput`, `Error`…) — описуються **один раз** |
| `components.parameters`, `responses` | спільні параметри й відповіді (`404`, `400`…) |
| `components.securitySchemes` | як передається токен (`bearer`, `JWT`) |
| `paths` | ендпоїнти; посилання на спільне — через `$ref: '#/components/…'` |

**Swagger UI** — вебсторінка, яка показує опис і дозволяє надсилати запити
просто з браузера. Кнопка **Authorize** запам'ятовує токен для захищених
маршрутів.

⚠️ Опис пишеться вручну, тож його треба **оновлювати разом із кодом**.
Змінили поле в схемі Zod — змініть і в `openapi.yaml`. (Існують бібліотеки,
що генерують опис зі схем Zod, але для навчального проєкту ручний опис
корисніший: ви бачите й розумієте кожен рядок контракту.)

📄 **`docs/openapi.yaml`**
```yaml
openapi: 3.1.0

info:
  title: Фонотека API
  version: 1.0.0
  description: |
    Навчальний REST API каталогу музичних альбомів (приклад до Завдання №4).
    GET-запити публічні; POST, PUT, PATCH — з токеном; DELETE — лише ADMIN.
    Токен: POST /auth/sign-in → кнопка «Authorize» → вставте значення token.

servers:
  - url: /api/v1
    description: Цей сервер

tags:
  - name: Albums
    description: Альбоми (головна сутність)
  - name: Artists
    description: Виконавці (довідник)
  - name: Auth
    description: Реєстрація та вхід

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  parameters:
    AlbumId:
      name: id
      in: path
      required: true
      schema: { type: string, format: uuid }
    Search:
      name: search
      in: query
      description: Частковий збіг у назві, без урахування регістру
      schema: { type: string, maxLength: 100 }
    ArtistId:
      name: artistId
      in: query
      schema: { type: integer, minimum: 1 }
    Format:
      name: format
      in: query
      schema: { $ref: '#/components/schemas/Format' }
    InCollection:
      name: inCollection
      in: query
      schema: { type: string, enum: ['true', 'false'] }
    YearFrom:
      name: yearFrom
      in: query
      schema: { type: integer, minimum: 1900, maximum: 2100 }
    YearTo:
      name: yearTo
      in: query
      schema: { type: integer, minimum: 1900, maximum: 2100 }
    RatingMin:
      name: ratingMin
      in: query
      schema: { type: integer, minimum: 1, maximum: 5 }

  schemas:
    Format:
      type: string
      enum: [vinyl, cd, cassette, digital]

    Album:
      type: object
      properties:
        id: { type: string, format: uuid }
        title: { type: string, example: Гірська весна }
        description: { type: [string, 'null'] }
        artist:
          type: object
          properties:
            id: { type: integer, example: 1 }
            name: { type: string, example: Карпатський вітер }
            country: { type: [string, 'null'], example: Україна }
        releaseDate: { type: string, format: date, example: '2014-04-18' }
        trackCount: { type: integer, example: 11 }
        durationMinutes: { type: [integer, 'null'], example: 47 }
        rating: { type: [integer, 'null'], minimum: 1, maximum: 5 }
        format: { $ref: '#/components/schemas/Format' }
        inCollection: { type: boolean }
        coverUrl: { type: [string, 'null'], format: uri }
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }

    AlbumInput:
      type: object
      additionalProperties: false
      required: [title, artistId, releaseDate, trackCount, format]
      properties:
        title: { type: string, minLength: 1, maxLength: 200, example: Перший сніг }
        description: { type: [string, 'null'], maxLength: 2000 }
        artistId: { type: integer, minimum: 1, example: 3 }
        releaseDate: { type: string, format: date, example: '2026-01-15' }
        trackCount: { type: integer, minimum: 1, maximum: 999, example: 9 }
        durationMinutes: { type: [integer, 'null'], minimum: 1, maximum: 600, example: 41 }
        rating: { type: [integer, 'null'], minimum: 1, maximum: 5 }
        format: { $ref: '#/components/schemas/Format' }
        inCollection: { type: boolean, default: false }
        coverUrl: { type: [string, 'null'], format: uri, maxLength: 500 }

    AlbumPatch:
      description: Будь-яка підмножина полів AlbumInput (хоча б одне)
      type: object
      additionalProperties: false
      minProperties: 1
      properties:
        title: { type: string }
        description: { type: [string, 'null'] }
        artistId: { type: integer }
        releaseDate: { type: string, format: date }
        trackCount: { type: integer }
        durationMinutes: { type: [integer, 'null'] }
        rating: { type: [integer, 'null'] }
        format: { $ref: '#/components/schemas/Format' }
        inCollection: { type: boolean }
        coverUrl: { type: [string, 'null'] }

    Artist:
      type: object
      properties:
        id: { type: integer }
        name: { type: string }
        country: { type: [string, 'null'] }
        albumCount: { type: integer }

    Credentials:
      type: object
      required: [email, password]
      properties:
        email: { type: string, format: email, example: admin@fonoteka.test }
        password: { type: string, minLength: 8, example: AdminPass123 }

    User:
      type: object
      properties:
        id: { type: integer }
        email: { type: string }
        role: { type: string, enum: [USER, ADMIN] }
        createdAt: { type: string, format: date-time }

    AuthResult:
      type: object
      properties:
        user: { $ref: '#/components/schemas/User' }
        token: { type: string, description: 'JWT (HS256), payload { sub, role, iat, exp }' }

    Error:
      type: object
      properties:
        status: { type: integer, example: 400 }
        message: { type: string, example: Помилка валідації }
        errors:
          type: array
          items:
            type: object
            properties:
              field: { type: string, example: title }
              message: { type: string, example: Назва обов'язкова }
        path: { type: string }
        timestamp: { type: string, format: date-time }

  responses:
    BadRequest:
      description: Некоректні вхідні дані
      content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
    Unauthorized:
      description: Немає токена або він недійсний
      content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
    Forbidden:
      description: Недостатньо прав (потрібна роль ADMIN)
      content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
    NotFound:
      description: Ресурс не знайдено
      content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }
    Conflict:
      description: Конфлікт (наприклад, альбом із такою назвою вже є)
      content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } }

paths:
  /albums:
    get:
      tags: [Albums]
      summary: Список альбомів (пагінація, сортування, фільтри)
      parameters:
        - $ref: '#/components/parameters/Search'
        - $ref: '#/components/parameters/ArtistId'
        - $ref: '#/components/parameters/Format'
        - $ref: '#/components/parameters/InCollection'
        - $ref: '#/components/parameters/YearFrom'
        - $ref: '#/components/parameters/YearTo'
        - $ref: '#/components/parameters/RatingMin'
        - name: sort
          in: query
          schema:
            type: string
            enum: [title, releaseDate, rating, trackCount, createdAt]
            default: title
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
          description: Масив альбомів; загальна кількість — у заголовку X-Total-Count
          headers:
            X-Total-Count: { schema: { type: integer } }
          content:
            application/json:
              schema: { type: array, items: { $ref: '#/components/schemas/Album' } }
        '400': { $ref: '#/components/responses/BadRequest' }
    post:
      tags: [Albums]
      summary: Створити альбом
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content: { application/json: { schema: { $ref: '#/components/schemas/AlbumInput' } } }
      responses:
        '201':
          description: Створено
          headers:
            Location: { schema: { type: string }, description: URL створеного альбому }
          content: { application/json: { schema: { $ref: '#/components/schemas/Album' } } }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '409': { $ref: '#/components/responses/Conflict' }

  /albums/count:
    get:
      tags: [Albums]
      summary: Кількість альбомів із тими самими фільтрами
      parameters:
        - $ref: '#/components/parameters/Search'
        - $ref: '#/components/parameters/ArtistId'
        - $ref: '#/components/parameters/Format'
        - $ref: '#/components/parameters/InCollection'
        - $ref: '#/components/parameters/YearFrom'
        - $ref: '#/components/parameters/YearTo'
        - $ref: '#/components/parameters/RatingMin'
      responses:
        '200':
          description: Кількість
          content:
            application/json:
              schema: { type: object, properties: { total: { type: integer, example: 60 } } }
        '400': { $ref: '#/components/responses/BadRequest' }

  /albums/{id}:
    parameters:
      - $ref: '#/components/parameters/AlbumId'
    get:
      tags: [Albums]
      summary: Один альбом разом із виконавцем
      responses:
        '200':
          description: Успіх
          content: { application/json: { schema: { $ref: '#/components/schemas/Album' } } }
        '400': { $ref: '#/components/responses/BadRequest' }
        '404': { $ref: '#/components/responses/NotFound' }
    put:
      tags: [Albums]
      summary: Замінити альбом повністю (не передані необов'язкові поля стають null)
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content: { application/json: { schema: { $ref: '#/components/schemas/AlbumInput' } } }
      responses:
        '204': { description: Оновлено }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
    patch:
      tags: [Albums]
      summary: Змінити лише передані поля
      security: [{ bearerAuth: [] }]
      requestBody:
        required: true
        content: { application/json: { schema: { $ref: '#/components/schemas/AlbumPatch' } } }
      responses:
        '204': { description: Оновлено }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '404': { $ref: '#/components/responses/NotFound' }
        '409': { $ref: '#/components/responses/Conflict' }
    delete:
      tags: [Albums]
      summary: Видалити альбом (лише ADMIN)
      security: [{ bearerAuth: [] }]
      responses:
        '204': { description: Видалено }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '403': { $ref: '#/components/responses/Forbidden' }
        '404': { $ref: '#/components/responses/NotFound' }

  /artists:
    get:
      tags: [Artists]
      summary: Усі виконавці з кількістю альбомів
      responses:
        '200':
          description: Успіх
          content:
            application/json:
              schema: { type: array, items: { $ref: '#/components/schemas/Artist' } }

  /auth/sign-up:
    post:
      tags: [Auth]
      summary: Реєстрація (роль завжди USER)
      requestBody:
        required: true
        content: { application/json: { schema: { $ref: '#/components/schemas/Credentials' } } }
      responses:
        '201':
          description: Зареєстровано
          headers:
            Authorization:
              description: Той самий токен у форматі `Bearer <jwt>`
              schema: { type: string }
          content: { application/json: { schema: { $ref: '#/components/schemas/AuthResult' } } }
        '400': { $ref: '#/components/responses/BadRequest' }
        '409': { $ref: '#/components/responses/Conflict' }
        '429': { description: Забагато спроб }

  /auth/sign-in:
    post:
      tags: [Auth]
      summary: Вхід — повертає JWT
      requestBody:
        required: true
        content: { application/json: { schema: { $ref: '#/components/schemas/Credentials' } } }
      responses:
        '200':
          description: Успіх
          headers:
            Authorization:
              description: Той самий токен у форматі `Bearer <jwt>`
              schema: { type: string }
          content: { application/json: { schema: { $ref: '#/components/schemas/AuthResult' } } }
        '400': { $ref: '#/components/responses/BadRequest' }
        '401': { $ref: '#/components/responses/Unauthorized' }
        '429': { description: Забагато спроб }

  /auth/refresh-token:
    post:
      tags: [Auth]
      summary: Обміняти ще дійсний токен на новий
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Новий токен
          headers:
            Authorization:
              description: Той самий токен у форматі `Bearer <jwt>`
              schema: { type: string }
          content: { application/json: { schema: { $ref: '#/components/schemas/AuthResult' } } }
        '401': { $ref: '#/components/responses/Unauthorized' }

  /auth/me:
    get:
      tags: [Auth]
      summary: Поточний користувач за токеном
      security: [{ bearerAuth: [] }]
      responses:
        '200':
          description: Успіх
          content: { application/json: { schema: { $ref: '#/components/schemas/User' } } }
        '401': { $ref: '#/components/responses/Unauthorized' }
```

Підключаємо документацію — це остаточна версія `app.js`:

📄 **`src/app.js`**
```js
// Налаштування Express: middleware, маршрути, документація, обробники помилок.
// Тут НЕМАЄ app.listen() — запуск у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'node:fs';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import apiRoutes from './routes/index.js';

const app = express();

// За проксі хостингу (Render, Railway, nginx) — щоб req.ip був IP клієнта, а не проксі
app.set('trust proxy', 1);

app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(httpLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(
  cors({
    origin: config.corsOrigins, // явний список дозволених джерел, а не '*'
    exposedHeaders: ['X-Total-Count', 'Location', 'X-Request-Id', 'Authorization'], // щоб клієнт їх бачив
  }),
);
app.use(express.json({ limit: '100kb' })); // 4. розбір JSON з обмеженням розміру

// Документація OpenAPI: http://localhost:3000/api-docs
const openApiSpec = YAML.parse(
  readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'),
);
app.get('/api-docs.json', (req, res) => res.json(openApiSpec));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, { customSiteTitle: 'Фонотека API' }),
);

app.use('/health', healthRoutes);
app.use('/api/v1', apiRoutes);

// Обробники помилок — ЗАВЖДИ останні
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

🤔 **Навіщо ще й `/api-docs.json`?** Сирий опис потрібен інструментам:
його можна імпортувати в Postman чи в генератор клієнтського коду.

### ✅ Контрольна точка 12

1. Відкрийте http://localhost:3000/api-docs — сторінка «Фонотека API» з
   групами **Albums**, **Artists**, **Auth**.
2. **GET /albums → Try it out → Execute** — відповідь 200 і заголовок
   `x-total-count`.
3. **POST /auth/sign-in → Try it out**, тіло `{"email":"user@fonoteka.test",
   "password":"UserPass123"}` → **Execute**, скопіюйте `token`.
4. Кнопка **Authorize** угорі → вставте токен (без слова `Bearer`) →
   **Authorize**. Тепер **POST /albums** відповідає 201, а **DELETE** — 403.

### 🧪 Експеримент

Зіпсуйте відступ у будь-якому рядку `openapi.yaml`, збережіть і
перезапустіть сервер (`Ctrl+C` → `npm run dev`: режим `--watch` стежить лише
за імпортованими модулями, а YAML читається як звичайний файл). Сервер не
запуститься — помилка розбору YAML із номером рядка. Це знову fail fast:
краще впасти на старті, ніж віддавати биту документацію. Поверніть.

---

## 14. Файл запитів, автоматичні тести, README

### 14.1. Запити для HTTP Client

Набирати `curl` щоразу незручно. WebStorm має вбудований **HTTP Client**:
файл `.http` — це набір запитів, розділених `###`, і кожен виконується
зеленою стрілкою ▶ ліворуч. Після запиту можна виконати скрипт `> {% … %}`:
зберегти значення у змінну (`client.global.set('userToken', …)`) і
перевірити відповідь (`client.test(…)`). Наступні запити підставляють
змінні як `{{userToken}}`.

📄 **`requests.http`**
```http
# Запити до API «Фонотеки» (Завдання №4) для HTTP Client у WebStorm.
# Запуск: зелена стрілка ▶ ліворуч від запиту. Виконуйте ЗГОРИ ВНИЗ: блоки > {% … %}
# зберігають токени та id у змінні для наступних запитів.

@baseUrl = http://localhost:3000
@api = http://localhost:3000/api/v1

### Стан сервера й бази
GET {{baseUrl}}/health

### Вхід як USER → зберігаємо токен
POST {{api}}/auth/sign-in
Content-Type: application/json

{ "email": "user@fonoteka.test", "password": "UserPass123" }

> {%
  client.global.set('userToken', response.body.token);
  client.test('200 і токен', () => client.assert(response.status === 200 && !!response.body.token));
%}

### Вхід як ADMIN → зберігаємо токен
POST {{api}}/auth/sign-in
Content-Type: application/json

{ "email": "admin@fonoteka.test", "password": "AdminPass123" }

> {% client.global.set('adminToken', response.body.token); %}

### Неправильний пароль → 401
POST {{api}}/auth/sign-in
Content-Type: application/json

{ "email": "user@fonoteka.test", "password": "wrong-password" }

### Реєстрація нового користувача → 201 (повторний запуск → 409)
POST {{api}}/auth/sign-up
Content-Type: application/json

{ "email": "student@lnu.edu.ua", "password": "StudentPass1" }

### Спроба зареєструватися адміністратором → 400 (поле role невідоме)
POST {{api}}/auth/sign-up
Content-Type: application/json

{ "email": "hacker@lnu.edu.ua", "password": "HackerPass1", "role": "ADMIN" }

### Хто я (за токеном)
GET {{api}}/auth/me
Authorization: Bearer {{userToken}}

### Оновлення токена → 200, новий токен і в тілі, і в заголовку Authorization
POST {{api}}/auth/refresh-token
Authorization: Bearer {{userToken}}

> {%
  client.test('Authorization у відповіді', () =>
    client.assert(response.headers.valueOf('Authorization') === `Bearer ${response.body.token}`));
%}

### Список: перша сторінка (масив + заголовок X-Total-Count)
GET {{api}}/albums?limit=5

> {%
  client.global.set('albumId', response.body[0].id);
  client.test('X-Total-Count є', () => client.assert(Number(response.headers.valueOf('X-Total-Count')) > 0));
%}

### Сортування й пагінація: найновіші, друга сторінка
GET {{api}}/albums?sort=releaseDate&order=desc&limit=5&offset=5

### Фільтри: пошук, формат, виконавець, у колекції, роки, мінімальна оцінка
GET {{api}}/albums?search=ніч&format=vinyl&inCollection=true&yearFrom=2000&yearTo=2025&ratingMin=3

### Кількість із тими самими фільтрами
GET {{api}}/albums/count?search=ніч&format=vinyl

### Некоректні query → 400 з переліком полів
GET {{api}}/albums?limit=1000&offset=-1&sort=password_hash&order=up

### Один альбом
GET {{api}}/albums/{{albumId}}

### Неіснуючий альбом → 404
GET {{api}}/albums/00000000-0000-4000-8000-000000000000

### Некоректний id → 400
GET {{api}}/albums/abc

### Створення без токена → 401
POST {{api}}/albums
Content-Type: application/json

{ "title": "Без токена", "artistId": 1, "releaseDate": "2026-01-01", "trackCount": 5, "format": "cd" }

### Створення → 201 + Location
POST {{api}}/albums
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "title": "Перший сніг",
  "description": "Зимовий джаз із фолковими мотивами.",
  "artistId": 3,
  "releaseDate": "2026-01-15",
  "trackCount": 9,
  "durationMinutes": 41,
  "format": "vinyl",
  "coverUrl": "https://example.com/covers/first-snow.jpg"
}

> {%
  client.global.set('newAlbumId', response.body.id);
  client.test('201 + Location', () => client.assert(response.status === 201 && !!response.headers.valueOf('Location')));
%}

### Та сама назва в іншому регістрі → 409
POST {{api}}/albums
Authorization: Bearer {{userToken}}
Content-Type: application/json

{ "title": "перший СНІГ", "artistId": 3, "releaseDate": "2026-01-15", "trackCount": 9, "format": "cd" }

### Невалідне тіло → 400 (сім помилок)
POST {{api}}/albums
Authorization: Bearer {{userToken}}
Content-Type: application/json

{
  "title": "",
  "artistId": "три",
  "releaseDate": "2026-02-30",
  "trackCount": 0,
  "format": "mp3",
  "coverUrl": "javascript:alert(1)",
  "isAdmin": true
}

### PATCH: лише оцінка → 204
PATCH {{api}}/albums/{{newAlbumId}}
Authorization: Bearer {{userToken}}
Content-Type: application/json

{ "rating": 5 }

### PUT: повна заміна → 204 (не передані rating, coverUrl стануть null)
PUT {{api}}/albums/{{newAlbumId}}
Authorization: Bearer {{userToken}}
Content-Type: application/json

{ "title": "Перший сніг (перевидання)", "artistId": 3, "releaseDate": "2026-02-01", "trackCount": 10, "format": "cd" }

### Перевірити результат
GET {{api}}/albums/{{newAlbumId}}

### Видалення як USER → 403
DELETE {{api}}/albums/{{newAlbumId}}
Authorization: Bearer {{userToken}}

### Видалення як ADMIN → 204
DELETE {{api}}/albums/{{newAlbumId}}
Authorization: Bearer {{adminToken}}

### Повторне видалення → 404
DELETE {{api}}/albums/{{newAlbumId}}
Authorization: Bearer {{adminToken}}

### Виконавці (довідник)
GET {{api}}/artists
```

### ✅ Контрольна точка 13

Відкрийте `requests.http` і виконайте **всі запити по черзі** (іконка
▶▶ **Run All Requests in File** угорі файлу). Внизу, у вкладці **Services**,
кожен запит має очікуваний статус, а тести (`client.test`) — зелені.
Повторний запуск теж має пройти: запит реєстрації цього разу поверне 409 —
так і задумано.

### 📚 Теорія: автоматичні тести

Перевіряти 30 сценаріїв руками після кожної зміни ніхто не буде.
**Інтеграційний тест** надсилає застосунку справжні HTTP-запити й перевіряє
відповіді — від маршруту до бази й назад. Для цього:

- **`node:test`** — вбудований у Node.js тестовий раннер (`describe`,
  `test`, `before`, `beforeEach`, `after`), окремий фреймворк не потрібен;
- **`supertest`** надсилає запити об'єкту `app` напряму, без запуску
  сервера на порту (ось навіщо `app.js` і `server.js` окремо);
- **окрема тестова база** `fonoteka_test`: тести очищають таблиці перед
  кожним сценарієм, тож на робочій базі їх запускати не можна;
- **`.env.test`** — налаштування для тестів. Прапорець
  `node --env-file=.env.test` завантажує його **до** запуску; `dotenv`
  потім читає `.env`, але вже задані змінні **не перезаписує** — тож
  тестова адреса бази має пріоритет.

📄 **`.env.test`**
```ini
# Налаштування для автоматичних тестів (npm test). Файл ПОТРАПЛЯЄ в git:
# тут немає справжніх секретів — окрема тестова база й тестовий ключ.
# Тестову базу створіть один раз: docker exec fonoteka-db createdb -U fonoteka fonoteka_test
NODE_ENV=test
DATABASE_URL=postgresql://fonoteka:fonoteka_dev_password@localhost:5432/fonoteka_test
JWT_SECRET=test-only-secret-that-is-at-least-32-characters-long
JWT_EXPIRES_IN=1h
CORS_ORIGINS=http://localhost:5173
AUTH_RATE_LIMIT=1000
```

📄 **`tests/helpers.js`**
```js
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
```

📄 **`tests/api.test.js`**
```js
// Інтеграційні тести API: справжній Express-застосунок + справжня тестова база.
// Запуск: npm test (потрібні запущений Docker і база fonoteka_test).
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { closePool } from '../src/db/pool.js';
import { ADMIN, ALBUM_ID, ARTIST_ID, USER, migrate, resetData } from './helpers.js';

const api = '/api/v1';
const newAlbum = {
  title: 'Модель',
  artistId: ARTIST_ID.okean,
  releaseDate: '2001-01-01',
  trackCount: 11,
  format: 'cd',
};

async function tokenFor(credentials) {
  const response = await request(app).post(`${api}/auth/sign-in`).send(credentials).expect(200);
  return response.body.token;
}

before(migrate);
beforeEach(resetData);
after(closePool);

describe('GET /albums', () => {
  test('повертає масив і загальну кількість у X-Total-Count', async () => {
    const response = await request(app).get(`${api}/albums`).expect(200);
    assert.equal(response.body.length, 3);
    assert.equal(response.headers['x-total-count'], '3');
    assert.equal(response.body[0].artist.name, 'Океан Ельзи'); // разом із виконавцем
  });

  test('пошук без урахування регістру + фільтр + сортування', async () => {
    const response = await request(app)
      .get(`${api}/albums?search=з&inCollection=true&sort=title&order=desc`)
      .expect(200);
    assert.deepEqual(
      response.body.map((album) => album.title),
      ['Земля'], // «Без меж» не в колекції, у «Шляху» немає «з»
    );
  });

  test('пагінація: limit і offset', async () => {
    const response = await request(app)
      .get(`${api}/albums?sort=releaseDate&limit=1&offset=1`)
      .expect(200);
    assert.equal(response.body.length, 1);
    assert.equal(response.body[0].title, 'Без меж');
    assert.equal(response.headers['x-total-count'], '3');
  });

  test('некоректні query-параметри → 400 з переліком полів', async () => {
    const response = await request(app)
      .get(`${api}/albums?limit=1000&sort=password_hash`)
      .expect(400);
    const fields = response.body.errors.map((error) => error.field).sort();
    assert.deepEqual(fields, ['limit', 'sort']);
  });

  test('/albums/count враховує фільтри', async () => {
    const response = await request(app).get(`${api}/albums/count?format=vinyl`).expect(200);
    assert.deepEqual(response.body, { total: 1 });
  });
});

describe('GET /albums/:id', () => {
  test('існуючий → 200, неіснуючий → 404, не UUID → 400', async () => {
    await request(app).get(`${api}/albums/${ALBUM_ID.first}`).expect(200);
    await request(app).get(`${api}/albums/00000000-0000-4000-8000-000000000099`).expect(404);
    await request(app).get(`${api}/albums/abc`).expect(400);
  });
});

describe('POST /albums', () => {
  test('без токена → 401', async () => {
    await request(app).post(`${api}/albums`).send(newAlbum).expect(401);
  });

  test('USER створює → 201 + Location', async () => {
    const token = await tokenFor(USER);
    const response = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send(newAlbum)
      .expect(201);
    assert.equal(response.headers.location, `${api}/albums/${response.body.id}`);
    assert.equal(response.body.inCollection, false); // значення за замовчуванням
  });

  test('дублікат назви (без урахування регістру) → 409', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, title: 'ЗЕМЛЯ' })
      .expect(409);
  });

  test('невідоме поле й неіснуючий виконавець → 400', async () => {
    const token = await tokenFor(USER);
    const unknown = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, id: 'hack' })
      .expect(400);
    assert.equal(unknown.body.errors[0].field, 'id');

    const noArtist = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, artistId: 999 })
      .expect(400);
    assert.equal(noArtist.body.errors[0].field, 'artistId');
  });

  test('битий JSON → 400 у загальному форматі, без стеку', async () => {
    const response = await request(app)
      .post(`${api}/albums`)
      .set('Content-Type', 'application/json')
      .send('{ "title": ')
      .expect(400);
    assert.equal(response.body.message, 'Некоректний JSON у тілі запиту');
    assert.equal(response.body.stack, undefined);
  });
});

describe('PUT, PATCH, DELETE /albums/:id', () => {
  test('PATCH змінює лише передані поля → 204', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .patch(`${api}/albums/${ALBUM_ID.second}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 2 })
      .expect(204);
    const { body } = await request(app).get(`${api}/albums/${ALBUM_ID.second}`);
    assert.equal(body.rating, 2);
    assert.equal(body.title, 'Без меж');
  });

  test('PUT замінює ресурс повністю: не передані поля стають null', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .put(`${api}/albums/${ALBUM_ID.first}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, title: 'Земля (перевидання)' })
      .expect(204);
    const { body } = await request(app).get(`${api}/albums/${ALBUM_ID.first}`);
    assert.equal(body.rating, null);
    assert.equal(body.inCollection, false);
  });

  test('id великими літерами — той самий альбом, без хибного 409', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .patch(`${api}/albums/${ALBUM_ID.second.toUpperCase()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Без меж' }) // назва не змінилася — конфлікту з самим собою немає
      .expect(204);
  });

  test('DELETE: USER → 403, ADMIN → 204, повторно → 404', async () => {
    const userToken = await tokenFor(USER);
    const adminToken = await tokenFor(ADMIN);
    const url = `${api}/albums/${ALBUM_ID.third}`;
    await request(app).delete(url).set('Authorization', `Bearer ${userToken}`).expect(403);
    await request(app).delete(url).set('Authorization', `Bearer ${adminToken}`).expect(204);
    await request(app).delete(url).set('Authorization', `Bearer ${adminToken}`).expect(404);
  });
});

describe('Автентифікація', () => {
  test('реєстрація: роль завжди USER, пароль не повертається', async () => {
    const response = await request(app)
      .post(`${api}/auth/sign-up`)
      .send({ email: 'New@Test.ua', password: 'NewPass123' })
      .expect(201);
    assert.equal(response.body.user.role, 'USER');
    assert.equal(response.body.user.email, 'new@test.ua'); // пошта нормалізується
    assert.equal(response.body.user.passwordHash, undefined);
    assert.equal(response.headers.authorization, `Bearer ${response.body.token}`);
  });

  test('спроба передати role → 400; повторна пошта → 409', async () => {
    await request(app)
      .post(`${api}/auth/sign-up`)
      .send({ email: 'x@test.ua', password: 'Password1', role: 'ADMIN' })
      .expect(400);
    await request(app).post(`${api}/auth/sign-up`).send(USER).expect(409);
  });

  test('неправильний пароль і неіснуюча пошта → однакова відповідь 401', async () => {
    const wrongPassword = await request(app)
      .post(`${api}/auth/sign-in`)
      .send({ ...USER, password: 'wrong-password' })
      .expect(401);
    const noUser = await request(app)
      .post(`${api}/auth/sign-in`)
      .send({ email: 'nobody@test.ua', password: 'whatever1' })
      .expect(401);
    assert.equal(wrongPassword.body.message, noUser.body.message);
  });

  test('me і refresh-token працюють з токеном; підроблений токен → 401', async () => {
    const token = await tokenFor(ADMIN);
    const me = await request(app)
      .get(`${api}/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(me.body.role, 'ADMIN');

    const refreshed = await request(app)
      .post(`${api}/auth/refresh-token`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.ok(refreshed.body.token);

    await request(app)
      .get(`${api}/auth/me`)
      .set('Authorization', `Bearer ${token.slice(0, -2)}xx`)
      .expect(401);
  });
});

describe('Службові маршрути', () => {
  test('/health → 200, невідомий маршрут → 404 JSON', async () => {
    const health = await request(app).get('/health').expect(200);
    assert.equal(health.body.database, 'up');
    const missing = await request(app).get(`${api}/nope`).expect(404);
    assert.equal(missing.body.path, `${api}/nope`);
  });
});
```

🤔 **Чому в тестах bcrypt із вартістю 4?** Кожен вхід у тестах обчислює
хеш; вартість 12 × десятки входів — це зайві секунди. На безпеку тестової бази це
не впливає.

### ✅ Контрольна точка 14

```bash
docker exec fonoteka-db createdb -U fonoteka fonoteka_test   # один раз
npm test
```

```text
▶ GET /albums
  ✔ повертає масив і загальну кількість у X-Total-Count
  …
ℹ tests 20
ℹ pass 20
ℹ fail 0
```

У WebStorm тести можна запускати й поодинці: зелена стрілка біля `test(…)`
у файлі `tests/api.test.js`.

### 🧪 Експерименти

1. **Захист у два шари.** У `albums.service.js` закоментуйте
   `await ensureTitleIsFree(data.title);` у функції `create` і запустіть
   `npm test`. Тест на дублікат **усе одно проходить**: тепер 409 повертає
   унікальний індекс бази через `translatePgError` — лише повідомлення стало
   загальнішим («Запис із таким значенням уже існує»). Поверніть рядок.
2. **Тест ловить вразливість.** Приберіть `requireRole('ADMIN')` з
   маршруту `DELETE` → тест «DELETE: USER → 403…» падає з
   `expected 403 "Forbidden", got 204 "No Content"`. Поверніть.

### 14.2. README

README — перше, що бачить викладач (і майбутній роботодавець) у
репозиторії. У ньому мають бути: що це за проєкт, схема бази, ендпоїнти,
як запустити **з нуля** на чистому комп'ютері, тестові облікові записи й
розділ про використання ШІ.

📄 **`README.md`**
````markdown
# Фонотека API — приклад Завдання №4

RESTful web service на **Node.js + Express 5 + PostgreSQL 18** для каталогу
музичних альбомів: шарова архітектура, валідація Zod, автентифікація JWT із
ролями USER/ADMIN, міграції, seed, документація OpenAPI.

> Навчальний приклад до курсу «Основи web програмування» (ЛНУ, ФПМІ).
> Покроковий опис створення — у файлі
> [`../01-assignment-4-5-step-by-step.md`](../01-assignment-4-5-step-by-step.md).
> Тему «Музичні альбоми» для власного завдання брати не можна.

## Сутність «Альбом»

| Поле | Тип у БД | Обмеження | Тип за вимогами |
|---|---|---|---|
| `id` | `uuid` | PRIMARY KEY, `gen_random_uuid()` | ідентифікатор |
| `title` | `varchar(200)` | NOT NULL, UNIQUE (без урахування регістру) | унікальна назва |
| `description` | `text` | до 2000 символів | довгий текст |
| `artistId` → `artist_id` | `integer` | NOT NULL, FOREIGN KEY → `artists` (RESTRICT) | зв'язок із довідником |
| `releaseDate` → `release_date` | `date` | NOT NULL, ≥ 1900-01-01 | дата |
| `trackCount` → `track_count` | `smallint` | NOT NULL, CHECK 1–999 | число |
| `durationMinutes` → `duration_minutes` | `smallint` | CHECK 1–600 | число |
| `rating` | `smallint` | CHECK 1–5 | число |
| `format` | `varchar(10)` | CHECK IN (`vinyl`, `cd`, `cassette`, `digital`) | фіксований набір |
| `inCollection` → `in_collection` | `boolean` | NOT NULL, DEFAULT false | логічне |
| `coverUrl` → `cover_url` | `text` | формат URL (http/https) | посилання |
| `createdAt`, `updatedAt` | `timestamptz` | DEFAULT now(), тригер для `updated_at` | службові |

## Схема бази

```mermaid
erDiagram
    artists ||--o{ albums : "має"
    artists {
        int id PK
        varchar name UK
        varchar country
        timestamptz created_at
    }
    albums {
        uuid id PK
        varchar title UK
        text description
        int artist_id FK
        date release_date
        smallint track_count
        smallint duration_minutes
        smallint rating
        varchar format
        boolean in_collection
        text cover_url
        timestamptz created_at
        timestamptz updated_at
    }
    users {
        int id PK
        varchar email UK
        varchar password_hash
        varchar role
        timestamptz created_at
    }
```

Індекси: унікальні `lower(title)`, `lower(name)`, `lower(email)`; `albums(artist_id)`
(зовнішній ключ); `albums(release_date)`; GIN `pg_trgm` на `albums(title)` для пошуку `ILIKE '%…%'`.

## Ендпоїнти

Базова адреса — `http://localhost:3000/api/v1`. Документація: **`/api-docs`** (Swagger UI).

| Метод | Шлях | Доступ | Успіх | Помилки |
|---|---|---|---|---|
| GET | `/albums` | публічний | 200 (масив + `X-Total-Count`) | 400 |
| GET | `/albums/count` | публічний | 200 `{ total }` | 400 |
| GET | `/albums/:id` | публічний | 200 | 400, 404 |
| POST | `/albums` | токен | 201 + `Location` | 400, 401, 409 |
| PUT | `/albums/:id` | токен | 204 | 400, 401, 404, 409 |
| PATCH | `/albums/:id` | токен | 204 | 400, 401, 404, 409 |
| DELETE | `/albums/:id` | ADMIN | 204 | 401, 403, 404 |
| GET | `/artists` | публічний | 200 | — |
| POST | `/auth/sign-up` | публічний | 201 `{ user, token }` | 400, 409, 429 |
| POST | `/auth/sign-in` | публічний | 200 `{ user, token }` | 400, 401, 429 |
| POST | `/auth/refresh-token` | токен | 200 `{ user, token }` | 401 |
| GET | `/auth/me` | токен | 200 | 401 |
| GET | `/health` (без `/api/v1`) | публічний | 200 / 503 | — |

Відповіді `sign-up`, `sign-in` і `refresh-token` містять токен і в тілі, і в заголовку
`Authorization: Bearer <jwt>`.

**Query-параметри списку:** `search`, `artistId`, `format`, `inCollection`, `yearFrom`,
`yearTo`, `ratingMin` (фільтри); `sort` (`title`, `releaseDate`, `rating`, `trackCount`,
`createdAt`), `order` (`asc`, `desc`); `limit` (1–100, за замовчуванням 20), `offset` (≥ 0).

**Формат помилки:**

```json
{
  "status": 400,
  "message": "Помилка валідації",
  "errors": [{ "field": "title", "message": "Назва обов'язкова" }],
  "path": "/api/v1/albums",
  "timestamp": "2026-11-11T10:00:00.000Z"
}
```

## Запуск «з нуля»

Потрібні Node.js 22+ (рекомендовано 24 LTS) і Docker.

```bash
npm install
cp .env.example .env            # і впишіть JWT_SECRET (команда генерації — у файлі)
docker compose up -d --wait     # PostgreSQL 18 (--wait: дочекатися готовності)
npm run migrate:up              # схема бази
npm run seed                    # 60 альбомів, 12 виконавців, 2 користувачі
npm run dev                     # http://localhost:3000
```

**Тестові облікові записи** (лише для розробки):

| Роль | E-mail | Пароль |
|---|---|---|
| ADMIN | `admin@fonoteka.test` | `AdminPass123` |
| USER | `user@fonoteka.test` | `UserPass123` |

**Автоматичні тести.** Один раз створіть тестову базу, далі — `npm test`
(міграції тест застосовує сам, дані перед кожним тестом відновлює):

```bash
docker exec fonoteka-db createdb -U fonoteka fonoteka_test
npm test
```

Приклади всіх запитів, зокрема негативних (400, 401, 403, 404, 409), — у файлі
[`requests.http`](requests.http) (HTTP Client у WebStorm).

| Скрипт | Що робить |
|---|---|
| `npm run dev` | сервер з автоперезапуском |
| `npm start` | сервер для продакшену |
| `npm run migrate:up` / `migrate:down` | застосувати / відкотити міграцію |
| `npm run seed` | очистити таблиці й заповнити демо-даними (`SEED_ALBUMS=200 npm run seed` — більше) |
| `npm test` | інтеграційні тести (node:test + supertest) на окремій базі `fonoteka_test` |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |

## Приклад запиту й відповіді

```http
GET /api/v1/albums?search=весна&limit=1
```

```json
[
  {
    "id": "1f9c5a1e-…",
    "title": "Гірська весна",
    "description": "Дебютний альбом гурту: трембіта, електрогітари й пісні, записані наживо в Яремчі.",
    "artist": { "id": 1, "name": "Карпатський вітер", "country": "Україна" },
    "releaseDate": "2014-04-18",
    "trackCount": 11,
    "durationMinutes": 47,
    "rating": 5,
    "format": "vinyl",
    "inCollection": true,
    "coverUrl": null,
    "createdAt": "2026-11-11T09:00:00.000Z",
    "updatedAt": "2026-11-11T09:00:00.000Z"
  }
]
```

## Чому лише параметризовані запити

Усі значення потрапляють у SQL лише як параметри `$1, $2, …`: драйвер надсилає текст
запиту й значення **окремо**, тому дані користувача фізично не можуть змінити структуру
запиту. Склеювання рядків (`` `WHERE title ILIKE '%${search}%'` ``) — це SQL-ін'єкція:
пошук `zzz' OR '%'='` повернув би всі записи, а звичайний апостроф у слові «пам'ять»
ламав би запит. Назви стовпців для сортування параметрами передати неможливо, тому вони
беруться з білого списку (`SORT_COLUMNS` у `albums.repository.js`).

## Використання ШІ

Приклад підготовлено викладачем за допомогою Claude (Anthropic): генерація коду, тексту
й тестових даних. Увесь код перевірено автоматичними сценаріями на PostgreSQL 18.
````

### ✅ Фінальна перевірка Завдання №4

```bash
npm run lint && npm run format:check && npm test
```

Усі три команди без помилок. Потім **перевірте запуск з нуля** — так, як
це зробить викладач:

```bash
cd /tmp                                    # будь-яка інша папка
git clone <адреса вашого репозиторію> check && cd check
npm ci                                     # точно за package-lock.json
cp .env.example .env                       # вписати JWT_SECRET
docker compose up -d --wait && npm run migrate:up && npm run seed && npm run dev
```

⚠️ Якщо контейнер `fonoteka-db` з основної папки ще працює, спершу
зупиніть його (`docker compose down` там): дві копії конфліктують за ім'я
контейнера й порт 5432.

| Перевірка | Як |
|---|---|
| `.env` не в репозиторії | `git ls-files \| grep .env` — лише `.env.example` і `.env.test` |
| немає `node_modules` у репозиторії | `git ls-files \| grep node_modules` — порожньо |
| стек не потрапляє у відповідь | будь-яка помилка в Swagger UI — без поля `stack` |
| усі коди | `requests.http` проходить повністю |

---
# Частина II. Завдання №5 — клієнт-серверний застосунок

## 15. Монорепозиторій: сервер і клієнт разом

### 📚 Теорія: один репозиторій — два застосунки

Клієнт і сервер — **два окремі npm-проєкти** зі своїми `package.json` і
`node_modules`: у сервера Express і `pg`, у клієнта React і Vite. Але
розвиваються вони разом: нове поле в API майже завжди означає зміну і в
клієнті. Тому зручно тримати їх в **одному репозиторії** (монорепозиторії):

```text
fonoteka/
├── docker-compose.yml   ← база для розробки — спільна
├── package.json         ← лише скрипти для запуску обох частин
├── README.md            ← опис усього застосунку
├── server/              ← REST API із частини I
└── client/              ← React-застосунок (з'явиться в кроці 17)
```

Один коміт змінює і API, і клієнт; одне посилання на репозиторій — для
здачі; README описує систему цілком. Кореневий `package.json` не має
власного коду: його скрипти лише запускають команди в підпапках через
`npm --prefix <папка>`, а пакет **`concurrently`** запускає сервер і клієнт
однією командою, у спільному терміналі з кольоровими префіксами.

### 15.1. Перенесення сервера

1. Створіть папку `fonoteka` і відкрийте її у WebStorm (**File → Open…**).
2. Скопіюйте в неї проєкт із частини I як папку **`server`** — **без**
   `node_modules` і `.git` (усе інше, зокрема `.env`, — разом).
3. Перенесіть `server/docker-compose.yml` у корінь `fonoteka/` — вміст не
   змінюється.
4. Ініціалізуйте репозиторій у корені (**VCS → Create Git Repository…**).
   Окремий `.gitignore` сервера лишається в `server/` і працює далі.

⚠️ Якщо контейнер бази із частини I ще працює, зупиніть його в старій
папці (`docker compose down`): нова копія `docker-compose.yml` створює
контейнер із тим самим іменем `fonoteka-db` і тим самим портом. Дані старої
бази в томі не загубляться, але нова папка отримає **новий** том (його ім'я
залежить від назви папки) — тож міграції й seed доведеться виконати ще раз.

📄 **`package.json`**
```json
{
  "name": "fonoteka",
  "private": true,
  "description": "«Фонотека» — React-клієнт + REST API на Node.js + PostgreSQL (приклад до Завдання №5)",
  "scripts": {
    "install:all": "npm --prefix server install && npm --prefix client install",
    "dev": "concurrently -c blue,green \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "npm --prefix server run dev",
    "dev:client": "npm --prefix client run dev",
    "lint": "npm --prefix server run lint && npm --prefix client run lint"
  },
  "devDependencies": {
    "concurrently": "^10.0.7"
  }
}
```

📄 **`.gitignore`**
```text
node_modules/
.env
dist/
*.log
```

```bash
npm install                 # concurrently для кореня
npm --prefix server install # залежності сервера
docker compose up -d --wait # --wait: дочекатися, поки база стане healthy
npm --prefix server run migrate:up
```

---

## 16. Зміни на сервері

### 📚 Теорія: відповідь списку з метаданими

Клієнту для пагінації потрібні **і сторінка даних, і загальна кількість**:
«Показано 13–24 з 240», кнопки «1 … 19 20». У Завданні №4 кількість ішла в
заголовку `X-Total-Count`. Для клієнта зручніше отримати все **в тілі
одного запиту**:

```json
{
  "data": [{ "id": "…", "title": "Гірська весна", … }],
  "total": 240,
  "limit": 12,
  "offset": 12
}
```

Такий об'єкт-«конверт» також дає місце для майбутніх полів (наприклад,
`nextCursor`) без зміни формату. Заголовок `X-Total-Count` лишаємо — він
нікому не заважає.

Сервіс уже повертає саме такий об'єкт (крок 10) — змінюється лише рядок
контролера:

📄 **`server/src/controllers/albums.controller.js`**
```js
// Контролер — тонкий шар: читає req, викликає сервіс, формує res. Жодної бізнес-логіки й SQL.
import * as albumsService from '../services/albums.service.js';

export async function list(req, res) {
  const result = await albumsService.list(req.validatedQuery);
  res.set('X-Total-Count', String(result.total));
  res.json(result); // { data, total, limit, offset } — дані й метадані пагінації разом
}

export async function count(req, res) {
  res.json({ total: await albumsService.count(req.validatedQuery) });
}

export async function getById(req, res) {
  res.json(await albumsService.getById(req.validatedParams.id));
}

export async function create(req, res) {
  const album = await albumsService.create(req.validatedBody);
  res.status(201).location(`${req.baseUrl}/${album.id}`).json(album);
}

// PUT і PATCH: 204 No Content — тіло не потрібне
export async function update(req, res) {
  await albumsService.update(req.validatedParams.id, req.validatedBody);
  res.status(204).end();
}

export async function remove(req, res) {
  await albumsService.remove(req.validatedParams.id);
  res.status(204).end();
}
```

Демо-даних має бути **200+**, тож змінюємо значення за замовчуванням у seed:

📄 **`server/scripts/seed.js`**
```js
// Наповнення бази демо-даними: npm run seed
// ⚠️ СПЕРШУ ОЧИЩАЄ таблиці — лише для розробки!
import bcrypt from 'bcrypt';
import { pool, withTransaction } from '../src/db/pool.js';
import { artists, buildAlbums } from '../src/data/seed-data.js';

const ALBUM_COUNT = Number(process.env.SEED_ALBUMS ?? 240); // вимога Завдання №5: 200+

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
```

### 16.1. Довідник виконавців: один запис і створення

Клієнт показуватиме довідник виконавців і дозволятиме додати нового —
потрібні `GET /artists/:id` і `POST /artists`. Шлях той самий, що й для
альбомів: схема → репозиторій → сервіс → контролер → маршрут.

📄 **`server/src/validators/artist.schemas.js`**
```js
import { z } from 'zod';

export const artistCreateSchema = z
  .object({
    name: z
      .string({ error: "Ім'я обов'язкове" })
      .trim()
      .min(2, { error: 'Мінімум 2 символи' })
      .max(120, { error: 'Максимум 120 символів' }),
    country: z
      .string({ error: 'Країна має бути рядком' })
      .trim()
      .max(60, { error: 'Максимум 60 символів' })
      .nullable()
      .default(null)
      .transform((value) => value || null),
  })
  .strict();
```

📄 **`server/src/repositories/artists.repository.js`**
```js
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

export async function findByName(name) {
  const { rows } = await pool.query('SELECT * FROM artists WHERE LOWER(name) = LOWER($1)', [name]);
  return rows[0] ?? null;
}

export async function create({ name, country }) {
  const { rows } = await pool.query(
    'INSERT INTO artists (name, country) VALUES ($1, $2) RETURNING *, 0 AS album_count',
    [name, country],
  );
  return rows[0];
}
```

🤔 **Навіщо `0 AS album_count` в `RETURNING`?** Щоб новий виконавець
пройшов через той самий мапер, що й решта: у щойно створеного виконавця
альбомів гарантовано нуль, і рахувати їх окремим запитом немає сенсу.

📄 **`server/src/services/artists.service.js`**
```js
import * as artistsRepository from '../repositories/artists.repository.js';
import { ConflictError, NotFoundError } from '../errors/index.js';
import { toArtistResponse } from '../mappers/artist.mapper.js';

export async function list() {
  const rows = await artistsRepository.findAll();
  return rows.map(toArtistResponse);
}

export async function getById(id) {
  const artist = await artistsRepository.findById(id);
  if (!artist) throw new NotFoundError('Виконавця');
  return toArtistResponse(artist);
}

export async function create({ name, country }) {
  if (await artistsRepository.findByName(name)) {
    throw new ConflictError(`Виконавець «${name}» уже є в довіднику`);
  }
  return toArtistResponse(await artistsRepository.create({ name, country }));
}
```

📄 **`server/src/controllers/artists.controller.js`**
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
```

📄 **`server/src/routes/artists.routes.js`**
```js
import { Router } from 'express';
import * as controller from '../controllers/artists.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { intIdParamSchema } from '../validators/common.js';
import { artistCreateSchema } from '../validators/artist.schemas.js';

const router = Router();

// Довідник: публічний перегляд, додавання — для автентифікованих
router.get('/', controller.list);
router.get('/:id', validate(intIdParamSchema, 'params'), controller.getById);
router.post('/', authenticate, validate(artistCreateSchema), controller.create);

export default router;
```

### 16.2. Документація, запити й тести

**`server/docs/openapi.yaml`** — зміни невеликі, тож замість повного файлу
(понад 400 рядків) ось що треба змінити; готовий файл — у
[`assignment-5/server/docs/openapi.yaml`](assignment-5/server/docs/openapi.yaml):

1. У `components.schemas` додайте схеми сторінки й нового виконавця:

   ```yaml
       AlbumPage:
         type: object
         properties:
           data: { type: array, items: { $ref: '#/components/schemas/Album' } }
           total: { type: integer, example: 240 }
           limit: { type: integer, example: 12 }
           offset: { type: integer, example: 24 }

       ArtistInput:
         type: object
         additionalProperties: false
         required: [name]
         properties:
           name: { type: string, minLength: 2, maxLength: 120, example: Нова хвиля }
           country: { type: [string, 'null'], maxLength: 60, example: Україна }
   ```

2. У відповіді `200` для `GET /albums` замініть схему масиву на
   `{ $ref: '#/components/schemas/AlbumPage' }`.
3. До шляху `/artists` додайте `post` (з `security: [{ bearerAuth: [] }]`,
   тілом `ArtistInput` і відповідями `201` з `Location`, `400`, `401`,
   `409`), а нижче — новий шлях `/artists/{id}` з `get` (`200`, `400`,
   `404`).

**`server/requests.http`** — у запиті «Список: перша сторінка» тепер
`response.body.data[0].id` замість `response.body[0].id`, а в кінці файлу —
два нові запити (готовий файл — у
[`assignment-5/server/requests.http`](assignment-5/server/requests.http)):

```http
### Один виконавець
GET {{api}}/artists/3

### Додати виконавця → 201 (повторний запуск → 409)
POST {{api}}/artists
Authorization: Bearer {{userToken}}
Content-Type: application/json

{ "name": "Нова хвиля", "country": "Україна" }
```

Тести теж оновлюємо: перевірки списку тепер читають `response.body.data`, і
є новий блок «Виконавці».

📄 **`server/tests/api.test.js`**
```js
// Інтеграційні тести API: справжній Express-застосунок + справжня тестова база.
// Запуск: npm test (потрібні запущений Docker і база fonoteka_test).
import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { closePool } from '../src/db/pool.js';
import { ADMIN, ALBUM_ID, ARTIST_ID, USER, migrate, resetData } from './helpers.js';

const api = '/api/v1';
const newAlbum = {
  title: 'Модель',
  artistId: ARTIST_ID.okean,
  releaseDate: '2001-01-01',
  trackCount: 11,
  format: 'cd',
};

async function tokenFor(credentials) {
  const response = await request(app).post(`${api}/auth/sign-in`).send(credentials).expect(200);
  return response.body.token;
}

before(migrate);
beforeEach(resetData);
after(closePool);

describe('GET /albums', () => {
  test('повертає { data, total, limit, offset }', async () => {
    const response = await request(app).get(`${api}/albums`).expect(200);
    assert.equal(response.body.data.length, 3);
    assert.equal(response.body.total, 3);
    assert.equal(response.body.limit, 20); // значення за замовчуванням
    assert.equal(response.body.offset, 0);
    assert.equal(response.body.data[0].artist.name, 'Океан Ельзи'); // разом із виконавцем
  });

  test('пошук без урахування регістру + фільтр + сортування', async () => {
    const response = await request(app)
      .get(`${api}/albums?search=з&inCollection=true&sort=title&order=desc`)
      .expect(200);
    assert.deepEqual(
      response.body.data.map((album) => album.title),
      ['Земля'], // «Без меж» не в колекції, у «Шляху» немає «з»
    );
  });

  test('пагінація: limit і offset', async () => {
    const response = await request(app)
      .get(`${api}/albums?sort=releaseDate&limit=1&offset=1`)
      .expect(200);
    assert.equal(response.body.data.length, 1);
    assert.equal(response.body.data[0].title, 'Без меж');
    assert.equal(response.body.total, 3);
  });

  test('некоректні query-параметри → 400 з переліком полів', async () => {
    const response = await request(app)
      .get(`${api}/albums?limit=1000&sort=password_hash`)
      .expect(400);
    const fields = response.body.errors.map((error) => error.field).sort();
    assert.deepEqual(fields, ['limit', 'sort']);
  });

  test('/albums/count враховує фільтри', async () => {
    const response = await request(app).get(`${api}/albums/count?format=vinyl`).expect(200);
    assert.deepEqual(response.body, { total: 1 });
  });
});

describe('GET /albums/:id', () => {
  test('існуючий → 200, неіснуючий → 404, не UUID → 400', async () => {
    await request(app).get(`${api}/albums/${ALBUM_ID.first}`).expect(200);
    await request(app).get(`${api}/albums/00000000-0000-4000-8000-000000000099`).expect(404);
    await request(app).get(`${api}/albums/abc`).expect(400);
  });
});

describe('POST /albums', () => {
  test('без токена → 401', async () => {
    await request(app).post(`${api}/albums`).send(newAlbum).expect(401);
  });

  test('USER створює → 201 + Location', async () => {
    const token = await tokenFor(USER);
    const response = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send(newAlbum)
      .expect(201);
    assert.equal(response.headers.location, `${api}/albums/${response.body.id}`);
    assert.equal(response.body.inCollection, false); // значення за замовчуванням
  });

  test('дублікат назви (без урахування регістру) → 409', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, title: 'ЗЕМЛЯ' })
      .expect(409);
  });

  test('невідоме поле й неіснуючий виконавець → 400', async () => {
    const token = await tokenFor(USER);
    const unknown = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, id: 'hack' })
      .expect(400);
    assert.equal(unknown.body.errors[0].field, 'id');

    const noArtist = await request(app)
      .post(`${api}/albums`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, artistId: 999 })
      .expect(400);
    assert.equal(noArtist.body.errors[0].field, 'artistId');
  });

  test('битий JSON → 400 у загальному форматі, без стеку', async () => {
    const response = await request(app)
      .post(`${api}/albums`)
      .set('Content-Type', 'application/json')
      .send('{ "title": ')
      .expect(400);
    assert.equal(response.body.message, 'Некоректний JSON у тілі запиту');
    assert.equal(response.body.stack, undefined);
  });
});

describe('PUT, PATCH, DELETE /albums/:id', () => {
  test('PATCH змінює лише передані поля → 204', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .patch(`${api}/albums/${ALBUM_ID.second}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ rating: 2 })
      .expect(204);
    const { body } = await request(app).get(`${api}/albums/${ALBUM_ID.second}`);
    assert.equal(body.rating, 2);
    assert.equal(body.title, 'Без меж');
  });

  test('PUT замінює ресурс повністю: не передані поля стають null', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .put(`${api}/albums/${ALBUM_ID.first}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...newAlbum, title: 'Земля (перевидання)' })
      .expect(204);
    const { body } = await request(app).get(`${api}/albums/${ALBUM_ID.first}`);
    assert.equal(body.rating, null);
    assert.equal(body.inCollection, false);
  });

  test('id великими літерами — той самий альбом, без хибного 409', async () => {
    const token = await tokenFor(USER);
    await request(app)
      .patch(`${api}/albums/${ALBUM_ID.second.toUpperCase()}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Без меж' }) // назва не змінилася — конфлікту з самим собою немає
      .expect(204);
  });

  test('DELETE: USER → 403, ADMIN → 204, повторно → 404', async () => {
    const userToken = await tokenFor(USER);
    const adminToken = await tokenFor(ADMIN);
    const url = `${api}/albums/${ALBUM_ID.third}`;
    await request(app).delete(url).set('Authorization', `Bearer ${userToken}`).expect(403);
    await request(app).delete(url).set('Authorization', `Bearer ${adminToken}`).expect(204);
    await request(app).delete(url).set('Authorization', `Bearer ${adminToken}`).expect(404);
  });
});

describe('Виконавці', () => {
  test('список із кількістю альбомів і один виконавець', async () => {
    const list = await request(app).get(`${api}/artists`).expect(200);
    assert.equal(list.body.length, 2);
    const okean = list.body.find((artist) => artist.id === ARTIST_ID.okean);
    assert.equal(okean.albumCount, 2);
    await request(app).get(`${api}/artists/${ARTIST_ID.dakha}`).expect(200);
    await request(app).get(`${api}/artists/999`).expect(404);
  });

  test('POST: без токена → 401, з токеном → 201, дублікат → 409', async () => {
    const artist = { name: 'Один в каное', country: 'Україна' };
    await request(app).post(`${api}/artists`).send(artist).expect(401);
    const token = await tokenFor(USER);
    const created = await request(app)
      .post(`${api}/artists`)
      .set('Authorization', `Bearer ${token}`)
      .send(artist)
      .expect(201);
    assert.equal(created.headers.location, `${api}/artists/${created.body.id}`);
    await request(app)
      .post(`${api}/artists`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ОДИН В КАНОЕ' })
      .expect(409);
  });
});

describe('Автентифікація', () => {
  test('реєстрація: роль завжди USER, пароль не повертається', async () => {
    const response = await request(app)
      .post(`${api}/auth/sign-up`)
      .send({ email: 'New@Test.ua', password: 'NewPass123' })
      .expect(201);
    assert.equal(response.body.user.role, 'USER');
    assert.equal(response.body.user.email, 'new@test.ua'); // пошта нормалізується
    assert.equal(response.body.user.passwordHash, undefined);
    assert.equal(response.headers.authorization, `Bearer ${response.body.token}`);
  });

  test('спроба передати role → 400; повторна пошта → 409', async () => {
    await request(app)
      .post(`${api}/auth/sign-up`)
      .send({ email: 'x@test.ua', password: 'Password1', role: 'ADMIN' })
      .expect(400);
    await request(app).post(`${api}/auth/sign-up`).send(USER).expect(409);
  });

  test('неправильний пароль і неіснуюча пошта → однакова відповідь 401', async () => {
    const wrongPassword = await request(app)
      .post(`${api}/auth/sign-in`)
      .send({ ...USER, password: 'wrong-password' })
      .expect(401);
    const noUser = await request(app)
      .post(`${api}/auth/sign-in`)
      .send({ email: 'nobody@test.ua', password: 'whatever1' })
      .expect(401);
    assert.equal(wrongPassword.body.message, noUser.body.message);
  });

  test('me і refresh-token працюють з токеном; підроблений токен → 401', async () => {
    const token = await tokenFor(ADMIN);
    const me = await request(app)
      .get(`${api}/auth/me`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.equal(me.body.role, 'ADMIN');

    const refreshed = await request(app)
      .post(`${api}/auth/refresh-token`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    assert.ok(refreshed.body.token);

    await request(app)
      .get(`${api}/auth/me`)
      .set('Authorization', `Bearer ${token.slice(0, -2)}xx`)
      .expect(401);
  });
});

describe('Службові маршрути', () => {
  test('/health → 200, невідомий маршрут → 404 JSON', async () => {
    const health = await request(app).get('/health').expect(200);
    assert.equal(health.body.database, 'up');
    const missing = await request(app).get(`${api}/nope`).expect(404);
    assert.equal(missing.body.path, `${api}/nope`);
  });
});
```

У `server/package.json` варто оновити поле `description` (наприклад, «REST API «Фонотеки» — серверна частина Завдання №5»); решта файлу не змінюється. Короткий README сервера — повний опис буде в кореневому README (крок 24):

📄 **`server/README.md`**
```markdown
# Фонотека API (сервер Завдання №5)

Опис, ендпоїнти й інструкція запуску — у [README кореня](../README.md).
Документація API: `http://localhost:3000/api-docs`. Приклади запитів — [`requests.http`](requests.http).
```

### ✅ Контрольна точка 15

```bash
npm --prefix server run seed   # ✔ Користувачів: 2, виконавців: 12, альбомів: 240
npm --prefix server test       # ℹ tests 22 · ℹ pass 22 (тестову базу створіть, як у кроці 14)
npm run dev:server
```

```bash
curl "http://localhost:3000/api/v1/albums?limit=2&offset=10"
# {"data":[{…},{…}],"total":240,"limit":2,"offset":10}
curl http://localhost:3000/api/v1/artists/3
# {"id":3,"name":"Тихий квартет","country":"Україна","albumCount":…}
```

---

## 17. Клієнт: проєкт Vite і глобальні стилі

### 📚 Теорія: що змінюється порівняно із Завданням №3

У Завданні №3 дані жили в `localStorage`, і будь-яка операція була
**миттєвою й не могла не вдатися**. Тепер кожна операція — **мережевий
запит**, і в нього є час виконання й невдачі. Звідси нові задачі клієнта:

| Задача | Де розв'язуємо |
|---|---|
| Один спосіб звертатися до API: адреса, токен, помилки | шар `src/api/` (крок 18) |
| Чотири стани кожного запиту: завантаження, помилка, порожньо, дані | хук `useAsync` + компоненти станів (кроки 18–20) |
| Застарілі відповіді й зайві запити | `AbortController`, debounce (кроки 18, 20) |
| Хто користувач, що йому можна | `AuthContext`, `ProtectedRoute` (крок 19) |
| Помилки сервера біля полів форми | `HttpError.fieldErrors` (крок 22) |
| Пошук, фільтри, сортування й сторінки — **на сервері** | клієнт лише передає параметри (крок 20) |

Інструменти ті самі: **Vite** (сервер розробки й збірка), **React 19**,
**React Router 8** (пакет `react-router`; окремого `react-router-dom` у
версії 8 більше немає).

### 17.1. Створення проєкту

У терміналі **в корені `fonoteka/`**:

```bash
npm create vite@latest client -- --template react
```

Якщо майстер спитає «Install with npm and start now?» — відповідайте **No**.
Шаблон Vite 8 використовує лінтер `oxlint`; ми, як і на сервері, візьмемо
ESLint + Prettier. Приберіть зайве й доставте потрібне:

```bash
cd client
rm -r .oxlintrc.json README.md public/icons.svg src/App.css src/assets
npm install
npm uninstall oxlint @types/react @types/react-dom
npm install react-router
npm install -D eslint @eslint/js globals eslint-plugin-react-hooks \
  eslint-plugin-react-refresh eslint-config-prettier prettier
cd ..
```

(`@types/*` потрібні лише для TypeScript; у Windows без Git Bash видаліть
файли й папки через вікно **Project** WebStorm.)

📄 **`client/package.json`**
```json
{
  "name": "fonoteka-client",
  "private": true,
  "version": "1.0.0",
  "description": "React-клієнт «Фонотеки» — клієнтська частина Завдання №5",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "dependencies": {
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "react-router": "^8.5.1"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@vitejs/plugin-react": "^6.3.0",
    "eslint": "^10.14.0",
    "eslint-config-prettier": "^10.1.8",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.14.0",
    "prettier": "^3.9.10",
    "vite": "^8.3.7"
  }
}
```

📄 **`client/vite.config.js`**
```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // Порт 5173 саме той, що дозволений у CORS_ORIGINS сервера
  server: { port: 5173, strictPort: true },
});
```

🤔 **Навіщо `strictPort`?** Якщо 5173 зайнятий, Vite без цього тихо
візьме 5174 — а сервер дозволяє CORS лише для 5173, і кожен запит
падатиме з незрозумілою помилкою CORS. Краще одразу побачити «Port 5173 is
already in use».

### 17.2. Лінтер і форматування

Правила **`eslint-plugin-react-hooks` 7** перевіряють не лише «правила
хуків» (хуки — лише на верхньому рівні компонента), а й типові помилки з
ефектами: наприклад, правило `set-state-in-effect` забороняє синхронно
викликати `setState` у тілі `useEffect` — це майже завжди ознака, що стан
можна **обчислити**, а не синхронізувати (крок 18). Плагін
`react-refresh` стежить, щоб файли з компонентами експортували лише
компоненти, — інакше гаряче оновлення Vite перезавантажує сторінку повністю.

📄 **`client/eslint.config.js`**
```js
// ESLint (flat config): рекомендовані правила, правила хуків React, Fast Refresh.
// eslint-config-prettier вимикає правила форматування — ними займається Prettier.
import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  prettier,
]);
```

📄 **`client/.prettierrc.json`**
```json
{
  "singleQuote": true,
  "printWidth": 100,
  "trailingComma": "all"
}
```

📄 **`client/.prettierignore`**
```text
node_modules/
dist/
package-lock.json
# Markdown форматуємо вручну: Prettier вирівнює таблиці пробілами
*.md
```

📄 **`client/.gitignore`**
```text
node_modules/
dist/
.env
.env.local
.env.production
```

### 📚 Теорія: змінні середовища у Vite

Адреса API на вашому комп'ютері — `http://localhost:3000/api/v1`, а після
розгортання — щось на кшталт `https://fonoteka-api.onrender.com/api/v1`.
Писати її в коді не можна. Vite читає файли `.env`:

| Файл | Коли діє |
|---|---|
| `.env.development` | `npm run dev` |
| `.env.production` | `npm run build` |
| `.env.local` | завжди, але **не** в git (особисті перевизначення) |

У клієнтський код потрапляють **лише змінні з префіксом `VITE_`**, і вони
**вбудовуються в зібраний JavaScript** — будь-хто прочитає їх у DevTools.
⚠️ Тож у клієнті **не буває секретів**: адреса API — так, ключ від бази чи
`JWT_SECRET` — ніколи.

📄 **`client/.env.development`**
```ini
# Адреса API для `npm run dev`. Це не секрет: значення потрапляє у збірку.
VITE_API_URL=http://localhost:3000/api/v1
```

📄 **`client/.env.example`**
```ini
# Для продакшен-збірки задайте адресу свого розгорнутого API
# (на Netlify/Vercel — у налаштуваннях змінних середовища проєкту).
VITE_API_URL=https://your-api.onrender.com/api/v1
```

### 17.3. HTML, стилі й тимчасовий застосунок

📄 **`client/index.html`**
```html
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Фонотека</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`public/favicon.svg` лишіть із шаблону (або замініть своєю іконкою).

📄 **`client/public/_redirects`**
```text
# Netlify: усі адреси віддають index.html — маршрутизацією займається React Router.
# Без цього пряме відкриття /albums/42 дасть 404.
/*    /index.html   200
```

(Знадобиться під час розгортання на Netlify — крок 25. Файли з `public/`
Vite копіює в збірку без змін.)

Глобальні стилі — ті самі, що в Завданні №3: CSS-змінні кольорів, скидання
стилів, спільні класи кнопок і полів. Підхід **mobile first**: базові правила
— для телефона, а `@media (min-width: …)` додають правила для ширших
екранів.

📄 **`client/src/index.css`**
```css
/* ==========================================================================
   Глобальні стилі: кольори (CSS-змінні), скидання, типографіка й спільні
   класи (.button, .input, .page-header…). Стилі компонентів — у *.module.css.
   Підхід mobile first: базові правила — для телефона, @media (min-width) — для ширших.
   ========================================================================== */

:root {
  --color-bg: #f4f2f7;
  --color-surface: #ffffff;
  --color-text: #1d1a24;
  --color-muted: #625d6e;
  --color-border: #dcd7e3;
  --color-accent: #5b2a86;
  --color-accent-hover: #47206a;
  --color-accent-soft: #efe7f6;
  --color-danger: #b42318;
  --color-danger-soft: #fdecea;
  --color-success: #1f6f43;
  --radius: 0.75rem; /* 12px */

  font-family: system-ui, sans-serif;
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body,
h1,
h2,
h3,
p,
ul,
dl,
dd,
figure,
fieldset {
  margin: 0;
}

ul {
  padding: 0;
  list-style: none;
}

fieldset {
  padding: 0;
  border: 0;
}

button,
input,
select,
textarea {
  font: inherit;
}

a {
  color: var(--color-accent);
}

:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
}

/* --- Кнопки ----------------------------------------------------------------- */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  min-height: 2.5rem; /* 40px */
  padding: 0.5rem 1rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: var(--color-accent);
  color: #ffffff;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}

.button:hover {
  background: var(--color-accent-hover);
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.button--secondary {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text);
}

.button--secondary:hover {
  background: var(--color-surface);
  border-color: var(--color-accent);
}

.button--danger {
  background: transparent;
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.button--danger:hover {
  background: var(--color-danger-soft);
}

/* --- Поля введення ----------------------------------------------------------- */

.input {
  width: 100%;
  min-height: 2.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: inherit;
}

/* Поле з помилкою: стан беремо з атрибута, який чує й читач екрана */
.input[aria-invalid='true'] {
  border-color: var(--color-danger);
}

/* --- Розмітка сторінки -------------------------------------------------------- */

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: clamp(1.5rem, 1.2rem + 1.2vw, 2.25rem); /* 24px … 36px */
  line-height: 1.2;
}

.muted {
  color: var(--color-muted);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Маленька «пігулка» — жанр, формат */
.chip {
  display: inline-block;
  padding: 0.125rem 0.625rem;
  border-radius: 999px;
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
  text-decoration: none;
}

/* Текст лише для читачів екрана */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* Вертикальна «стопка» з проміжками */
.stack {
  display: grid;
  gap: 1rem;
  justify-items: start;
}
```

📄 **`client/src/main.jsx`** — тимчасова версія
```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Глобальні стилі — ПЕРШИМИ: стилі компонентів (*.module.css) підключаться після них
// і зможуть перевизначати загальні класи на кшталт .button
import './index.css';
import App from './App.jsx';

// ТИМЧАСОВА ВЕРСІЯ (крок 17): роутер і провайдери додамо в кроці 19
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

📄 **`client/src/App.jsx`** — тимчасова версія
```jsx
// ТИМЧАСОВА ВЕРСІЯ (крок 17): перевіряємо, що проєкт запускається і глобальні стилі працюють
function App() {
  return (
    <main className="stack" style={{ padding: '1rem' }}>
      <h1 className="page-title">🎵 Фонотека</h1>
      <p className="muted">Клієнт працює. Далі — шар API.</p>
      <div className="actions">
        <button type="button" className="button">
          Основна кнопка
        </button>
        <button type="button" className="button button--secondary">
          Другорядна
        </button>
      </div>
    </main>
  );
}

export default App;
```

Тепер можна запускати обидві частини однією командою **з кореня**:

```bash
npm --prefix client install   # якщо ще не встановлювали
npm run dev
```

```text
[dev:server] INFO: API «Фонотеки»: http://localhost:3000/api/v1 · документація: /api-docs
[dev:client]   VITE v8.x  ready in 300 ms
[dev:client]   ➜  Local:   http://localhost:5173/
```

### ✅ Контрольна точка 16

- http://localhost:5173 — заголовок «🎵 Фонотека» і дві кнопки в
  фіолетових стилях на сірому тлі;
- `npm --prefix client run lint` — без помилок;
- консоль браузера (`F12` → **Console**) — без помилок і попереджень
  (інформаційне повідомлення React про DevTools — не помилка).

---

## 18. Шар API: єдина точка спілкування з сервером

### 📚 Теорія: чому не `fetch` у компонентах

Можна викликати `fetch('http://localhost:3000/api/v1/albums')` прямо в
компоненті. Але тоді в кожному з двадцяти місць доведеться:

- повторити базову адресу;
- додати заголовок `Authorization` з токеном;
- перевірити `response.ok` (⚠️ **`fetch` не кидає помилку на 400 чи 500** —
  лише на мережеву невдачу), розібрати JSON, витягти повідомлення;
- обробити `401`: токен прострочено — «вийти» й піти на сторінку входу.

Забудете в одному місці — отримаєте баг, який важко знайти. Тому всю цю
роботу робить **один модуль** `api/http.js`, а поверх нього — маленькі
модулі ресурсів (`albumsApi`, `artistsApi`, `authApi`). Компоненти не
знають ні адрес, ні заголовків: вони викликають `albumsApi.getById(id)` і
отримують **або дані, або `HttpError`**.

```mermaid
flowchart LR
    P[Сторінка] -->|albumsApi.list query| A[api/albums.js<br/>page, size → limit, offset]
    A --> H[api/http.js<br/>адреса, токен, JSON,<br/>HttpError, 401]
    H -->|fetch| S[(REST API)]
    S -->|JSON або помилка| H
    H -->|дані або HttpError| P
```

**Клас `HttpError`** несе статус і тіло відповіді сервера. Зручні гетери
(`isValidation`, `isConflict`, `fieldErrors`) дозволяють сторінці писати
`if (error.isConflict)` замість перевірок чисел, а форма отримує помилки
полів у вигляді `{ title: 'Альбом «…» уже є у фонотеці' }`.

**401 і подія `auth:unauthorized`.** `http.js` — звичайний модуль, не
компонент: він не може викликати `useNavigate`. Тому, отримавши 401 на
запит **з токеном**, він видаляє токен і **надсилає подію** у `window`, а
`AuthProvider` (крок 19) слухає її, очищає стан і переходить на сторінку
входу. Модуль і React-дерево зв'язані, але не залежать один від одного.

📄 **`client/src/api/config.js`**
```js
// Адреса API — зі змінної середовища (файли .env.development, .env.production).
// Змінні Vite, доступні клієнту, мусять починатися з VITE_ і потрапляють у збірку:
// секретів тут бути не може, лише публічні адреси.
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export const TOKEN_KEY = 'fonoteka:token';
```

📄 **`client/src/api/http.js`**
```js
// Єдина точка спілкування з сервером: базова адреса, заголовки, токен, помилки.
// Жоден компонент не викликає fetch напряму — лише модулі з папки api/.
import { API_BASE_URL, TOKEN_KEY } from './config.js';

export class HttpError extends Error {
  constructor(status, body) {
    super(body?.message ?? `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isValidation() {
    return this.status === 400 || this.status === 422;
  }

  get isConflict() {
    return this.status === 409;
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** Помилки полів із сервера: [{ field, message }] → { title: '…', trackCount: '…' } */
  get fieldErrors() {
    const errors = this.body?.errors;
    return Array.isArray(errors) ? Object.fromEntries(errors.map((e) => [e.field, e.message])) : {};
  }
}

/** Текст помилки для користувача */
export function describeError(error) {
  if (!(error instanceof HttpError)) return "Не вдалося з'єднатися з сервером. Перевірте інтернет.";
  if (error.status >= 500) return 'Сервер тимчасово недоступний. Спробуйте пізніше.';
  return error.message;
}

// Порожні значення фільтрів у адресу не потрапляють
function buildUrl(path, params = {}) {
  const url = new URL(API_BASE_URL + path);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  return url;
}

export async function request(path, { method = 'GET', params, body, signal } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(buildUrl(path, params), {
    method,
    signal, // AbortController: застарілий запит можна скасувати
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 на запит із токеном → токен недійсний або прострочений: «виходимо» й ідемо на вхід
  if (response.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  if (response.status === 204) return null;

  const isJson = response.headers.get('Content-Type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) throw new HttpError(response.status, payload);
  return payload;
}

export const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
};
```

📄 **`client/src/api/albums.js`**
```js
import { http } from './http.js';

export const albumsApi = {
  /** Стан списку зі сторінки (page, size, …) → параметри API (limit, offset, …) */
  list: ({ page, size, ...filters }, { signal } = {}) =>
    http.get('/albums', { params: { ...filters, limit: size, offset: (page - 1) * size }, signal }),

  getById: (id, { signal } = {}) => http.get(`/albums/${id}`, { signal }),
  create: (data) => http.post('/albums', data),
  update: (id, data) => http.put(`/albums/${id}`, data),
  remove: (id) => http.delete(`/albums/${id}`),
};
```

🤔 **Чому клієнт говорить «сторінка й розмір», а сервер — `limit` і
`offset`?** Користувачу й адресі зрозуміліше «сторінка 3 по 12», а серверу
— універсальніше «пропусти 24, дай 12». Перетворення — в одному рядку
`albumsApi.list`; сторінки про `offset` не знають.

📄 **`client/src/api/artists.js`**
```js
import { http } from './http.js';

export const artistsApi = {
  list: ({ signal } = {}) => http.get('/artists', { signal }),
  create: (data) => http.post('/artists', data),
};
```

📄 **`client/src/api/auth.js`**
```js
import { http } from './http.js';

export const authApi = {
  signIn: (credentials) => http.post('/auth/sign-in', credentials),
  signUp: (credentials) => http.post('/auth/sign-up', credentials),
};
```

### 📚 Теорія: хук завантаження даних і гонка запитів

Завантаження даних у компоненті — це **ефект**: «коли змінився `id` —
запитай альбом». Наївна версія має дві приховані проблеми:

```jsx
// ❌ Наївно
useEffect(() => {
  setLoading(true);                                  // синхронний setState в ефекті
  albumsApi.getById(id).then((album) => { setAlbum(album); setLoading(false); });
}, [id]);
```

1. **Гонка відповідей.** Користувач швидко перейшов з альбому A на альбом
   B. Запит A відповів **пізніше** за B — і на сторінці B показано дані A.
   Розв'язання — **`AbortController`**: функція очищення ефекту скасовує
   попередній запит (`controller.abort()`), `fetch` відхиляє його проміс з
   `AbortError`, і застаріла відповідь нікуди не потрапляє. У вкладці
   **Network** такий запит позначено як `(canceled)`.
2. **Зайвий стан.** `loading` тут — це не окремий факт, а наслідок: «чи
   отримано відповідь саме **для поточного** `id`?». Якщо зберігати його в
   окремому `useState`, його треба вручну синхронізувати (а правило
   `set-state-in-effect` про це попередить). Наш хук **обчислює** статус:
   кожна відповідь зберігається разом із ключем запиту, для якого її
   отримано; ключ не збігається з поточним — значить, ще вантажимо.

Бонус такого підходу: поки вантажиться нова сторінка списку, **старі дані
лишаються** в `data`, і їх можна показати приглушеними замість
«стрибка» до скелетона.

У режимі розробки `StrictMode` монтує кожен компонент **двічі**, щоб
виявити ефекти без очищення. Тож у **Network** ви побачите перший запит
`(canceled)` і другий успішний — це нормально й доводить, що очищення
працює. У продакшен-збірці запит один.

📄 **`client/src/hooks/useAsync.js`**
```js
import { useEffect, useRef, useState } from 'react';

/**
 * Завантаження даних зі станами 'loading' | 'success' | 'error' і скасуванням.
 *
 *   const { status, data, error, reload } = useAsync(({ signal }) => api.get(id, { signal }), [id]);
 *
 * Щойно deps змінилися (або компонент зник з екрана), попередній запит скасовується
 * через AbortController — його застаріла відповідь не перезапише нову.
 */
export function useAsync(asyncFn, deps) {
  const [attempt, setAttempt] = useState(0); // «Спробувати ще раз» — новий запит із тими ж deps
  const requestKey = `${JSON.stringify(deps)}#${attempt}`;
  const [result, setResult] = useState({ key: null, data: null, error: null });

  // Завжди найсвіжіша функція запиту, без перезапуску ефекту на кожен рендер
  const asyncFnRef = useRef(asyncFn);
  useEffect(() => {
    asyncFnRef.current = asyncFn;
  });

  useEffect(() => {
    const controller = new AbortController();
    asyncFnRef.current({ signal: controller.signal }).then(
      (data) => setResult({ key: requestKey, data, error: null }),
      (error) => {
        if (!controller.signal.aborted) setResult({ key: requestKey, data: null, error });
      },
    );
    return () => controller.abort();
  }, [requestKey]);

  // Стан не зберігаємо, а обчислюємо: відповідь не для поточного запиту → ще вантажимо.
  // Старі data при цьому лишаються — сторінка може показати їх приглушеними.
  let status = 'loading';
  if (result.key === requestKey) status = result.error ? 'error' : 'success';

  return {
    status,
    data: result.data,
    error: result.error,
    reload: () => setAttempt((count) => count + 1),
  };
}
```

🤔 **Навіщо `asyncFnRef`?** Функція запиту — нова на кожен рендер (це
стрілочна функція всередині компонента). Якби вона стояла в залежностях
ефекту, запит ішов би на **кожен** рендер. Ефект залежить лише від ключа
(`deps`), а свіжу функцію бере з `ref`.

Перевіримо шар API тимчасовим `App.jsx`:

📄 **`client/src/App.jsx`** — тимчасова версія
```jsx
import { albumsApi } from './api/albums.js';
import { describeError } from './api/http.js';
import { useAsync } from './hooks/useAsync.js';

// ТИМЧАСОВА ВЕРСІЯ (крок 18): перевіряємо шар API і хук useAsync
function App() {
  const { status, data, error, reload } = useAsync(
    ({ signal }) =>
      albumsApi.list({ page: 1, size: 5, sort: 'releaseDate', order: 'desc' }, { signal }),
    [],
  );

  return (
    <main className="stack" style={{ padding: '1rem' }}>
      <h1 className="page-title">🎵 Фонотека</h1>

      {status === 'loading' && <p>Завантаження…</p>}

      {status === 'error' && (
        <div role="alert" className="stack">
          <p>{describeError(error)}</p>
          <button type="button" className="button" onClick={reload}>
            Спробувати ще раз
          </button>
        </div>
      )}

      {status === 'success' && (
        <>
          <p className="muted">5 найновіших із {data.total}:</p>
          <ul>
            {data.data.map((album) => (
              <li key={album.id}>
                {album.releaseDate} — {album.title} ({album.artist.name})
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default App;
```

### ✅ Контрольна точка 17

- На сторінці — «5 найновіших із 240:» і п'ять альбомів із датами й
  виконавцями.
- **DevTools → Network → Fetch/XHR**: запит
  `albums?sort=releaseDate&order=desc&limit=5&offset=0` зі статусом 200
  (і, через `StrictMode`, один `(canceled)` перед ним). У відповіді —
  заголовок `Access-Control-Allow-Origin: http://localhost:5173`.

### 🧪 Експерименти

1. **Сервер недоступний.** Зупиніть `npm run dev` і запустіть лише клієнт
   (`npm run dev:client`). Сторінка покаже «Не вдалося з'єднатися з
   сервером…» і кнопку повтору. Запустіть сервер (`npm run dev:server` у
   другому терміналі) → **Спробувати ще раз** → дані з'явилися.
2. **CORS.** У `server/.env` поставте `CORS_ORIGINS=http://localhost:5999` і
   перезапустіть сервер (зміни `.env` режим `--watch` не помічає). Сторінка
   покаже ту саму помилку з'єднання, а в консолі — `blocked by CORS policy:
   No 'Access-Control-Allow-Origin' header`. У Network запит позначено
   **CORS error**, але в терміналі сервера видно рядок `GET /api/v1/albums…
   200`: сервер **відповів**, це браузер не віддав відповідь JavaScript.
   CORS захищає **користувача** (його браузер), а не сервер — `curl` отримає
   дані й так. Поверніть значення й перезапустіть сервер.
3. **Помилка 400.** У `App.jsx` змініть `size: 5` на `size: 500` → сервер
   поверне 400, а сторінка покаже його повідомлення «Помилка валідації».

---
## 19. Автентифікація в клієнті, сповіщення й макет

### 📚 Теорія: стан автентифікації — у Context

Хто увійшов і з якою роллю, потрібно знати **багатьом** компонентам: шапці
(показати пошту й «Вийти»), сторінці альбому (показати «Видалити» лише
адміністратору), захищеним маршрутам. Передавати це пропсами через усе
дерево незручно, тому — **Context**, як у Завданні №3:

- `AuthContext.js` — сам контекст і хук `useAuth()`. **Окремий файл без
  компонентів**: правило `react-refresh/only-export-components` вимагає,
  щоб файл із компонентом експортував лише компоненти, інакше гаряче
  оновлення Vite не спрацює.
- `AuthProvider.jsx` — компонент, що зберігає користувача й надає функції
  `signIn`, `signUp`, `signOut`.

У React 19 провайдером є сам контекст: `<AuthContext value={…}>` замість
старого `<AuthContext.Provider value={…}>`.

**Де зберігати токен.** Вимога завдання — `localStorage`: токен
переживає перезавантаження сторінки. ⚠️ Це свідоме спрощення: будь-який
сторонній скрипт на сторінці (XSS) може прочитати `localStorage`. У
реальних проєктах токен частіше тримають у пам'яті, а довгоживучий
refresh-токен — у cookie з прапорцем `httpOnly`, недоступній для JavaScript.
Ми зменшуємо ризик тим, що React екранує весь текст і ми ніде не вставляємо
HTML з даних.

**Роль користувача** клієнт бере з відповіді сервера (`user.role`) — не з
власного коду й не з форми. Але ⚠️ **усе, що клієнт робить із роллю, — лише
зручність**: сховати кнопку, не пустити на сторінку. Справжній захист —
перевірка токена й ролі **на сервері** (крок 12). Користувач може
змінити `localStorage` і побачити кнопку «Видалити», але сервер на його
запит відповість 403.

**Строк дії.** Під час завантаження сторінки `AuthProvider` читає `exp` із
токена (дані JWT — лише base64url) і, якщо токен прострочений, одразу
«виходить», не чекаючи першої відмови сервера.

📄 **`client/src/context/AuthContext.js`**
```js
import { createContext, useContext } from 'react';

// Окремий файл без компонентів: так працює швидке оновлення Vite (Fast Refresh)
export const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth() має викликатися всередині <AuthProvider>');
  return context;
}
```

📄 **`client/src/context/AuthProvider.jsx`**
```jsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from './AuthContext.js';
import { authApi } from '../api/auth.js';
import { TOKEN_KEY } from '../api/config.js';

const USER_KEY = 'fonoteka:user';

/** Payload JWT — це лише Base64URL, його може прочитати будь-хто (підпис перевіряє сервер) */
function isExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Початковий стан: токен і користувач із localStorage, якщо токен ще чинний
function loadUser() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY));
    if (token && user && !isExpired(token)) return user;
  } catch {
    // пошкоджені дані — просто вважаємо, що користувач не увійшов
  }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  return null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const [sessionExpired, setSessionExpired] = useState(false);
  const navigate = useNavigate();

  const saveSession = useCallback(({ user: nextUser, token }) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    setSessionExpired(false);
    return nextUser;
  }, []);

  const signIn = useCallback(
    async (credentials) => saveSession(await authApi.signIn(credentials)),
    [saveSession],
  );
  const signUp = useCallback(
    async (credentials) => saveSession(await authApi.signUp(credentials)),
    [saveSession],
  );

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  // Сервер відповів 401 на запит із токеном (див. api/http.js) → вихід і сторінка входу
  useEffect(() => {
    const handleUnauthorized = () => {
      signOut();
      setSessionExpired(true);
      // Після входу повернемося туди, де були
      const { pathname, search } = window.location;
      navigate('/login', { state: { from: { pathname: pathname + search } } });
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [signOut, navigate]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin: user?.role === 'ADMIN',
      sessionExpired,
      signIn,
      signUp,
      signOut,
    }),
    [user, sessionExpired, signIn, signUp, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
```

🤔 **Навіщо `useCallback` і `useMemo`?** Значення контексту — об'єкт. Якби
він створювався заново на кожен рендер провайдера, **усі** споживачі
`useAuth()` перерендерювалися б щоразу. `useMemo` створює новий об'єкт
лише тоді, коли справді змінився користувач або прапорець `sessionExpired`.

🤔 **Чому `sessionExpired` — окремий прапорець, а не `state` у
навігації?** Після `signOut` захищений маршрут сам перенаправить на
`/login` — і його перенаправлення замінить наш `state`. Прапорець у
контексті переживає будь-яке перенаправлення, і сторінка входу точно
покаже «Сесія завершилася».

### 19.1. Сповіщення

Після дій потрібен зворотний зв'язок: «Альбом створено», «Не вдалося
видалити». Сповіщення (toast) з'являється в куті екрана й зникає за 4
секунди. Його показують з різних сторінок, тож це ще один маленький
контекст. Контейнер має `aria-live="polite"`: читач екрана озвучить нове
сповіщення, не забираючи фокус.

📄 **`client/src/context/ToastContext.js`**
```js
import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast() має викликатися всередині <ToastProvider>');
  return context;
}
```

📄 **`client/src/context/ToastProvider.jsx`**
```jsx
import { useCallback, useMemo, useState } from 'react';
import { ToastContext } from './ToastContext.js';
import styles from './Toasts.module.css';

let nextId = 1;

/** Сповіщення про результат дій: «Альбом створено», «Не вдалося видалити»… */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = 'success', message }) => {
      const id = nextId++;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismiss(id), 4000); // зникає саме через 4 с
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      {/* aria-live: читач екрана озвучить нове сповіщення, не переводячи фокус */}
      <div className={styles.region} aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`} role="status">
            <span>{toast.message}</span>
            <button
              type="button"
              className={styles.close}
              onClick={() => dismiss(toast.id)}
              aria-label="Закрити сповіщення"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}
```

📄 **`client/src/context/Toasts.module.css`**
```css
/* Сповіщення: унизу екрана на телефоні, у правому нижньому куті на ширших */
.region {
  position: fixed;
  inset: auto 1rem 1rem;
  z-index: 10;
  display: grid;
  gap: 0.5rem;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0.75rem 0.75rem 1rem;
  border-left: 4px solid;
  border-radius: 0.5rem;
  background: var(--color-surface);
  box-shadow: 0 0.5rem 1.5rem rgb(0 0 0 / 0.15);
}

.success {
  border-color: var(--color-success);
}

.error {
  border-color: var(--color-danger);
}

.close {
  flex: none;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
}

.close:hover {
  background: var(--color-bg);
}

@media (min-width: 48rem) {
  .region {
    inset: auto 1.5rem 1.5rem auto;
    width: 24rem;
  }
}
```

### 19.2. Захищені маршрути й макет

`ProtectedRoute` — маршрут-обгортка без власного шляху: якщо користувач не
увійшов, він перенаправляє на `/login` і **запам'ятовує в `state`, куди
користувач ішов**; після входу сторінка входу поверне його туди.

📄 **`client/src/components/ProtectedRoute.jsx`**
```jsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext.js';

/**
 * Обгортка маршрутів, доступних лише після входу.
 * Неавторизованого користувача перенаправляє на /login і запам'ятовує, куди він ішов.
 * ⚠️ Це зручність, а не безпека: справжній захист — перевірка токена на сервері.
 */
function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
```

📄 **`client/src/components/Layout.jsx`**
```jsx
import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext.js';
import styles from './Layout.module.css';

const navLinkClass = ({ isActive }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

function Layout() {
  const { user, isAuthenticated, signOut } = useAuth();

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/albums" className={styles.logo}>
          🎵 Фонотека
        </Link>

        <nav aria-label="Основна навігація">
          <ul className={styles.navList}>
            <li>
              {/* end: «Альбоми» активні лише на /albums, а не на /albums/new */}
              <NavLink to="/albums" end className={navLinkClass}>
                Альбоми
              </NavLink>
            </li>
            <li>
              <NavLink to="/artists" className={navLinkClass}>
                Виконавці
              </NavLink>
            </li>
            {isAuthenticated && (
              <li>
                <NavLink to="/albums/new" className={navLinkClass}>
                  Додати альбом
                </NavLink>
              </li>
            )}
          </ul>
        </nav>

        <div className={styles.account}>
          {isAuthenticated ? (
            <>
              <span className={styles.user}>
                {user.email}
                {user.role === 'ADMIN' && <span className="chip">ADMIN</span>}
              </span>
              <button type="button" className="button button--secondary" onClick={signOut}>
                Вийти
              </button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkClass}>
              Увійти
            </NavLink>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        Навчальний приклад до Завдання №5 · Основи web програмування · ЛНУ ім. Івана Франка
      </footer>
    </div>
  );
}

export default Layout;
```

📄 **`client/src/components/Layout.module.css`**
```css
/* Підвал завжди внизу, навіть на короткій сторінці */
.layout {
  display: grid;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: minmax(0, 1fr);
  min-height: 100dvh;
}

.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.logo {
  color: var(--color-text);
  font-size: 1.25rem; /* 20px */
  font-weight: 800;
  text-decoration: none;
}

.navList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.navLink {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  color: var(--color-text);
  text-decoration: none;
}

.navLink:hover {
  background: var(--color-bg);
}

.active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 600;
}

.main {
  width: 100%;
  max-width: 72rem; /* 1152px */
  margin-inline: auto;
  padding: 1.5rem 1rem 3rem;
}

.footer {
  padding: 1.5rem 1rem;
  border-top: 1px solid var(--color-border);
  color: var(--color-muted);
  font-size: 0.875rem;
  text-align: center;
}

@media (min-width: 48rem) {
  .header {
    padding-inline: 2rem;
  }
}

.account {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.user {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-muted);
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}
```

### 19.3. Поле форми й сторінка входу

`Field` — та сама обгортка поля, що й у Завданні №3: підпис, підказка,
помилка й зв'язки `aria-invalid` / `aria-describedby`, завдяки яким читач
екрана озвучує помилку разом із полем. Сам елемент введення малює батько
через функцію в `children` (render prop).

📄 **`client/src/components/Field.jsx`**
```jsx
import styles from './Field.module.css';

/**
 * Обгортка поля форми: підпис, підказка, помилка й aria-зв'язки між ними.
 * Сам елемент введення малює батько — через функцію в children (render prop),
 * тож Field підходить для <input>, <textarea>, <select> і react-select.
 *
 * @param {Object} props
 * @param {string} props.id — id елемента введення (з ним зв'язується <label>)
 * @param {string} props.label
 * @param {string} [props.hint]
 * @param {string | null} [props.error]
 * @param {(fieldProps: {id: string, 'aria-invalid'?: boolean, 'aria-describedby'?: string}) => React.ReactNode} props.children
 */
function Field({ id, label, hint, error, children }) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ');

  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>

      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
      })}

      {hint && (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      )}
      {/* Елемент є завжди і має висоту рядка: поява помилки не зсуває форму */}
      <p id={errorId} className={styles.error} role="alert">
        {error}
      </p>
    </div>
  );
}

export default Field;
```

📄 **`client/src/components/Field.module.css`**
```css
.field {
  display: grid;
  gap: 0.25rem;
  align-content: start;
}

.label {
  font-size: 0.875rem; /* 14px */
  font-weight: 600;
}

.hint {
  color: var(--color-muted);
  font-size: 0.8125rem; /* 13px */
}

/* min-height резервує місце під один рядок повідомлення */
.error {
  min-height: 1.25rem; /* 20px */
  color: var(--color-danger);
  font-size: 0.8125rem;
  font-weight: 600;
}
```

Сторінка входу й реєстрації — одна, з пропом `mode`. Зверніть увагу на
обробку помилок: **400** — помилки біля полів (сервер сказав, яке поле
неправильне), **409** (пошта зайнята) — біля поля e-mail, решта (**401**
«Неправильна пошта або пароль», **429**, мережа) — загальне повідомлення над
формою.

📄 **`client/src/pages/SignInPage.jsx`**
```jsx
import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import Field from '../components/Field.jsx';
import { HttpError, describeError } from '../api/http.js';
import { useAuth } from '../context/AuthContext.js';
import styles from './SignInPage.module.css';

/** Вхід (/login) і реєстрація (/register) — одна сторінка, різний режим */
function SignInPage({ mode = 'sign-in' }) {
  const isSignUp = mode === 'sign-up';
  const { isAuthenticated, sessionExpired, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Куди повернутися після входу: туди, звідки нас перенаправив ProtectedRoute
  const from = location.state?.from?.pathname ?? '/albums';

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!values.email.trim()) nextErrors.email = 'Введіть e-mail';
    if (!values.password) nextErrors.password = 'Введіть пароль';
    else if (isSignUp && values.password.length < 8) nextErrors.password = 'Мінімум 8 символів';
    if (Object.keys(nextErrors).length > 0) return setErrors(nextErrors);

    setIsSubmitting(true);
    setFormError(null);
    try {
      const credentials = { email: values.email.trim(), password: values.password };
      await (isSignUp ? signUp(credentials) : signIn(credentials));
      navigate(from, { replace: true });
    } catch (error) {
      if (error instanceof HttpError && error.isValidation) setErrors(error.fieldErrors);
      else if (error instanceof HttpError && error.isConflict) setErrors({ email: error.message });
      else setFormError(describeError(error)); // 401 «Неправильна пошта або пароль», 429, мережа
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className="page-title">{isSignUp ? 'Реєстрація' : 'Вхід'}</h1>

      {sessionExpired && (
        <p className={styles.notice} role="status">
          Сесія завершилася. Увійдіть знову.
        </p>
      )}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <Field id="email" label="E-mail" error={errors.email}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="email"
              type="email"
              value={values.email}
              onChange={handleChange}
              className="input"
              autoComplete="email"
            />
          )}
        </Field>
        <Field
          id="password"
          label="Пароль"
          hint={isSignUp ? 'Щонайменше 8 символів' : undefined}
          error={errors.password}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              name="password"
              type="password"
              value={values.password}
              onChange={handleChange}
              className="input"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          )}
        </Field>
        <button type="submit" className="button" disabled={isSubmitting}>
          {isSubmitting ? 'Зачекайте…' : isSignUp ? 'Зареєструватися' : 'Увійти'}
        </button>
      </form>

      <p>
        {isSignUp ? (
          <>
            Уже маєте обліковий запис? <Link to="/login">Увійти</Link>
          </>
        ) : (
          <>
            Немає облікового запису? <Link to="/register">Зареєструватися</Link>
          </>
        )}
      </p>
    </div>
  );
}

export default SignInPage;
```

📄 **`client/src/pages/SignInPage.module.css`**
```css
.page {
  display: grid;
  gap: 1rem;
  max-width: 26rem;
  margin-inline: auto;
}

.form {
  display: grid;
  gap: 0.5rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.formError,
.notice {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.formError {
  background: var(--color-danger-soft);
  color: var(--color-danger);
  font-weight: 600;
}

.notice {
  background: var(--color-accent-soft);
}
```

📄 **`client/src/pages/NotFoundPage.jsx`**
```jsx
import { Link } from 'react-router';

function NotFoundPage({ message = 'Такої сторінки не існує.' }) {
  return (
    <div className="stack">
      <h1 className="page-title">404</h1>
      <p>{message}</p>
      <Link to="/albums" className="button">
        До списку альбомів
      </Link>
    </div>
  );
}

export default NotFoundPage;
```

### 19.4. Провайдери й маршрути

Остаточна версія `main.jsx`. Порядок обгорток важливий: `AuthProvider`
викликає `useNavigate`, тож він мусить бути **всередині** `BrowserRouter`.

📄 **`client/src/main.jsx`**
```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
// Глобальні стилі — ПЕРШИМИ: стилі компонентів (*.module.css) підключаться після них
// і зможуть перевизначати загальні класи на кшталт .button
import './index.css';
import { AuthProvider } from './context/AuthProvider.jsx';
import { ToastProvider } from './context/ToastProvider.jsx';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* AuthProvider усередині роутера: йому потрібен useNavigate для переходу на /login */}
      <ToastProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
```

Маршрути вже остаточні, але сторінок альбомів і виконавців ще немає — на
їхньому місці заглушки:

📄 **`client/src/App.jsx`** — тимчасова версія
```jsx
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import SignInPage from './pages/SignInPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// ТИМЧАСОВА ВЕРСІЯ (крок 19): сторінки альбомів і виконавців — у кроках 20–23
// Заглушка для сторінок, яких ще немає
function Placeholder({ title }) {
  return <h1 className="page-title">{title}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/albums" replace />} />
        <Route path="albums" element={<Placeholder title="Альбоми" />} />
        <Route path="albums/:albumId" element={<Placeholder title="Сторінка альбому" />} />
        {/* Створення й редагування — лише після входу */}
        <Route element={<ProtectedRoute />}>
          <Route path="albums/new" element={<Placeholder title="Новий альбом" />} />
          <Route path="albums/:albumId/edit" element={<Placeholder title="Редагування" />} />
        </Route>
        <Route path="artists" element={<Placeholder title="Виконавці" />} />
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<SignInPage mode="sign-up" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
```

### ✅ Контрольна точка 18

1. http://localhost:5173 перенаправляє на `/albums`: шапка «🎵 Фонотека»,
   посилання **Альбоми**, **Виконавці**, **Увійти**; заголовок «Альбоми».
2. Відкрийте вручну http://localhost:5173/albums/new → вас перенаправило на
   `/login`.
3. Увійдіть як `user@fonoteka.test` / `UserPass123` → ви **повернулися** на
   «Новий альбом», у шапці — пошта, «Додати альбом» і «Вийти».
4. **DevTools → Application → Local Storage → http://localhost:5173**: ключі
   `fonoteka:token` і `fonoteka:user`. Перезавантажте сторінку — ви досі
   увійшли.
5. «Вийти» → ключі зникли. Увійдіть як `admin@fonoteka.test` /
   `AdminPass123` → біля пошти позначка **ADMIN**.
6. Неправильний пароль → «Неправильна пошта або пароль» над формою.
   Реєстрація з поштою `user@fonoteka.test` → «Користувач із такою поштою
   вже існує» під полем e-mail.

### 🧪 Експерименти

1. **Прострочений токен.** У `server/.env` поставте `JWT_EXPIRES_IN=20s`,
   перезапустіть сервер, увійдіть, зачекайте 20 секунд і перезавантажте
   сторінку: ви вже не увійшли — `AuthProvider` перевірив `exp`. Поверніть
   `1h`.
2. **Підміна ролі.** В **Application → Local Storage** змініть у
   `fonoteka:user` значення `"role":"USER"` на `"ADMIN"` і перезавантажте
   сторінку: позначка ADMIN з'явилася. Чи стали ви адміністратором? На
   сервері — ні: у токені досі `USER`, і в кроці 21 сервер відповість на
   спробу видалення 403. Інтерфейс лише **відображає** права, а не
   **надає** їх.

---

## 20. Список альбомів: пошук, фільтри, сортування, пагінація, три макети

### 📚 Теорія: стан списку — в адресі

Як і в Завданні №3, пошук, фільтри, сортування й номер сторінки живуть у
**query-параметрах адреси**: `/albums?q=ніч&format=vinyl&sort=rating&order=desc&page=2`.
Посилання можна надіслати, після перезавантаження все відновлюється, а
кнопка «Назад» повертає попередній стан списку.

Різниця з №3 — **хто фільтрує**. Тепер клієнт нічого не фільтрує й не
сортує: він лише перетворює стан з адреси на параметри запиту, а сервер
повертає готову сторінку. Ланцюжок:

```text
адреса ?q=ніч&page=2  →  parseListQuery  →  query { search: 'ніч', page: 2, size: 12, … }
  →  albumsApi.list  →  GET /api/v1/albums?search=ніч&limit=12&offset=12  →  { data, total, … }
```

| Рішення | Чому |
|---|---|
| короткі імена в адресі (`q`, `artist`, `owned`) | адреса читабельна й коротка |
| значення за замовчуванням не пишемо | `/albums` замість `/albums?q=&page=1&size=12&sort=title…` |
| `page`, `size`, `sort` перевіряємо при розборі | адресу може змінити будь-хто (`?page=abc`) — показуємо першу сторінку, а не падаємо |
| будь-яка зміна, крім сторінки, скидає `page` на 1 | змінили фільтр на 5-й сторінці — нова вибірка може мати лише 2 сторінки |
| пошук пишемо в адресу з `replace: true` | інакше кожна літера — окремий запис історії, і «Назад» стирає пошук по літері |

### 📚 Теорія: debounce + скасування

Поле пошуку оновлює адресу **на кожну літеру** — інакше поле «гальмувало
б». А от запит до сервера на кожну літеру — марнотратство: слово «вечір» дало
б п'ять запитів, і чотири відповіді були б непотрібні. **Debounce** — значення
«доходить» до запиту лише тоді, коли користувач **перестав друкувати** на
300 мс. Хук `useDebounce` робить це таймером, який скасовується при кожній
новій зміні.

Debounce і `AbortController` доповнюють одне одного: debounce **зменшує
кількість** запитів, скасування **гарантує**, що застаріла відповідь (якщо
запит уже пішов) не перезапише новішу.

Один нюанс: очищення пошуку (кнопка ✕, «Скинути фільтри») застосовуємо
**одразу**, без затримки, — інакше на 300 мс з'явився б проміжний запит зі
старим пошуком і новими фільтрами.

### 📚 Теорія: три макети

Вимога завдання — **три структурно різні макети**, а не одна сітка, що
стискається:

| | Телефон (< 768 px) | Планшет (768–1023 px) | Комп'ютер (≥ 1024 px) |
|---|---|---|---|
| Фільтри | згорнуті за кнопкою «Показати (N)» | відкриті, сітка над списком | бічна колонка ліворуч |
| Альбоми | картки в одну колонку | картки в кілька колонок | **таблиця** |
| Сортування | список + кнопка ↑/↓ | список + кнопка ↑/↓ | клік по заголовку колонки |

Розташування (колонки, сітка, приховування кнопки) змінює **CSS**
(`@media (min-width: 48rem)` і `(min-width: 64rem)`). Але таблиця й картки —
**різна розмітка**, і рендерити обидві, ховаючи одну через CSS, означає
подвоєний DOM і зайву роботу рендерингу, а ще дубльовані `id` і посилання. Тому вибір «таблиця чи
картки» робить **JavaScript**: хук `useMediaQuery('(min-width: 64rem)')`.

Хук побудовано на `useSyncExternalStore` — стандартному способі React
«підписатися» на зовнішнє джерело (тут — `window.matchMedia`): React сам
викликає підписку й відписку й перерендерює компонент, коли медіазапит
змінює результат.

### 📚 Теорія: чотири стани

| Стан | Що показуємо |
|---|---|
| перше завантаження | **скелетон** — сірі «заготовки» карток: структура сторінки видна одразу, без стрибка верстки |
| повторне завантаження (нова сторінка, фільтр) | **старі дані приглушено** (`opacity: 0.55`) + `aria-busy="true"` на області результатів |
| помилка | повідомлення + «Спробувати ще раз» |
| порожньо | різні тексти: «немає альбомів узагалі», «нічого не знайдено» (+ «Скинути фільтри»), «такої сторінки немає» (`?page=99`) |
| дані | картки або таблиця |

### 20.1. Допоміжні функції

📄 **`client/src/utils/format.js`**
```js
export const FORMATS = [
  { value: 'vinyl', label: 'Вініл' },
  { value: 'cd', label: 'CD' },
  { value: 'cassette', label: 'Касета' },
  { value: 'digital', label: 'Цифровий' },
];

export const formatLabel = (value) =>
  FORMATS.find((format) => format.value === value)?.label ?? value;

const dateFormatter = new Intl.DateTimeFormat('uk-UA', { dateStyle: 'long' });

/** '2014-04-18' → «18 квітня 2014 р.» (без зсуву часового поясу) */
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

/** 4 → «★★★★☆»; null → «—» */
export function formatRating(rating) {
  return rating ? '★'.repeat(rating) + '☆'.repeat(5 - rating) : '—';
}

// Українська множина: 1 трек, 2 треки, 5 треків, 21 трек, 22 треки, 11 треків
const pluralRules = new Intl.PluralRules('uk-UA');
const TRACK_FORMS = { one: 'трек', few: 'треки', many: 'треків', other: 'трека' };

/** 12 → «12 треків», 22 → «22 треки» */
export function formatTrackCount(count) {
  return `${count} ${TRACK_FORMS[pluralRules.select(count)]}`;
}
```

🤔 **Навіщо `Intl.PluralRules`?** «1 трек, 2 треки, 5 треків, 21 трек, 22
треки» — в українській три форми множини, і правило залежить від останніх
цифр. `Intl.PluralRules('uk-UA')` знає ці правила, тож не треба писати
власні `if (n % 10 === 1 && n % 100 !== 11)`.

📄 **`client/src/utils/listQuery.js`**
```js
// Стан списку живе в адресі (?q=ніч&artist=3&page=2): посилання можна надіслати,
// а після перезавантаження сторінки пошук, фільтри й сортування відновлюються.

export const SORT_FIELDS = [
  { value: 'title', label: 'Назвою' },
  { value: 'releaseDate', label: 'Датою виходу' },
  { value: 'rating', label: 'Оцінкою' },
  { value: 'trackCount', label: 'Кількістю треків' },
];

export const PAGE_SIZES = [12, 24, 48];

export const DEFAULT_QUERY = {
  search: '',
  artistId: '',
  format: '',
  inCollection: '',
  yearFrom: '',
  yearTo: '',
  ratingMin: '',
  sort: 'title',
  order: 'asc',
  page: 1,
  size: 12,
};

// Ключ у стані → короткий параметр в адресі
const PARAM_NAMES = {
  search: 'q',
  artistId: 'artist',
  format: 'format',
  inCollection: 'owned',
  yearFrom: 'from',
  yearTo: 'to',
  ratingMin: 'rating',
  sort: 'sort',
  order: 'order',
  page: 'page',
  size: 'size',
};

/**
 * Адреса → стан. Адресу може змінити будь-хто (?page=abc), тому сторінку,
 * розмір і сортування перевіряємо; фільтри перевірить сервер (400 → повідомлення).
 */
export function parseListQuery(searchParams) {
  const query = { ...DEFAULT_QUERY };
  for (const [key, name] of Object.entries(PARAM_NAMES)) {
    const value = searchParams.get(name);
    if (value !== null) query[key] = value;
  }

  const page = Number(query.page);
  const size = Number(query.size);
  return {
    ...query,
    sort: SORT_FIELDS.some((field) => field.value === query.sort) ? query.sort : DEFAULT_QUERY.sort,
    order: query.order === 'desc' ? 'desc' : 'asc',
    page: Number.isInteger(page) && page > 0 ? page : DEFAULT_QUERY.page,
    size: PAGE_SIZES.includes(size) ? size : DEFAULT_QUERY.size,
  };
}

/** Стан → адреса. Значення за замовчуванням не пишемо: /albums замість /albums?q=&page=1… */
export function toSearchParams(query) {
  const params = new URLSearchParams();
  for (const [key, name] of Object.entries(PARAM_NAMES)) {
    if (query[key] !== DEFAULT_QUERY[key] && query[key] !== '') params.set(name, query[key]);
  }
  return params;
}

/** Чи задано хоч один фільтр або пошук (для кнопки «Скинути фільтри») */
export const hasFilters = (query) =>
  ['search', 'artistId', 'format', 'inCollection', 'yearFrom', 'yearTo', 'ratingMin'].some(
    (key) => query[key] !== '',
  );
```

### 20.2. Хуки

📄 **`client/src/hooks/useDebounce.js`**
```js
import { useEffect, useState } from 'react';

/**
 * Повертає value, але із затримкою: нове значення «доходить» лише тоді,
 * коли value не змінювалося delay мілісекунд.
 * @template T
 * @param {T} value
 * @param {number} [delay=300]
 * @returns {T}
 */
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // Значення змінилося раніше, ніж минув delay, — старий таймер скасовуємо
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
```

📄 **`client/src/hooks/useMediaQuery.js`**
```js
import { useSyncExternalStore } from 'react';

/** true, якщо медіазапит виконується: useMediaQuery('(min-width: 64rem)') */
export function useMediaQuery(query) {
  return useSyncExternalStore(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
  );
}
```

📄 **`client/src/hooks/useListQuery.js`**
```js
import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import { DEFAULT_QUERY, parseListQuery, toSearchParams } from '../utils/listQuery.js';

/**
 * Стан списку в адресі:
 *   const [query, updateQuery, resetFilters] = useListQuery();
 *   updateQuery({ artistId: '3' });   // → /albums?artist=3 (сторінка скидається на 1)
 *   updateQuery({ page: 2 });          // → /albums?artist=3&page=2
 */
export function useListQuery() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useMemo(() => parseListQuery(searchParams), [searchParams]);

  const updateQuery = (changes, { replace = false } = {}) => {
    // Будь-яка зміна, крім самої сторінки, починає список спочатку
    const page = 'page' in changes ? changes.page : 1;
    setSearchParams(toSearchParams({ ...query, ...changes, page }), { replace });
  };

  // Пошук і фільтри скидаємо, сортування й розмір сторінки залишаємо
  const resetFilters = () =>
    setSearchParams(
      toSearchParams({ ...DEFAULT_QUERY, sort: query.sort, order: query.order, size: query.size }),
    );

  return [query, updateQuery, resetFilters];
}
```

📄 **`client/src/hooks/useArtists.js`**
```js
import { artistsApi } from '../api/artists.js';
import { useAsync } from './useAsync.js';

/** Довідник виконавців для фільтрів і форми */
export function useArtists() {
  const { data, status, error, reload } = useAsync(({ signal }) => artistsApi.list({ signal }), []);
  return { artists: data ?? [], status, error, reload };
}
```

### 20.3. Стани, обкладинка, пагінація

📄 **`client/src/components/states/States.jsx`**
```jsx
import styles from './States.module.css';

/** Скелетон списку: показує структуру ще до приходу даних — без «стрибка» верстки */
export function ListSkeleton({ count = 6 }) {
  return (
    <ul className={styles.skeletonGrid} aria-busy="true" aria-label="Завантаження списку">
      {Array.from({ length: count }, (_, index) => (
        <li key={index} className={styles.skeletonCard} aria-hidden="true">
          <div className={`${styles.skeleton} ${styles.image}`} />
          <div className={`${styles.skeleton} ${styles.line}`} />
          <div className={`${styles.skeleton} ${styles.line} ${styles.short}`} />
        </li>
      ))}
    </ul>
  );
}

/** Помилка завантаження з кнопкою повтору */
export function ErrorState({ message, onRetry }) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <h2 className={styles.title}>Щось пішло не так</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button" onClick={onRetry}>
          Спробувати ще раз
        </button>
      )}
    </div>
  );
}

/** Порожній результат */
export function EmptyState({ message, actionLabel, onAction }) {
  return (
    <div className={styles.state}>
      <p>{message}</p>
      {onAction && (
        <button type="button" className="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/** Невеликий індикатор для сторінок з одним записом */
export function PageSpinner({ label = 'Завантаження…' }) {
  return (
    <p className={styles.spinner} role="status">
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </p>
  );
}
```

📄 **`client/src/components/states/States.module.css`**
```css
.state {
  display: grid;
  gap: 1rem;
  justify-items: center;
  padding: 2rem 1rem;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius);
  text-align: center;
}

.error {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

.title {
  font-size: 1.25rem;
}

.skeletonGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr));
  gap: 1rem;
}

.skeletonCard {
  display: grid;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

/* Переливання «світла» — ознака того, що дані вантажаться */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--color-bg) 25%,
    var(--color-border) 50%,
    var(--color-bg) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}

.image {
  aspect-ratio: 1;
  border-radius: var(--radius) var(--radius) 0 0;
}

.line {
  height: 0.875rem;
  margin-inline: 1rem;
  border-radius: 0.25rem;
}

.short {
  width: 40%;
}

.spinner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--color-muted);
}

.dot {
  width: 1.25rem;
  height: 1.25rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s infinite linear;
}

@keyframes shimmer {
  to {
    background-position: -200% 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Користувач попросив менше руху — без анімацій */
@media (prefers-reduced-motion: reduce) {
  .skeleton,
  .dot {
    animation: none;
  }
}
```

📄 **`client/src/components/CoverImage.jsx`**
```jsx
import { useState } from 'react';
import styles from './CoverImage.module.css';

// Стабільний відтінок кольору для назви: та сама назва — той самий колір заглушки
function hueFromText(text) {
  let sum = 0;
  for (const char of text) sum += char.codePointAt(0);
  return sum % 360;
}

const initials = (text) =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

/**
 * Обкладинка альбому із заглушкою, якщо зображення немає або воно не завантажилося.
 * @param {Object} props
 * @param {string} props.src — URL або data URL; порожній рядок — зображення немає
 * @param {string} props.title — назва альбому (для alt і заглушки)
 */
function CoverImage({ src, title }) {
  // Запам'ятовуємо, ЯКЕ саме посилання не завантажилося:
  // нове src автоматично отримує новий шанс — без жодного ефекту
  const [failedSrc, setFailedSrc] = useState(null);

  if (!src || failedSrc === src) {
    return (
      <div
        className={styles.placeholder}
        style={{ '--hue': hueFromText(title) }}
        role="img"
        aria-label={`Альбом «${title}» без обкладинки`}
      >
        <span aria-hidden="true">{initials(title) || '♪'}</span>
      </div>
    );
  }

  return (
    <img
      className={styles.image}
      src={src}
      alt={`Обкладинка альбому «${title}»`}
      onError={() => setFailedSrc(src)}
    />
  );
}

export default CoverImage;
```

📄 **`client/src/components/CoverImage.module.css`**
```css
.image,
.placeholder {
  display: block;
  width: 100%;
  aspect-ratio: 1; /* завжди квадрат, як справжня обкладинка */
  border-radius: 0.5rem;
}

.image {
  object-fit: cover;
  background: var(--color-bg);
}

/* --hue задається в JSX для кожної назви окремо */
.placeholder {
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, hsl(var(--hue) 55% 50%), hsl(calc(var(--hue) + 50) 55% 30%));
  color: #ffffff;
  font-weight: 800;
  container-type: inline-size; /* розмір літер — від ширини самої заглушки */
}

.placeholder span {
  font-size: 35cqi; /* 35 % ширини: однаково гарно і в картці, і в рядку таблиці */
}
```

📄 **`client/src/components/Pagination.jsx`**
```jsx
import styles from './Pagination.module.css';

/**
 * Номери сторінок із пропусками: [1, 'gap-1', 4, 5, 6, 'gap-6', 20] → 1 … 4 5 6 … 20.
 * Завжди показуємо першу, останню й сусідні з поточною.
 * Пропуск — рядок 'gap-N' (N — сторінка перед ним): він же стане ключем у списку.
 */
function buildPageList(current, total) {
  const pages = [];
  for (let page = 1; page <= total; page++) {
    const isEdge = page === 1 || page === total;
    const isNear = Math.abs(page - current) <= 1;
    if (isEdge || isNear) {
      pages.push(page);
    } else if (typeof pages.at(-1) === 'number') {
      pages.push(`gap-${pages.at(-1)}`);
    }
  }
  return pages;
}

/**
 * @param {Object} props
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {(page: number) => void} props.onChange
 */
function Pagination({ currentPage, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  return (
    <nav className={styles.pagination} aria-label="Сторінки">
      <button
        type="button"
        className={styles.step}
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Попередня
      </button>

      <ul className={styles.pages}>
        {buildPageList(currentPage, totalPages).map((page) =>
          typeof page === 'string' ? (
            <li key={page} className={styles.gap} aria-hidden="true">
              …
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                className={styles.page}
                onClick={() => onChange(page)}
                aria-current={page === currentPage ? 'page' : undefined}
                aria-label={`Сторінка ${page}`}
              >
                {page}
              </button>
            </li>
          ),
        )}
      </ul>

      <button
        type="button"
        className={styles.step}
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Наступна →
      </button>
    </nav>
  );
}

export default Pagination;
```

📄 **`client/src/components/Pagination.module.css`**
```css
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.pages {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.step,
.page {
  min-width: 2.5rem;
  min-height: 2.5rem;
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 0.5rem;
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.step:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page[aria-current='page'] {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #ffffff;
  font-weight: 700;
}

.gap {
  align-self: center;
  padding-inline: 0.25rem;
  color: var(--color-muted);
}
```

### 20.4. Картка, таблиця, сортування, пошук, фільтри

📄 **`client/src/features/albums/AlbumCard.jsx`**
```jsx
import { Link } from 'react-router';
import CoverImage from '../../components/CoverImage.jsx';
import { formatLabel, formatRating, formatTrackCount } from '../../utils/format.js';
import styles from './AlbumCard.module.css';

/** Картка альбому для телефона й планшета */
function AlbumCard({ album }) {
  return (
    <article className={styles.card}>
      <CoverImage src={album.coverUrl} title={album.title} />

      <div className={styles.body}>
        <h2 className={styles.title}>
          <Link to={`/albums/${album.id}`}>{album.title}</Link>
        </h2>
        <p className="muted">
          {album.artist.name} · {album.releaseDate.slice(0, 4)}
        </p>
        <p className={styles.rating} aria-label={`Оцінка: ${album.rating ?? 'немає'}`}>
          {formatRating(album.rating)}
        </p>
        <ul className={styles.tags}>
          <li className="chip">{formatLabel(album.format)}</li>
          <li className={`chip ${styles.tracks}`}>{formatTrackCount(album.trackCount)}</li>
        </ul>
        {album.inCollection && <p className={styles.owned}>✓ У моїй колекції</p>}
      </div>
    </article>
  );
}

export default AlbumCard;
```

📄 **`client/src/features/albums/AlbumCard.module.css`**
```css
.card {
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.card > :first-child {
  border-radius: 0; /* обкладинка без заокруглення всередині картки */
}

.body {
  display: grid;
  gap: 0.375rem;
  align-content: start;
  padding: 0.875rem 1rem 1rem;
}

.title {
  font-size: 1.0625rem; /* 17px */
  line-height: 1.3;
}

.title a {
  color: inherit;
}

.rating {
  color: #8a5a00;
  letter-spacing: 0.1em;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.tracks {
  background: var(--color-bg);
  color: var(--color-muted);
}

.owned {
  color: #1f6f43;
  font-size: 0.875rem;
  font-weight: 600;
}
```

У таблиці сортування — кліком по заголовку колонки. Атрибут `aria-sort`
повідомляє читачу екрана, за якою колонкою й у якому напрямку відсортовано,
а кнопка всередині `<th>` робить заголовок доступним із клавіатури.

📄 **`client/src/features/albums/AlbumTable.jsx`**
```jsx
import { Link } from 'react-router';
import CoverImage from '../../components/CoverImage.jsx';
import { formatLabel, formatRating } from '../../utils/format.js';
import styles from './AlbumTable.module.css';

/** Заголовок колонки, за якою можна сортувати: клік змінює поле або напрямок */
function SortableHeader({ field, label, sort, order, onSort }) {
  const isActive = sort === field;
  const nextOrder = isActive && order === 'asc' ? 'desc' : 'asc';
  return (
    <th scope="col" aria-sort={isActive ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className={styles.sortButton} onClick={() => onSort(field, nextOrder)}>
        {label}
        <span aria-hidden="true">{isActive ? (order === 'asc' ? ' ↑' : ' ↓') : ' ↕'}</span>
      </button>
    </th>
  );
}

/** Таблиця альбомів для широкого екрана */
function AlbumTable({ albums, sort, order, onSort }) {
  const headerProps = { sort, order, onSort };
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <caption className="visually-hidden">
          Альбоми. Натисніть на заголовок колонки, щоб відсортувати.
        </caption>
        <thead>
          <tr>
            <th scope="col">
              <span className="visually-hidden">Обкладинка</span>
            </th>
            <SortableHeader field="title" label="Назва" {...headerProps} />
            <th scope="col">Виконавець</th>
            <SortableHeader field="releaseDate" label="Дата виходу" {...headerProps} />
            <SortableHeader field="trackCount" label="Треків" {...headerProps} />
            <SortableHeader field="rating" label="Оцінка" {...headerProps} />
            <th scope="col">Формат</th>
          </tr>
        </thead>
        <tbody>
          {albums.map((album) => (
            <tr key={album.id}>
              <td className={styles.cover}>
                <CoverImage src={album.coverUrl} title={album.title} />
              </td>
              <td>
                <Link to={`/albums/${album.id}`}>{album.title}</Link>
              </td>
              <td>{album.artist.name}</td>
              <td>{album.releaseDate}</td>
              <td>{album.trackCount}</td>
              <td className={styles.rating}>{formatRating(album.rating)}</td>
              <td>{formatLabel(album.format)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AlbumTable;
```

📄 **`client/src/features/albums/AlbumTable.module.css`**
```css
.wrapper {
  overflow-x: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}

.table th,
.table td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
  vertical-align: middle;
}

.table th {
  background: var(--color-bg);
  font-size: 0.875rem;
}

.table tbody tr:last-child td {
  border-bottom: 0;
}

.cover {
  width: 3.5rem; /* 56px */
}

.rating {
  color: #8a5a00;
}

.sortButton {
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.sortButton:hover {
  color: var(--color-accent);
}

.table tbody tr:hover {
  background: var(--color-accent-soft);
}
```

📄 **`client/src/features/albums/SortControl.jsx`**
```jsx
import { SORT_FIELDS } from '../../utils/listQuery.js';
import styles from './SortControl.module.css';

/** Сортування для карток (у таблиці сортують кліком по заголовку колонки) */
function SortControl({ sort, order, onChange }) {
  const isAsc = order === 'asc';

  return (
    <div className={styles.sort}>
      <label htmlFor="album-sort" className={styles.label}>
        Сортувати за
      </label>
      <select
        id="album-sort"
        className="input"
        value={sort}
        onChange={(event) => onChange(event.target.value, order)}
      >
        {SORT_FIELDS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="button button--secondary"
        onClick={() => onChange(sort, isAsc ? 'desc' : 'asc')}
        aria-label={
          isAsc ? 'За зростанням. Змінити на спадання' : 'За спаданням. Змінити на зростання'
        }
      >
        {isAsc ? '↑' : '↓'}
      </button>
    </div>
  );
}

export default SortControl;
```

📄 **`client/src/features/albums/SortControl.module.css`**
```css
.sort {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.label {
  font-size: 0.875rem;
  white-space: nowrap;
}

.sort select {
  width: auto;
}
```

📄 **`client/src/features/albums/SearchBox.jsx`**
```jsx
import { useRef } from 'react';
import styles from './SearchBox.module.css';

/**
 * Поле пошуку з кнопкою очищення.
 * @param {Object} props
 * @param {string} props.value
 * @param {(value: string) => void} props.onChange
 */
function SearchBox({ value, onChange }) {
  const inputRef = useRef(null);

  const handleClear = () => {
    onChange('');
    inputRef.current.focus(); // після очищення користувач одразу може друкувати знову
  };

  return (
    <div className={styles.search}>
      <label htmlFor="album-search" className="visually-hidden">
        Пошук за назвою
      </label>
      <input
        ref={inputRef}
        id="album-search"
        type="search"
        className={`input ${styles.input}`}
        placeholder="Пошук за назвою…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={handleClear}
          aria-label="Очистити пошук"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBox;
```

📄 **`client/src/features/albums/SearchBox.module.css`**
```css
.search {
  position: relative;
  flex: 1 1 16rem; /* росте, але не вужче 256px */
}

.input {
  padding-right: 2.5rem; /* місце для кнопки очищення */
}

/* Ховаємо вбудований «хрестик» Chrome/Safari — у нас свій */
.input::-webkit-search-cancel-button {
  display: none;
}

.clear {
  position: absolute;
  top: 50%;
  right: 0.25rem;
  width: 2rem;
  height: 2rem;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transform: translateY(-50%);
}

.clear:hover {
  background: var(--color-bg);
}
```

Панель фільтрів — **керований компонент без власних даних**: значення бере
з `query`, про зміни повідомляє через `onChange`. Власний стан у неї один —
чи розгорнута панель на телефоні (`aria-expanded` на кнопці каже читачу
екрана, відкрита вона чи ні). Шість фільтрів: виконавець (з довідника),
формат, «у колекції», мінімальна оцінка й діапазон років.

📄 **`client/src/features/albums/AlbumFilters.jsx`**
```jsx
import { useId, useState } from 'react';
import { FORMATS } from '../../utils/format.js';
import styles from './AlbumFilters.module.css';

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 1959 }, (_, index) => currentYear - index);

/**
 * Панель фільтрів. Сама нічого не зберігає: показує значення з query
 * і повідомляє батька про зміни через onChange({ назва: значення }).
 * На телефоні панель згортається за кнопкою, на широкому екрані — завжди відкрита.
 */
function AlbumFilters({ query, artists, activeCount, onChange, onReset }) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();

  const select = (name, label, options) => (
    <div className={styles.group}>
      <label htmlFor={`filter-${name}`} className={styles.label}>
        {label}
      </label>
      <select
        id={`filter-${name}`}
        className="input"
        value={query[name]}
        onChange={(event) => onChange({ [name]: event.target.value })}
      >
        {options.map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section className={styles.filters} aria-labelledby="filters-title">
      <div className={styles.header}>
        <h2 id="filters-title" className={styles.title}>
          Фільтри
        </h2>
        <button
          type="button"
          className={`button button--secondary ${styles.toggle}`}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? 'Сховати' : `Показати${activeCount ? ` (${activeCount})` : ''}`}
        </button>
      </div>

      <div id={panelId} className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
        {select('artistId', 'Виконавець', [
          ['', 'Усі виконавці'],
          ...artists.map((artist) => [String(artist.id), artist.name]),
        ])}
        {select('format', 'Формат', [['', 'Будь-який'], ...FORMATS.map((f) => [f.value, f.label])])}
        {select('inCollection', 'У моїй колекції', [
          ['', 'Усі альбоми'],
          ['true', 'Лише в колекції'],
          ['false', 'Лише не в колекції'],
        ])}
        {select('ratingMin', 'Оцінка', [
          ['', 'Будь-яка'],
          ...[5, 4, 3, 2].map((stars) => [String(stars), `★ ${stars} і вище`]),
        ])}

        <fieldset className={styles.group}>
          <legend className={styles.label}>Рік виходу</legend>
          <div className={styles.range}>
            <select
              className="input"
              aria-label="Рік від"
              value={query.yearFrom}
              onChange={(event) => onChange({ yearFrom: event.target.value })}
            >
              <option value="">від</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <span aria-hidden="true">—</span>
            <select
              className="input"
              aria-label="Рік до"
              value={query.yearTo}
              onChange={(event) => onChange({ yearTo: event.target.value })}
            >
              <option value="">до</option>
              {YEARS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <button
          type="button"
          className="button button--secondary"
          onClick={onReset}
          disabled={activeCount === 0}
        >
          Скинути фільтри
        </button>
      </div>
    </section>
  );
}

export default AlbumFilters;
```

📄 **`client/src/features/albums/AlbumFilters.module.css`**
```css
.filters {
  display: grid;
  gap: 1.25rem;
  align-content: start;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.title {
  font-size: 1.125rem;
}

.group {
  display: grid;
  gap: 0.375rem;
}

.label {
  font-size: 0.875rem;
  font-weight: 600;
}

.range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Телефон: панель згорнута, доки її не розгорнуть кнопкою */
.panel {
  display: none;
  gap: 1.25rem;
}

.open {
  display: grid;
}

/* Планшет: фільтри відкриті, у кілька колонок над списком */
@media (min-width: 48rem) {
  .toggle {
    display: none;
  }

  .panel {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    align-items: end;
  }
}

/* Десктоп: фільтри — бічна колонка, поля одне під одним */
@media (min-width: 64rem) {
  .panel {
    grid-template-columns: 1fr;
  }
}
```

### 20.5. Сторінка списку

Сторінка збирає все разом: стан з адреси, debounce пошуку, запит через
`useAsync`, вибір макета й чотири стани.

📄 **`client/src/pages/AlbumsPage.jsx`**
```jsx
import { Link } from 'react-router';
import AlbumCard from '../features/albums/AlbumCard.jsx';
import AlbumFilters from '../features/albums/AlbumFilters.jsx';
import AlbumTable from '../features/albums/AlbumTable.jsx';
import SearchBox from '../features/albums/SearchBox.jsx';
import SortControl from '../features/albums/SortControl.jsx';
import Pagination from '../components/Pagination.jsx';
import { EmptyState, ErrorState, ListSkeleton } from '../components/states/States.jsx';
import { albumsApi } from '../api/albums.js';
import { describeError } from '../api/http.js';
import { useAuth } from '../context/AuthContext.js';
import { useArtists } from '../hooks/useArtists.js';
import { useAsync } from '../hooks/useAsync.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useListQuery } from '../hooks/useListQuery.js';
import { useMediaQuery } from '../hooks/useMediaQuery.js';
import { PAGE_SIZES, hasFilters } from '../utils/listQuery.js';
import styles from './AlbumsPage.module.css';

const FILTER_KEYS = ['artistId', 'format', 'inCollection', 'yearFrom', 'yearTo', 'ratingMin'];

function AlbumsPage() {
  const [query, updateQuery, resetFilters] = useListQuery();
  const { isAuthenticated } = useAuth();
  const { artists } = useArtists();
  const isDesktop = useMediaQuery('(min-width: 64rem)'); // десктоп — таблиця, менше — картки

  // Адреса оновлюється на кожну літеру, а запит іде через 300 мс після останньої
  const debouncedSearch = useDebounce(query.search, 300);
  // Очищений пошук (кнопка ✕, «Скинути фільтри») застосовуємо одразу, без затримки
  const search = query.search === '' ? '' : debouncedSearch;
  const apiQuery = { ...query, search };
  const requestKey = JSON.stringify(apiQuery); // зміна будь-якого параметра → новий запит

  const { status, data, error, reload } = useAsync(
    ({ signal }) => albumsApi.list(apiQuery, { signal }),
    [requestKey],
  );

  const activeCount = FILTER_KEYS.filter((key) => query[key] !== '').length;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / query.size)) : 1;
  const from = data?.total ? data.offset + 1 : 0;
  const to = data ? data.offset + data.data.length : 0;

  const handleSort = (sort, order) => updateQuery({ sort, order });

  let content;
  if (status === 'error') {
    content = <ErrorState message={describeError(error)} onRetry={reload} />;
  } else if (!data) {
    content = <ListSkeleton count={query.size > 12 ? 12 : query.size} />; // перше завантаження
  } else if (data.data.length === 0 && data.total > 0) {
    // ?page=99 при 20 сторінках
    content = (
      <EmptyState
        message="Такої сторінки немає."
        actionLabel="До першої сторінки"
        onAction={() => updateQuery({ page: 1 })}
      />
    );
  } else if (data.data.length === 0) {
    content = hasFilters(query) ? (
      <EmptyState
        message="Жоден альбом не відповідає пошуку й фільтрам."
        actionLabel="Скинути фільтри"
        onAction={resetFilters}
      />
    ) : (
      <EmptyState message="У фонотеці поки немає альбомів." />
    );
  } else {
    content = (
      <div className={status === 'loading' ? styles.stale : undefined}>
        {isDesktop ? (
          <AlbumTable
            albums={data.data}
            sort={query.sort}
            order={query.order}
            onSort={handleSort}
          />
        ) : (
          <ul className={styles.grid}>
            {data.data.map((album) => (
              <li key={album.id}>
                <AlbumCard album={album} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Альбоми</h1>
        {isAuthenticated && (
          <Link to="/albums/new" className="button">
            + Додати альбом
          </Link>
        )}
      </div>

      <div className={styles.layout}>
        <AlbumFilters
          query={query}
          artists={artists}
          activeCount={activeCount}
          onChange={updateQuery}
          onReset={resetFilters}
        />

        <section
          className={styles.results}
          aria-label="Результати"
          aria-busy={status === 'loading'}
        >
          <div className={styles.toolbar}>
            <SearchBox
              value={query.search}
              onChange={(text) => updateQuery({ search: text }, { replace: true })}
            />
            {!isDesktop && (
              <SortControl sort={query.sort} order={query.order} onChange={handleSort} />
            )}
          </div>

          <p className="muted" aria-live="polite">
            {data && data.total > 0 ? `Показано ${from}–${to} з ${data.total}` : ' '}
          </p>

          {content}

          {data && data.total > 0 && (
            <div className={styles.footer}>
              <label className={styles.pageSize}>
                На сторінці:
                <select
                  className="input"
                  value={query.size}
                  onChange={(event) => updateQuery({ size: Number(event.target.value) })}
                >
                  {PAGE_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </label>
              <Pagination
                currentPage={query.page}
                totalPages={totalPages}
                onChange={(page) => updateQuery({ page })}
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}

export default AlbumsPage;
```

🤔 **Навіщо `requestKey = JSON.stringify(apiQuery)`?** `apiQuery` — новий
об'єкт на кожен рендер. `useAsync` і сам перетворює `deps` на рядок-ключ, тож
`[apiQuery]` теж працював би; явний `requestKey` лише показує, від чого
залежить запит: рядок однаковий, доки не змінився жоден параметр, і новий
запит іде лише тоді, коли справді змінився стан списку.

📄 **`client/src/pages/AlbumsPage.module.css`**
```css
/* Телефон: фільтри над списком. Ширший екран: фільтри ліворуч */
.layout {
  display: grid;
  gap: 1.5rem;
}

.results {
  display: grid;
  gap: 1rem;
  align-content: start;
  min-width: 0; /* дозволяє таблиці прокручуватися всередині колонки */
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

/* Стільки колонок, скільки вміщається по 200px */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 12.5rem), 1fr));
  gap: 1rem;
}

.grid > li {
  display: grid; /* картки в одному ряду однакової висоти */
}

.footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.pageSize {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.pageSize select {
  width: auto;
}

@media (min-width: 64rem) {
  .layout {
    grid-template-columns: 16rem 1fr;
    align-items: start;
  }
}

/* Нові дані вантажаться — старі лишаються, але приглушені */
.stale {
  opacity: 0.55;
  transition: opacity 0.2s;
}

/* Планшет: картки у дві колонки й більше; телефон — одна колонка */
@media (min-width: 48rem) {
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  }
}
```

📄 **`client/src/App.jsx`** — тимчасова версія
```jsx
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AlbumsPage from './pages/AlbumsPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// ТИМЧАСОВА ВЕРСІЯ (крок 20): інші сторінки — у кроках 21–23
// Заглушка для сторінок, яких ще немає
function Placeholder({ title }) {
  return <h1 className="page-title">{title}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/albums" replace />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="albums/:albumId" element={<Placeholder title="Сторінка альбому" />} />
        {/* Створення й редагування — лише після входу */}
        <Route element={<ProtectedRoute />}>
          <Route path="albums/new" element={<Placeholder title="Новий альбом" />} />
          <Route path="albums/:albumId/edit" element={<Placeholder title="Редагування" />} />
        </Route>
        <Route path="artists" element={<Placeholder title="Виконавці" />} />
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<SignInPage mode="sign-up" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
```

### ✅ Контрольна точка 19

1. `/albums`: «Показано 1–12 з 240», картки або таблиця (залежно від ширини
   вікна), пагінація «1 2 … 20».
2. Надрукуйте в пошуку `ніч`. Адреса стала `/albums?q=ніч`, а в **Network**
   — **один** запит `albums?search=ніч&…` після паузи (не три).
3. Оберіть виконавця, формат «Вініл», оцінку «★ 4 і вище» — адреса й
   результати змінюються, «Скинути фільтри» стало активним.
4. Перейдіть на сторінку 2, натисніть **F5** — та сама сторінка з тими
   самими фільтрами. Кнопка браузера «Назад» повертає попередній стан
   списку.
5. **Три макети** — **DevTools → Toggle device toolbar** (`⇧⌘M` /
   `Ctrl+Shift+M`), ширина 375, 834 і 1280 px:
   - 375 — кнопка «Показати», картки в одну колонку, список сортування;
   - 834 — фільтри сіткою над картками, кнопки «Показати» немає;
   - 1280 — фільтри ліворуч, таблиця; клік по «Оцінка» сортує (стрілка ↓ / ↑).
6. Пошук `zzzz` → «Жоден альбом не відповідає пошуку й фільтрам» і кнопка
   скидання. Адреса `/albums?page=99` → «Такої сторінки немає».
7. Зупиніть сервер і змініть сторінку → «Щось пішло не так» і «Спробувати
   ще раз»; запустіть сервер → кнопка повтору показує дані.

Посилання на альбом поки веде на заглушку «Сторінка альбому».

### 🧪 Експерименти

1. **Без debounce.** У `AlbumsPage.jsx` замініть `useDebounce(query.search,
   300)` на `useDebounce(query.search, 0)` і швидко надрукуйте «вечір»: у
   Network — п'ять запитів, по одному на літеру (ті, що не встигли
   відповісти до наступної літери, позначено `(canceled)`). Поверніть 300.
2. **Без `replace`.** Приберіть `{ replace: true }` у `onChange` поля пошуку,
   надрукуйте слово й натисніть «Назад» кілька разів — пошук стирається по
   одній літері. Поверніть.
3. **Повільна мережа.** **Network → No throttling → Slow 4G**: перше
   завантаження — скелетон, перемикання сторінок — старі картки приглушено,
   доки не прийдуть нові.
4. **Перевірка адреси.** Відкрийте `/albums?page=abc&size=1000&sort=password`
   — показано першу сторінку по 12, відсортовано за назвою: `parseListQuery`
   замінив неприпустимі значення на значення за замовчуванням.

---
## 21. Сторінка альбому й видалення

### 📚 Теорія: сторінка одного запису

Адреса `/albums/:albumId` → `useParams()` дає `albumId` → `useAsync` вантажить
альбом. Помилки тут теж треба розрізняти:

| Відповідь | Що показуємо |
|---|---|
| **404** (альбому немає) або **400** (в адресі не UUID) | сторінку «Такого альбому немає» — це не збій, а неіснуюча адреса |
| мережа, **500** | «Щось пішло не так» і кнопку повтору |

Пов'язана сутність — виконавець — приходить **разом з альбомом** (сервер
зробив `JOIN`), тож другий запит не потрібен. Ім'я виконавця — посилання на
список, відфільтрований за ним: `/albums?artist=3`. Це та сама адреса, яку
створює фільтр, тож список одразу відкриється відфільтрованим.

**Видалення** — незворотна дія, тому лише після підтвердження в модальному
вікні. Нативний `<dialog>` з `showModal()` дає затемнення фону, утримання
фокуса всередині вікна й закриття клавішею `Escape` — без бібліотек. Кнопку
«Видалити» бачить лише `ADMIN`; після успіху — сповіщення й перехід до
списку з `replace: true`, щоб кнопка «Назад» не повертала на сторінку
видаленого альбому.

📄 **`client/src/components/ConfirmDialog.jsx`**
```jsx
import { useEffect, useId, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

/**
 * Модальне вікно підтвердження на нативному <dialog>.
 * showModal() дає затемнення фону, утримання фокуса всередині й закриття клавішею Escape.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.confirmLabel='Підтвердити']
 * @param {string} [props.cancelLabel='Скасувати']
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Підтвердити',
  cancelLabel = 'Скасувати',
  onConfirm,
  onCancel,
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // React знає лише prop open, а <dialog> відкривається методами DOM — синхронізуємо
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={titleId} onClose={onCancel}>
      <h2 id={titleId} className={styles.title}>
        {title}
      </h2>
      <p>{message}</p>
      <div className={`actions ${styles.actions}`}>
        <button type="button" className="button button--secondary" onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className="button button--danger" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export default ConfirmDialog;
```

📄 **`client/src/components/ConfirmDialog.module.css`**
```css
.dialog {
  max-width: min(28rem, calc(100% - 2rem));
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
}

.dialog::backdrop {
  background: rgb(0 0 0 / 0.5);
}

.title {
  margin-bottom: 0.5rem;
  font-size: 1.25rem;
}

.actions {
  justify-content: flex-end;
  margin-top: 1.5rem;
}
```

📄 **`client/src/pages/AlbumDetailsPage.jsx`**
```jsx
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import CoverImage from '../components/CoverImage.jsx';
import { ErrorState, PageSpinner } from '../components/states/States.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { albumsApi } from '../api/albums.js';
import { HttpError, describeError } from '../api/http.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useAsync } from '../hooks/useAsync.js';
import { formatDate, formatLabel, formatRating } from '../utils/format.js';
import styles from './AlbumDetailsPage.module.css';

function AlbumDetailsPage() {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    status,
    data: album,
    error,
    reload,
  } = useAsync(({ signal }) => albumsApi.getById(albumId, { signal }), [albumId]);

  if (status === 'error') {
    // 404 і некоректний id (400) — «такого альбому немає»
    if (error instanceof HttpError && (error.isNotFound || error.status === 400)) {
      return <NotFoundPage message="Такого альбому немає. Можливо, його видалили." />;
    }
    return <ErrorState message={describeError(error)} onRetry={reload} />;
  }
  if (!album) return <PageSpinner />;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await albumsApi.remove(album.id);
      showToast({ message: `Альбом «${album.title}» видалено` });
      navigate('/albums', { replace: true }); // видаленої сторінки не має лишитися в історії
    } catch (deleteError) {
      showToast({ type: 'error', message: describeError(deleteError) });
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <article>
      <Link to="/albums">← До списку</Link>

      <div className={styles.details}>
        <div className={styles.cover}>
          <CoverImage src={album.coverUrl} title={album.title} />
        </div>

        <div className={styles.info}>
          <h1 className="page-title">{album.title}</h1>
          <p className={styles.artist}>
            {/* Посилання на список, уже відфільтрований за виконавцем */}
            <Link to={`/albums?artist=${album.artist.id}`}>{album.artist.name}</Link>
            {album.artist.country && <span className="muted"> · {album.artist.country}</span>}
          </p>

          <dl className={styles.facts}>
            <div>
              <dt>Дата виходу</dt>
              <dd>{formatDate(album.releaseDate)}</dd>
            </div>
            <div>
              <dt>Треків</dt>
              <dd>{album.trackCount}</dd>
            </div>
            <div>
              <dt>Тривалість</dt>
              <dd>{album.durationMinutes ? `${album.durationMinutes} хв` : '—'}</dd>
            </div>
            <div>
              <dt>Оцінка</dt>
              <dd className={styles.rating}>{formatRating(album.rating)}</dd>
            </div>
            <div>
              <dt>Формат</dt>
              <dd>{formatLabel(album.format)}</dd>
            </div>
            <div>
              <dt>У колекції</dt>
              <dd>{album.inCollection ? 'Так' : 'Ні'}</dd>
            </div>
          </dl>

          {album.description && <p>{album.description}</p>}

          {isAuthenticated && (
            <div className="actions">
              <Link to={`/albums/${album.id}/edit`} className="button button--secondary">
                Редагувати
              </Link>
              {/* Кнопку бачить лише ADMIN; але й без неї сервер поверне 403 */}
              {isAdmin && (
                <button
                  type="button"
                  className="button button--danger"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={isDeleting}
                >
                  Видалити
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        title="Видалити альбом?"
        message={`«${album.title}» буде видалено назавжди.`}
        confirmLabel={isDeleting ? 'Видалення…' : 'Видалити'}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </article>
  );
}

export default AlbumDetailsPage;
```

📄 **`client/src/pages/AlbumDetailsPage.module.css`**
```css
.details {
  display: grid;
  gap: 1.5rem;
  margin-top: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.cover {
  max-width: 20rem; /* 320px */
}

.info {
  display: grid;
  gap: 1rem;
  align-content: start;
}

.artist {
  font-size: 1.125rem;
}

.facts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  gap: 0.75rem 1rem;
}

.facts dt {
  color: var(--color-muted);
  font-size: 0.875rem;
}

.facts dd {
  font-weight: 600;
}

.rating {
  color: #8a5a00;
}

@media (min-width: 48rem) {
  .details {
    grid-template-columns: 18rem 1fr;
  }
}
```

📄 **`client/src/App.jsx`** — тимчасова версія
```jsx
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AlbumsPage from './pages/AlbumsPage.jsx';
import AlbumDetailsPage from './pages/AlbumDetailsPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// ТИМЧАСОВА ВЕРСІЯ (крок 21): форма — у кроці 22, виконавці — у кроці 23
// Заглушка для сторінок, яких ще немає
function Placeholder({ title }) {
  return <h1 className="page-title">{title}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/albums" replace />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="albums/:albumId" element={<AlbumDetailsPage />} />
        {/* Створення й редагування — лише після входу */}
        <Route element={<ProtectedRoute />}>
          <Route path="albums/new" element={<Placeholder title="Новий альбом" />} />
          <Route path="albums/:albumId/edit" element={<Placeholder title="Редагування" />} />
        </Route>
        <Route path="artists" element={<Placeholder title="Виконавці" />} />
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<SignInPage mode="sign-up" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
```

### ✅ Контрольна точка 20

1. Клік по альбому → сторінка з обкладинкою (або кольоровою заглушкою з
   ініціалами), датою «18 квітня 2014 р.», оцінкою зірками, виконавцем і
   країною.
2. Клік по імені виконавця → список лише його альбомів, у фільтрі обрано
   цього виконавця.
3. `/albums/abc` і `/albums/00000000-0000-4000-8000-000000000000` → «Такого
   альбому немає».
4. Без входу кнопок «Редагувати» й «Видалити» немає. Як `USER` — лише
   «Редагувати». Як `ADMIN` — обидві; «Видалити» → вікно підтвердження;
   `Escape` або «Скасувати» закриває його; «Видалити» → сповіщення «Альбом
   «…» видалено» і список.

### 🧪 Експерименти

1. **Сервер — останнє слово.** Увійдіть як `USER` і, як у кроці 19, змініть
   роль у `fonoteka:user` на `ADMIN`. Кнопка «Видалити» з'явилася, але після
   підтвердження — червоне сповіщення «Недостатньо прав для цієї дії» (403),
   і альбом на місці.
2. **Прострочений токен під час роботи.** У `server/.env` поставте
   `JWT_EXPIRES_IN=20s`, перезапустіть сервер, увійдіть як `ADMIN`, зачекайте
   20 секунд (не перезавантажуючи сторінку) і спробуйте видалити альбом:
   сервер відповів 401 → `http.js` видалив токен → `AuthProvider` перевів на
   `/login` із повідомленням «Сесія завершилася». Після входу ви
   повернетеся на сторінку альбому. Поверніть `1h`.

---

## 22. Форма створення й редагування

### 📚 Теорія: дві валідації

| | Клієнтська | Серверна |
|---|---|---|
| Навіщо | **зручність**: миттєва підказка без запиту | **безпека й цілісність**: обійти неможливо |
| Що перевіряє | формат полів (обов'язкове, число, URL…) | те саме **плюс** те, чого клієнт знати не може: унікальність назви, існування виконавця |
| Де помилка | біля поля, щойно користувач залишив поле | **теж біля поля**: сервер повертає `errors: [{ field, message }]` |

Друга колонка — головне в цьому кроці. Форма не вигадує власних текстів для
серверних помилок: `HttpError.fieldErrors` перетворює масив сервера на
`{ title: '…', artistId: '…' }`, і ті самі помилки з'являються біля тих самих
полів. **409** («Альбом «…» уже є у фонотеці») показуємо біля поля «Назва».
Решту (403, 500, мережа) — сповіщенням: до конкретного поля вони не
стосуються.

**Рядки й числа.** Поля `<input>` працюють лише з рядками, а API чекає
`trackCount: 12`, `rating: null`, `inCollection: true`. Перетворення «альбом ↔
значення форми» — в окремому модулі `albumFormValues.js`, а не розкидане по
JSX.

**Одна форма для двох маршрутів.** `/albums/new` і `/albums/:albumId/edit`
рендерять ту саму `AlbumFormPage`; редагування спершу вантажить альбом. Для
редагування надсилаємо `PUT` — повний ресурс: форма завжди має всі поля.

**Подвійне натискання.** Поки запит виконується, кнопка вимкнена, а
`handleSubmit` ігнорує повторні виклики — інакше подвійний клік створив би
два альбоми (точніше, другий отримав би 409).

📄 **`client/src/utils/albumValidation.js`**
```js
// Клієнтська валідація форми альбому — для зручності користувача (миттєві підказки).
// Джерело істини — сервер: його помилки теж показуються біля полів (див. AlbumFormPage).

const isEmpty = (value) => String(value ?? '').trim() === '';

const required =
  (message = "Обов'язкове поле") =>
  (value) =>
    isEmpty(value) ? message : null;

const maxLength = (max) => (value) =>
  String(value).length > max ? `Не більше ${max} символів (зараз ${String(value).length})` : null;

const integerInRange = (min, max) => (value) => {
  if (isEmpty(value)) return null; // порожнє перевіряє required
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max
    ? null
    : `Ціле число від ${min} до ${max}`;
};

const dateNotBefore = (min) => (value) =>
  !isEmpty(value) && value < min ? 'Не раніше 1900 року' : null;

const httpUrl = () => (value) => {
  if (isEmpty(value)) return null;
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:'
      ? null
      : 'Посилання має починатися з http:// або https://';
  } catch {
    return 'Введіть коректне посилання, наприклад https://example.com/cover.jpg';
  }
};

// Поле → правила (у порядку полів форми: так перше помилкове поле збігається з екраном)
export const albumSchema = {
  title: [required(), maxLength(200)],
  artistId: [required('Оберіть виконавця')],
  releaseDate: [required(), dateNotBefore('1900-01-01')],
  trackCount: [required(), integerInRange(1, 999)],
  durationMinutes: [integerInRange(1, 600)],
  description: [maxLength(2000)],
  coverUrl: [httpUrl(), maxLength(500)],
};

export function validateField(name, value) {
  for (const rule of albumSchema[name] ?? []) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/** Лише помилкові поля: { title: '…', trackCount: '…' } */
export function validateAll(values) {
  const errors = {};
  for (const name of Object.keys(albumSchema)) {
    const error = validateField(name, values[name]);
    if (error) errors[name] = error;
  }
  return errors;
}
```

📄 **`client/src/features/albums/albumFormValues.js`**
```js
// Перетворення «альбом ↔ значення форми».
// Поля <input> працюють із РЯДКАМИ, а API чекає числа, булеві й null.

export const EMPTY_VALUES = {
  title: '',
  artistId: '',
  releaseDate: '',
  trackCount: '',
  durationMinutes: '',
  rating: '',
  format: 'digital',
  inCollection: false,
  description: '',
  coverUrl: '',
};

const toText = (value) => (value === null || value === undefined ? '' : String(value));

/** Альбом з API → значення форми */
export function toFormValues(album) {
  return {
    title: album.title,
    artistId: String(album.artist.id),
    releaseDate: album.releaseDate,
    trackCount: toText(album.trackCount),
    durationMinutes: toText(album.durationMinutes),
    rating: toText(album.rating),
    format: album.format,
    inCollection: album.inCollection,
    description: toText(album.description),
    coverUrl: toText(album.coverUrl),
  };
}

const toNumberOrNull = (text) => (text.trim() === '' ? null : Number(text));

/** Значення форми → тіло запиту POST/PUT (повний ресурс) */
export function fromFormValues(values) {
  return {
    title: values.title.trim(),
    artistId: Number(values.artistId),
    releaseDate: values.releaseDate,
    trackCount: Number(values.trackCount),
    durationMinutes: toNumberOrNull(values.durationMinutes),
    rating: toNumberOrNull(values.rating),
    format: values.format,
    inCollection: values.inCollection,
    description: values.description.trim() || null,
    coverUrl: values.coverUrl.trim() || null,
  };
}
```

📄 **`client/src/hooks/useAlbumForm.js`**
```js
import { useState } from 'react';
import { HttpError } from '../api/http.js';
import { validateAll, validateField } from '../utils/albumValidation.js';

/**
 * Логіка форми альбому: значення, помилки (і клієнтські, і з сервера), надсилання.
 * Розмітка — в AlbumForm.jsx.
 *
 * @param {Object} options
 * @param {object} options.initialValues
 * @param {(values: object) => Promise<void>} options.onSubmit — запит до API
 * @param {(fieldName: string) => void} options.onInvalid — куди перевести фокус
 */
export function useAlbumForm({ initialValues, onSubmit, onInvalid }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  const setFieldValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Поле вже з помилкою — перевіряємо на кожну зміну, щоб помилка зникла, щойно стане правильно
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setFieldValue(name, type === 'checkbox' ? checked : value);
  };

  // Помилка з'являється, коли користувач покинув поле
  const handleBlur = (event) => {
    const { name } = event.target;
    setErrors((prev) => ({ ...prev, [name]: validateField(name, values[name]) }));
  };

  const showErrors = (nextErrors) => {
    setErrors(nextErrors);
    const firstInvalid = Object.keys(nextErrors).find((name) => nextErrors[name]);
    if (firstInvalid) onInvalid(firstInvalid);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return; // подвійне натискання «Зберегти» не створить два записи

    const clientErrors = validateAll(values);
    if (Object.keys(clientErrors).length > 0) return showErrors(clientErrors);

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      // Сервер — джерело істини: його помилки показуємо біля відповідних полів.
      // Решту (401, 403, 500, мережа) уже обробила сторінка — тут нічого не робимо.
      if (error instanceof HttpError && error.isValidation) showErrors(error.fieldErrors);
      if (error instanceof HttpError && error.isConflict) showErrors({ title: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { values, errors, isDirty, isSubmitting, handleChange, handleBlur, handleSubmit };
}
```

🤔 **Чому хук «ковтає» помилку, а не кидає далі?** Сторінка вже показала
сповіщення для 403/500/мережі, форма — помилки полів для 400/409. Якби
помилка пішла далі, її ніхто б не зловив, і в консолі з'явилося б
«Uncaught (in promise)» — а вимога завдання: **жодних помилок у консолі**.

📄 **`client/src/features/albums/FormatRadioGroup.jsx`**
```jsx
import { FORMATS } from '../../utils/format.js';
import styles from './AlbumForm.module.css';

/**
 * Група radio-кнопок «Формат». Значення з фіксованого набору (enum).
 * @param {Object} props
 * @param {string} props.value
 * @param {(event: React.ChangeEvent<HTMLInputElement>) => void} props.onChange
 */
function FormatRadioGroup({ value, onChange }) {
  return (
    <fieldset className={styles.radioGroup}>
      <legend className={styles.legend}>Формат</legend>
      {FORMATS.map((format) => (
        <label key={format.value} className={styles.choice}>
          {/* Однаковий name об'єднує кнопки в групу: обрати можна лише одну */}
          <input
            type="radio"
            name="format"
            value={format.value}
            checked={value === format.value}
            onChange={onChange}
          />
          {format.label}
        </label>
      ))}
    </fieldset>
  );
}

export default FormatRadioGroup;
```

📄 **`client/src/features/albums/AlbumForm.jsx`**
```jsx
import { useId } from 'react';
import Field from '../../components/Field.jsx';
import FormatRadioGroup from './FormatRadioGroup.jsx';
import { EMPTY_VALUES } from './albumFormValues.js';
import { useAlbumForm } from '../../hooks/useAlbumForm.js';
import styles from './AlbumForm.module.css';

/**
 * Одна форма і для створення, і для редагування. Про маршрути й API не знає:
 * віддає значення через onSubmit (async) і показує помилки, які той кине.
 */
function AlbumForm({ initialValues = EMPTY_VALUES, artists, submitLabel, onSubmit, onCancel }) {
  const idPrefix = useId();
  const fieldId = (name) => `${idPrefix}-${name}`;

  const form = useAlbumForm({
    initialValues,
    onSubmit,
    onInvalid: (name) => document.getElementById(fieldId(name))?.focus(),
  });
  const { values, errors, handleChange, handleBlur } = form;

  // Спільні props для звичайних полів
  const bind = (name) => ({
    name,
    value: values[name],
    onChange: handleChange,
    onBlur: handleBlur,
  });

  return (
    <form className={styles.form} onSubmit={form.handleSubmit} noValidate>
      <Field id={fieldId('title')} label="Назва *" error={errors.title}>
        {(fieldProps) => (
          <input {...fieldProps} {...bind('title')} className="input" autoComplete="off" />
        )}
      </Field>

      <div className={styles.row}>
        <Field id={fieldId('artistId')} label="Виконавець *" error={errors.artistId}>
          {(fieldProps) => (
            <select {...fieldProps} {...bind('artistId')} className="input">
              <option value="">Оберіть виконавця</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {artist.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field id={fieldId('releaseDate')} label="Дата виходу *" error={errors.releaseDate}>
          {(fieldProps) => (
            <input {...fieldProps} {...bind('releaseDate')} type="date" className="input" />
          )}
        </Field>
      </div>

      <div className={styles.row}>
        <Field id={fieldId('trackCount')} label="Кількість треків *" error={errors.trackCount}>
          {(fieldProps) => (
            <input
              {...fieldProps}
              {...bind('trackCount')}
              type="number"
              inputMode="numeric"
              className="input"
            />
          )}
        </Field>
        <Field
          id={fieldId('durationMinutes')}
          label="Тривалість, хв"
          error={errors.durationMinutes}
        >
          {(fieldProps) => (
            <input
              {...fieldProps}
              {...bind('durationMinutes')}
              type="number"
              inputMode="numeric"
              className="input"
            />
          )}
        </Field>
        <Field id={fieldId('rating')} label="Оцінка" error={errors.rating}>
          {(fieldProps) => (
            <select {...fieldProps} {...bind('rating')} className="input">
              <option value="">Без оцінки</option>
              {[5, 4, 3, 2, 1].map((stars) => (
                <option key={stars} value={stars}>
                  {'★'.repeat(stars)} ({stars})
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <div className={styles.row}>
        <FormatRadioGroup value={values.format} onChange={handleChange} />
        <label className={styles.choice}>
          <input
            type="checkbox"
            name="inCollection"
            checked={values.inCollection}
            onChange={handleChange}
          />
          Є в моїй колекції
        </label>
      </div>

      <Field
        id={fieldId('description')}
        label="Опис"
        hint="До 2000 символів"
        error={errors.description}
      >
        {(fieldProps) => (
          <textarea {...fieldProps} {...bind('description')} rows={4} className="input" />
        )}
      </Field>

      <Field
        id={fieldId('coverUrl')}
        label="Посилання на обкладинку"
        hint="https://… (необов'язково)"
        error={errors.coverUrl}
      >
        {(fieldProps) => (
          <input
            {...fieldProps}
            {...bind('coverUrl')}
            type="url"
            className="input"
            placeholder="https://example.com/cover.jpg"
          />
        )}
      </Field>

      <div className="actions">
        <button type="submit" className="button" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Збереження…' : submitLabel}
        </button>
        <button type="button" className="button button--secondary" onClick={onCancel}>
          Скасувати
        </button>
      </div>
    </form>
  );
}

export default AlbumForm;
```

📄 **`client/src/features/albums/AlbumForm.module.css`**
```css
.form {
  display: grid;
  gap: 0.5rem 1.25rem;
  max-width: 48rem; /* 768px */
  padding: 1.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

/* Кілька коротких полів в один ряд, якщо вміщаються */
.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 13rem), 1fr));
  gap: 0.5rem 1.25rem;
  align-items: start;
}

.radioGroup {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
}

.legend {
  width: 100%;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.choice {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  cursor: pointer;
}

.choice input {
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-accent);
}
```

📄 **`client/src/pages/AlbumFormPage.jsx`**
```jsx
import { useNavigate, useParams } from 'react-router';
import AlbumForm from '../features/albums/AlbumForm.jsx';
import { fromFormValues, toFormValues } from '../features/albums/albumFormValues.js';
import { ErrorState, PageSpinner } from '../components/states/States.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import { albumsApi } from '../api/albums.js';
import { HttpError, describeError } from '../api/http.js';
import { useToast } from '../context/ToastContext.js';
import { useArtists } from '../hooks/useArtists.js';
import { useAsync } from '../hooks/useAsync.js';

// Одна сторінка для двох маршрутів: /albums/new і /albums/:albumId/edit
function AlbumFormPage() {
  const { albumId } = useParams();
  const isEdit = albumId !== undefined;
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { artists, status: artistsStatus } = useArtists();

  // Під час редагування спершу завантажуємо альбом; для нового — нічого не вантажимо
  const album = useAsync(
    ({ signal }) => (isEdit ? albumsApi.getById(albumId, { signal }) : Promise.resolve(null)),
    [albumId],
  );

  if (album.status === 'error') {
    // 404 і некоректний id в адресі (400) — «такого альбому немає», як на сторінці деталей
    if (
      album.error instanceof HttpError &&
      (album.error.isNotFound || album.error.status === 400)
    ) {
      return <NotFoundPage message="Альбом для редагування не знайдено." />;
    }
    return <ErrorState message={describeError(album.error)} onRetry={album.reload} />;
  }
  if (album.status === 'loading' || artistsStatus === 'loading') return <PageSpinner />;

  const handleSubmit = async (values) => {
    const data = fromFormValues(values);
    try {
      if (isEdit) {
        await albumsApi.update(albumId, data); // PUT → 204
        showToast({ message: 'Зміни збережено' });
        navigate(`/albums/${albumId}`, { replace: true });
      } else {
        const created = await albumsApi.create(data); // POST → 201 + створений альбом
        showToast({ message: `Альбом «${created.title}» створено` });
        navigate(`/albums/${created.id}`, { replace: true });
      }
    } catch (error) {
      // Помилки полів (400, 409) покаже сама форма; тут — усе інше
      if (!(error instanceof HttpError) || error.status >= 500 || error.status === 403) {
        showToast({ type: 'error', message: describeError(error) });
      }
      throw error;
    }
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          {isEdit ? `Редагування: ${album.data.title}` : 'Новий альбом'}
        </h1>
      </div>

      {/* key: перехід «редагування» → «новий» створює форму заново з чистим станом */}
      <AlbumForm
        key={albumId ?? 'new'}
        initialValues={album.data ? toFormValues(album.data) : undefined}
        artists={artists}
        submitLabel={isEdit ? 'Зберегти зміни' : 'Створити альбом'}
        onSubmit={handleSubmit}
        onCancel={() => navigate(isEdit ? `/albums/${albumId}` : '/albums')}
      />
    </>
  );
}

export default AlbumFormPage;
```

🤔 **Навіщо `key={albumId ?? 'new'}` на формі?** Стан форми
ініціалізується один раз — під час монтування. Якщо з редагування перейти
на «Новий альбом», React використав би той самий екземпляр компонента зі
старими значеннями. Новий `key` змушує React створити форму заново.

📄 **`client/src/App.jsx`** — тимчасова версія
```jsx
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AlbumsPage from './pages/AlbumsPage.jsx';
import AlbumDetailsPage from './pages/AlbumDetailsPage.jsx';
import AlbumFormPage from './pages/AlbumFormPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// ТИМЧАСОВА ВЕРСІЯ (крок 22): сторінка виконавців — у кроці 23
// Заглушка для сторінок, яких ще немає
function Placeholder({ title }) {
  return <h1 className="page-title">{title}</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/albums" replace />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="albums/:albumId" element={<AlbumDetailsPage />} />
        {/* Створення й редагування — лише після входу */}
        <Route element={<ProtectedRoute />}>
          <Route path="albums/new" element={<AlbumFormPage />} />
          <Route path="albums/:albumId/edit" element={<AlbumFormPage />} />
        </Route>
        <Route path="artists" element={<Placeholder title="Виконавці" />} />
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<SignInPage mode="sign-up" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
```

### ✅ Контрольна точка 21

1. Як `USER`: **Додати альбом** → **Створити альбом** з порожньою формою →
   помилки біля назви, виконавця, дати й кількості треків, фокус — на першому
   помилковому полі.
2. Заповніть форму, але назву візьміть **наявного** альбому в іншому
   регістрі (наприклад, `гірська ВЕСНА`) → біля назви: «Альбом «Гірська
   весна» уже є у фонотеці» (це відповідь сервера 409).
3. Виправте назву → сповіщення «Альбом «…» створено» і сторінка нового
   альбому. **Редагувати** → форма заповнена → змініть оцінку →
   «Зміни збережено».
4. Консоль — без жодних помилок і попереджень.

### 🧪 Експеримент: серверна валідація без клієнтської

У `useAlbumForm.js` тимчасово закоментуйте рядок
`if (Object.keys(clientErrors).length > 0) return showErrors(clientErrors);`
і надішліть порожню форму. Помилки біля полів **однаково** з'являться — тепер
від сервера (подивіться відповідь 400 у Network). Текст трохи інший, бо це
повідомлення Zod із кроку 8. Висновок: навіть якщо клієнтська валідація
помилиться, сервер не пропустить неправильних даних, а користувач побачить,
що виправити. Поверніть рядок.

---

## 23. Довідник виконавців і остаточні маршрути

Сторінка довідника: список виконавців із кількістю альбомів (кожна кількість —
посилання на відфільтрований список) і, для тих, хто увійшов, коротка форма
додавання. Після створення список перевантажується через `reload()` з
`useAsync`.

📄 **`client/src/features/artists/ArtistForm.jsx`**
```jsx
import { useState } from 'react';
import Field from '../../components/Field.jsx';
import { HttpError } from '../../api/http.js';
import styles from './ArtistForm.module.css';

const validateName = (name) => {
  const length = name.trim().length;
  if (length === 0) return "Ім'я обов'язкове";
  if (length < 2) return 'Мінімум 2 символи';
  if (length > 120) return 'Максимум 120 символів';
  return null;
};

/** Коротка форма додавання виконавця в довідник */
function ArtistForm({ onSubmit }) {
  const [values, setValues] = useState({ name: '', country: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nameError = validateName(values.name);
    if (nameError) return setErrors({ name: nameError });

    setIsSubmitting(true);
    try {
      await onSubmit({ name: values.name.trim(), country: values.country.trim() || null });
      setValues({ name: '', country: '' });
    } catch (error) {
      // Помилки полів — біля полів; решту (401, 500, мережа) показала сторінка
      if (error instanceof HttpError && error.isValidation) setErrors(error.fieldErrors);
      if (error instanceof HttpError && error.isConflict) setErrors({ name: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate aria-label="Новий виконавець">
      <Field id="artist-name" label="Ім'я або назва гурту *" error={errors.name}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="name"
            value={values.name}
            onChange={handleChange}
            className="input"
            autoComplete="off"
          />
        )}
      </Field>
      <Field id="artist-country" label="Країна" error={errors.country}>
        {(fieldProps) => (
          <input
            {...fieldProps}
            name="country"
            value={values.country}
            onChange={handleChange}
            className="input"
            autoComplete="off"
          />
        )}
      </Field>
      <button type="submit" className={`button ${styles.submit}`} disabled={isSubmitting}>
        {isSubmitting ? 'Додавання…' : 'Додати'}
      </button>
    </form>
  );
}

export default ArtistForm;
```

📄 **`client/src/features/artists/ArtistForm.module.css`**
```css
.form {
  display: grid;
  gap: 0.25rem 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

/* Кнопка вирівнюється з полями (над нею — місце під підпис) */
.submit {
  justify-self: start;
}

@media (min-width: 48rem) {
  .form {
    grid-template-columns: 2fr 1fr auto;
    align-items: start;
  }

  .submit {
    margin-top: 1.5rem;
  }
}
```

📄 **`client/src/pages/ArtistsPage.jsx`**
```jsx
import { Link } from 'react-router';
import ArtistForm from '../features/artists/ArtistForm.jsx';
import { EmptyState, ErrorState, PageSpinner } from '../components/states/States.jsx';
import { artistsApi } from '../api/artists.js';
import { describeError } from '../api/http.js';
import { useAuth } from '../context/AuthContext.js';
import { useToast } from '../context/ToastContext.js';
import { useArtists } from '../hooks/useArtists.js';
import styles from './ArtistsPage.module.css';

/** Довідник виконавців: список і (після входу) форма додавання */
function ArtistsPage() {
  const { artists, status, error, reload } = useArtists();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const handleCreate = async (data) => {
    try {
      const artist = await artistsApi.create(data);
      showToast({ message: `Виконавця «${artist.name}» додано` });
      reload();
    } catch (createError) {
      if (createError.status >= 500 || !createError.status) {
        showToast({ type: 'error', message: describeError(createError) });
      }
      throw createError; // помилки полів покаже форма
    }
  };

  let content;
  if (status === 'error') content = <ErrorState message={describeError(error)} onRetry={reload} />;
  else if (status === 'loading' && artists.length === 0) content = <PageSpinner />;
  else if (artists.length === 0) content = <EmptyState message="Довідник порожній." />;
  else {
    content = (
      <ul className={styles.list}>
        {artists.map((artist) => (
          <li key={artist.id} className={styles.item}>
            <div>
              <h2 className={styles.name}>{artist.name}</h2>
              <p className="muted">{artist.country ?? 'Країна не вказана'}</p>
            </div>
            <Link to={`/albums?artist=${artist.id}`} className="chip">
              Альбомів: {artist.albumCount}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Виконавці</h1>
      </div>
      <div className="stack">
        {isAuthenticated ? (
          <ArtistForm onSubmit={handleCreate} />
        ) : (
          <p className="muted">
            <Link to="/login">Увійдіть</Link>, щоб додавати виконавців.
          </p>
        )}
        {content}
      </div>
    </>
  );
}

export default ArtistsPage;
```

📄 **`client/src/pages/ArtistsPage.module.css`**
```css
.list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 16rem), 1fr));
  gap: 0.75rem;
  width: 100%;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
}

.name {
  font-size: 1.0625rem;
}
```

Остаточна версія маршрутів — заглушок більше немає:

📄 **`client/src/App.jsx`**
```jsx
import { Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AlbumsPage from './pages/AlbumsPage.jsx';
import AlbumDetailsPage from './pages/AlbumDetailsPage.jsx';
import AlbumFormPage from './pages/AlbumFormPage.jsx';
import ArtistsPage from './pages/ArtistsPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/albums" replace />} />
        <Route path="albums" element={<AlbumsPage />} />
        <Route path="albums/:albumId" element={<AlbumDetailsPage />} />
        {/* Створення й редагування — лише після входу */}
        <Route element={<ProtectedRoute />}>
          <Route path="albums/new" element={<AlbumFormPage />} />
          <Route path="albums/:albumId/edit" element={<AlbumFormPage />} />
        </Route>
        <Route path="artists" element={<ArtistsPage />} />
        <Route path="login" element={<SignInPage />} />
        <Route path="register" element={<SignInPage mode="sign-up" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
```

📄 **`client/README.md`**
```markdown
# Фонотека (клієнт Завдання №5)

React 19 + React Router + Vite. Опис і запуск — у [README кореня](../README.md).

| Скрипт | Що робить |
|---|---|
| `npm run dev` | сервер розробки на http://localhost:5173 |
| `npm run build` | продакшен-збірка в `dist/` |
| `npm run preview` | перегляд продакшен-збірки |
| `npm run lint` / `format` | ESLint / Prettier |
```

### ✅ Контрольна точка 22

1. **Виконавці**: 12 виконавців із країнами й кількістю альбомів; клік по
   «Альбомів: N» → список, відфільтрований за виконавцем.
2. Без входу — «Увійдіть, щоб додавати виконавців». Після входу додайте
   «Нова хвиля» → сповіщення, виконавець у списку з «Альбомів: 0» і вже
   доступний у фільтрі та формі альбому. Повторне додавання `нова ХВИЛЯ` →
   «Виконавець «нова ХВИЛЯ» уже є в довіднику» біля поля.
3. `npm --prefix client run lint` і `npm --prefix client run build` — без
   помилок.

---

## 24. Якість: консоль, доступність, Lighthouse

### 24.1. Продакшен-збірка локально

`npm run dev` — режим розробки (подвійні ефекти `StrictMode`, неоптимізований
код). Перед здачею перевірте **збірку**, яку побачать користувачі:

```bash
npm --prefix client run build     # dist/: index.html + стиснуті JS і CSS
npm --prefix client run preview   # http://localhost:4173
```

⚠️ Сервер дозволяє CORS лише для `http://localhost:5173`. Для перевірки
`preview` тимчасово розширте список у `server/.env`:
`CORS_ORIGINS=http://localhost:5173,http://localhost:4173` (і перезапустіть
сервер).

### 24.2. Чек-лист інтерфейсу

| Перевірка | Як |
|---|---|
| Жодних помилок і попереджень у консолі | пройдіть усі сторінки й дії з відкритою **Console**. Рядки «Failed to load resource: the server responded with a status of 404/409» для **очікуваних** відповідей сервера — це журнал мережі браузера, а не помилка коду; неприпустимі — `Uncaught …`, попередження React і помилки CORS |
| Коректно від 320 px | device toolbar, ширина 320: немає горизонтальної прокрутки сторінки (таблиця на десктопі прокручується всередині своєї колонки) |
| Три макети | 375 / 834 / 1280 px (крок 20) |
| Клавіатура | лише `Tab`, `Shift+Tab`, `Enter`, `Space`, `Esc`: вхід, пошук, фільтри, пагінація, створення альбому, видалення з підтвердженням. Фокус завжди видно |
| Чотири стани | скелетон, помилка з повтором, порожньо, дані — на списку; спінер і «немає такого альбому» — на деталях |
| 401 і 403 | крок 21 (експерименти) |

### 24.3. Lighthouse

**DevTools → Lighthouse** → Mode **Navigation**, Device **Mobile**,
Categories — **Accessibility** (можна й решту) → **Analyze page load**.
Вимога — **≥ 90**; наш приклад отримує **100** на сторінках списку, альбому
й входу.

![Звіт Lighthouse: Accessibility 100](assignment-5/docs/screenshots/lighthouse-accessibility.png)
 Якщо бал нижчий, Lighthouse показує конкретні елементи:
найчастіше це недостатній контраст тексту, поля без `<label>`, кнопки-іконки
без `aria-label`, пропущені рівні заголовків.

Зробіть скриншоти трьох макетів і звіту Lighthouse і покладіть у
`docs/screenshots/` — вони потрібні в README.

### 24.4. README застосунку

📄 **`README.md`**
````markdown
# Фонотека — приклад Завдання №5

Підсумковий клієнт-серверний застосунок: **React 19 + React Router** (клієнт),
**Node.js + Express 5 + JWT** (сервер), **PostgreSQL 18** (база в Docker).

> Навчальний приклад до курсу «Основи web програмування» (ЛНУ, ФПМІ).
> Покроковий опис створення — у файлі
> [`../01-assignment-4-5-step-by-step.md`](../01-assignment-4-5-step-by-step.md).
> Тему «Музичні альбоми» для власного завдання брати не можна.

| Телефон (375 px) | Планшет (834 px) |
|---|---|
| ![Телефон](docs/screenshots/fonoteka-mobile.png) | ![Планшет](docs/screenshots/fonoteka-tablet.png) |

![Десктоп (1280 px)](docs/screenshots/fonoteka-desktop.png)

![Lighthouse Accessibility: 100](docs/screenshots/lighthouse-accessibility.png)

## Предметна область

Головна сутність — **альбом**, довідник — **виконавець** (зв'язок «багато-до-одного»:
в альбому один виконавець, у виконавця багато альбомів). Користувачі мають роль `USER`
або `ADMIN`.

```mermaid
erDiagram
    artists ||--o{ albums : "має"
    artists {
        int id PK
        varchar name UK
        varchar country
    }
    albums {
        uuid id PK
        varchar title UK
        text description
        int artist_id FK
        date release_date
        smallint track_count
        smallint duration_minutes
        smallint rating
        varchar format
        boolean in_collection
        text cover_url
        timestamptz created_at
        timestamptz updated_at
    }
    users {
        int id PK
        varchar email UK
        varchar password_hash
        varchar role
    }
```

## Ендпоїнти API

Базова адреса — `/api/v1`, документація Swagger UI — `/api-docs`.

| Метод | Шлях | Доступ | Успіх |
|---|---|---|---|
| GET | `/albums?search=&artistId=&format=&inCollection=&yearFrom=&yearTo=&ratingMin=&sort=&order=&limit=&offset=` | публічний | 200 `{ data, total, limit, offset }` |
| GET | `/albums/count` | публічний | 200 `{ total }` |
| GET | `/albums/:id` | публічний | 200 (разом із виконавцем) |
| POST | `/albums` | USER, ADMIN | 201 + `Location` |
| PUT / PATCH | `/albums/:id` | USER, ADMIN | 204 |
| DELETE | `/albums/:id` | ADMIN | 204 |
| GET | `/artists`, `/artists/:id` | публічний | 200 |
| POST | `/artists` | USER, ADMIN | 201 + `Location` |
| POST | `/auth/sign-up`, `/auth/sign-in` | публічний | 201 / 200 `{ user, token }` |
| POST | `/auth/refresh-token` | USER, ADMIN | 200 `{ user, token }` |
| GET | `/auth/me` | USER, ADMIN | 200 |
| GET | `/health` | публічний | 200 / 503 |

Помилки: `400` (валідація, з полем `errors`), `401`, `403`, `404`, `409`, `429`, `500` —
завжди у форматі `{ status, message, errors?, path, timestamp }`.

## Локальний запуск «з нуля»

Потрібні Node.js 22+ (рекомендовано 24 LTS) і Docker.

```bash
npm install && npm run install:all     # залежності кореня, сервера й клієнта
docker compose up -d --wait            # PostgreSQL 18, дочекатися готовності
cp server/.env.example server/.env     # і впишіть JWT_SECRET (команда генерації — у файлі)
npm --prefix server run migrate:up     # схема бази
npm --prefix server run seed           # 240 альбомів, 12 виконавців, 2 користувачі
npm run dev                            # сервер :3000 + клієнт :5173
```

Відкрийте http://localhost:5173. Адресу API клієнт бере зі змінної `VITE_API_URL`
(`client/.env.development`).

Автоматичні тести сервера: один раз `docker exec fonoteka-db createdb -U fonoteka fonoteka_test`,
далі `npm --prefix server test`.

**Тестові облікові записи:**

| Роль | E-mail | Пароль |
|---|---|---|
| ADMIN | `admin@fonoteka.test` | `AdminPass123` |
| USER | `user@fonoteka.test` | `UserPass123` |

## Структура

```
fonoteka/
├── docker-compose.yml      ← PostgreSQL для розробки
├── package.json            ← npm run dev запускає обидві частини
├── server/                 ← REST API: routes → controllers → services → repositories
│   ├── docs/openapi.yaml   ← документація OpenAPI (Swagger UI на /api-docs)
│   ├── scripts/seed.js
│   └── src/ (config, db/migrations, middlewares, validators, routes, controllers,
│            services, repositories, mappers, errors, utils)
└── client/                 ← React SPA
    └── src/
        ├── api/            ← єдина точка спілкування з сервером (fetch + токен + помилки)
        ├── context/        ← автентифікація, сповіщення
        ├── hooks/          ← useAsync, useDebounce, useListQuery, useMediaQuery…
        ├── components/     ← Layout, Pagination, Field, ConfirmDialog, стани
        ├── features/       ← альбоми, виконавці
        └── pages/          ← сторінки-маршрути
```

## Розгортання

Рекомендована схема: база — **Neon**, сервер — **Render**, клієнт — **Netlify**.
Покрокова інструкція — у розділі «Розгортання» посібника.

## Використання ШІ

Приклад підготовлено викладачем за допомогою Claude (Anthropic): генерація коду, тексту
й тестових даних. Код перевірено автоматичними сценаріями (API — на PostgreSQL 18,
клієнт — у браузері через Playwright); Lighthouse Accessibility — 100.
````

---

## 25. Розгортання: Neon + Render + Netlify

> ⚠️ **Цей розділ не перевірено розгортанням «наживо».** Він складений за
> документацією сервісів станом на листопад 2026 року. Інтерфейси й умови
> безкоштовних тарифів змінюються часто, тож звіряйтеся з поточною
> документацією (посилання — у [розділі 29](#29-корисні-посилання)).

### 📚 Теорія: три частини — три сервіси

| Частина | Що це після збірки | Де розміщуємо | Чому |
|---|---|---|---|
| База | PostgreSQL | **Neon** | керована PostgreSQL з безкоштовним тарифом; база «засинає» без запитів і прокидається за секунди |
| Сервер | процес Node.js, що слухає порт | **Render** (Web Service) | вміє запускати Node.js із репозиторію GitHub; безкоштовний тариф |
| Клієнт | **статичні файли** (`index.html`, JS, CSS) | **Netlify** | статику роздає CDN, сервер Node.js для неї не потрібен |

Обмеження безкоштовних тарифів, про які варто знати (станом на листопад
2026 року):

- **Render**: безкоштовний веб-сервіс **засинає після 15 хвилин** без
  запитів, і перший запит після цього чекає близько хвилини, поки сервіс
  прокинеться. Для демонстрації відкрийте сайт заздалегідь. Безкоштовна
  база Render видаляється через 30 днів — тому базу беремо в Neon.
- **Neon**: обмежені обсяг сховища й обчислювальний час на місяць; для
  навчального проєкту цього з запасом.

Порядок важливий: **база → сервер → клієнт → CORS**. Серверу потрібна адреса
бази, клієнту — адреса сервера, а серверу — адреса клієнта для CORS.

### 25.1. База в Neon

1. Зареєструйтеся на [neon.com](https://neon.com/) і створіть проєкт
   (регіон — Європа, наприклад Frankfurt).
2. У діалозі **Connect** вимкніть **Connection pooling** (для міграцій
   потрібне пряме з'єднання) і скопіюйте рядок підключення:
   `postgresql://<користувач>:<пароль>@<хост>.neon.tech/<база>?sslmode=require…`.
3. Замініть параметри після `?` на `sslmode=verify-full`. Драйвер `pg`
   на `sslmode=require` друкує попередження безпеки й однаково перевіряє
   сертифікат повністю; явний `verify-full` робить це без попередження.
4. Застосуйте міграції й демо-дані **зі свого комп'ютера** — змінна з
   командного рядка має пріоритет над `.env`:

   ```bash
   cd server
   DATABASE_URL='postgresql://…neon.tech/neondb?sslmode=verify-full' npm run migrate:up
   DATABASE_URL='postgresql://…neon.tech/neondb?sslmode=verify-full' npm run seed
   ```

   (У PowerShell: `$env:DATABASE_URL='…'; npm run migrate:up`.)

💡 Українське сортування на Neon залежить від налаштувань бази за
замовчуванням. Перевірте експериментом із кроку 3; якщо «Ґава» не стоїть
після «Гори», створіть окрему базу з ICU в SQL Editor Neon:
`CREATE DATABASE fonoteka LOCALE_PROVIDER icu ICU_LOCALE 'uk-UA' LOCALE 'C.UTF-8' TEMPLATE template0;`
і використовуйте її в рядку підключення.

### 25.2. Сервер на Render

1. Зареєструйтеся на [render.com](https://render.com/) через GitHub.
   **New → Web Service** → оберіть свій репозиторій.
2. Налаштування:

   | Поле | Значення |
   |---|---|
   | Root Directory | `server` |
   | Runtime | Node |
   | Build Command | `npm ci` |
   | Start Command | `npm run migrate:up && npm start` |
   | Instance Type | Free |
   | Health Check Path (Advanced) | `/health/live` |

   Міграції в команді запуску виконуються при кожному старті сервісу — після
   розгортання й після кожного «пробудження» безкоштовного екземпляра (це
   кілька секунд до часу холодного старту); якщо нових міграцій немає,
   команда нічого не робить (`No migrations to run!`).
3. **Environment Variables:**

   | Змінна | Значення |
   |---|---|
   | `NODE_ENV` | `production` |
   | `DATABASE_URL` | рядок Neon із `sslmode=verify-full` |
   | `JWT_SECRET` | **новий** випадковий рядок (команда з кроку 2) — не той, що в `.env` |
   | `JWT_EXPIRES_IN` | `1h` |
   | `CORS_ORIGINS` | поки `http://localhost:5173`, після кроку 25.3 — адреса Netlify |
   | `LOG_LEVEL` | `info` |

   `PORT` задавати не треба: Render передає його сам, а `config.port`
   читає саме `process.env.PORT`.
4. **Deploy.** Після збірки відкрийте
   `https://<назва>.onrender.com/health` — `{"status":"ok","database":"up",…}`, і
   `https://<назва>.onrender.com/api-docs` — Swagger UI. Логи (JSON від
   pino) — на вкладці **Logs**.

🤔 **Чому `NODE_ENV=production` важливий?** Логер пише JSON без
`pino-pretty` (його в продакшені й немає: `npm ci` з цією змінною не
встановлює `devDependencies`), а Express вимикає докладні повідомлення
про помилки.

### 25.3. Клієнт на Netlify

1. Зареєструйтеся на [netlify.com](https://www.netlify.com/) через GitHub.
   **Add new project → Import an existing project** → ваш репозиторій.
2. Налаштування збірки:

   | Поле | Значення |
   |---|---|
   | Base directory | `client` |
   | Build command | `npm run build` |
   | Publish directory | `client/dist` (відносно кореня; інтерфейс може показувати просто `dist`) |

3. **Environment variables** → `VITE_API_URL` =
   `https://<назва>.onrender.com/api/v1`. ⚠️ Змінна вбудовується **під час
   збірки**: змінили її — запустіть **Deploy → Trigger deploy** заново.
4. Після розгортання сайт доступний за `https://<назва>.netlify.app`.
   Файл `public/_redirects` (`/* /index.html 200`) потрапив у `dist/`: пряме
   відкриття `https://<назва>.netlify.app/albums/…` віддає `index.html`, і
   маршрут обробляє React Router (**SPA-fallback**). Без нього Netlify
   відповів би 404.

### 25.4. Замикаємо CORS

Поверніться в Render і поставте `CORS_ORIGINS=https://<назва>.netlify.app` —
**без** слеша в кінці (джерело — це схема + хост + порт, слеш не є його
частиною). Збережіть — Render перезапустить сервіс.

### ✅ Контрольна точка 23

| Перевірка | Як |
|---|---|
| Клієнт за HTTPS | `https://<назва>.netlify.app` відкривається, список завантажується (перший раз — до хвилини, поки прокидається Render) |
| SPA-fallback | відкрийте посилання на альбом у новій вкладці й натисніть F5 |
| Вхід і ролі | `USER` створює, `ADMIN` видаляє |
| Swagger UI публічно | `https://<назва>.onrender.com/api-docs` |
| CORS — конкретний домен | `curl -I -H 'Origin: https://evil.example' https://<назва>.onrender.com/api/v1/albums` — **без** `Access-Control-Allow-Origin` |
| Адреса API — зі змінної | у коді немає `onrender.com`; `git grep onrender` знаходить лише `.env.example` і документацію |
| Секретів у репозиторії немає | `git ls-files \| grep '\.env$'` — порожньо |

Додайте обидві адреси в README (розділ «Розгортання»).

---
# Частина III. Підсумки

## 26. Як перенести приклад на свою тему

Приклад зроблено так, щоб назви сутностей змінювалися, а **структура
лишалася**. Порядок дій для власної предметної області (наприклад,
«Бібліотека»: книга + автор, чи «Спортзал»: тренування + тренер):

| Крок | Що змінити | Що лишається як є |
|---|---|---|
| 1. Сутності | головна сутність і довідник; таблиця полів на зразок 0.1 (різні типи, enum, дата, логічне, URL) | `users` і ролі |
| 2. Міграція | таблиці, `CHECK`, зовнішній ключ, унікальні `lower(…)`, індекси на пошук і FK | тригер `updated_at`, `pg_trgm` |
| 3. Схеми Zod | поля, повідомлення, `SORT_FIELDS`, фільтри (щонайменше три) | `common.js`, `validate.js` |
| 4. Репозиторій | `SORT_COLUMNS`, `COLUMNS`, умови в `buildFilters`, `JOIN` з довідником | структура функцій, параметри `$n` |
| 5. Мапер, сервіс, контролер, маршрути | назви полів і бізнес-правила | коди 201/204, `Location`, `authenticate` і `requireRole` |
| 6. Seed | власні правдоподібні дані (200+) | детермінований генератор, транзакція |
| 7. OpenAPI, `requests.http`, тести | назви й поля | структура |
| 8. Клієнт | `api/<сутність>.js`, `utils/listQuery.js`, форма й валідація, картка, таблиця, фільтри | `api/http.js`, `useAsync`, `useDebounce`, `useMediaQuery`, `AuthProvider`, `ProtectedRoute`, `Field`, `Pagination`, `ConfirmDialog`, стани |

⚠️ Копіювати приклад і перейменовувати «альбом» на «книгу» без розуміння —
погана ідея: на захисті попросять пояснити **будь-який** рядок (див.
розділ 28). Перенісши файл, перечитайте його й переконайтеся, що можете
пояснити кожне рішення своїми словами.

---

## 27. Типові помилки

### Сервер

| Симптом | Причина | Рішення |
|---|---|---|
| `SyntaxError: Cannot use import statement outside a module` | немає `"type": "module"` | крок 1.3 |
| `ERR_MODULE_NOT_FOUND … '/src/app'` | імпорт без `.js` | в ES-модулях розширення обов'язкове |
| `✖ Відсутня обов'язкова змінна середовища` | немає `.env` або змінної в ньому | `cp .env.example .env`, крок 2 |
| `ECONNREFUSED 127.0.0.1:5432` | база не запущена | `docker compose up -d`, `docker compose ps` |
| `password authentication failed` | інший пароль у `.env`, або том створено з іншим паролем | звірте `DATABASE_URL` з `docker-compose.yml`; у крайньому разі `docker compose down -v` |
| `port is already allocated` | 5432 зайнятий локальним PostgreSQL | змініть порт на `5433:5432` і в `DATABASE_URL` |
| `relation "albums" does not exist` | не застосовано міграції | `npm run migrate:up` |
| Дата альбому на день раніша | `DATE` перетворився на `Date` з часовим поясом | `types.setTypeParser(1082, …)`, крок 5 |
| `"total": "60"` (рядок) | `COUNT(*)` — `bigint` | `COUNT(*)::int` |
| `GET /albums/count` → 400 «Некоректний ідентифікатор» | маршрут `/count` нижче за `/:id` | порядок маршрутів, крок 11 |
| `PATCH { rating: 5 }` стер опис | у схемі PATCH лишилися `.default()` | окрема схема без значень за замовчуванням, крок 8 |
| Дублікати записів між сторінками | `ORDER BY` без унікального другого ключа | `, a.id` в `ORDER BY` |
| Пошук з апострофом → 500 | SQL склеєно з даними | лише параметри `$n`, крок 9 |
| Усі 401 з «Недійсний токен» після перезапуску | змінився `JWT_SECRET` | старі токени стали недійсними — увійдіть знову |
| У відповіді є `stack` | обробник помилок віддає `error.stack` | стек — лише в лог, крок 6 |
| `npm test` чистить робочу базу | тести запущено без `.env.test` | лише `npm test`; запобіжник у `tests/helpers.js` |

### Клієнт

| Симптом | Причина | Рішення |
|---|---|---|
| `blocked by CORS policy` | джерело клієнта не в `CORS_ORIGINS`, або клієнт на іншому порту | `CORS_ORIGINS`, `strictPort`, крок 17 |
| `import.meta.env.VITE_API_URL` — `undefined` | змінна без префікса `VITE_`, або Vite не перезапущено після зміни `.env` | префікс і перезапуск `npm run dev` |
| Кожен запит у Network двічі, перший `(canceled)` | `StrictMode` у режимі розробки | так і має бути; у збірці запит один |
| Запит на кожну літеру пошуку | пошук іде в запит без debounce | `useDebounce`, крок 20 |
| Старі результати замість нових | гонка відповідей | `AbortController` у `useAsync`, крок 18 |
| Нескінченні запити | об'єкт або функція в залежностях ефекту | ключ-рядок (`JSON.stringify`) і `ref` для функції |
| `Uncaught (in promise) HttpError` у консолі | помилку кинуто далі й ніхто її не зловив | обробити на сторінці або у формі, крок 22 |
| Після входу користувача не повертає на сторінку, де він був | `state.from` втрачено | `ProtectedRoute` передає `state={{ from: location }}` |
| На Netlify пряме посилання → 404 | немає SPA-fallback | `public/_redirects`, крок 25 |
| На Netlify запити йдуть на `localhost:3000` | `VITE_API_URL` не задано **до збірки** | змінна в Netlify + новий deploy |
| Форма редагування показує дані попереднього альбому | компонент форми не перестворено | `key={albumId ?? 'new'}`, крок 22 |

---

## 28. Питання для самоперевірки й захисту

**Архітектура й HTTP**

1. Назвіть шари сервера і що **не** може знати кожен із них. (Маршрути — SQL;
   контролер — SQL і бізнес-правила; сервіс — `req`/`res`; репозиторій —
   HTTP і правила.)
2. Чому `app.js` і `server.js` — окремі файли? (Тести імпортують `app` без
   запуску на порту.)
3. Чим `PUT` відрізняється від `PATCH` у нашому API і як це видно в схемах
   Zod? (`PUT` — повний ресурс, не передані поля → `null`; `PATCH` — лише
   передане, без `.default()`.)
4. Чому `POST` відповідає 201 з `Location`, а `PUT` — 204? (Новому ресурсу
   потрібна адреса; при оновленні клієнт і так знає дані.)
5. Чому неіснуючий `artistId` у тілі — 400, а не 404? (Адреса `/albums`
   існує; неправильне значення поля.)
6. Що станеться, якщо `errorHandler` підключити до маршрутів? (Він не
   отримає помилок з маршрутів — обробник помилок має бути останнім.)

**База даних і безпека**

7. Як працює SQL-ін'єкція і чому параметр `$1` її унеможливлює? Чому
   стовпець сортування не можна передати параметром?
8. Навіщо індекс на `artist_id`, якщо це вже зовнішній ключ? (PostgreSQL не
   індексує FK автоматично.)
9. Чому звичайний B-tree-індекс не допомагає `ILIKE '%ніч%'`? Що допомагає?
10. Навіщо перевіряти унікальність назви в сервісі, якщо є унікальний
    індекс, — і навпаки? (Сервіс дає зрозуміле повідомлення; індекс захищає
    від гонки двох одночасних запитів.)
11. Чому паролі хешують bcrypt, а не SHA-256? Що таке сіль і де вона
    зберігається?
12. Що всередині JWT? Чи можна прочитати його без секрету? Чи можна
    змінити? Що перевіряє сервер?
13. Чим 401 відрізняється від 403? Наведіть приклад кожного в «Фонотеці».
14. Чому однакове повідомлення для «немає пошти» й «неправильний пароль»?
15. Від чого захищає `.strict()` у схемах? (Mass assignment: `role`, `id`.)
16. Чому `.env` не комітять, а `.env.example` — комітять?

**Клієнт**

17. Навіщо шар `api/`? Що станеться з кодом, якщо зміниться формат помилок
    сервера?
18. Чому `fetch` не кидає помилку на 404? Як це обробляє `http.js`?
19. Опишіть гонку відповідей і як її усуває `AbortController`.
20. Чому статус у `useAsync` обчислюється, а не зберігається в `useState`?
21. Що дає debounce і чому очищення пошуку застосовується одразу?
22. Чому стан списку — в адресі, а не в `useState`? Навіщо `replace: true`
    для пошуку?
23. Чому вибір «таблиця чи картки» зроблено в JavaScript, а розташування
    фільтрів — у CSS?
24. Чи захищає `ProtectedRoute` дані? (Ні — лише зручність; захищає сервер.)
25. Що відбувається від моменту, коли сервер відповів 401, до появи сторінки
    входу? (`http.js` видаляє токен → подія `auth:unauthorized` →
    `AuthProvider` виходить і переходить на `/login`.)
26. Чому змінні `VITE_*` не можуть містити секретів?

**Розгортання**

27. Чому клієнт можна розмістити на Netlify, а сервер — ні? (Клієнт після
    збірки — статичні файли.)
28. Що таке SPA-fallback і що станеться без нього?
29. Чому `CORS_ORIGINS` на продакшені — конкретний домен, а не `*`?
30. Навіщо `migrate:up` у команді запуску на Render?

---

## 29. Корисні посилання

**Документація інструментів**

- [Node.js — документація](https://nodejs.org/docs/latest/api/) · [`node:test`](https://nodejs.org/api/test.html)
- [Express 5 — посібник](https://expressjs.com/en/guide/routing.html) · [Перехід на Express 5](https://expressjs.com/en/guide/migrating-5.html)
- [PostgreSQL 18 — документація](https://www.postgresql.org/docs/18/) · [`pg_trgm`](https://www.postgresql.org/docs/18/pgtrgm.html)
- [node-postgres (`pg`)](https://node-postgres.com/) · [node-pg-migrate](https://salsita.github.io/node-pg-migrate/)
- [Zod 4](https://zod.dev/)
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) · [jwt.io — розбір токена](https://jwt.io/)
- [helmet](https://helmetjs.github.io/) · [express-rate-limit](https://www.npmjs.com/package/express-rate-limit)
- [pino](https://getpino.io/)
- [OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0) · [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [supertest](https://github.com/forwardemail/supertest)
- [React 19](https://react.dev/) · [React Router](https://reactrouter.com/) · [Vite](https://vite.dev/guide/)
- [MDN: Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) · [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) · [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)
- [WebStorm: HTTP Client](https://www.jetbrains.com/help/webstorm/http-client-in-product-code-editor.html)

**Безпека**

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Cheat Sheet: Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) · [SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) · [REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)

**Розгортання**

- [Neon — документація](https://neon.com/docs/introduction) · [Підключення з Node.js](https://neon.com/docs/guides/node)
- [Render — Node.js/Express](https://render.com/docs/deploy-node-express-app) · [Безкоштовний тариф](https://render.com/docs/free)
- [Netlify — Vite](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/) · [Перенаправлення](https://docs.netlify.com/manage/routing/redirects/overview/)

**Матеріали курсу**

- Лекції [11](../../lectures/11-nodejs-runtime.md) · [12](../../lectures/12-express-middleware-architecture.md) · [13](../../lectures/13-rest-api-postgresql.md) · [14](../../lectures/14-auth-security.md) · [15](../../lectures/15-nodejs-quality-testing-openapi.md) · [16](../../lectures/16-integration-deployment.md)
- [HTTP і HTTPS під капотом](../../additional-materials/http-https-rest.md)
- [Приклад Завдання №3](../../additiona-tutorials/assignment-3-music-catalog.md)
- [Кращі практики: Node.js і REST API в React](02-best-practices-node-react-api.md)

---

> Посібник підготовлено за допомогою Claude (Anthropic). Код обох проєктів
> перевірено автоматично: сервер — інтеграційними тестами й прогоном усіх
> запитів `requests.http` на PostgreSQL 18, клієнт — сценаріями в браузері
> (Playwright) і Lighthouse. Розділ 25 (розгортання) не перевірено «наживо».
