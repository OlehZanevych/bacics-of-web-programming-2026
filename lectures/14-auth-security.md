# Лекція 14. Автентифікація, авторизація та безпека

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язані завдання:** №4, №5
> **Попередня лекція:** [Лекція 13](13-rest-api-postgresql.md)

---

## Про що ця лекція

Безпека — не окрема «функція», яку додають наприкінці. Це наскрізна
властивість застосунку, і кожна помилка тут коштує дорожче за будь-який
візуальний недолік: витік бази користувачів або викрадений обліковий запис
не «виправляється патчем».

Ця лекція охоплює два тісно пов'язані питання — **хто ви** (автентифікація) і
**що вам можна** (авторизація) — та найпоширеніші вразливості веб-застосунків.

---

## Зміст

1. [Автентифікація й авторизація](#1-автентифікація-й-авторизація)
2. [Зберігання паролів](#2-зберігання-паролів)
3. [Сесії проти токенів](#3-сесії-проти-токенів)
4. [JWT: будова](#4-jwt-будова)
5. [Реалізація автентифікації](#5-реалізація-автентифікації)
6. [Middleware перевірки токена](#6-middleware-перевірки-токена)
7. [Ролі та права](#7-ролі-та-права)
8. [Оновлення токена](#8-оновлення-токена)
9. [Де зберігати токен на клієнті](#9-де-зберігати-токен-на-клієнті)
10. [CORS](#10-cors)
11. [OWASP Top 10 для нашого застосунку](#11-owasp-top-10-для-нашого-застосунку)
12. [Захисні заголовки](#12-захисні-заголовки)
13. [Обмеження частоти запитів](#13-обмеження-частоти-запитів)
14. [Секрети й конфігурація](#14-секрети-й-конфігурація)
15. [Логування й безпека](#15-логування-й-безпека)
16. [Чек-лист безпеки](#16-чек-лист-безпеки)
17. [Типові помилки](#17-типові-помилки)
18. [Контрольні запитання](#18-контрольні-запитання)
19. [Практичні вправи](#19-практичні-вправи)
20. [Корисні посилання](#20-корисні-посилання)
21. [Література](#21-література)
22. [Глосарій](#22-глосарій)

---

## 1. Автентифікація й авторизація

| | Автентифікація (AuthN) | Авторизація (AuthZ) |
|---|---|---|
| Питання | **Хто ви?** | **Що вам можна?** |
| Коли | один раз при вході | при кожній дії |
| Код HTTP при відмові | **401** Unauthorized | **403** Forbidden |
| Приклад | перевірка логіна й пароля | «видаляти може лише адміністратор» |

⚠️ Назва `401 Unauthorized` історично невдала: насправді це
*unauthenticated* — «я не знаю, хто ви». А `403 Forbidden` — «я знаю, хто ви,
і вам не можна».

```
Запит без токена            → 401
Запит із недійсним токеном  → 401
Запит із простроченим       → 401
Роль USER до /admin         → 403
Роль USER видаляє чужий запис → 403
```

---

## 2. Зберігання паролів

🔑 **Пароль ніколи не зберігається у відкритому вигляді. Ніколи. Ні за яких
обставин.** Навіть у навчальному проєкті, навіть «тимчасово».

### 2.1. Чому звичайного хешування недостатньо

```js
// ❌ Недостатньо: SHA-256 створений бути ШВИДКИМ
crypto.createHash('sha256').update(password).digest('hex');
```

Сучасна відеокарта обчислює мільярди SHA-256 за секунду. Пароль на 8 символів
підбирається за години. Плюс однакові паролі дають однакові хеші — можна
скористатися готовими «райдужними таблицями».

Потрібен алгоритм, спеціально створений **повільним** і з **сіллю** —
випадковим значенням для кожного пароля.

### 2.2. bcrypt

```bash
npm install bcrypt
```

```js
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;                      // 2^12 ітерацій

// Реєстрація
const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
// $2b$12$LQv3c1yqBWVHxkd0LHAkCO.EuZ9V5kJ8kZ6X8...
//  │   │  └─ сіль + хеш
//  │   └──── вартість (12)
//  └──────── версія алгоритму

// Вхід
const isValid = await bcrypt.compare(password, user.password_hash);
```

Сіль генерується автоматично і зберігається **всередині** хеша — окреме поле в
базі не потрібне.

**Вибір вартості:** 12 — розумний баланс у 2026 році (≈250 мс на сучасному
процесорі). Більше — безпечніше, але повільніше; менше — швидше, але
вразливіше. Перевірте на своєму обладнанні й підберіть так, щоб хешування
займало 200–500 мс.

⚠️ bcrypt мовчки обрізає паролі, довші за **72 байти**. Якщо дозволяєте довгі
паролі — попередньо хешуйте їх SHA-256, або використовуйте argon2.

### 2.3. argon2

Переможець Password Hashing Competition (2015), рекомендований OWASP:

```bash
npm install argon2
```

```js
import argon2 from 'argon2';

const hash = await argon2.hash(password, { type: argon2.argon2id });
const isValid = await argon2.verify(hash, password);
```

`argon2id` стійкіший до атак на спеціалізованому обладнанні (GPU, ASIC), бо
вимагає багато **пам'яті**, а не лише обчислень.

🔑 Обидва варіанти прийнятні для Завдання №4. bcrypt простіший у встановленні,
argon2 — сучасніший.

### 2.4. Вимоги до пароля

Сучасна рекомендація NIST — **довжина важливіша за складність**:

```js
export const passwordRules = [
  (v) => (!v ? 'Пароль обов\'язковий' : null),
  (v) => (v.length < 8 ? 'Мінімум 8 символів' : null),
  (v) => (v.length > 128 ? 'Максимум 128 символів' : null),
  (v) => (!/[a-zA-Zа-яА-ЯіїєґІЇЄҐ]/.test(v) ? 'Має містити літеру' : null),
  (v) => (!/\d/.test(v) ? 'Має містити цифру' : null),
];
```

⚠️ Не змушуйте вигадувати «щонайменше один спецсимвол, велику літеру й
не більше двох однакових підряд». Це призводить до `Password1!` у всіх
користувачів. Краще: більша мінімальна довжина, перевірка за списком
скомпрометованих паролів, підтримка менеджерів паролів (`autocomplete`).

⚠️ **Ніколи не обмежуйте максимальну довжину до 20 символів** і не забороняйте
пробіли — це прямо шкодить безпеці.

---

## 3. Сесії проти токенів

### 3.1. Сесії з cookie

```
Вхід → сервер створює сесію, зберігає в пам'яті/Redis/БД
     → надсилає cookie з ідентифікатором сесії
Запит → браузер автоматично шле cookie
     → сервер шукає сесію за id
```

| Плюси | Мінуси |
|---|---|
| Можна миттєво відкликати | Сервер має зберігати стан |
| `httpOnly` cookie недоступна з JS | Складніше масштабувати |
| Менший обсяг передавання | Потрібен захист від CSRF |

### 3.2. Токени (JWT)

```
Вхід → сервер створює підписаний токен, НІЧОГО не зберігає
     → віддає токен клієнту
Запит → клієнт шле Authorization: Bearer <token>
     → сервер перевіряє підпис
```

| Плюси | Мінуси |
|---|---|
| Сервер без стану, легко масштабувати | **Неможливо відкликати до закінчення терміну** |
| Зручно для мобільних і SPA | Більший обсяг |
| Один токен для кількох сервісів | Ризик зберігання на клієнті |

🔑 **Найважливіше обмеження JWT:** виданий токен дійсний до `exp`, і
«вилогінити» користувача миттєво неможливо. Обхідні шляхи: короткий термін
життя (15 хвилин), чорний список відкликаних `jti`, зміна секрету (розлогінить
усіх).

⚠️ JWT часто обирають «бо модно», хоча для класичного вебзастосунку з одним
сервером сесії простіші й безпечніші. У Завданні №4 використовуємо JWT, бо це
типовий підхід для SPA + API і бо цього вимагає завдання.

---

## 4. JWT: будова

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MiIsInJvbGUiOiJBRE1JTiJ9.SflKxwRJ...
└──────────── header ──────────────┘ └────────── payload ──────────┘ └─ signature ─┘
```

Три частини у Base64URL, розділені крапками.

**Header:**
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload (claims):**
```json
{
  "sub": "42",                  // subject — ідентифікатор користувача
  "role": "ADMIN",
  "iat": 1756713600,            // issued at
  "exp": 1756717200,            // expiration
  "jti": "a1b2c3d4"             // унікальний id токена
}
```

**Signature:**
```
HMACSHA256(base64url(header) + "." + base64url(payload), secret)
```

### 4.1. Критично важливо розуміти

🔑 **Payload НЕ зашифрований — він лише закодований Base64.** Будь-хто може
його прочитати: скопіюйте свій токен на [jwt.io](https://jwt.io/) і
переконайтеся самі.

Наслідки:

- **ніколи не кладіть у payload** паролі, номери карток, персональні дані;
- підпис гарантує лише те, що токен **не змінювали**, а не таємність;
- не кладіть у токен великі об'єкти — він передається з кожним запитом.

### 4.2. Атака `alg: none`

Історична вразливість багатьох бібліотек: зловмисник змінює заголовок на
`{"alg":"none"}`, прибирає підпис — і наївна реалізація приймає токен.

```js
// ✅ Завжди вказуйте очікуваний алгоритм явно
jwt.verify(token, secret, { algorithms: ['HS256'] });
```

### 4.3. Секрет

```bash
# Згенерувати надійний секрет
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

⚠️ Секрет має бути **не менш ніж 256 біт** (32 байти) випадкових даних. Рядок
`"secret"` чи `"myapp2026"` підбирається за секунди — і тоді будь-хто може
підписати токен із роллю `ADMIN`.

---

## 5. Реалізація автентифікації

### 5.1. Таблиця користувачів

```js
// міграція
export const up = (pgm) => {
  pgm.createTable('users', {
    id: 'id',
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    display_name: { type: 'varchar(120)', notNull: true },
    role: { type: 'varchar(20)', notNull: true, default: 'USER' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('users', 'users_role_check', {
    check: "role IN ('USER', 'ADMIN')",
  });

  pgm.createIndex('users', 'email');
};
```

### 5.2. Сервіс токенів

```js
// src/services/token.service.js
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config/index.js';
import { UnauthorizedError } from '../errors/index.js';

export function generateToken(user) {
  return jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
      jti: crypto.randomUUID(),
    },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      expiresIn: config.jwtExpiresIn,        // '30m'
      issuer: 'movies-api',
    }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],                  // ← захист від alg: none
      issuer: 'movies-api',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Термін дії токена вичерпано');
    }
    throw new UnauthorizedError('Недійсний токен');
  }
}
```

### 5.3. Сервіс автентифікації

```js
// src/services/auth.service.js
import bcrypt from 'bcrypt';
import * as usersRepository from '../repositories/users.repository.js';
import { generateToken } from './token.service.js';
import { ConflictError, UnauthorizedError } from '../errors/index.js';

const SALT_ROUNDS = 12;

export async function signUp({ email, password, displayName }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await usersRepository.findByEmail(normalizedEmail);
  if (existing) throw new ConflictError('Користувач із такою поштою вже існує');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await usersRepository.create({
    email: normalizedEmail,
    passwordHash,
    displayName,
    role: 'USER',                    // ⚠️ роль НІКОЛИ не береться з запиту!
  });

  return { user: toPublicUser(user), token: generateToken(user) };
}

export async function signIn({ email, password }) {
  const user = await usersRepository.findByEmail(email.trim().toLowerCase());

  // Однакове повідомлення в обох випадках — не підказуємо, чи існує пошта
  if (!user) {
    await bcrypt.hash(password, SALT_ROUNDS);   // вирівнюємо час відповіді
    throw new UnauthorizedError('Невірна пошта або пароль');
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new UnauthorizedError('Невірна пошта або пароль');

  if (!user.is_active) throw new UnauthorizedError('Обліковий запис заблоковано');

  return { user: toPublicUser(user), token: generateToken(user) };
}

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name,
    role: user.role,
  };
  // password_hash НЕ потрапляє назовні НІКОЛИ
}
```

🔑 Три деталі, які легко пропустити:

1. **Роль ніколи не береться з тіла запиту.** Інакше будь-хто зареєструється
   як `ADMIN`.
2. **Однакове повідомлення** для «немає такої пошти» й «невірний пароль».
   Різні повідомлення дозволяють перебором з'ясувати, які адреси
   зареєстровані.
3. **Вирівнювання часу відповіді.** Без фіктивного хешування запит для
   неіснуючого користувача повертається помітно швидше — це теж витік
   інформації (timing attack).

### 5.4. Ендпоінти

```js
// src/routes/auth.routes.js
const router = Router();

router.post('/sign-up', validate(signUpSchema), controller.signUp);
router.post('/sign-in', validate(signInSchema), controller.signIn);
router.post('/refresh-token', authenticate, controller.refresh);
router.get('/me', authenticate, controller.me);

export default router;
```

```js
export async function signUp(req, res) {
  const result = await service.signUp(req.validatedBody);
  res.status(201).json(result);
}

export async function signIn(req, res) {
  const result = await service.signIn(req.validatedBody);
  res.set('Authorization', `Bearer ${result.token}`);   // вимога Завдання №4
  res.json(result);
}
```

---

## 6. Middleware перевірки токена

```js
// src/middlewares/auth.js
import { verifyToken } from '../services/token.service.js';
import { UnauthorizedError, ForbiddenError } from '../errors/index.js';

export function authenticate(req, res, next) {
  const header = req.get('Authorization');

  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Потрібна автентифікація'));
  }

  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
}

/** Не вимагає токена, але додає користувача, якщо він є */
export function optionalAuth(req, res, next) {
  const header = req.get('Authorization');
  if (!header?.startsWith('Bearer ')) return next();

  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role };
  } catch { /* мовчки ігноруємо */ }

  next();
}
```

🔑 Перевірка токена **в одному middleware**, а не в кожному контролері — пряма
вимога Завдання №4. Дублювання логіки автентифікації неминуче призводить до
того, що десь її забудуть.

---

## 7. Ролі та права

### 7.1. Перевірка ролі

```js
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

```js
router.get('/',       controller.list);                                    // публічно
router.post('/',      authenticate, controller.create);                     // будь-хто авторизований
router.delete('/:id', authenticate, requireRole('ADMIN'), controller.remove); // лише адмін
```

### 7.2. Право на власний ресурс

Часто потрібне складніше правило: «редагувати може автор **або** адміністратор».
Це вже бізнес-логіка, тому вона в **сервісі**, а не в middleware:

```js
export async function update(id, data, currentUser) {
  const movie = await repository.findById(id);
  if (!movie) throw new NotFoundError('Фільм');

  const isOwner = String(movie.created_by) === String(currentUser.id);
  const isAdmin = currentUser.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError('Ви можете редагувати лише власні записи');
  }

  return toMovieResponse(await repository.update(id, data));
}
```

⚠️ **Broken Access Control — вразливість №1 в OWASP Top 10.** Найтиповіший її
прояв: перевірка є в інтерфейсі (кнопку приховано), але немає на сервері.
Зловмисник просто надішле запит через Postman.

🔑 **Правило:** усе, що приховано в UI, має бути **також** заборонено на
сервері. Клієнтські перевірки — це зручність, а не безпека.

---

## 8. Оновлення токена

Токен із коротким терміном життя безпечніший, але змушує часто входити.
Розв'язання — оновлення.

```js
// Спрощений варіант (достатній для Завдання №4):
// один токен, який можна обміняти на новий, поки старий ще дійсний
export async function refresh(req, res) {
  const user = await usersRepository.findById(req.user.id);
  if (!user || !user.is_active) throw new UnauthorizedError();

  const token = generateToken(user);
  res.set('Authorization', `Bearer ${token}`);
  res.json({ token, user: toPublicUser(user) });
}
```

**Повноцінна схема** (для реальних проєктів):

| | Access token | Refresh token |
|---|---|---|
| Термін життя | 15 хвилин | 7–30 днів |
| Де зберігається | пам'ять / `localStorage` | `httpOnly` cookie |
| Що дає | доступ до API | лише отримання нового access |
| Зберігається на сервері | ні | так (можна відкликати) |

Із такою схемою викрадений access-токен «живе» 15 хвилин, а refresh можна
відкликати з бази.

**Ротація refresh-токенів:** при кожному оновленні старий refresh стає
недійсним. Якщо надійшов уже використаний refresh — це ознака крадіжки, і всі
сесії користувача варто скинути.

---

## 9. Де зберігати токен на клієнті

| Місце | XSS | CSRF | Зручність |
|---|---|---|---|
| `localStorage` | ❌ вразливо | ✅ захищено | висока |
| `sessionStorage` | ❌ вразливо | ✅ захищено | висока |
| Змінна в пам'яті | ✅ краще | ✅ захищено | губиться при перезавантаженні |
| `httpOnly` cookie | ✅ захищено | ❌ потрібен захист | автоматично надсилається |

🔑 **Ідеального варіанта немає — це компроміс.**

- `localStorage`: будь-який скрипт на сторінці (зокрема впроваджений через XSS
  чи скомпрометовану залежність з npm) прочитає токен.
- `httpOnly` cookie: JavaScript до неї не дістанеться, але браузер надсилає її
  автоматично — звідси ризик CSRF, який лікується `SameSite=Lax/Strict` і
  CSRF-токенами.

Найбезпечніша сучасна схема: **access у пам'яті + refresh у `httpOnly` cookie
з `SameSite=Strict`**.

⚠️ Завдання №4 і №5 вимагають `localStorage` — це свідоме спрощення для
навчання. У `README` варто зазначити, що ви розумієте компроміс.

```js
// Cookie з усіма запобіжниками
res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: config.isProduction,     // лише HTTPS
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth/refresh-token',
});
```

---

## 10. CORS

```js
import cors from 'cors';

app.use(cors({
  origin: config.corsOrigin,               // ['http://localhost:5173', 'https://app.example.com']
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Authorization', 'X-Total-Count'],   // щоб клієнт їх бачив
  maxAge: 86400,                                        // кешувати preflight на добу
}));
```

⚠️ **Три поширені помилки:**

1. `origin: '*'` у продакшені — будь-який сайт може звертатися до вашого API
   від імені користувача.
2. `origin: '*'` разом із `credentials: true` — **не працює за
   специфікацією**; браузер відхилить відповідь.
3. Забути `exposedHeaders` — клієнт не побачить `Authorization` чи
   `X-Total-Count`, хоча вони надіслані. За замовчуванням браузер відкриває
   JavaScript лише кілька «простих» заголовків.

🔑 **CORS — захист браузера, а не сервера.** З `curl` чи Postman запит пройде
без обмежень. CORS не замінює автентифікації.

---

## 11. OWASP Top 10 для нашого застосунку

| № | Категорія | Що це означає в нашому проєкті |
|---|---|---|
| **A01** | Broken Access Control | Перевірка прав лише в UI; можливість змінити чужий запис за `id` |
| **A02** | Cryptographic Failures | Пароль у відкритому вигляді; слабкий секрет JWT; HTTP замість HTTPS |
| **A03** | Injection | SQL-ін'єкція через склеювання рядків; XSS через `innerHTML` |
| **A04** | Insecure Design | Немає обмеження частоти; необмежений `limit`; немає валідації |
| **A05** | Security Misconfiguration | `cors: '*'`; стек викликів у відповіді; налагоджувальні маршрути в продакшені |
| **A06** | Vulnerable Components | Застарілі залежності; `npm audit` не запускається |
| **A07** | Identification & Auth Failures | Слабкі паролі; немає блокування після невдалих спроб; довгі токени |
| **A08** | Data Integrity Failures | Довіра до даних клієнта (роль у запиті); незахищений процес збірки |
| **A09** | Logging & Monitoring Failures | Немає логів входів; паролі в логах |
| **A10** | Server-Side Request Forgery | Сервер завантажує URL, наданий користувачем, без перевірки |

### 11.1. Найважливіші для Завдання №4

**A03 — Injection.** Розібрано в лекції 13: параметризовані запити й білий
список полів сортування. Це найдешевша й найважливіша перемога.

**A01 — Broken Access Control.** Кожен захищений маршрут має middleware; кожна
операція над чужим ресурсом перевіряється в сервісі.

**A02 — Cryptographic Failures.** bcrypt/argon2 для паролів, надійний секрет
JWT, HTTPS у продакшені.

**A05 — Misconfiguration.** `helmet`, конкретний `origin` у CORS, відсутність
стеку у відповідях.

### 11.2. Mass assignment

Окремо варто згадати вразливість, яку легко припустити в Node.js:

```js
// ❌ Клієнт надішле { "title": "…", "role": "ADMIN" } — і стане адміністратором
await repository.update(id, req.body);

// ✅ Явний перелік дозволених полів
const { title, year, description, genreId } = req.validatedBody;
await repository.update(id, { title, year, description, genreId });
```

🔑 Схема валідації (лекція 15), налаштована на **відкидання невідомих полів**,
розв'язує це системно.

---

## 12. Захисні заголовки

```js
import helmet from 'helmet';
app.use(helmet());
```

| Заголовок | Від чого захищає |
|---|---|
| `Content-Security-Policy` | XSS: обмежує, звідки можна завантажувати скрипти |
| `Strict-Transport-Security` | примусовий HTTPS |
| `X-Content-Type-Options: nosniff` | підміна типу вмісту |
| `X-Frame-Options: DENY` | clickjacking (вбудовування у чужий `<iframe>`) |
| `Referrer-Policy` | витік URL у заголовку `Referer` |
| `X-Powered-By` (прибирається) | не розкриваємо стек технологій |

Для API окремо варто вимкнути кешування чутливих відповідей:

```js
app.use('/api/v1/auth', (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
```

---

## 13. Обмеження частоти запитів

```bash
npm install express-rate-limit
```

```js
import rateLimit from 'express-rate-limit';

// Загальне обмеження
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

// Суворе — для автентифікації
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,        // рахуємо лише невдалі спроби
  message: { status: 429, message: 'Забагато спроб входу. Спробуйте через 15 хвилин.' },
});

app.use('/api/', globalLimiter);
app.use('/api/v1/auth/sign-in', authLimiter);
app.use('/api/v1/auth/sign-up', authLimiter);
```

⚠️ За зворотним проксі (Render, Railway, nginx) без `app.set('trust proxy', 1)`
усі запити виглядатимуть як з однієї IP-адреси — обмеження заблокує всіх
одразу.

📚 Для кількох екземплярів сервера потрібне спільне сховище лічильників
(Redis), інакше кожен рахує окремо.

---

## 14. Секрети й конфігурація

```
# .env — НІКОЛИ в git
JWT_SECRET=8f3a…довгий-випадковий-рядок…c91
DATABASE_URL=postgresql://user:pass@host:5432/db
```

```
# .gitignore
.env
.env.local
*.pem
*.key
```

**Правила:**

1. `.env` у `.gitignore` **до першого коміту**.
2. `.env.example` із порожніми значеннями — у git.
3. Секрет генерується випадково, не менш ніж 32 байти.
4. Різні секрети для розробки й продакшену.
5. У продакшені секрети задаються **в панелі платформи**, а не файлом.

⚠️ **Якщо секрет потрапив у git — він скомпрометований назавжди.** Видалення
файлу наступним комітом не допомагає: значення лишається в історії, і його
знайдуть автоматичні сканери (GitHub має вбудований secret scanning). Єдина
правильна реакція — **негайно замінити секрет** і, за потреби, переписати
історію (`git filter-repo`).

---

## 15. Логування й безпека

```js
// ❌ Ніколи не логуйте
console.log('Вхід:', { email, password });
console.log('Токен:', token);
console.log('Тіло запиту:', req.body);          // там може бути пароль

// ✅
logger.info({ userId: user.id, ip: req.ip }, 'Успішний вхід');
logger.warn({ email: maskEmail(email), ip: req.ip }, 'Невдала спроба входу');
```

**Що варто логувати:** успішні й невдалі входи, зміни прав, видалення даних,
спрацювання обмеження частоти, помилки 5xx.

**Чого не можна:** паролі, повні токени, номери карток, персональні дані понад
потрібне, вміст тіла запитів автентифікації.

```js
const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}***@${domain}`;
};
```

Детальніше про структуроване логування — лекція 15.

---

## 16. Чек-лист безпеки

Перед здачею Завдань №4 і №5 пройдіть цей список.

**Паролі й токени**

- [ ] Паролі хешуються bcrypt (12+) або argon2id
- [ ] Пароль не потрапляє у відповідь API **ніде**
- [ ] Секрет JWT ≥ 32 байти випадкових даних, у змінній середовища
- [ ] `jwt.verify` викликається з явним `algorithms: ['HS256']`
- [ ] Термін дії токена обмежений (15–60 хв)
- [ ] Payload не містить чутливих даних
- [ ] Однакове повідомлення для невірної пошти й невірного пароля

**Доступ**

- [ ] Перевірка токена — в одному middleware
- [ ] Кожен маршрут зміни даних захищений
- [ ] 401 і 403 розрізняються правильно
- [ ] Роль **не** береться з тіла запиту при реєстрації
- [ ] Права на чужий ресурс перевіряються на сервері
- [ ] Немає mass assignment (явний перелік полів)

**Введення даних**

- [ ] Усі SQL-запити параметризовані
- [ ] Поле сортування — за білим списком
- [ ] `limit` обмежений зверху
- [ ] Валідація типів і діапазонів на сервері
- [ ] `express.json({ limit: '1mb' })`

**Конфігурація**

- [ ] `.env` у `.gitignore`, є `.env.example`
- [ ] `helmet` увімкнено
- [ ] CORS — конкретні домени, не `*`
- [ ] Обмеження частоти на `/auth`
- [ ] Стек викликів не потрапляє у відповідь у продакшені
- [ ] `npm audit` без критичних вразливостей

**Логування**

- [ ] У логах немає паролів і повних токенів
- [ ] Логуються входи, зміни прав, помилки 5xx

---

## 17. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Пароль у відкритому вигляді | Катастрофа при витоку бази | bcrypt/argon2 |
| 2 | SHA-256 замість bcrypt | Швидкий перебір | Повільний алгоритм із сіллю |
| 3 | Секрет `"secret"` | Будь-хто підпише токен ADMIN | 32+ випадкові байти |
| 4 | Секрет у коді або в git | Компрометація | Змінні середовища |
| 5 | `jwt.verify` без `algorithms` | Атака `alg: none` | Явний перелік |
| 6 | Чутливі дані в payload | Витік (payload читається) | Лише id і роль |
| 7 | Роль із тіла запиту | Самопризначення ADMIN | Роль задає сервер |
| 8 | `password_hash` у відповіді | Витік хешів | Мапер публічного подання |
| 9 | Різні повідомлення для пошти й пароля | Перебір зареєстрованих адрес | Однакове повідомлення |
| 10 | Перевірка прав лише в UI | Обхід через Postman | Перевірка на сервері |
| 11 | Немає перевірки власника ресурсу | Редагування чужих даних | Перевірка в сервісі |
| 12 | `req.body` напряму в `update` | Mass assignment | Явний перелік полів |
| 13 | `cors: '*'` у продакшені | Будь-який сайт звертається до API | Конкретні домени |
| 14 | Немає обмеження частоти на вхід | Перебір паролів | `express-rate-limit` |
| 15 | Немає `trust proxy` за проксі | Обмеження блокує всіх | `app.set('trust proxy', 1)` |
| 16 | Пароль або токен у логах | Витік через систему логування | Маскування |
| 17 | Токен без терміну дії | Довічний доступ при крадіжці | `expiresIn` |
| 18 | HTTP замість HTTPS | Перехоплення токенів | TLS обов'язково |

---

## 18. Контрольні запитання

1. Чим автентифікація відрізняється від авторизації? Які коди їм
   відповідають?
2. Чому SHA-256 не годиться для паролів?
3. Що таке сіль і чому в bcrypt її не треба зберігати окремо?
4. Як обрати вартість (cost) для bcrypt?
5. Назвіть три частини JWT. Яка з них зашифрована?
6. Що можна й чого не можна класти в payload токена?
7. У чому полягає атака `alg: none` і як від неї захиститися?
8. Порівняйте сесії та JWT за трьома критеріями.
9. Чому JWT неможливо відкликати миттєво і які є обхідні шляхи?
10. Чому повідомлення «невірна пошта» і «невірний пароль» мають бути
    однаковими?
11. Навіщо хешувати пароль навіть для неіснуючого користувача?
12. Чому роль не можна брати з тіла запиту при реєстрації?
13. Порівняйте `localStorage` і `httpOnly` cookie для зберігання токена.
14. Чому `cors({ origin: '*', credentials: true })` не працює?
15. Що таке mass assignment і як його уникнути?
16. Чому клієнтське приховування кнопки не є захистом?
17. Що робити, якщо секрет потрапив у git?

---

## 19. Практичні вправи

**Вправа 1 (хешування, 25 хв).** Реалізуйте реєстрацію з bcrypt. Виміряйте
час хешування для вартості 8, 10, 12, 14. Оберіть значення, за якого час
близький до 250 мс, і обґрунтуйте вибір у `README`.

**Вправа 2 (JWT, 35 хв).** Реалізуйте `token.service.js` із генерацією та
перевіркою. Напишіть тести: коректний токен, прострочений
(`expiresIn: '1ms'`), зі зміненим підписом, із неправильним алгоритмом.

**Вправа 3 (розбір токена, 15 хв).** Згенеруйте токен і розберіть його на
[jwt.io](https://jwt.io/) — переконайтеся, що payload читається без секрету.
Спробуйте змінити `role` на `ADMIN` і надіслати запит. Опишіть, що сталося й
чому.

**Вправа 4 (автентифікація, 45 хв).** Реалізуйте `sign-up`, `sign-in`,
`refresh-token`, `me`. Перевірте всі сценарії в Postman: успіх, дублювання
пошти (409), невірний пароль (401), запит без токена (401).

**Вправа 5 (авторизація, 40 хв).** Додайте `authenticate` та
`requireRole('ADMIN')`. Реалізуйте правило «редагувати може автор або
адміністратор». Перевірте: USER не може видалити (403), ADMIN може (204),
USER не може змінити чужий запис (403).

**Вправа 6 (атака, 30 хв).** Спробуйте зламати власний застосунок:
– зареєструватися з `"role": "ADMIN"` у тілі;
– змінити чужий запис, підставивши інший `id`;
– надіслати `{ "title": "x", "isAdmin": true }` в `update`;
– перебрати пароль 50 разів поспіль.
Для кожної спроби опишіть результат і, якщо атака вдалася, — виправлення.

**Вправа 7 (захист, 30 хв).** Додайте `helmet`, CORS із конкретним доменом,
обмеження частоти. Перевірте заголовки відповіді в DevTools і поясніть
призначення кожного.

**Вправа 8 (аудит, 20 хв).** Запустіть `npm audit`. Якщо є вразливості —
опишіть, у якому пакеті, наскільки критичні й що ви зробили.

---

## 20. Корисні посилання

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — обов'язково
  переглянути перед здачею.
- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) —
  специфічно для API.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — зокрема
  [Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
  [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html),
  [JWT for Java](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
  (принципи не залежать від мови),
  [Node.js Security](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html).
- [jwt.io](https://jwt.io/) — розбір токенів, перелік бібліотек.
- [RFC 7519 — JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519).
- [RFC 6750 — Bearer Token Usage](https://www.rfc-editor.org/rfc/rfc6750).
- [MDN: HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Authentication).
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).
- [Have I Been Pwned](https://haveibeenpwned.com/Passwords) — API перевірки
  скомпрометованих паролів (можна вбудувати в реєстрацію).
- [Helmet](https://helmetjs.github.io/) · [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) ·
  [bcrypt](https://github.com/kelektiv/node.bcrypt.js) · [argon2](https://github.com/ranisalt/node-argon2).

---

## 21. Література

1. **OWASP Foundation.** *Top 10* та *Cheat Sheet Series.* — Головне
   практичне джерело з безпеки веб-застосунків. Безкоштовно.
2. **Buna, S.** *Efficient Node.js.* — O'Reilly, 2025. — Розділи про
   надійність і безпеку серверних застосунків.
3. **Brown, E.** *Web Development with Node and Express.* 2nd ed. —
   O'Reilly, 2019. — Розділи про автентифікацію та безпеку.
4. **Stuttard, D., Pinto, M.** *The Web Application Hacker's Handbook.*
   2nd ed. — Wiley, 2011. — Класика: як атакують веб-застосунки. Розуміння
   атак — найкращий спосіб навчитися захищатися.
5. **NIST SP 800-63B.** *Digital Identity Guidelines: Authentication.* —
   Сучасні офіційні рекомендації щодо паролів (зокрема — чому «складність»
   гірша за довжину).

---

## 22. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Автентифікація | authentication | Перевірка особи |
| Авторизація | authorization | Перевірка прав |
| Хешування | hashing | Незворотне перетворення |
| Сіль | salt | Випадкове значення для унікальності хеша |
| Вартість | cost factor | Кількість ітерацій хешування |
| Токен | token | Підписане свідчення про особу |
| Твердження | claim | Поле в payload токена |
| Термін дії | expiration (`exp`) | Момент, після якого токен недійсний |
| Оновлення токена | token refresh | Отримання нового токена |
| Ротація | rotation | Заміна токена при кожному оновленні |
| Відкликання | revocation | Дострокове припинення дії токена |
| Роль | role | Набір прав, наданий користувачеві |
| Порушений контроль доступу | broken access control | Можливість дій без прав |
| Масове призначення | mass assignment | Запис полів, які клієнт не мав змінювати |
| Ін'єкція | injection | Впровадження команд через дані |
| Обмеження частоти | rate limiting | Обмеження кількості запитів |
| Атака за часом | timing attack | Витік інформації через час відповіді |
| Захоплення кліків | clickjacking | Обман через невидимий `<iframe>` |

---

**Попередня:** [Лекція 13. Проєктування REST API та робота з PostgreSQL](13-rest-api-postgresql.md)
**Наступна:** [Лекція 15. Node.js: якість, надійність і документація API](15-nodejs-quality-testing-openapi.md)

[← До змісту курсу](README.md)
