# Лекція 16. Інтеграція, розгортання та підсумки курсу

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №5 «Підсумковий клієнт-серверний застосунок»
> **Попередня лекція:** [Лекція 15](15-nodejs-quality-testing-openapi.md)

---

## Про що ця лекція

Ви маєте клієнт на React і сервер на Node.js. Лишилося з'єднати їх у робочу
систему й **опублікувати в Інтернеті** так, щоб посилання можна було надіслати
будь-кому.

Друга частина лекції — підсумки: що ви навчилися робити, чого свідомо не
торкалися і куди рухатися далі.

---

## Зміст

1. [Архітектура повного застосунку](#1-архітектура-повного-застосунку)
2. [З'єднання клієнта із сервером](#2-зєднання-клієнта-із-сервером)
3. [Локальна розробка двох частин](#3-локальна-розробка-двох-частин)
4. [Узгодження контракту](#4-узгодження-контракту)
5. [Підготовка до розгортання](#5-підготовка-до-розгортання)
6. [Розгортання бази даних](#6-розгортання-бази-даних)
7. [Розгортання сервера](#7-розгортання-сервера)
8. [Розгортання клієнта](#8-розгортання-клієнта)
9. [Контейнеризація](#9-контейнеризація)
10. [CI/CD](#10-cicd)
11. [Аудит доступності та продуктивності](#11-аудит-доступності-та-продуктивності)
12. [Чек-лист здачі Завдання №5](#12-чек-лист-здачі-завдання-5)
13. [Підсумки курсу](#13-підсумки-курсу)
14. [Куди рухатися далі](#14-куди-рухатися-далі)
15. [Типові помилки](#15-типові-помилки)
16. [Контрольні запитання](#16-контрольні-запитання)
17. [Корисні посилання](#17-корисні-посилання)
18. [Література](#18-література)
19. [Глосарій](#19-глосарій)

---

## 1. Архітектура повного застосунку

```
        ┌──────────────┐
        │  Користувач  │
        └──────┬───────┘
               │ HTTPS
        ┌──────▼─────────────────┐
        │  CDN / статичний       │  ← зібраний React (dist/)
        │  хостинг               │     Netlify · Vercel · Cloudflare
        └──────┬─────────────────┘
               │ fetch (HTTPS, CORS)
        ┌──────▼─────────────────┐
        │  Сервер Node.js        │  ← Express API
        │  (Render/Railway/Fly)  │     JWT, валідація, шари
        └──────┬─────────────────┘
               │ TCP + TLS
        ┌──────▼─────────────────┐
        │  PostgreSQL            │  ← керована база
        │  (Neon/Supabase/Render)│     міграції, індекси
        └────────────────────────┘
```

🔑 Три **окремі** розгортання. Клієнт — це просто набір статичних файлів; йому
не потрібен сервер Node.js для роботи. Це важлива архітектурна властивість:
статику можна роздавати з CDN у десятках точок світу, а API масштабувати
окремо.

---

## 2. З'єднання клієнта із сервером

### 2.1. Конфігурація адреси

```js
// client/src/api/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api/v1';
```

```
# client/.env.development
VITE_API_URL=http://localhost:3000/api/v1

# client/.env.production
VITE_API_URL=https://movies-api.onrender.com/api/v1
```

⚠️ Змінні `VITE_*` **вбудовуються у збірку** й видимі кожному, хто відкриє
файли сайту. Секретів там бути не може — лише публічні адреси.

### 2.2. Повний потік автентифікації

```
1. Користувач вводить пошту й пароль
2. POST /auth/sign-in
3. Сервер: bcrypt.compare → генерує JWT
4. Клієнт: зберігає токен у localStorage, оновлює AuthContext
5. Кожен наступний запит: Authorization: Bearer <token>
6. Сервер: middleware перевіряє підпис і термін → req.user
7. Відповідь 401 → клієнт видаляє токен → редірект на /sign-in
```

```js
// Обгортка з автоматичною реакцією на 401 (лекція 10)
if (response.status === 401) {
  localStorage.removeItem('token');
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}
```

### 2.3. Помилки валідації з сервера у формі

```js
try {
  await moviesApi.create(values);
} catch (error) {
  if (error instanceof HttpError && error.isValidation) {
    setErrors(error.fieldErrors);      // { title: 'Мінімум 2 символи' }
    focusFirstError(error.fieldErrors);
    return;
  }
  showToast({ type: 'error', message: 'Не вдалося зберегти' });
}
```

Для цього формат помилки має бути узгоджений (лекція 13):

```json
{ "status": 400, "errors": [{ "field": "title", "message": "…" }] }
```

---

## 3. Локальна розробка двох частин

### 3.1. Структура моно-репозиторію

```
movies-app/
├── README.md
├── docker-compose.yml
├── .gitignore
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── .env.development
│   └── src/
└── server/
    ├── package.json
    ├── .env.example
    ├── docs/openapi.yaml
    └── src/
```

### 3.2. Запуск

```bash
# Термінал 1 — база
docker compose up -d

# Термінал 2 — сервер
cd server && npm run migrate:up && npm run seed && npm run dev

# Термінал 3 — клієнт
cd client && npm run dev
```

Зручніше — одна команда з кореня:

```json
// package.json у корені
{
  "scripts": {
    "dev": "concurrently -n db,server,client -c blue,green,magenta \"npm:dev:*\"",
    "dev:server": "npm --prefix server run dev",
    "dev:client": "npm --prefix client run dev",
    "install:all": "npm --prefix server ci && npm --prefix client ci"
  },
  "devDependencies": { "concurrently": "^9.1.0" }
}
```

### 3.3. Проксі замість CORS у розробці

Vite може проксіювати запити — тоді браузер вважає, що API на тому самому
походженні, і CORS взагалі не потрібен:

```js
// client/vite.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
```

Тоді у клієнті `API_BASE_URL = '/api/v1'` — і однаковий код працює локально й
у продакшені (якщо там теж налаштувати проксі).

🔑 Проксі зручний, але **не позбавляє** від налаштування CORS у продакшені,
якщо клієнт і сервер там на різних доменах.

---

## 4. Узгодження контракту

Найчастіші розбіжності між клієнтом і сервером:

| Проблема | Приклад | Рішення |
|---|---|---|
| Іменування полів | сервер `created_at`, клієнт очікує `createdAt` | мапер на сервері |
| Формат дат | `"2026-09-01"` проти `"2026-09-01T00:00:00Z"` | ISO 8601 всюди |
| Числа як рядки | `"rating": "8.5"` замість `8.5` | приведення в мапері |
| Порожні значення | `null` проти `""` проти відсутнього поля | домовитися й дотримуватися |
| Структура списку | масив проти `{ data, total }` | завжди об'єкт |
| Формат помилок | різний для різних маршрутів | єдиний обробник |

🔑 **Джерело істини — OpenAPI-специфікація** (лекція 15). Якщо клієнт і сервер
розходяться, звіряйтеся з нею, а не з чиєюсь пам'яттю.

⚠️ Особливо підступне: PostgreSQL повертає `NUMERIC` як **рядок** (щоб не
втратити точність). `rating: "8.5"` зламає сортування на клієнті. Приведення в
мапері обов'язкове:

```js
rating: row.rating === null ? null : Number(row.rating),
```

---

## 5. Підготовка до розгортання

### 5.1. Змінні середовища

**Сервер (у панелі платформи):**

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
JWT_SECRET=<64 випадкові байти в hex>
JWT_EXPIRES_IN=30m
CORS_ORIGIN=https://movies-app.netlify.app
```

**Клієнт (під час збірки):**

```
VITE_API_URL=https://movies-api.onrender.com/api/v1
```

### 5.2. Що перевірити перед деплоєм

```bash
# Сервер
cd server
npm ci
npm run lint
npm test
NODE_ENV=production node --env-file=.env.production src/server.js

# Клієнт
cd client
npm ci
npm run lint
npm run build
npm run preview          # перевірити ПРОДАКШЕН-збірку локально
```

⚠️ `npm run preview` часто виявляє помилки, яких немає в режимі розробки:
неправильні шляхи, залежності від dev-проксі, різна поведінка змінних
середовища.

---

## 6. Розгортання бази даних

| Сервіс | Безкоштовний рівень | Особливості |
|---|---|---|
| **Neon** | 0.5 ГБ | serverless, гілки бази як у git, засинає без навантаження |
| **Supabase** | 500 МБ | PostgreSQL + автогенероване API + автентифікація |
| **Render PostgreSQL** | 1 ГБ, 90 днів | зручно, якщо сервер теж на Render |
| **Railway** | пробний кредит | просте налаштування |
| **Aiven** | пробний період | професійний рівень |

Після створення отримаєте рядок підключення:

```
postgresql://user:password@ep-cool-name.eu-central-1.aws.neon.tech/movies?sslmode=require
```

⚠️ Керовані бази **вимагають SSL**:

```js
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.isProduction ? { rejectUnauthorized: false } : false,
});
```

**Міграції в продакшені** запускаються автоматично при деплої:

```json
"scripts": {
  "start": "npm run migrate:up && node src/server.js"
}
```

⚠️ Ніколи не застосовуйте міграції вручну «одноразово» — при наступному
деплої з чистого середовища схеми не буде.

---

## 7. Розгортання сервера

| Платформа | Безкоштовно | Примітка |
|---|---|---|
| **Render** | так, засинає після 15 хв | найпростіше для навчального проєкту |
| **Railway** | пробний кредит | зручний інтерфейс |
| **Fly.io** | обмежено | контейнери, багато регіонів |
| **Cyclic / Koyeb** | так | альтернативи |

**Налаштування на Render:**

| Поле | Значення |
|---|---|
| Root Directory | `server` |
| Build Command | `npm ci` |
| Start Command | `npm start` |
| Health Check Path | `/health/live` |
| Environment | усі змінні з розділу 5.1 |

⚠️ **Холодний старт.** На безкоштовному рівні сервіс засинає після
15 хвилин без запитів, і перший запит триває 30–60 секунд. Обов'язково
попередьте про це на захисті — інакше виглядатиме, ніби нічого не працює.

⚠️ **Порт.** Платформа задає його через `process.env.PORT`. Жорстко зашитий
`3000` не працюватиме.

```js
const port = Number(process.env.PORT ?? 3000);
app.listen(port, '0.0.0.0');       // саме 0.0.0.0, а не localhost
```

⚠️ **`trust proxy`.** За балансувальником платформи без цього рядка
`req.ip` буде адресою проксі, і rate limiting заблокує всіх одразу:

```js
app.set('trust proxy', 1);
```

---

## 8. Розгортання клієнта

| Платформа | Особливості |
|---|---|
| **Netlify** | найпростіше, `_redirects` для SPA |
| **Vercel** | `vercel.json` для rewrites |
| **Cloudflare Pages** | дуже швидка мережа |
| **GitHub Pages** | безкоштовно, але потрібні `base` і `404.html` |

**Netlify:**

| Поле | Значення |
|---|---|
| Base directory | `client` |
| Build command | `npm run build` |
| Publish directory | `client/dist` |
| Environment | `VITE_API_URL=https://…` |

```
# client/public/_redirects
/*    /index.html   200
```

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

🔑 **Без SPA-fallback пряме відкриття `/movies/42` дасть 404.** Це найчастіша
проблема при першому розгортанні SPA.

**GitHub Pages:**

```js
// vite.config.js
export default defineConfig({ plugins: [react()], base: '/movies-app/' });
```

```json
"build": "vite build && cp dist/index.html dist/404.html"
```

### 8.1. CORS у продакшені

Після розгортання клієнта оновіть змінну на сервері:

```
CORS_ORIGIN=https://movies-app.netlify.app
```

⚠️ **Без завершального слеша.** `https://app.netlify.app/` не збігається з
`https://app.netlify.app` — і CORS не спрацює.

Якщо доменів кілька:

```js
const allowed = config.corsOrigin.split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Не дозволено політикою CORS'));
  },
  credentials: true,
  exposedHeaders: ['Authorization', 'X-Total-Count'],
}));
```

---

## 9. Контейнеризація

Не обов'язково для Завдання №5, але дуже корисно знати.

```dockerfile
# server/Dockerfile — багатоетапна збірка
FROM node:24-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Не запускаємо від root
USER node

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "fetch('http://localhost:3000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
```

```dockerfile
# client/Dockerfile
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# client/nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;      # ← SPA-fallback
  }

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }
}
```

**Навіщо багатоетапна збірка:** інструменти збірки й dev-залежності не
потрапляють у фінальний образ. Різниця — сотні мегабайтів.

```
# .dockerignore
node_modules
dist
.env
.git
*.log
```

---

## 10. CI/CD

```yaml
# .github/workflows/ci.yml
name: CI/CD
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  server:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:18-alpine
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 5s
          --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/test
      JWT_SECRET: ci-secret-value-for-tests-only
    defaults:
      run: { working-directory: server }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm, cache-dependency-path: server/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run migrate:up
      - run: npm test

  client:
    runs-on: ubuntu-latest
    defaults:
      run: { working-directory: client }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm, cache-dependency-path: client/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

🔑 Render, Netlify й Vercel самі розгортають при `push` у `main` — окремий
крок деплою в CI не потрібен. CI тут відповідає за **перевірку якості до**
розгортання.

**Захист гілки `main`** (Settings → Branches → Add rule): вимагати успішного
проходження CI перед злиттям. Одне налаштування, що рятує від зламаного
продакшену.

---

## 11. Аудит доступності та продуктивності

### 11.1. Lighthouse

DevTools → Lighthouse → Analyze (обов'язково в режимі **Mobile**).

| Категорія | Мінімум для завдання |
|---|---|
| Performance | 80 |
| **Accessibility** | **90** |
| Best Practices | 90 |
| SEO | 80 |

### 11.2. Типові зауваження й виправлення

| Зауваження | Виправлення |
|---|---|
| Image elements do not have `[alt]` | додати `alt` |
| Background/foreground contrast | збільшити контраст до 4.5:1 |
| Form elements do not have labels | `<label for>` |
| Links do not have discernible name | текст або `aria-label` |
| Heading elements not in order | виправити ієрархію |
| `[lang]` missing | `<html lang="uk">` |
| Image elements no explicit width/height | додати атрибути |
| Properly size images | адаптивні зображення |
| Eliminate render-blocking resources | `defer`, критичний CSS |

### 11.3. Ручна перевірка

Автоматика ловить 30–40% проблем. Обов'язково пройдіть:

1. **Лише клавіатурою:** `Tab` через усю сторінку. Видно фокус? Логічний
   порядок? Модальне вікно не «випускає» фокус? `Escape` закриває?
2. **Зі збільшенням 200%:** нічого не обрізається, немає горизонтальної
   прокрутки.
3. **З екранним читачем:** VoiceOver (`Cmd+F5`) або NVDA. Пройдіть форму —
   чи озвучуються підписи й помилки?
4. **На реальному телефоні**, а не лише в Device Mode.
5. **З вимкненою мережею:** зрозуміле повідомлення, а не «біла сторінка».

### 11.4. Продуктивність

```bash
npm run build
npx vite-bundle-visualizer
```

Типові знахідки й дії: величезна бібліотека дат заради однієї функції
(замінити на `Intl.DateTimeFormat`); увесь набір іконок замість кількох
(імпортувати вибірково); незжаті зображення (WebP/AVIF, `Squoosh`).

---

## 12. Чек-лист здачі Завдання №5

**Функціональність**
- [ ] Список із пагінацією, пошуком (debounce), фільтрами (3+), сортуванням
- [ ] Стан списку в query-параметрах, відновлюється за посиланням
- [ ] Створення, редагування, видалення з підтвердженням
- [ ] Сторінка деталей зі зв'язаною сутністю
- [ ] Довідник другої сутності
- [ ] Вхід, захищені маршрути, ролі USER/ADMIN
- [ ] Обробка 401: очищення токена й редірект

**Сервер**
- [ ] Усі ендпоінти з коректними кодами й `Location` при 201
- [ ] Фільтрація, сортування, пагінація **у SQL**
- [ ] Відповідь списку містить `data`, `total`, `limit`, `offset`
- [ ] Валідація тіла й query-параметрів
- [ ] JWT, ролі, хешовані паролі
- [ ] Єдиний формат помилок без стеку
- [ ] Міграції + seed на 200+ записів
- [ ] Індекси на полях пошуку й зовнішніх ключах
- [ ] OpenAPI зі Swagger UI

**Інтерфейс**
- [ ] Чотири стани: завантаження, помилка, порожньо, дані
- [ ] Mobile first, коректно від 320 px, три різні макети
- [ ] Lighthouse Accessibility ≥ 90
- [ ] Немає помилок у консолі

**Розгортання**
- [ ] Клієнт доступний за публічним HTTPS-URL
- [ ] Сервер доступний за публічним HTTPS-URL
- [ ] Керована PostgreSQL із застосованими міграціями
- [ ] Swagger UI доступний публічно
- [ ] SPA-fallback налаштований
- [ ] CORS — конкретний домен
- [ ] Адреса API зі змінної середовища

**Документація**
- [ ] `README` з описом, ER-діаграмою, таблицею ендпоінтів
- [ ] Інструкція локального запуску «з нуля»
- [ ] Тестові облікові записи USER і ADMIN
- [ ] Скриншоти трьох макетів і звіту Lighthouse
- [ ] Розділ «Використання ШІ»

**Демонстрація (7–10 хв)**
- [ ] Вхід → пошук і фільтри → створення → редагування → видалення
- [ ] Мобільний макет через DevTools
- [ ] Поведінка при 401 і 403
- [ ] Готовність пояснити **будь-який** рядок коду

---

## 13. Підсумки курсу

### 13.1. Шлях, який ви пройшли

| Завдання | Що з'явилося | Ключова навичка |
|---|---|---|
| №1 Портфоліо | HTML + CSS, mobile first | Семантика, адаптивність, доступність |
| №2 Стікери | JavaScript, DOM, події | Стан окремо від DOM, події вказівника |
| №3 SPA | React, Context, Reducer | Декларативний інтерфейс, керування станом |
| №4 REST API | Node.js, Express, PostgreSQL | Шарова архітектура, безпека, SQL |
| №5 Fullstack | Інтеграція, розгортання | Система цілком, продакшен |

### 13.2. Наскрізні принципи

Ці ідеї повторювалися в кожній лекції — і повторюватимуться в кожному
проєкті вашої кар'єри:

1. **Розділення відповідальності.** HTML — структура, CSS — вигляд,
   JS — поведінка. Контролер — HTTP, сервіс — логіка, репозиторій — дані.
2. **Одне джерело істини.** Стан визначає інтерфейс, а не навпаки. Дублювання
   даних породжує розсинхронізацію.
3. **Ніколи не довіряйте клієнту.** Валідація на сервері обов'язкова,
   параметризовані запити обов'язкові, перевірка прав на сервері обов'язкова.
4. **Доступність — не додаткова функція.** Семантичний HTML, контраст, фокус,
   клавіатура — це базовий рівень якості.
5. **Явне краще за неявне.** Явні залежності, явні коди помилок, явні
   конфігурації.
6. **Спочатку зрозуміло, потім швидко.** Оптимізація без вимірювання — марна
   робота.
7. **Помилки — частина інтерфейсу.** Чотири стани запиту, зрозумілі
   повідомлення, можливість повторити.

### 13.3. Чого ми свідомо не торкалися

Щоб ви розуміли межі курсу:

- **TypeScript** — стандарт індустрії; наступний крок після цього курсу;
- **SSR і Next.js** — серверний рендеринг, SEO, серверні компоненти;
- **Тестування інтерфейсу** — Playwright, повне E2E;
- **WebSocket і real-time** — буде в курсі «Проєктування web застосунків»;
- **GraphQL** — там само;
- **Мікросервіси, черги, кешування в Redis** — там само;
- **Docker і Kubernetes** глибоко, IaC, моніторинг;
- **Продуктивність глибоко** — Core Web Vitals, профілювання, віртуалізація;
- **Дизайн-системи, анімації, WebGL**.

---

## 14. Куди рухатися далі

### 14.1. Найближчі кроки (наступні 3–6 місяців)

**1. TypeScript.** Найбільша віддача на вкладений час. Типи ловлять
цілий клас помилок до запуску й роблять рефакторинг безпечним.
→ [Effective TypeScript, 2nd ed.](https://www.oreilly.com/library/view/effective-typescript-2nd/9781098155056/),
[typescript-eslint](https://typescript-eslint.io/).

**2. Тестування.** Vitest + Testing Library на клієнті, Vitest/node:test +
supertest на сервері. Уміння писати тести відрізняє джуніора від мідла
швидше, ніж знання ще одного фреймворку.

**3. Git у команді.** Гілки, pull request'и, код-рев'ю, вирішення конфліктів,
`rebase`. Спробуйте попрацювати над спільним проєктом удвох-утрьох.

**4. Свій проєкт.** Не туторіал, а **власна** ідея, доведена до
розгорнутого стану. Це найкращий рядок у резюме й найкращий матеріал для
співбесіди.

### 14.2. Далі

| Напрям | Технології | Навіщо |
|---|---|---|
| **Frontend глибше** | Next.js, серверні компоненти, TanStack Query, Zustand | сучасний промисловий стек |
| **Backend глибше** | NestJS, Prisma/Drizzle, Redis, черги | архітектура складних систем |
| **DevOps** | Docker, CI/CD, Terraform, моніторинг | те, що робить систему працездатною |
| **Мобільна розробка** | React Native | ваш React переноситься майже цілком |
| **Тестування** | Playwright, Testing Library | якість як професія |
| **Доступність** | WCAG, ARIA, аудити | недооцінена й потрібна спеціалізація |

### 14.3. Наступний курс

**«Проєктування web застосунків»** (6-й семестр) продовжує саме там, де ми
зупинилися, але на іншій платформі:

| Що ви робили тут | Що буде там |
|---|---|
| Express + `pg` | Spring Boot + JDBC |
| Ручна валідація й помилки | Bean Validation, `@RestControllerAdvice` |
| JWT у middleware | JWT + Spring AOP + власні анотації |
| Тести supertest | JUnit, Mockito, MockMvc, Testcontainers |
| React | Angular |
| — | Реактивне програмування, GraphQL, WebSocket |
| Розгортання на Render | AWS / Azure / GCP, мікросервіси |

🔑 Головна цінність цього курсу — **не конкретні бібліотеки**. React і Express
колись застаріють. Не застаріють: розуміння HTTP, уміння проєктувати API,
відчуття, де має жити стан, звичка не довіряти вхідним даним і думати про
людину, яка користуватиметься вашим інтерфейсом.

### 14.4. Як не відстати

- **Читайте першоджерела:** MDN, react.dev, документація Node.js — не блоги
  трирічної давнини.
- **Слідкуйте за Baseline** ([web.dev/baseline](https://web.dev/baseline)) —
  що вже безпечно застосовувати.
- **Читайте чужий код.** Відкрийте будь-який популярний репозиторій на GitHub
  і подивіться, як там влаштована структура.
- **Пишіть.** Конспект, стаття, README — пояснення іншим виявляє прогалини
  краще за будь-який тест.
- **Не женіться за кожним новим фреймворком.** Фундамент змінюється повільно.

---

## 15. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Немає SPA-fallback | 404 при прямому URL | `_redirects` / `404.html` |
| 2 | Адреса API зашита в код | Продакшен звертається до `localhost` | `VITE_API_URL` |
| 3 | Секрет у клієнтській збірці | Витік (усе видно) | Секрети лише на сервері |
| 4 | `CORS_ORIGIN` зі слешем у кінці | CORS не працює | Без слеша |
| 5 | Жорстко зашитий порт | Платформа не може запустити | `process.env.PORT` |
| 6 | `app.listen(port, 'localhost')` | Недоступно ззовні контейнера | `'0.0.0.0'` |
| 7 | Немає `trust proxy` | Rate limit блокує всіх | `app.set('trust proxy', 1)` |
| 8 | Немає SSL для керованої бази | Не підключається | `ssl: { rejectUnauthorized: false }` |
| 9 | Міграції запущені вручну один раз | Чисте середовище без схеми | У команді `start` |
| 10 | `NUMERIC` як рядок на клієнті | Ламається сортування | Приведення в мапері |
| 11 | Не перевірено `npm run preview` | Помилки лише в продакшені | Перевіряти збірку локально |
| 12 | Немає попередження про холодний старт | На захисті «нічого не працює» | Прогріти перед демонстрацією |
| 13 | `.env` потрапив у git | Компрометація секретів | `.gitignore` від початку |
| 14 | Один коміт «final» | Немає історії роботи | Регулярні осмислені коміти |
| 15 | `README` без інструкції запуску | Проєкт неможливо відтворити | Покрокова інструкція |

---

## 16. Контрольні запитання

1. Чому клієнт і сервер розгортаються окремо? Які переваги це дає?
2. Чому змінні `VITE_*` не можуть містити секретів?
3. Опишіть повний потік автентифікації від форми входу до захищеного запиту.
4. Що таке SPA-fallback і чому без нього пряме відкриття URL дає 404?
5. Чому `CORS_ORIGIN` не повинен мати завершального слеша?
6. Навіщо `app.listen(port, '0.0.0.0')` у контейнері?
7. Навіщо `trust proxy` за балансувальником?
8. Чому міграції мають запускатися командою `start`, а не вручну?
9. Чому PostgreSQL повертає `NUMERIC` рядком і що з цим робити?
10. Що дає багатоетапна збірка Docker-образу?
11. Що перевіряє CI і чому це варто робити до розгортання?
12. Які п'ять ручних перевірок доступності обов'язкові?
13. Чому `npm run preview` виявляє помилки, яких немає в `npm run dev`?
14. Назвіть три наскрізні принципи курсу й поясніть кожен прикладом.
15. Що з вивченого залишиться актуальним через десять років?

---

## 17. Корисні посилання

### Розгортання

- [Netlify Docs](https://docs.netlify.com/) — зокрема
  [Redirects](https://docs.netlify.com/routing/redirects/).
- [Vercel Docs](https://vercel.com/docs) —
  [Project Configuration](https://vercel.com/docs/project-configuration).
- [Render Docs](https://render.com/docs) — веб-сервіси й PostgreSQL.
- [Railway Docs](https://docs.railway.app/) · [Fly.io](https://fly.io/docs/).
- [Neon](https://neon.tech/docs) · [Supabase](https://supabase.com/docs).
- [Vite: Building for Production](https://vite.dev/guide/build.html) та
  [Deploying a Static Site](https://vite.dev/guide/static-deploy.html).

### Docker і CI/CD

- [Docker: Node.js best practices](https://docs.docker.com/guides/nodejs/).
- [Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/).
- [GitHub Actions Documentation](https://docs.github.com/en/actions).

### Якість

- [web.dev: Core Web Vitals](https://web.dev/articles/vitals).
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview/).
- [WCAG 2.2 Quick Reference](https://www.w3.org/WAI/WCAG22/quickref/).
- [The A11Y Project Checklist](https://www.a11yproject.com/checklist/).
- [axe DevTools](https://www.deque.com/axe/devtools/) ·
  [WAVE](https://wave.webaim.org/).

### Що вчити далі

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html).
- [Next.js Learn](https://nextjs.org/learn).
- [TanStack Query](https://tanstack.com/query/latest).
- [Testing Library](https://testing-library.com/) ·
  [Playwright](https://playwright.dev/).
- [roadmap.sh: Frontend](https://roadmap.sh/frontend) та
  [Backend](https://roadmap.sh/backend) — карти напрямів (орієнтир, не
  обов'язковий список).
- [Frontend Masters Learning Paths](https://frontendmasters.com/learn/).
- [JavaScript Weekly](https://javascriptweekly.com/) ·
  [Node Weekly](https://nodeweekly.com/) ·
  [Frontend Focus](https://frontendfoc.us/) — розсилки, щоб не відстати.

---

## 18. Література

1. **Wiggins, A.** *The Twelve-Factor App.* —
   [12factor.net](https://12factor.net/) — 12 принципів створення застосунків,
   придатних до розгортання. Читається за годину, актуальне назавжди.
2. **Buna, S.** *Efficient Node.js.* — O'Reilly, 2025. — Підготовка Node.js
   до продакшену.
3. **Vanderkam, D.** *Effective TypeScript.* 2nd ed. — O'Reilly, 2024. —
   Ваш наступний крок після цього курсу.
4. **Beyer, B. та ін.** *Site Reliability Engineering.* — O'Reilly, 2016. —
   Як підтримувати системи в робочому стані;
   [безкоштовно онлайн](https://sre.google/books/).
5. **Firth, A.** *Practical Web Accessibility.* 2nd ed. — Apress, 2024. —
   Доступність як професійна навичка.
6. **Martin, R. C.** *Clean Architecture.* — Prentice Hall, 2017. —
   Про межі, шари й напрямок залежностей. Ідеї, що переживуть будь-який
   фреймворк.

---

## 19. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Розгортання | deployment | Публікація застосунку в робочому середовищі |
| Продакшен | production | Робоче середовище з реальними користувачами |
| Збірка | build | Перетворення вихідного коду на артефакт |
| Артефакт | artifact | Результат збірки (`dist/`, образ) |
| Статичний хостинг | static hosting | Роздача готових файлів |
| Мережа доставки вмісту | CDN | Роздача з найближчого до користувача вузла |
| Запасний маршрут SPA | SPA fallback | Віддача `index.html` для всіх шляхів |
| Холодний старт | cold start | Затримка першого запиту після простою |
| Керована база | managed database | База як сервіс, без адміністрування |
| Контейнер | container | Ізольоване середовище виконання |
| Багатоетапна збірка | multi-stage build | Образ без інструментів збірки |
| Безперервна інтеграція | continuous integration | Автоматична перевірка при кожному push |
| Безперервне постачання | continuous delivery | Автоматичне розгортання |
| Змінна середовища | environment variable | Конфігурація поза кодом |
| Зворотний проксі | reverse proxy | Посередник перед сервером застосунку |
| Аудит | audit | Перевірка за набором критеріїв |

---

**Попередня:** [Лекція 15. Node.js: якість, надійність і документація API](15-nodejs-quality-testing-openapi.md)

[← До змісту курсу](README.md)

---

**Дякую за роботу протягом семестру. Успіхів у розробці!**
