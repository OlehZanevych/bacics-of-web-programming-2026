# Лекція 5. Асинхронний JavaScript та робота з мережею

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язані завдання:** №2 (завершення), №3, №5
> **Попередня лекція:** [Лекція 4](04-dom-events.md)

---

## Про що ця лекція

JavaScript однопотоковий: у нього рівно один потік виконання. Але веб повний
операцій, що тривають довго, — запити до сервера, читання файлів, таймери.
Якби браузер чекав на них, сторінка «замерзала» б.

Розв'язання — **асинхронна модель**: довга операція запускається, потік
звільняється, а результат обробляється, коли він з'явиться. Це найважча для
розуміння частина мови й водночас найважливіша: без неї не працює жоден
сучасний застосунок.

---

## Зміст

1. [Однопотоковість і цикл подій](#1-однопотоковість-і-цикл-подій)
2. [Колбеки та їхні проблеми](#2-колбеки-та-їхні-проблеми)
3. [Проміси](#3-проміси)
4. [`async` / `await`](#4-async--await)
5. [Комбінатори промісів](#5-комбінатори-промісів)
6. [`fetch`: запити до сервера](#6-fetch-запити-до-сервера)
7. [Скасування запитів і тайм-аути](#7-скасування-запитів-і-тайм-аути)
8. [Обробка помилок](#8-обробка-помилок)
9. [Три стани запиту в інтерфейсі](#9-три-стани-запиту-в-інтерфейсі)
10. [CORS](#10-cors)
11. [Робота з REST API](#11-робота-з-rest-api)
12. [Таймери, debounce, throttle](#12-таймери-debounce-throttle)
13. [Типові помилки](#13-типові-помилки)
14. [Контрольні запитання](#14-контрольні-запитання)
15. [Практичні вправи](#15-практичні-вправи)
16. [Корисні посилання](#16-корисні-посилання)
17. [Література](#17-література)
18. [Глосарій](#18-глосарій)

---

## 1. Однопотоковість і цикл подій

### 1.1. Модель

```
┌──────────────────────────────────────────────┐
│                 Головний потік               │
│  ┌────────────────┐                          │
│  │  Стек викликів │  ← виконується ТУТ       │
│  │  (call stack)  │                          │
│  └────────┬───────┘                          │
│           │ порожній?                        │
│           ▼                                  │
│  ┌──────────────────────┐                    │
│  │ Черга МІКРОзадач     │ ← проміси          │
│  │ (microtask queue)    │   спочатку!        │
│  └──────────┬───────────┘                    │
│             ▼                                │
│  ┌──────────────────────┐                    │
│  │ Черга МАКРОзадач     │ ← таймери, події,  │
│  │ (task queue)         │   мережа           │
│  └──────────────────────┘                    │
└──────────────────────────────────────────────┘
         ▲
         │ Web API браузера (таймери, мережа, DOM-події)
         │ працюють ПОЗА головним потоком
```

**Цикл подій (event loop)** працює просто:

1. Виконати весь синхронний код зі стека.
2. Коли стек порожній — виконати **всі** мікрозадачі (і ті, що з'явилися під
   час виконання).
3. Виконати **одну** макрозадачу.
4. Перемалювати сторінку за потреби.
5. Повторити.

### 1.2. Класичне запитання

```js
console.log('1');

setTimeout(() => console.log('2'), 0);

Promise.resolve().then(() => console.log('3'));

queueMicrotask(() => console.log('4'));

console.log('5');
```

**Результат: `1, 5, 3, 4, 2`.**

Пояснення:
- `1` і `5` — синхронний код;
- `3` і `4` — мікрозадачі, виконуються одразу після синхронного коду;
- `2` — макрозадача, після всіх мікрозадач.

🔑 **`setTimeout(fn, 0)` не означає «негайно».** Він означає «постав у чергу
макрозадач; виконається не раніше ніж через 0 мс і лише коли звільниться потік».

### 1.3. Чому блокування — це погано

```js
// ❌ Заблокує сторінку на кілька секунд: не працюватиме прокрутка,
//    кнопки, анімації — узагалі нічого
const start = Date.now();
while (Date.now() - start < 3000) { }
```

Будь-яка синхронна операція тримає головний потік. Тому важкі обчислення
виносять у **Web Workers** (окремий потік), а операції введення-виведення
роблять асинхронними.

---

## 2. Колбеки та їхні проблеми

Історично асинхронність робили через функції зворотного виклику:

```js
function loadUser(id, callback) {
  setTimeout(() => callback(null, { id, name: 'Аня' }), 500);
}

loadUser(1, (error, user) => {
  if (error) return console.error(error);
  console.log(user);
});
```

Домовленість «error-first callback» (перший аргумент — помилка) прийшла з
Node.js і досі трапляється в старих API.

**Проблема — «пекло колбеків»:**

```js
loadUser(1, (err, user) => {
  if (err) return handle(err);
  loadPosts(user.id, (err, posts) => {
    if (err) return handle(err);
    loadComments(posts[0].id, (err, comments) => {
      if (err) return handle(err);
      loadAuthor(comments[0].authorId, (err, author) => {
        // …і так далі
      });
    });
  });
});
```

Код зростає вправо, обробка помилок дублюється, а керувати паралельним
виконанням майже неможливо. Саме для цього придумали проміси.

---

## 3. Проміси

**Проміс (Promise)** — об'єкт, що представляє результат операції, яка ще не
завершилася.

### 3.1. Три стани

```
        ┌──────────────┐
        │   pending    │  очікування
        └──────┬───────┘
         ┌─────┴─────┐
         ▼           ▼
  ┌────────────┐ ┌───────────┐
  │  fulfilled │ │  rejected │
  │ (виконано) │ │(відхилено)│
  └────────────┘ └───────────┘
```

Стан змінюється **рівно один раз** і назавжди.

### 3.2. Створення й споживання

```js
const promise = new Promise((resolve, reject) => {
  setTimeout(() => {
    const success = Math.random() > 0.3;
    if (success) resolve({ data: 'готово' });
    else reject(new Error('Не вдалося'));
  }, 500);
});

promise
  .then(result => console.log('Успіх:', result))
  .catch(error => console.error('Помилка:', error))
  .finally(() => console.log('Завершено в будь-якому разі'));
```

⚠️ `new Promise(...)` потрібен лише для «обгортання» старих API з колбеками.
Функції на кшталт `fetch` уже повертають проміс — обгортати їх не треба.

```js
// Обгортка setTimeout у проміс — корисна утиліта
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

await delay(1000);
```

### 3.3. Ланцюжки

`then` завжди повертає **новий** проміс, тому виклики можна ланцюжити. Якщо з
`then` повернути значення — воно стане результатом наступного; якщо повернути
проміс — наступний `then` чекатиме на нього.

```js
fetch('/api/user/1')
  .then(response => response.json())        // повертаємо проміс
  .then(user => fetch(`/api/posts?userId=${user.id}`))
  .then(response => response.json())
  .then(posts => render(posts))
  .catch(error => showError(error));        // ловить помилку з БУДЬ-ЯКОЇ ланки
```

🔑 Один `catch` наприкінці обробляє помилки всього ланцюжка — це головна
перевага перед колбеками.

⚠️ **Найпоширеніша помилка з ланцюжками — забути `return`:**

```js
// ❌ Наступний then отримає undefined
.then(user => { fetch(`/api/posts/${user.id}`); })

// ✅
.then(user => fetch(`/api/posts/${user.id}`))
```

---

## 4. `async` / `await`

Синтаксичний цукор над промісами, що дозволяє писати асинхронний код так, ніби
він синхронний.

```js
async function loadUserData(userId) {
  try {
    const userResponse = await fetch(`/api/users/${userId}`);
    if (!userResponse.ok) throw new Error(`HTTP ${userResponse.status}`);
    const user = await userResponse.json();

    const postsResponse = await fetch(`/api/posts?userId=${user.id}`);
    const posts = await postsResponse.json();

    return { user, posts };
  } catch (error) {
    console.error('Не вдалося завантажити дані:', error);
    throw error;                      // прокидаємо далі
  }
}
```

Правила:

- `async` перед функцією означає, що вона **завжди повертає проміс**;
- `await` можна писати лише всередині `async`-функції (або на верхньому рівні
  ES-модуля);
- `await` призупиняє **лише цю функцію**, не блокуючи потік.

### 4.1. Послідовно проти паралельно

```js
// ❌ Послідовно: 300 + 300 + 300 = ~900 мс
const user = await fetchUser();
const posts = await fetchPosts();
const tags = await fetchTags();

// ✅ Паралельно: ~300 мс, бо запити незалежні
const [user, posts, tags] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchTags(),
]);
```

🔑 Послідовний `await` доречний **лише тоді, коли наступний запит залежить від
результату попереднього**. У всіх інших випадках — `Promise.all`. Це одна з
найчастіших причин повільних інтерфейсів.

### 4.2. `await` у циклі

```js
// ❌ Повільно: запити один за одним
for (const id of ids) {
  results.push(await fetchItem(id));
}

// ✅ Швидко
const results = await Promise.all(ids.map(id => fetchItem(id)));
```

⚠️ Але якщо запитів сотні — паралельний запуск усіх одразу «завалить» сервер.
Тоді потрібна обмежена паралельність (пакетами по 5–10).

⚠️ **`forEach` не вміє чекати:**

```js
// ❌ Функція завершиться до того, як щось збережеться
items.forEach(async (item) => { await save(item); });

// ✅
await Promise.all(items.map(item => save(item)));
```

---

## 5. Комбінатори промісів

| Метод | Поведінка | Коли використовувати |
|---|---|---|
| `Promise.all` | чекає на всі; **падає**, якщо хоч один відхилено | усі дані обов'язкові |
| `Promise.allSettled` | чекає на всі, **ніколи не падає**; повертає статуси | частина може не спрацювати |
| `Promise.race` | перший, що завершився (успіх **або** помилка) | тайм-аут |
| `Promise.any` | перший **успішний**; падає, лише якщо всі відхилені | кілька дзеркал одного ресурсу |

```js
// all — потрібні всі
const [user, settings] = await Promise.all([fetchUser(), fetchSettings()]);

// allSettled — частина може не спрацювати
const results = await Promise.allSettled(urls.map(u => fetch(u)));
const ok = results.filter(r => r.status === 'fulfilled').map(r => r.value);
const failed = results.filter(r => r.status === 'rejected');

// race — тайм-аут
const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Час очікування вичерпано')), ms)
  ),
]);
```

---

## 6. `fetch`: запити до сервера

### 6.1. Базовий запит

```js
const response = await fetch('https://api.example.com/movies');

response.ok            // true, якщо статус 200–299
response.status        // 200, 404, 500…
response.statusText
response.headers.get('content-type');

const data = await response.json();
```

⚠️ **Найважливіша особливість `fetch`: він НЕ кидає помилку на 404 чи 500.**
Проміс відхиляється лише при мережевому збої (немає з'єднання, DNS не
відповідає, CORS заблокував). Статус треба перевіряти вручну:

```js
const response = await fetch(url);

if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

Це помилка №1 у роботі з `fetch`. Без цієї перевірки застосунок мовчки покаже
порожній список замість повідомлення про помилку.

### 6.2. Методи, заголовки, тіло

```js
// POST із JSON
const response = await fetch('/api/notes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({ text: 'Нова нотатка', color: 'yellow' }),
});

// PUT, PATCH, DELETE — так само
await fetch(`/api/notes/${id}`, { method: 'DELETE' });

// Відправка форми з файлом
const formData = new FormData(form);
await fetch('/api/upload', { method: 'POST', body: formData });
// ⚠️ Content-Type для FormData НЕ вказують — браузер додасть boundary сам
```

### 6.3. Побудова URL із параметрами

```js
// ❌ Крихко: спецсимволи й кирилиця зламають запит
const url = `/api/movies?search=${query}&page=${page}`;

// ✅ Надійно: кодування виконується автоматично
const url = new URL('/api/movies', location.origin);
url.searchParams.set('search', query);
url.searchParams.set('page', String(page));
url.searchParams.set('genre', genreId);

const response = await fetch(url);
```

### 6.4. Методи читання тіла

```js
await response.json();        // розібрати як JSON
await response.text();        // як текст
await response.blob();        // як двійкові дані (файли, зображення)
await response.formData();
await response.arrayBuffer();
```

⚠️ **Тіло відповіді можна прочитати лише один раз.** Другий виклик кине
помилку. Якщо потрібні обидва подання — `response.clone()`.

---

## 7. Скасування запитів і тайм-аути

### 7.1. `AbortController`

```js
const controller = new AbortController();

fetch(url, { signal: controller.signal })
  .then(r => r.json())
  .catch(error => {
    if (error.name === 'AbortError') return;   // це ми самі скасували — не помилка
    showError(error);
  });

controller.abort();     // скасувати
```

### 7.2. Практичний випадок: пошук із перегонами запитів

Класична проблема: користувач набирає «Матриця», летить запит на «Мат», потім
на «Матри», потім на «Матриця». Відповіді можуть повернутися **не в тому
порядку** — і на екрані опиниться результат для «Мат».

```js
let currentController = null;

async function search(query) {
  currentController?.abort();               // скасувати попередній запит
  currentController = new AbortController();

  try {
    const url = new URL('/api/movies', location.origin);
    url.searchParams.set('search', query);

    const response = await fetch(url, { signal: currentController.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    render(await response.json());
  } catch (error) {
    if (error.name === 'AbortError') return;
    showError(error);
  }
}

searchInput.addEventListener('input', debounce(e => search(e.target.value), 300));
```

🔑 `debounce` + `AbortController` — стандартна пара для будь-якого поля пошуку.
Вона обов'язкова в Завданнях №3 і №5.

### 7.3. Тайм-аут

```js
// Сучасний спосіб — вбудований
const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

// Комбінація власного скасування й тайм-ауту
const signal = AbortSignal.any([
  controller.signal,
  AbortSignal.timeout(5000),
]);
```

### 7.4. Повторні спроби

```js
async function fetchWithRetry(url, options = {}, retries = 3, backoff = 500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Повторювати має сенс лише для серверних помилок
      if (response.status >= 500 && attempt < retries) {
        throw new Error(`Server error ${response.status}`);
      }
      return response;
    } catch (error) {
      if (error.name === 'AbortError' || attempt === retries) throw error;
      await new Promise(r => setTimeout(r, backoff * 2 ** attempt));   // 500, 1000, 2000
    }
  }
}
```

⚠️ Ніколи не повторюйте автоматично `POST`-запити без гарантій ідемпотентності:
можна створити кілька однакових записів.

---

## 8. Обробка помилок

### 8.1. Категорії

| Категорія | Приклад | Як реагувати |
|---|---|---|
| Мережева | немає інтернету, DNS | «Перевірте з'єднання», кнопка «Повторити» |
| HTTP 4xx | 400, 401, 403, 404, 409 | Показати конкретну причину |
| HTTP 5xx | 500, 502, 503 | «Сервер тимчасово недоступний», повтор |
| Розбір | некоректний JSON | Логувати, показати загальну помилку |
| Скасування | `AbortError` | **Нічого не робити** |

### 8.2. Єдина обгортка над `fetch`

```js
// api/http.js
export class HttpError extends Error {
  constructor(response, body) {
    super(body?.message ?? `HTTP ${response.status}`);
    this.name = 'HttpError';
    this.status = response.status;
    this.body = body;
  }
}

export async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;      // No Content

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) throw new HttpError(response, body);

  return body;
}

export const http = {
  get:    (url, options)       => request(url, { ...options, method: 'GET' }),
  post:   (url, data, options) => request(url, { ...options, method: 'POST',   body: JSON.stringify(data) }),
  put:    (url, data, options) => request(url, { ...options, method: 'PUT',    body: JSON.stringify(data) }),
  patch:  (url, data, options) => request(url, { ...options, method: 'PATCH',  body: JSON.stringify(data) }),
  delete: (url, options)       => request(url, { ...options, method: 'DELETE' }),
};
```

Використання стає коротким і однорідним:

```js
import { http, HttpError } from './api/http.js';

try {
  const movies = await http.get('/api/movies?page=1');
} catch (error) {
  if (error instanceof HttpError && error.status === 401) {
    redirectToLogin();
  } else {
    showError('Не вдалося завантажити дані');
  }
}
```

🔑 Такий шар `api/` — обов'язкова вимога Завдання №5. Компоненти не повинні
знати про `fetch`, заголовки й коди станів.

### 8.3. Необроблені відхилення

```js
window.addEventListener('unhandledrejection', (event) => {
  console.error('Необроблене відхилення проміса:', event.reason);
  event.preventDefault();
  showToast('Сталася непередбачена помилка');
});
```

---

## 9. Три стани запиту в інтерфейсі

Кожен запит має **щонайменше три** видимі стани. Ігнорувати їх — найчастіша
причина «дивних» інтерфейсів.

```js
const state = {
  status: 'idle',   // 'idle' | 'loading' | 'success' | 'error'
  data: null,
  error: null,
};

async function load() {
  setState({ status: 'loading', error: null });

  try {
    const data = await http.get('/api/movies');
    setState({ status: 'success', data });
  } catch (error) {
    if (error.name === 'AbortError') return;
    setState({ status: 'error', error });
  }
}

function render(state) {
  switch (state.status) {
    case 'loading':
      return renderSkeleton();
    case 'error':
      return renderError(state.error, { onRetry: load });
    case 'success':
      return state.data.length === 0
        ? renderEmpty()                       // ← четвертий стан!
        : renderList(state.data);
    default:
      return null;
  }
}
```

🔑 **Чотири стани, а не три:** завантаження, помилка, порожній результат,
дані. «Порожньо» й «завантажується» — це різні речі, і плутати їх не можна.

**Скелетон проти спінера.** Скелетон (сірі прямокутники на місці майбутнього
вмісту) сприймається як швидший інтерфейс і не спричиняє стрибка верстки, бо
одразу займає правильне місце.

---

## 10. CORS

**CORS (Cross-Origin Resource Sharing)** — механізм, що дозволяє серверу
вирішувати, з яких сайтів браузер може читати його відповіді.

**Походження (origin)** = схема + хост + порт. Різне хоч в одному —
різні походження:

| URL A | URL B | Те саме походження? |
|---|---|---|
| `https://site.com/a` | `https://site.com/b` | ✅ так |
| `https://site.com` | `http://site.com` | ❌ інша схема |
| `https://site.com` | `https://api.site.com` | ❌ інший хост |
| `http://localhost:5173` | `http://localhost:3000` | ❌ інший порт |

Останній рядок — саме ваша ситуація в Завданні №5: клієнт на Vite (порт 5173)
звертається до сервера Node.js (порт 3000).

**Що бачить розробник:**

```
Access to fetch at 'http://localhost:3000/api/movies' from origin
'http://localhost:5173' has been blocked by CORS policy
```

🔑 **CORS налаштовується на СЕРВЕРІ, не на клієнті.** Жодні заголовки у
`fetch` цього не змінять. Сервер має надіслати:

```http
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
```

У Express (лекція 12) це один рядок:

```js
app.use(cors({ origin: 'http://localhost:5173' }));
```

**Попередній запит (preflight).** Для «непростих» запитів (методи `PUT`,
`PATCH`, `DELETE` або власні заголовки на кшталт `Authorization`) браузер
спочатку надсилає `OPTIONS` і лише після дозволу — сам запит. Тому в
Network ви побачите два записи замість одного.

⚠️ CORS — захист **браузера**, а не сервера. З `curl` чи Postman запит пройде
без жодних обмежень. Це нікого не автентифікує — для цього є токени
(лекція 14).

---

## 11. Робота з REST API

### 11.1. Типовий клієнт ресурсу

```js
// api/movies.js
import { http } from './http.js';

const BASE = '/api/movies';

export const moviesApi = {
  list({ page = 1, limit = 12, search = '', genreId, signal } = {}) {
    const url = new URL(BASE, location.origin);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('offset', String((page - 1) * limit));
    if (search) url.searchParams.set('search', search);
    if (genreId) url.searchParams.set('genreId', String(genreId));

    return http.get(url, { signal });
  },

  getById: (id, { signal } = {}) => http.get(`${BASE}/${id}`, { signal }),
  create:  (data) => http.post(BASE, data),
  update:  (id, data) => http.put(`${BASE}/${id}`, data),
  remove:  (id) => http.delete(`${BASE}/${id}`),
};
```

### 11.2. Публічні API для тренування

Для вправ цієї лекції зручні відкриті API без реєстрації:

| API | Що дає |
|---|---|
| [JSONPlaceholder](https://jsonplaceholder.typicode.com/) | фейкові пости, коментарі, користувачі; підтримує POST/PUT/DELETE |
| [PokéAPI](https://pokeapi.co/) | великий набір даних, зручний для пагінації |
| [REST Countries](https://restcountries.com/) | країни, прапори, регіони — добре для фільтрів |
| [Open-Meteo](https://open-meteo.com/) | погода без ключа |
| [Open Library](https://openlibrary.org/developers/api) | книги й обкладинки |

---

## 12. Таймери, debounce, throttle

```js
const id = setTimeout(fn, 1000);        // один раз
clearTimeout(id);

const intervalId = setInterval(fn, 1000);   // періодично
clearInterval(intervalId);

requestAnimationFrame(step);            // перед наступним кадром (~60 разів/с)
```

⚠️ **Завжди зберігайте ідентифікатор таймера й очищайте його.** Забутий
`setInterval` продовжує працювати навіть після того, як елемент зник — це витік
і джерело дивних помилок.

⚠️ `setTimeout(fn, 1000)` гарантує **не менше** 1000 мс, а не рівно.
Якщо потік зайнятий, виклик відкладеться. Для точного часу використовуйте
`Date.now()`, а не підрахунок спрацювань.

⚠️ У неактивній вкладці таймери «пригальмовуються» браузером (мінімум ~1 с).

### Debounce і throttle — де що

| | Debounce | Throttle |
|---|---|---|
| Поведінка | виклик після паузи | не частіше ніж раз на інтервал |
| Пошук у полі | ✅ | ❌ |
| Автозбереження | ✅ | ❌ |
| Зміна розміру вікна | ✅ (кінцевий стан) | ✅ (проміжні) |
| Прокрутка | ❌ | ✅ |
| Перетягування | ❌ | ✅ (або `requestAnimationFrame`) |

```js
// Найплавніший варіант для рухів вказівника
function rafThrottle(fn) {
  let scheduled = false;
  return (...args) => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn(...args);
    });
  };
}
```

---

## 13. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Не перевіряти `response.ok` | 404/500 обробляються як успіх | `if (!response.ok) throw …` |
| 2 | Послідовні `await` для незалежних запитів | Утричі повільніше | `Promise.all` |
| 3 | `await` у `forEach` | Код не чекає | `Promise.all(map(...))` |
| 4 | Немає скасування пошуку | Перегони запитів, «стрибає» результат | `AbortController` + `debounce` |
| 5 | `AbortError` показується як помилка | Користувач бачить «Сталася помилка» на кожен символ | Ігнорувати `AbortError` |
| 6 | Немає стану «завантаження» | Порожній екран, здається що зламалося | Скелетон/спінер |
| 7 | Плутають «порожньо» й «завантажується» | Незрозумілий інтерфейс | Чотири окремі стани |
| 8 | Забутий `return` у `then` | `undefined` у наступній ланці | Повертати проміс |
| 9 | Спроба «полагодити» CORS на клієнті | Марна витрата часу | Налаштувати сервер |
| 10 | `Content-Type: application/json` для `FormData` | Сервер не розбере тіло | Не вказувати вручну |
| 11 | Читання тіла відповіді двічі | `TypeError` | `response.clone()` |
| 12 | `setInterval` без `clearInterval` | Витік, фонова робота | Зберігати й очищати id |
| 13 | Ручне склеювання URL із параметрами | Ламається на пробілах і кирилиці | `URL` + `searchParams` |
| 14 | Повтор `POST` при помилці | Дублікати записів | Повторювати лише безпечні методи |
| 15 | `fetch` напряму в компонентах | Дублювання, неможливо змінити базовий URL | Шар `api/` |

---

## 14. Контрольні запитання

1. Що виведе код із розділу 1.2 і чому саме в такому порядку?
2. Чим мікрозадачі відрізняються від макрозадач?
3. Чому `setTimeout(fn, 0)` не виконується негайно?
4. Назвіть три стани проміса. Чи може проміс перейти з `fulfilled` у
   `rejected`?
5. Чому `fetch` не кидає помилку при статусі 404?
6. У чому різниця між `Promise.all` і `Promise.allSettled`? Коли потрібен
   кожен?
7. Як за допомогою `Promise.race` реалізувати тайм-аут?
8. Що таке перегони запитів у пошуку й як їх усунути?
9. Чому `AbortError` не слід показувати користувачеві як помилку?
10. Чому `items.forEach(async item => await save(item))` не працює як
    очікується?
11. Що таке походження (origin) і коли два URL мають однакове походження?
12. Чому CORS неможливо налаштувати з боку клієнта?
13. Що таке preflight-запит і коли він надсилається?
14. Скільки станів має бути в інтерфейсі, що завантажує список? Назвіть їх.
15. Коли доречний `debounce`, а коли `throttle`?
16. Чому тіло `Response` можна прочитати лише один раз?

---

## 15. Практичні вправи

**Вправа 1 (цикл подій, 15 хв).** Передбачте порядок виведення, потім
перевірте:

```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => { console.log('C'); return Promise.resolve(); })
                 .then(() => console.log('D'));
queueMicrotask(() => console.log('E'));
(async () => { console.log('F'); await null; console.log('G'); })();
console.log('H');
```

**Вправа 2 (базовий fetch, 25 хв).** Завантажте список користувачів із
JSONPlaceholder і виведіть картки з ім'ям, поштою й містом. Обов'язково:
перевірка `response.ok`, стан завантаження, обробка помилки з кнопкою
«Повторити».

**Вправа 3 (паралельність, 20 хв).** Завантажте користувача з `id = 1`, його
пости й альбоми. Реалізуйте двічі — послідовно й через `Promise.all` — та
виміряйте різницю через `console.time`.

**Вправа 4 (пошук, 40 хв).** Зробіть поле пошуку по країнах
([restcountries.com](https://restcountries.com/)) з `debounce` 300 мс і
скасуванням попереднього запиту. Перевірте в Network, що при швидкому наборі
зайві запити позначені як `canceled`.

**Вправа 5 (обгортка, 30 хв).** Реалізуйте модуль `http.js` із розділу 8.2
самостійно. Додайте: тайм-аут 8 секунд, повтор для 5xx (до 2 разів), клас
`HttpError` зі статусом і тілом. Напишіть демонстрацію для 200, 404 і
неіснуючого домену.

**Вправа 6 (стани, 30 хв).** Реалізуйте компонент списку, що коректно
показує всі чотири стани. Перевірте кожен: успіх; помилка (вимкніть мережу в
Network → Offline); порожній результат (пошук за безглуздим рядком);
завантаження (Network → Slow 3G).

**Вправа 7 (налагодження, 20 хв).** Знайдіть п'ять помилок:

```js
async function loadAll(ids) {
  const results = [];
  ids.forEach(async (id) => {
    const r = await fetch('/api/items?id=' + id);
    const data = r.json();
    results.push(data);
  });
  return results;
}

function search(q) {
  fetch(`/api/search?q=${q}`)
    .then(r => { r.json(); })
    .then(data => render(data));
}
```

---

## 16. Корисні посилання

- [javascript.info: Проміси, async/await](https://uk.javascript.info/async) —
  найкраще пояснення теми, українською.
- [javascript.info: Цикл подій](https://uk.javascript.info/event-loop).
- [MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch).
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS) —
  зокрема розділ про preflight.
- [Jake Archibald: In The Loop](https://www.youtube.com/watch?v=cCOL7MC4Pl0) —
  класична доповідь про цикл подій із візуалізацією.
- [Loupe](http://latentflip.com/loupe/) — інтерактивна візуалізація стека,
  черги й циклу подій.
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) — API для вправ.
- [Public APIs](https://github.com/public-apis/public-apis) — великий список
  відкритих API.
- [HTTP Cats](https://http.cat/) — коди станів у вигляді котів (несподівано
  дієвий спосіб їх запам'ятати).

---

## 17. Література

1. **Haverbeke, M.** *Eloquent JavaScript.* 4th ed. — No Starch Press, 2024. —
   Розділ 11 «Asynchronous Programming»: проміси, `async`/`await`, цикл подій
   із покроковими прикладами.
2. **Flanagan, D.** *JavaScript: The Definitive Guide.* 7th ed. —
   O'Reilly, 2020. — Розділ 13 «Asynchronous JavaScript».
3. **Simpson, K.** *You Don't Know JS Yet: Async & Performance.* —
   Найдетальніший розбір промісів і моделі паралелізму.
4. **Grigsby, J.** *Progressive Web Apps.* — A Book Apart, 2019. —
   Про офлайн, кешування й роботу з мережею на нестабільному з'єднанні.

---

## 18. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Цикл подій | event loop | Механізм чергування задач у однопотоковому середовищі |
| Стек викликів | call stack | Стек функцій, що виконуються зараз |
| Мікрозадача | microtask | Задача з пріоритетної черги (проміси) |
| Макрозадача | task / macrotask | Задача звичайної черги (таймери, події) |
| Проміс | promise | Об'єкт результату майбутньої операції |
| Виконано | fulfilled | Проміс успішно завершився |
| Відхилено | rejected | Проміс завершився помилкою |
| Очікування | pending | Проміс ще не завершився |
| Колбек | callback | Функція, передана для виклику пізніше |
| Пекло колбеків | callback hell | Глибока вкладеність колбеків |
| Скасування | abort | Переривання запиту до завершення |
| Перегони запитів | race condition | Відповіді приходять не в порядку відправлення |
| Походження | origin | Схема + хост + порт |
| Попередній запит | preflight | `OPTIONS`-запит перед «непростим» запитом |
| Тайм-аут | timeout | Обмеження часу очікування |
| Повторна спроба | retry | Повторення запиту після невдачі |
| Експоненційна витримка | exponential backoff | Зростаюча пауза між спробами |
| Скелетон | skeleton | Заглушка у формі майбутнього вмісту |

---

**Попередня:** [Лекція 4. DOM, події, взаємодія зі сторінкою](04-dom-events.md)
**Наступна:** [Лекція 6. React: компонентна модель, props, state](06-react-components-props-state.md)

[← До змісту курсу](README.md)
