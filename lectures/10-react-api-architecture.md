# Лекція 10. React: робота з API, архітектура та якість застосунку

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язані завдання:** №3 (завершення), №5 (клієнтська частина)
> **Попередня лекція:** [Лекція 9](09-react-routing-forms.md)

---

## Про що ця лекція

Це остання лекція про React і водночас перехідна. Досі дані у нас були
локальними. Тепер розберемо, як React працює з **сервером**: завантаження,
стани, гонки, кешування, оптимістичне оновлення.

Друга частина — про **архітектуру й якість**: як організувати проєкт, який
житиме довше за один семестр, як його тестувати й збирати для продакшену.

---

## Зміст

1. [Шар роботи з API](#1-шар-роботи-з-api)
2. [Завантаження даних у компоненті](#2-завантаження-даних-у-компоненті)
3. [Гонки й скасування](#3-гонки-й-скасування)
4. [Стани інтерфейсу](#4-стани-інтерфейсу)
5. [Мутації даних](#5-мутації-даних)
6. [Оптимістичне оновлення](#6-оптимістичне-оновлення)
7. [Кешування та інвалідація](#7-кешування-та-інвалідація)
8. [Автентифікація на клієнті](#8-автентифікація-на-клієнті)
9. [Архітектура проєкту](#9-архітектура-проєкту)
10. [Розумні та презентаційні компоненти](#10-розумні-та-презентаційні-компоненти)
11. [Доступність React-застосунку](#11-доступність-react-застосунку)
12. [Продуктивність](#12-продуктивність)
13. [Тестування](#13-тестування)
14. [Збірка та розгортання](#14-збірка-та-розгортання)
15. [Типові помилки](#15-типові-помилки)
16. [Контрольні запитання](#16-контрольні-запитання)
17. [Практичні вправи](#17-практичні-вправи)
18. [Корисні посилання](#18-корисні-посилання)
19. [Література](#19-література)
20. [Глосарій](#20-глосарій)

---

## 1. Шар роботи з API

🔑 **Головне правило: жоден компонент не викликає `fetch` напряму.**

Причини:

- зміна базового URL зачіпає один файл, а не тридцять;
- заголовки, токен і обробка помилок описані в одному місці;
- компоненти легко тестувати, підмінивши модуль API;
- видно всі точки взаємодії з сервером.

```js
// src/api/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
```

```
# .env.development
VITE_API_URL=http://localhost:3000/api

# .env.production
VITE_API_URL=https://my-api.onrender.com/api
```

⚠️ У Vite змінні середовища, доступні клієнту, **мусять** починатися з
`VITE_`. І пам'ятайте: усе, що потрапило у клієнтську збірку, **видно
кожному**. Секретів там бути не може.

```js
// src/api/http.js
import { API_BASE_URL } from './config.js';

export class HttpError extends Error {
  constructor(status, body, url) {
    super(body?.message ?? `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
    this.body = body;
    this.url = url;
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isNotFound()     { return this.status === 404; }
  get isConflict()     { return this.status === 409; }
  get isValidation()   { return this.status === 400 || this.status === 422; }
  get isServerError()  { return this.status >= 500; }

  /** Помилки полів у форматі { fieldName: message } */
  get fieldErrors() {
    const errors = this.body?.errors;
    if (!Array.isArray(errors)) return {};
    return Object.fromEntries(errors.map(e => [e.field, e.message]));
  }
}

function buildUrl(path, params) {
  const url = new URL(path.replace(/^\//, ''), API_BASE_URL + '/');
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) value.forEach(v => url.searchParams.append(key, String(v)));
    else url.searchParams.set(key, String(value));
  }
  return url;
}

export async function request(path, { params, body, headers, ...options } = {}) {
  const token = localStorage.getItem('token');
  const isFormData = body instanceof FormData;

  const response = await fetch(buildUrl(path, params), {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text();

  if (!response.ok) throw new HttpError(response.status, payload, response.url);

  return payload;
}

export const http = {
  get:    (path, options)       => request(path, { ...options, method: 'GET' }),
  post:   (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put:    (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch:  (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options)       => request(path, { ...options, method: 'DELETE' }),
};
```

```js
// src/api/movies.js
import { http } from './http.js';

export const moviesApi = {
  list: ({ page = 1, limit = 12, search, genreId, sort, order, signal } = {}) =>
    http.get('/movies', {
      params: { limit, offset: (page - 1) * limit, search, genreId, sort, order },
      signal,
    }),

  getById: (id, { signal } = {}) => http.get(`/movies/${id}`, { signal }),
  create:  (data)      => http.post('/movies', data),
  update:  (id, data)  => http.put(`/movies/${id}`, data),
  remove:  (id)        => http.delete(`/movies/${id}`),
};

// src/api/genres.js
export const genresApi = {
  list: ({ signal } = {}) => http.get('/genres', { signal }),
};
```

---

## 2. Завантаження даних у компоненті

### 2.1. Базовий хук

```jsx
// hooks/useAsync.js
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const controllerRef = useRef(null);

  const run = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setState(prev => ({ ...prev, status: 'loading', error: null }));

    try {
      const data = await asyncFn({ signal: controller.signal });
      if (controller.signal.aborted) return;
      setState({ status: 'success', data, error: null });
    } catch (error) {
      if (error.name === 'AbortError' || controller.signal.aborted) return;
      setState({ status: 'error', data: null, error });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
    return () => controllerRef.current?.abort();
  }, [run]);

  return { ...state, reload: run };
}
```

```jsx
function MoviesPage() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('q') ?? '';
  const debouncedSearch = useDebounce(search, 300);

  const { status, data, error, reload } = useAsync(
    ({ signal }) => moviesApi.list({ page, search: debouncedSearch, signal }),
    [page, debouncedSearch]
  );

  if (status === 'loading') return <MovieListSkeleton count={12} />;
  if (status === 'error')   return <ErrorState error={error} onRetry={reload} />;
  if (!data?.data?.length)  return <EmptyState onReset={() => setSearchParams({})} />;

  return (
    <>
      <ResultsInfo total={data.total} page={page} limit={data.limit} />
      <MovieGrid movies={data.data} />
      <Pagination page={page} totalPages={Math.ceil(data.total / data.limit)} />
    </>
  );
}
```

⚠️ Тут `eslint-disable` для `deps` виправданий: це навмисно параметризований
хук, як `useCallback` із власним списком. У звичайних ефектах так робити не
можна.

---

## 3. Гонки й скасування

Три сценарії, які обов'язково треба обробити:

**1. Швидка зміна параметрів.** Користувач набирає в пошуку — летять запити на
кожне значення. Відповіді можуть повернутися не в порядку відправлення.
Розв'язання: `debounce` + `AbortController`.

**2. Перехід на іншу сторінку до завершення запиту.** Компонент знято, а
`setState` викликається → попередження й потенційний витік. Розв'язання:
скасування в функції очищення ефекту.

**3. Подвійне надсилання форми.** Користувач двічі натиснув «Зберегти» →
два однакові записи. Розв'язання: блокування кнопки під час відправки.

```jsx
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async (values) => {
  if (isSubmitting) return;             // подвійний захист
  setIsSubmitting(true);
  try {
    const created = await moviesApi.create(values);
    navigate(`/movies/${created.id}`);
  } catch (error) {
    handleError(error);
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 4. Стани інтерфейсу

```jsx
function ErrorState({ error, onRetry }) {
  const message =
    error instanceof HttpError
      ? error.isNotFound     ? 'Записи не знайдено'
      : error.isUnauthorized ? 'Потрібно увійти'
      : error.isServerError  ? 'Сервер тимчасово недоступний. Спробуйте пізніше.'
      : error.message
      : 'Не вдалося з\'єднатися з сервером. Перевірте інтернет.';

  return (
    <div className="state state--error" role="alert">
      <h2>Щось пішло не так</h2>
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry}>Спробувати ще раз</button>}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="state state--empty">
      <p>За вашим запитом нічого не знайдено.</p>
      <button type="button" onClick={onReset}>Скинути фільтри</button>
    </div>
  );
}

function MovieListSkeleton({ count = 6 }) {
  return (
    <ul className="cards" aria-busy="true" aria-label="Завантаження списку">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="card card--skeleton" aria-hidden="true">
          <div className="skeleton skeleton--image" />
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line skeleton--short" />
        </li>
      ))}
    </ul>
  );
}
```

**Скелетон проти спінера:**

| | Скелетон | Спінер |
|---|---|---|
| Показує структуру | ✅ | ❌ |
| Уникає стрибка верстки | ✅ | ❌ |
| Сприймається швидшим | ✅ | ❌ |
| Складність | більша | мінімальна |

Для списків і карток — скелетон. Для короткої дії (натиснули «Зберегти») —
індикатор у самій кнопці.

⚠️ Не показуйте скелетон для запитів, коротших за ~200 мс: він встигне
блимнути й тільки роздратує. Або додайте затримку появи, або залиште старі
дані з приглушенням (`opacity`).

---

## 5. Мутації даних

```jsx
function useMovieMutations({ onSuccess } = {}) {
  const [isPending, setIsPending] = useState(false);
  const { showToast } = useToast();

  const run = async (fn, successMessage) => {
    setIsPending(true);
    try {
      const result = await fn();
      showToast({ type: 'success', message: successMessage });
      onSuccess?.();
      return result;
    } catch (error) {
      if (error instanceof HttpError && error.isValidation) {
        throw error;                       // помилки полів обробить форма
      }
      showToast({ type: 'error', message: describeError(error) });
      throw error;
    } finally {
      setIsPending(false);
    }
  };

  return {
    isPending,
    create: (data)     => run(() => moviesApi.create(data), 'Фільм створено'),
    update: (id, data) => run(() => moviesApi.update(id, data), 'Зміни збережено'),
    remove: (id)       => run(() => moviesApi.remove(id), 'Фільм видалено'),
  };
}
```

**Помилки валідації з сервера в полях форми:**

```jsx
const handleSubmit = async (values) => {
  try {
    await mutations.create(values);
    navigate('/movies');
  } catch (error) {
    if (error instanceof HttpError && error.isValidation) {
      setErrors(error.fieldErrors);       // { title: 'Уже існує', year: '…' }
      focusFirstError(error.fieldErrors);
    }
  }
};
```

🔑 Це прямо вимагається в Завданні №5: «помилки валідації, що прийшли з
сервера, показуються біля відповідних полів». Клієнтська валідація — для
зручності, серверна — джерело істини.

---

## 6. Оптимістичне оновлення

Замість «натиснув → чекав → побачив результат» інтерфейс показує результат
одразу, а в разі помилки відкочується.

```jsx
function useOptimisticDelete(movies, setMovies) {
  const { showToast } = useToast();

  return async (id) => {
    const snapshot = movies;                                 // 1. запам'ятали
    setMovies(prev => prev.filter(m => m.id !== id));        // 2. одразу прибрали

    try {
      await moviesApi.remove(id);                            // 3. надіслали
    } catch (error) {
      setMovies(snapshot);                                   // 4. відкотили
      showToast({ type: 'error', message: 'Не вдалося видалити. Спробуйте ще раз.' });
    }
  };
}
```

React 19 має для цього спеціальний хук:

```jsx
import { useOptimistic } from 'react';

const [optimisticMovies, addOptimistic] = useOptimistic(
  movies,
  (state, { type, payload }) => {
    if (type === 'delete') return state.filter(m => m.id !== payload);
    if (type === 'add') return [payload, ...state];
    return state;
  }
);
```

⚠️ Оптимістичне оновлення доречне для дій, що **майже завжди** успішні
(лайк, видалення, позначка «прочитано»). Для оплати чи створення складного
запису краще чесно показати очікування.

---

## 7. Кешування та інвалідація

Найпростіший корисний кеш:

```js
// api/cache.js
const cache = new Map();
const TTL = 60_000;   // 1 хвилина

export async function cachedGet(key, loader) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < TTL) return entry.value;

  const value = await loader();
  cache.set(key, { value, time: Date.now() });
  return value;
}

export function invalidate(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}
```

```js
const genres = await cachedGet('genres', () => genresApi.list());

// Після створення фільму список фільмів застарів
await moviesApi.create(data);
invalidate('movies');
```

🔑 **Довідники** (жанри, категорії, міста) кешувати варто майже завжди — вони
змінюються рідко, а запитуються постійно.

📚 У реальних проєктах це не пишуть вручну: **TanStack Query** дає кеш,
дедуплікацію запитів, фонове оновлення, повтори, інвалідацію й оптимістичні
мутації «з коробки». Після завершення курсу обов'язково подивіться на нього —
але спершу зрозумійте, що саме він робить.

---

## 8. Автентифікація на клієнті

```jsx
// context/AuthContext.jsx
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });

  const signIn = useCallback(async (credentials) => {
    const { token, user } = await authApi.signIn(credentials);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    return user;
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Глобальна реакція на 401 із будь-якого запиту
  useEffect(() => {
    const onUnauthorized = () => signOut();
    window.addEventListener('auth:unauthorized', onUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized);
  }, [signOut]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, signIn, signOut }),
    [user, signIn, signOut]
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth() має викликатися всередині <AuthProvider>');
  return context;
}
```

У `http.js` додаємо оповіщення:

```js
if (response.status === 401) {
  window.dispatchEvent(new CustomEvent('auth:unauthorized'));
}
```

⚠️ **Де зберігати токен.** `localStorage` доступний будь-якому скрипту на
сторінці — при XSS токен викрадуть. Безпечніший варіант —
`httpOnly`-cookie, недоступна з JavaScript. У навчальному завданні
використовуємо `localStorage` (так простіше й так вимагає завдання), але в
реальному проєкті це усвідомлений компроміс. Детальніше — лекція 14.

---

## 9. Архітектура проєкту

```
src/
├── main.jsx
├── App.jsx
│
├── api/                      ← єдина точка спілкування з сервером
│   ├── config.js
│   ├── http.js
│   ├── movies.js
│   ├── genres.js
│   └── auth.js
│
├── context/                  ← глобальний стан
│   ├── AuthContext.jsx
│   ├── DataContext.jsx
│   └── ToastContext.jsx
│
├── hooks/                    ← переюзана логіка
│   ├── useAsync.js
│   ├── useDebounce.js
│   ├── useLocalStorage.js
│   └── useClickOutside.js
│
├── components/               ← презентаційні, без знання про домен
│   ├── Button/
│   ├── Modal/
│   ├── Accordion/
│   ├── Pagination/
│   ├── Field/
│   └── states/
│       ├── ErrorState.jsx
│       ├── EmptyState.jsx
│       └── Skeleton.jsx
│
├── features/                 ← компоненти предметної області
│   └── movies/
│       ├── MovieCard.jsx
│       ├── MovieGrid.jsx
│       ├── MovieForm.jsx
│       └── MovieFilters.jsx
│
├── pages/                    ← сторінки-маршрути
│   ├── MoviesPage.jsx
│   ├── MovieDetailsPage.jsx
│   ├── MovieFormPage.jsx
│   ├── SignInPage.jsx
│   └── NotFoundPage.jsx
│
├── layouts/
│   └── MainLayout.jsx
│
├── utils/                    ← чисті функції
│   ├── format.js
│   └── validation.js
│
└── styles/
    ├── reset.css
    └── variables.css
```

**Правила залежностей** (порушення — ознака проблем):

```
pages → features → components → (нічого доменного)
  ↓        ↓
context   api
  ↓        ↓
hooks    utils
```

- `components/` **не імпортує** нічого з `features/`, `api/`, `context/`;
- `api/` **не імпортує** React;
- `utils/` не імпортує нічого, крім інших `utils/`.

---

## 10. Розумні та презентаційні компоненти

**Презентаційний («дурний»)** — отримує все через props, не має власного
складного стану, не знає, звідки дані.

```jsx
// components/Pagination/Pagination.jsx
export function Pagination({ page, totalPages, onChange }) { … }
```

**Контейнерний («розумний»)** — бере дані з контексту або API, керує станом,
передає вниз.

```jsx
// pages/MoviesPage.jsx
export default function MoviesPage() {
  const { data, status, error, reload } = useAsync(…);
  const [searchParams, setSearchParams] = useSearchParams();
  …
  return <MovieGrid movies={data.data} onDelete={handleDelete} />;
}
```

Що це дає: презентаційні компоненти легко тестувати й перевикористовувати;
логіка зосереджена в кількох файлах; макет можна змінити, не чіпаючи логіку.

🔑 Практичний тест: якщо компонент у `components/` імпортує щось із `api/` —
архітектуру порушено.

---

## 11. Доступність React-застосунку

SPA створює специфічні проблеми доступності, яких немає на звичайних
сторінках.

**1. Зміна маршруту не оголошується.** На звичайному сайті екранний читач
повідомляє про нову сторінку. У SPA — ні.

```jsx
function RouteAnnouncer() {
  const { pathname } = useLocation();
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(`Перейшли на сторінку ${document.title}`);
  }, [pathname]);

  return (
    <div role="status" aria-live="polite" className="visually-hidden">
      {message}
    </div>
  );
}
```

**2. Фокус не переміщується.** Після переходу фокус лишається на посиланні:

```jsx
useEffect(() => {
  mainRef.current?.focus();
}, [pathname]);

<main ref={mainRef} tabIndex={-1} id="main">…</main>
```

**3. Заголовок вкладки не змінюється:**

```jsx
useEffect(() => { document.title = `${movie.title} — Кінокаталог`; }, [movie.title]);
```

**4. Динамічні повідомлення** (сповіщення, результати пошуку):

```jsx
<div role="status" aria-live="polite">
  {status === 'success' && `Знайдено ${total} записів`}
</div>
```

**5. Модальні вікна** — пастка фокуса, `Escape`, повернення фокуса
(див. лекцію 9).

**Перевірка:** Lighthouse (Accessibility ≥ 90 — вимога завдань), axe DevTools,
прохід сторінки лише клавіатурою, увімкнений екранний читач.

---

## 12. Продуктивність

### 12.1. Профілювання

React DevTools → Profiler → запис взаємодії. Дивіться, які компоненти
перемальовуються й скільки це коштує. **Спочатку вимірюйте, потім
оптимізуйте.**

### 12.2. Типові прийоми

```jsx
// 1. Мемоізація дорогих обчислень
const sorted = useMemo(() => items.toSorted(comparator), [items, comparator]);

// 2. memo + useCallback для елементів списку
const MovieCard = memo(MovieCardBase);

// 3. Розділення контекстів (лекція 8)

// 4. Ліниве завантаження сторінок (лекція 9)

// 5. Ключі, що не змінюються без потреби
```

### 12.3. Довгі списки

Для сотень елементів на екрані використовують **віртуалізацію** — рендериться
лише видима частина. Готові рішення: `@tanstack/react-virtual`,
`react-window`.

Для Завдання №3 (пагінація по 12–24 записи) віртуалізація не потрібна.

### 12.4. Зображення

```jsx
<img
  src={movie.poster}
  alt={`Постер фільму «${movie.title}»`}
  width={300} height={450}
  loading="lazy"
  decoding="async"
/>
```

### 12.5. Аналіз розміру збірки

```bash
npm run build
npx vite-bundle-visualizer
```

Типова знахідка: величезна бібліотека дат чи іконок, з якої використовується
дві функції.

---

## 13. Тестування

У Завданні №3 тести не обов'язкові, але вітаються — і у Завданні №5 вони вже
знадобляться на боці сервера.

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.js' },
});
```

```jsx
// MovieCard.test.jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MovieCard } from './MovieCard.jsx';

test('показує назву та рік', () => {
  render(<MovieCard movie={{ id: '1', title: 'Тіні забутих предків', year: 1965 }} />);

  expect(screen.getByRole('heading', { name: /Тіні забутих предків/ })).toBeInTheDocument();
  expect(screen.getByText('1965')).toBeInTheDocument();
});

test('викликає onDelete при натисканні кнопки', async () => {
  const onDelete = vi.fn();
  const user = userEvent.setup();

  render(<MovieCard movie={{ id: '1', title: 'Фільм' }} onDelete={onDelete} />);
  await user.click(screen.getByRole('button', { name: /видалити/i }));

  expect(onDelete).toHaveBeenCalledWith('1');
});
```

🔑 **Принцип Testing Library:** шукайте елементи так, **як їх шукає
користувач** — за роллю, підписом, текстом, а не за класами й
`data-testid`. Побічний ефект: якщо тест важко написати, бо елемент не має
доступного імені, — це водночас і проблема доступності.

Найцінніші тести для нашого рівня — **на чисті функції**: редюсер, правила
валідації, форматування.

---

## 14. Збірка та розгортання

```bash
npm run build      # → dist/
npm run preview    # перевірити продакшен-збірку локально
```

### 14.1. Чек-лист перед розгортанням

- [ ] `npm run build` без помилок і попереджень;
- [ ] `npm run lint` чистий;
- [ ] адреса API береться зі змінної середовища, а не «зашита»;
- [ ] у консолі немає помилок і залишків `console.log`;
- [ ] налаштований SPA-fallback на всі маршрути;
- [ ] є `favicon`, `<title>`, `<meta name="description">`;
- [ ] Lighthouse: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90;
- [ ] перевірено на 320 px, 768 px, 1440 px;
- [ ] працює навігація лише клавіатурою;
- [ ] перевірено поведінку при вимкненій мережі.

### 14.2. Платформи

| Платформа | Особливості |
|---|---|
| **Netlify** | найпростіше; `_redirects` для SPA; змінні середовища в UI |
| **Vercel** | те саме, `vercel.json` для rewrites |
| **GitHub Pages** | безкоштовно, але потрібен `base` у `vite.config.js` і `404.html` |
| **Cloudflare Pages** | швидка мережа доставки |

Для GitHub Pages:

```js
// vite.config.js
export default defineConfig({
  plugins: [react()],
  base: '/my-repo-name/',
});
```

```json
// package.json
"scripts": {
  "build": "vite build && cp dist/index.html dist/404.html"
}
```

### 14.3. Найпростіший CI

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```

---

## 15. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | `fetch` напряму в компонентах | Дублювання, неможливо змінити базовий URL | Шар `api/` |
| 2 | Адреса API «зашита» в код | Не працює в продакшені | `import.meta.env.VITE_API_URL` |
| 3 | Немає перевірки `response.ok` | 404 сприймається як успіх | Обгортка з `HttpError` |
| 4 | Немає скасування запитів | Гонки, попередження після знімання | `AbortController` |
| 5 | `AbortError` показується користувачеві | «Помилка» на кожен символ | Ігнорувати |
| 6 | Три стани замість чотирьох | «Порожньо» виглядає як поломка | Додати `EmptyState` |
| 7 | Спінер для швидких запитів | Блимання | Затримка або збереження старих даних |
| 8 | Немає блокування подвійного надсилання | Дублікати записів | `isSubmitting` |
| 9 | Серверні помилки валідації ігноруються | Користувач не знає, що не так | `error.fieldErrors` |
| 10 | Оптимістичне оновлення без відкоту | Розсинхронізація з сервером | Зберігати знімок |
| 11 | Зміна маршруту не оголошується | Недоступно для екранних читачів | `aria-live` + фокус |
| 12 | `document.title` не змінюється | Погана навігація й SEO | Оновлювати в ефекті |
| 13 | Токен у коді або в git | Витік | Змінні середовища, `.gitignore` |
| 14 | Оптимізація без профілювання | Складний код без користі | Спочатку Profiler |
| 15 | Немає SPA-fallback | 404 при прямому URL | Налаштувати хостинг |
| 16 | `components/` імпортує з `api/` | Порушення шарів | Дані через props |

---

## 16. Контрольні запитання

1. Навіщо потрібен окремий шар `api/`? Назвіть чотири причини.
2. Чому змінна середовища у Vite має починатися з `VITE_` і чому туди не
   можна класти секрети?
3. Які три сценарії гонок треба обробити при роботі з сервером?
4. Чому `AbortError` не показують користувачеві?
5. Назвіть чотири стани списку. Чому «порожньо» — окремий стан?
6. Коли скелетон кращий за спінер, а коли навпаки?
7. Що таке оптимістичне оновлення й коли воно недоречне?
8. Як показати помилки валідації з сервера біля полів форми?
9. Чому довідники варто кешувати?
10. Які ризики зберігання токена в `localStorage`?
11. Що таке презентаційний і контейнерний компоненти?
12. Які правила залежностей між теками проєкту?
13. Назвіть три проблеми доступності, специфічні для SPA.
14. Чому Testing Library радить шукати елементи за роллю, а не за класом?
15. Що потрібно налаштувати, щоб SPA працював на GitHub Pages?

---

## 17. Практичні вправи

**Вправа 1 (шар API, 40 хв).** Реалізуйте `config.js`, `http.js` із класом
`HttpError` і `movies.js`. Перевірте на JSONPlaceholder: успішний запит,
404, неіснуючий домен.

**Вправа 2 (хук завантаження, 40 хв).** Напишіть `useAsync` самостійно.
Перевірте: швидка зміна параметрів (у Network зайві запити мають бути
`canceled`); перехід на іншу сторінку під час завантаження (не має бути
попереджень у консолі).

**Вправа 3 (стани, 35 хв).** Реалізуйте `ErrorState`, `EmptyState` і скелетон.
Перевірте всі чотири стани, зокрема через Network → Offline і Slow 3G.

**Вправа 4 (мутації, 45 хв).** Додайте створення, редагування й видалення
через API зі сповіщеннями, блокуванням подвійного надсилання й обробкою
серверних помилок валідації.

**Вправа 5 (оптимістичне видалення, 30 хв).** Реалізуйте оптимістичне
видалення з відкотом. Змоделюйте помилку (тимчасово змініть URL на
неіснуючий) і переконайтеся, що елемент повертається, а користувач бачить
пояснення.

**Вправа 6 (доступність SPA, 35 хв).** Додайте оголошення зміни маршруту,
переміщення фокуса на `<main>`, оновлення `document.title`. Перевірте з
екранним читачем.

**Вправа 7 (рефакторинг архітектури, 60 хв).** Перебудуйте свій проєкт за
структурою з розділу 9. Перевірте правила залежностей: жоден файл у
`components/` не повинен імпортувати з `api/`, `context/` чи `features/`.

**Вправа 8 (розгортання, 40 хв).** Зберіть проєкт і розгорніть на Netlify або
Vercel. Налаштуйте SPA-fallback і змінну середовища з адресою API. Пройдіть
чек-лист із розділу 14.1 і додайте звіт Lighthouse у `README`.

---

## 18. Корисні посилання

- [react.dev: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) —
  зокрема розділ про завантаження даних.
- [react.dev: Fetching data](https://react.dev/reference/react/useEffect#fetching-data-with-effects) —
  офіційні застереження й рекомендації.
- [react.dev: useOptimistic](https://react.dev/reference/react/useOptimistic).
- [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) —
  подивіться після завдання, щоб оцінити масштаб автоматизації.
- [Testing Library: React](https://testing-library.com/docs/react-testing-library/intro/)
  та [Guiding Principles](https://testing-library.com/docs/guiding-principles).
- [Vitest](https://vitest.dev/guide/).
- [Vite: Env Variables and Modes](https://vite.dev/guide/env-and-mode.html).
- [Vite: Building for Production](https://vite.dev/guide/build.html).
- [web.dev: Core Web Vitals](https://web.dev/articles/vitals).
- [Netlify: Redirects](https://docs.netlify.com/routing/redirects/) ·
  [Vercel: Rewrites](https://vercel.com/docs/project-configuration).
- [bulletproof-react](https://github.com/alan2207/bulletproof-react) —
  зразкова архітектура React-проєкту з поясненнями.

---

## 19. Література

1. **Barklund, M.** *React in Depth.* — Manning, 2024. — Розділи про роботу з
   віддаленими даними (TanStack Query), тестування й продакшен-збірку.
2. **Kumar, T.** *Fluent React.* — O'Reilly, 2024. — Продуктивність,
   профілювання, серверні компоненти.
3. **Firth, A.** *Practical Web Accessibility.* 2nd ed. — Apress, 2024. —
   Доступність динамічних застосунків: `aria-live`, керування фокусом.
4. **Wiggins, A.** *The Twelve-Factor App.* — [12factor.net](https://12factor.net/) —
   конфігурація через середовище (фактор III).

---

## 20. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Шар доступу до даних | data access layer | Модулі, що інкапсулюють роботу з API |
| Мутація | mutation | Операція, що змінює дані на сервері |
| Оптимістичне оновлення | optimistic update | Показ результату до відповіді сервера |
| Відкат | rollback | Повернення попереднього стану після помилки |
| Інвалідація кешу | cache invalidation | Позначення кешованих даних застарілими |
| Скелетон | skeleton | Заглушка у формі майбутнього вмісту |
| Презентаційний компонент | presentational component | Малює, не знає про джерело даних |
| Контейнерний компонент | container component | Керує даними й станом |
| Віртуалізація | virtualization | Рендеринг лише видимої частини списку |
| Розділення коду | code splitting | Розбиття збірки на частини |
| Змінна середовища | environment variable | Налаштування поза кодом |
| Жива область | live region | Область, зміни в якій озвучуються |
| Безперервна інтеграція | continuous integration | Автоматична перевірка при кожному push |

---

**Попередня:** [Лекція 9. React: маршрутизація, форми та валідація](09-react-routing-forms.md)
**Наступна:** [Лекція 11. Node.js: середовище виконання та екосистема](11-nodejs-runtime.md)

[← До змісту курсу](README.md)
