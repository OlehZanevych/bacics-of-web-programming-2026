# Лекція 9. React: маршрутизація, форми та валідація

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №3 «SPA на React.js»
> **Попередня лекція:** [Лекція 8](08-react-context-reducer.md)

---

## Про що ця лекція

Односторінковий застосунок (SPA) не перезавантажує сторінку — але користувач
усе одно очікує, що кнопка «Назад» працює, посилання можна скопіювати, а
закладка відкриє потрібний екран. За це відповідає **маршрутизація на
клієнті**.

Друга половина лекції — **форми**: те, через що в застосунок потрапляють усі
дані. Форма без продуманої валідації дратує користувача більше, ніж будь-яка
інша частина інтерфейсу.

---

## Зміст

1. [Як працює маршрутизація в SPA](#1-як-працює-маршрутизація-в-spa)
2. [React Router: налаштування](#2-react-router-налаштування)
3. [Навігація](#3-навігація)
4. [Параметри шляху](#4-параметри-шляху)
5. [Вкладені маршрути та спільний макет](#5-вкладені-маршрути-та-спільний-макет)
6. [Стан списку в query-параметрах](#6-стан-списку-в-query-параметрах)
7. [Захищені маршрути](#7-захищені-маршрути)
8. [Ліниве завантаження](#8-ліниве-завантаження)
9. [Сторінка 404 і межі помилок](#9-сторінка-404-і-межі-помилок)
10. [Форми: архітектура](#10-форми-архітектура)
11. [Валідація](#11-валідація)
12. [UX помилок](#12-ux-помилок)
13. [Робота із зображеннями](#13-робота-із-зображеннями)
14. [Захист від втрати даних](#14-захист-від-втрати-даних)
15. [Доступність форм](#15-доступність-форм)
16. [Типові помилки](#16-типові-помилки)
17. [Контрольні запитання](#17-контрольні-запитання)
18. [Практичні вправи](#18-практичні-вправи)
19. [Корисні посилання](#19-корисні-посилання)
20. [Література](#20-література)
21. [Глосарій](#21-глосарій)

---

## 1. Як працює маршрутизація в SPA

### 1.1. Багатосторінковий підхід проти SPA

**Класичний сайт (MPA):** клік по посиланню → запит на сервер → нова
HTML-сторінка → повне перезавантаження.

**SPA:** клік по посиланню → JavaScript перехоплює подію → змінює URL через
History API → рендерить інший компонент. **Жодного запиту до сервера за
розміткою.**

### 1.2. History API

```js
history.pushState({}, '', '/movies/42');     // змінює URL без перезавантаження
history.replaceState({}, '', '/movies/42');  // замінює поточний запис
history.back();
history.forward();

window.addEventListener('popstate', (e) => { … });   // натиснули «Назад»
```

React Router робить це за вас, але розуміти механізм корисно — саме тому
кнопка «Назад» працює й у SPA.

### 1.3. Важливе застереження для розгортання

Сервер має віддавати `index.html` **для будь-якого шляху**. Інакше при
відкритті `example.com/movies/42` напряму (не переходом усередині застосунку)
сервер шукатиме файл `/movies/42` і поверне 404.

Налаштування для типових платформ:

```
# Netlify — файл public/_redirects
/*    /index.html   200
```

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Для **GitHub Pages** штатного способу немає. Найпростіше рішення — скопіювати
`index.html` у `404.html` під час збірки. Альтернатива — використовувати
`HashRouter` (URL виду `/#/movies/42`), але виглядає це гірше.

⚠️ Це найчастіша причина, чому «локально все працює, а на GitHub Pages 404».

---

## 2. React Router: налаштування

```bash
npm install react-router
```

React Router 7 має три режими роботи:

| Режим | Опис | Коли |
|---|---|---|
| **Declarative** | звичні `<Routes>`/`<Route>` | наш випадок |
| **Data** | маршрути як об'єкти, `loader`/`action` | складніші застосунки |
| **Framework** | повноцінний фреймворк із SSR | окремий проєкт |

Для Завдання №3 достатньо декларативного режиму.

```jsx
// main.jsx
import { BrowserRouter } from 'react-router';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </BrowserRouter>
  </StrictMode>
);
```

```jsx
// App.jsx
import { Routes, Route } from 'react-router';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route path="items/new" element={<ItemFormPage mode="create" />} />
        <Route path="items/:id" element={<ItemDetailsPage />} />
        <Route path="items/:id/edit" element={<ItemFormPage mode="edit" />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
```

⚠️ Порядок маршрутів у React Router 7 не має значення — він сам обирає
найточніший збіг. Але `path="*"` за домовленістю ставлять останнім для
читабельності.

---

## 3. Навігація

### 3.1. `Link` і `NavLink`

```jsx
import { Link, NavLink } from 'react-router';

<Link to="/items">Список</Link>
<Link to={`/items/${item.id}`}>Деталі</Link>
<Link to="/items" state={{ from: 'home' }}>З додатковими даними</Link>

// NavLink знає, чи він активний
<NavLink
  to="/items"
  className={({ isActive }) => isActive ? 'nav__link nav__link--active' : 'nav__link'}
>
  Список
</NavLink>
```

⚠️ **Ніколи не використовуйте `<a href>` для внутрішніх переходів** — це
спричинить повне перезавантаження сторінки й втрату всього стану застосунку.
`<a href>` лишається для зовнішніх посилань.

**Доступність активного пункту:**

```jsx
<NavLink to="/items">
  {({ isActive }) => (
    <span aria-current={isActive ? 'page' : undefined}>Список</span>
  )}
</NavLink>
```

### 3.2. Програмна навігація

```jsx
import { useNavigate } from 'react-router';

function ItemForm() {
  const navigate = useNavigate();

  const handleSubmit = (data) => {
    const created = createItem(data);
    navigate(`/items/${created.id}`);              // перейти
  };

  const handleDelete = (id) => {
    deleteItem(id);
    navigate('/items', { replace: true });         // без запису в історію
  };

  return <button onClick={() => navigate(-1)}>Назад</button>;
}
```

🔑 `{ replace: true }` потрібен після видалення чи після входу: інакше кнопка
«Назад» поверне користувача на сторінку неіснуючого запису.

---

## 4. Параметри шляху

```jsx
<Route path="items/:id" element={<ItemDetailsPage />} />
```

```jsx
import { useParams, Navigate } from 'react-router';

function ItemDetailsPage() {
  const { id } = useParams();          // завжди РЯДОК
  const { items } = useData();

  const item = items.find(i => i.id === id);

  if (!item) return <Navigate to="/404" replace />;
  // або одразу відрендерити сторінку «не знайдено»:
  // if (!item) return <NotFoundPage message="Запис не знайдено" />;

  return (
    <article>
      <h1>{item.title}</h1>
      …
    </article>
  );
}
```

⚠️ Параметри маршруту — **завжди рядки**. Якщо `id` у даних числовий,
порівняння `i.id === id` не спрацює. Або приводьте (`Number(id)`), або
використовуйте рядкові ідентифікатори (`crypto.randomUUID()`).

---

## 5. Вкладені маршрути та спільний макет

```jsx
import { Outlet } from 'react-router';

function Layout() {
  return (
    <div className="layout">
      <a className="skip-link" href="#main">Перейти до основного вмісту</a>

      <header className="layout__header">
        <Link to="/" className="logo">Кінокаталог</Link>
        <nav aria-label="Основна навігація">
          <NavLink to="/items">Фільми</NavLink>
          <NavLink to="/categories">Жанри</NavLink>
          <NavLink to="/about">Про застосунок</NavLink>
        </nav>
      </header>

      <main id="main" className="layout__main">
        <Outlet />        {/* ← сюди підставляється поточний маршрут */}
      </main>

      <footer className="layout__footer">
        <p>© 2026 · Навчальний проєкт ФПМІ</p>
      </footer>
    </div>
  );
}
```

`<Outlet />` — місце, куди React Router вставляє дочірній маршрут. Шапка,
навігація й підвал рендеряться один раз і не перемальовуються при переходах.

**Прокручування вгору при переході.** React Router не робить цього
автоматично:

```jsx
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
```

---

## 6. Стан списку в query-параметрах

Це окрема вимога Завдання №3: **пошук, фільтри, сортування й номер сторінки
мають бути в URL**, щоб посилання можна було скопіювати й надіслати.

```jsx
import { useSearchParams } from 'react-router';

function ItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Читаємо з URL із значеннями за замовчуванням
  const search = searchParams.get('q') ?? '';
  const categoryId = searchParams.get('category') ?? '';
  const sortField = searchParams.get('sort') ?? 'title';
  const sortOrder = searchParams.get('order') ?? 'asc';
  const page = Number(searchParams.get('page') ?? 1);

  // Оновлюємо, зберігаючи решту параметрів
  const updateParams = (updates, { resetPage = true } = {}) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);

      for (const [key, value] of Object.entries(updates)) {
        if (value === '' || value == null) next.delete(key);
        else next.set(key, String(value));
      }
      if (resetPage) next.delete('page');

      return next;
    }, { replace: true });     // не засмічуємо історію кожним символом
  };

  return (
    <>
      <SearchBar value={search} onChange={q => updateParams({ q })} />
      <CategoryFilter value={categoryId} onChange={c => updateParams({ category: c })} />
      <SortControl
        field={sortField} order={sortOrder}
        onChange={(sort, order) => updateParams({ sort, order }, { resetPage: false })}
      />
      <ItemList …/>
      <Pagination
        page={page}
        onChange={p => updateParams({ page: p }, { resetPage: false })}
      />
    </>
  );
}
```

🔑 Три деталі:

1. **`replace: true`** для пошуку: інакше кожен введений символ створить запис
   в історії, і кнопка «Назад» стане непридатною.
2. **Порожні значення видаляємо** з URL, а не пишемо `?q=` — адреса лишається
   чистою.
3. **Скидання сторінки** при зміні фільтрів — те саме правило, що й у
   редюсері з лекції 8.

**Пагінація:**

```jsx
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = buildPageList(page, totalPages);   // [1, '…', 4, 5, 6, '…', 20]

  return (
    <nav className="pagination" aria-label="Навігація сторінками">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1}>
        ← Попередня
      </button>

      <ul className="pagination__list">
        {pages.map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} aria-hidden="true">…</li>
          ) : (
            <li key={p}>
              <button
                type="button"
                onClick={() => onChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={p === page ? 'is-active' : ''}
              >
                {p}
              </button>
            </li>
          )
        )}
      </ul>

      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages}>
        Наступна →
      </button>
    </nav>
  );
}
```

---

## 7. Захищені маршрути

```jsx
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // Запам'ятовуємо, куди хотіли, щоб повернути після входу
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return children;
}
```

```jsx
<Route
  path="items/new"
  element={<RequireAuth><ItemFormPage mode="create" /></RequireAuth>}
/>
```

Повернення після входу:

```jsx
function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname ?? '/items';

  const handleSubmit = async (credentials) => {
    await signIn(credentials);
    navigate(from, { replace: true });
  };
  …
}
```

⚠️ Захист маршруту на клієнті — **зручність, а не безпека**. Будь-хто може
відкрити DevTools і показати сторінку. Реальний захист — на сервері
(лекція 14).

---

## 8. Ліниве завантаження

```jsx
import { lazy, Suspense } from 'react';

const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const StatsPage = lazy(() => import('./pages/StatsPage.jsx'));

<Route
  path="about"
  element={
    <Suspense fallback={<PageSkeleton />}>
      <AboutPage />
    </Suspense>
  }
/>
```

Vite автоматично виділить ці сторінки в окремі файли, і вони завантажаться
лише при переході. Для великих сторінок (зі складними бібліотеками, графіками)
це помітно пришвидшує перший запуск.

⚠️ Не робіть лінивими всі маршрути підряд: перехід почне «блимати»
заглушкою. Виносьте великі й рідко відвідувані сторінки.

---

## 9. Сторінка 404 і межі помилок

```jsx
function NotFoundPage({ message = 'Сторінку не знайдено' }) {
  return (
    <div className="not-found">
      <h1>404</h1>
      <p>{message}</p>
      <Link to="/items">Повернутися до списку</Link>
    </div>
  );
}
```

**Межа помилок (Error Boundary)** ловить помилки рендерингу й не дає «білого
екрана»:

```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Помилка рендерингу:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <h2>Щось пішло не так</h2>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={() => this.setState({ error: null })}>
            Спробувати ще раз
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

⚠️ Це **єдине** місце в сучасному React, де класовий компонент обов'язковий:
хука-аналога поки що немає. Готова альтернатива — бібліотека
[react-error-boundary](https://github.com/bvaughn/react-error-boundary).

⚠️ Межа помилок **не ловить**: помилки в обробниках подій, в асинхронному коді
й у самій межі. Для них — звичайний `try/catch`.

---

## 10. Форми: архітектура

### 10.1. Один компонент для створення й редагування

Вимога Завдання №3 — форма має бути **одним переюзаним компонентом**.

```jsx
function ItemForm({ initialValues, onSubmit, submitLabel = 'Зберегти' }) {
  const [values, setValues] = useState(initialValues ?? emptyValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));

    // Прибираємо помилку одразу, щойно поле стало валідним
    if (errors[name]) {
      const fieldError = validateField(name, value, values);
      if (!fieldError) setErrors(prev => { const { [name]: _, ...rest } = prev; return rest; });
    }
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const fieldError = validateField(name, value, values);
    setErrors(prev => fieldError ? { ...prev, [name]: fieldError } : prev);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const allErrors = validateAll(values);
    setErrors(allErrors);
    setTouched(Object.fromEntries(Object.keys(values).map(k => [k, true])));

    if (Object.keys(allErrors).length > 0) {
      focusFirstError(allErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      …
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Збереження…' : submitLabel}
      </button>
    </form>
  );
}
```

```jsx
// Створення
<ItemForm onSubmit={handleCreate} submitLabel="Створити" />

// Редагування — той самий компонент
<ItemForm initialValues={item} onSubmit={handleUpdate} submitLabel="Зберегти зміни" />
```

### 10.2. Переюзане поле

```jsx
function Field({ label, name, error, touched, hint, children }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const showError = touched && error;

  return (
    <div className={clsx('field', showError && 'field--invalid')}>
      <label className="field__label" htmlFor={id}>{label}</label>

      {cloneElement(children, {
        id,
        name,
        'aria-invalid': showError ? 'true' : undefined,
        'aria-describedby': [hint && hintId, showError && errorId].filter(Boolean).join(' ') || undefined,
      })}

      {hint && <p className="field__hint" id={hintId}>{hint}</p>}
      {showError && <p className="field__error" id={errorId} role="alert">{error}</p>}
    </div>
  );
}
```

```jsx
<Field label="Назва" name="title" error={errors.title} touched={touched.title}
       hint="Від 2 до 100 символів">
  <input type="text" value={values.title} onChange={handleChange} onBlur={handleBlur} />
</Field>
```

---

## 11. Валідація

У Завданні №3 бібліотеки валідації **заборонені** — пишемо самі. Це корисно:
ви побачите, що саме роблять Zod чи Yup.

### 11.1. Правила як дані

```js
// validation/rules.js
export const required = (message = 'Обов\'язкове поле') =>
  (value) => (value == null || String(value).trim() === '' ? message : null);

export const minLength = (min, message) =>
  (value) => (String(value).trim().length < min
    ? message ?? `Мінімум ${min} символів`
    : null);

export const maxLength = (max, message) =>
  (value) => (String(value).length > max
    ? message ?? `Максимум ${max} символів`
    : null);

export const numberRange = (min, max, message) =>
  (value) => {
    const n = Number(value);
    if (Number.isNaN(n)) return 'Має бути числом';
    if (n < min || n > max) return message ?? `Значення від ${min} до ${max}`;
    return null;
  };

export const pattern = (regex, message) =>
  (value) => (!regex.test(String(value)) ? message : null);

export const url = (message = 'Некоректне посилання') =>
  (value) => {
    if (!value) return null;
    try { new URL(value); return null; } catch { return message; }
  };

// Унікальність серед наявних записів — вимога завдання
export const uniqueTitle = (items, currentId, message = 'Такий запис уже існує') =>
  (value) => items.some(i =>
    i.id !== currentId &&
    i.title.trim().toLowerCase() === String(value).trim().toLowerCase()
  ) ? message : null;
```

### 11.2. Схема й перевірка

```js
// validation/itemSchema.js
export function buildSchema(items, currentId) {
  return {
    title:       [required(), minLength(2), maxLength(100), uniqueTitle(items, currentId)],
    year:        [required(), numberRange(1888, 2100)],
    description: [maxLength(1000)],
    posterUrl:   [url()],
    categoryId:  [required('Оберіть категорію')],
  };
}

export function validateField(name, value, schema) {
  for (const rule of schema[name] ?? []) {
    const error = rule(value);
    if (error) return error;         // повертаємо ПЕРШУ помилку поля
  }
  return null;
}

export function validateAll(values, schema) {
  const errors = {};
  for (const name of Object.keys(schema)) {
    const error = validateField(name, values[name], schema);
    if (error) errors[name] = error;
  }
  return errors;
}
```

🔑 Такий підхід — це фактично те, що роблять бібліотеки валідації: правила
описані декларативно, окремо від компонента, і їх можна тестувати.

### 11.3. П'ять обов'язкових перевірок для Завдання №3

1. **Обов'язковість** — `required()`.
2. **Довжина** — `minLength` / `maxLength`.
3. **Числовий діапазон** — `numberRange`.
4. **Формат** — `url()` або `pattern()` для e-mail.
5. **Унікальність** назви серед наявних записів — `uniqueTitle`.

---

## 12. UX помилок

Це те, що відрізняє «просто працює» від «приємно користуватися».

### 12.1. Коли показувати помилку

| Момент | Показувати? |
|---|---|
| Під час першого введення | ❌ ні — користувач ще не закінчив |
| Після втрати фокуса (`blur`) | ✅ так |
| Після спроби відправити | ✅ так, усі одразу |
| Під час виправлення вже помилкового поля | ✅ так — прибрати, щойно стало валідним |

Ця асиметрія важлива: помилка з'являється «пізно», а зникає «рано». Так
користувач не почувається так, ніби на нього кричать, і одразу бачить, що
виправив правильно.

### 12.2. Формулювання

| Погано | Добре |
|---|---|
| «Помилка» | «Назва має містити щонайменше 2 символи» |
| «Invalid input» | «Введіть рік від 1888 до 2100» |
| «Поле заповнене неправильно» | «Посилання має починатися з http:// або https://» |

Повідомлення має казати **що не так** і **як виправити**.

### 12.3. Кнопка відправки

```jsx
<button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Збереження…' : 'Зберегти'}
</button>
```

⚠️ **Не блокуйте кнопку, поки форма невалідна.** Це поширена, але шкідлива
практика: користувач бачить неактивну кнопку й не розуміє, чого від нього
хочуть. Краще дати натиснути, показати всі помилки й перевести фокус на першу.

Блокувати варто лише **під час відправки**, щоб уникнути подвійного надсилання.

### 12.4. Фокус на першу помилку

```jsx
function focusFirstError(errors) {
  const firstName = Object.keys(errors)[0];
  const element = document.querySelector(`[name="${firstName}"]`);
  element?.focus();
  element?.scrollIntoView({ block: 'center', behavior: 'smooth' });
}
```

### 12.5. Зведення помилок

Для довгих форм корисно показати список угорі:

```jsx
{submitAttempted && Object.keys(errors).length > 0 && (
  <div className="form-errors" role="alert" tabIndex={-1} ref={errorSummaryRef}>
    <h2>Виправте {Object.keys(errors).length} помил{Object.keys(errors).length === 1 ? 'ку' : 'ки'}:</h2>
    <ul>
      {Object.entries(errors).map(([name, message]) => (
        <li key={name}><a href={`#${name}`}>{message}</a></li>
      ))}
    </ul>
  </div>
)}
```

---

## 13. Робота із зображеннями

Вимога Завдання №3: можливість оновити фотографію — завантаженням файлу або
посиланням, із попереднім переглядом.

```jsx
function ImageField({ value, onChange }) {
  const [preview, setPreview] = useState(value ?? '');
  const [error, setError] = useState(null);

  const MAX_SIZE = 2 * 1024 * 1024;   // 2 МБ

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Файл має бути зображенням (JPEG, PNG, WebP)');
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(`Розмір не має перевищувати ${MAX_SIZE / 1024 / 1024} МБ`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      onChange(reader.result);          // data URL
    };
    reader.onerror = () => setError('Не вдалося прочитати файл');
    reader.readAsDataURL(file);
  };

  const handleUrl = (event) => {
    const url = event.target.value;
    setPreview(url);
    onChange(url);
  };

  return (
    <div className="image-field">
      <div className="image-field__preview">
        {preview ? (
          <img src={preview} alt="Попередній перегляд"
               onError={() => setError('Не вдалося завантажити зображення')} />
        ) : (
          <div className="image-field__placeholder" aria-hidden="true">Немає зображення</div>
        )}
      </div>

      <label>
        Завантажити файл
        <input type="file" accept="image/*" onChange={handleFile} />
      </label>

      <label>
        Або вставити посилання
        <input type="url" value={typeof value === 'string' && !value.startsWith('data:') ? value : ''}
               onChange={handleUrl} placeholder="https://…" />
      </label>

      {error && <p className="field__error" role="alert">{error}</p>}
    </div>
  );
}
```

⚠️ `data:` URL великого зображення легко перевищить квоту `localStorage`
(~5 МБ). Тому обмеження розміру обов'язкове. У Завданні №5, коли з'явиться
сервер, файли завантажуватимуться туди.

**Заглушка при помилці завантаження:**

```jsx
<img
  src={item.posterUrl || '/placeholder.svg'}
  alt={item.title}
  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
/>
```

---

## 14. Захист від втрати даних

```jsx
function useUnsavedChangesWarning(isDirty) {
  // Попередження при закритті вкладки або перезавантаженні
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event) => { event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

Для переходу всередині застосунку — власне підтвердження:

```jsx
function ItemFormPage() {
  const [isDirty, setIsDirty] = useState(false);
  const [pendingPath, setPendingPath] = useState(null);
  const navigate = useNavigate();

  useUnsavedChangesWarning(isDirty);

  const handleCancel = () => {
    if (isDirty) setPendingPath('/items');   // відкриваємо модальне вікно
    else navigate('/items');
  };

  return (
    <>
      <ItemForm onDirtyChange={setIsDirty} … />

      <ConfirmDialog
        open={pendingPath !== null}
        title="Незбережені зміни"
        message="Ви внесли зміни, які не збережено. Залишити сторінку?"
        confirmLabel="Залишити"
        cancelLabel="Продовжити редагування"
        onConfirm={() => navigate(pendingPath)}
        onCancel={() => setPendingPath(null)}
      />
    </>
  );
}
```

`isDirty` визначається порівнянням поточних значень із початковими:

```js
const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);
```

---

## 15. Доступність форм

Обов'язковий мінімум:

```jsx
<div className="field">
  <label htmlFor="title">Назва</label>
  <input
    id="title"
    name="title"
    type="text"
    value={values.title}
    onChange={handleChange}
    onBlur={handleBlur}
    aria-invalid={showError ? 'true' : undefined}
    aria-describedby={showError ? 'title-error' : 'title-hint'}
    autoComplete="off"
  />
  <p id="title-hint" className="field__hint">Від 2 до 100 символів</p>
  {showError && (
    <p id="title-error" className="field__error" role="alert">{errors.title}</p>
  )}
</div>
```

| Атрибут | Навіщо |
|---|---|
| `htmlFor` / `id` | зв'язує підпис із полем |
| `aria-invalid` | екранний читач повідомляє про помилку |
| `aria-describedby` | зачитує підказку й текст помилки |
| `role="alert"` | нове повідомлення озвучується одразу |
| `autoComplete` | автозаповнення браузером |

**Групи полів:**

```jsx
<fieldset>
  <legend>Формат видання</legend>
  <label><input type="radio" name="format" value="digital" … /> Цифровий</label>
  <label><input type="radio" name="format" value="disc" … /> Диск</label>
</fieldset>
```

**Модальне вікно** (потрібне для підтвердження видалення) має:

- `role="dialog"` і `aria-modal="true"`;
- підпис через `aria-labelledby`;
- закриття по `Escape` і кліку по підкладці;
- **пастку фокуса** всередині;
- повернення фокуса на елемент, що його відкрив;
- блокування прокручування фону.

Найпростіший спосіб отримати більшість цього безкоштовно — нативний
`<dialog>`:

```jsx
function ConfirmDialog({ open, title, message, onConfirm, onCancel }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} onClose={onCancel} className="dialog" aria-labelledby="dlg-title">
      <h2 id="dlg-title">{title}</h2>
      <p>{message}</p>
      <div className="dialog__actions">
        <button type="button" onClick={onCancel}>Скасувати</button>
        <button type="button" onClick={onConfirm} className="btn--danger">Видалити</button>
      </div>
    </dialog>
  );
}
```

`showModal()` дає пастку фокуса, підкладку та закриття по `Escape`
автоматично.

⚠️ Але Завдання №3 вимагає **перетягуване** модальне вікно власної реалізації —
там доведеться реалізувати пастку фокуса вручну (див. ARIA APG за посиланням
нижче).

---

## 16. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | `<a href>` для внутрішніх переходів | Перезавантаження, втрата стану | `<Link>` |
| 2 | Немає налаштування SPA-fallback на хостингу | 404 при прямому відкритті | `_redirects` / `404.html` |
| 3 | Порівняння `item.id === id` з числовим id | Нічого не знайдено | Привести тип |
| 4 | Немає `replace: true` після видалення | «Назад» веде на неіснуючий запис | Додати |
| 5 | Пошук у query без `replace` | Історія забита, «Назад» непридатний | `{ replace: true }` |
| 6 | Порожні параметри в URL (`?q=&page=`) | Брудна адреса | Видаляти порожні |
| 7 | Немає `<Route path="*">` | Порожній екран при неправильному URL | Сторінка 404 |
| 8 | Помилки одразу під час введення | Дратує користувача | Після `blur` або відправки |
| 9 | Кнопка заблокована, поки форма невалідна | Незрозуміло, що робити | Блокувати лише під час відправки |
| 10 | «Помилка» замість пояснення | Користувач не знає, що виправити | Конкретне формулювання |
| 11 | Немає `<label>` | Поле недоступне | Завжди підпис |
| 12 | Валідація лише на клієнті | Дані можна підробити | Дублювати на сервері |
| 13 | Дві окремі форми для створення й редагування | Дублювання коду | Один компонент |
| 14 | Немає обмеження розміру зображення | Переповнення `localStorage` | Перевірка `file.size` |
| 15 | Немає попередження про незбережені зміни | Втрата роботи користувача | `beforeunload` + діалог |
| 16 | Клієнтський захист маршруту вважають безпекою | Дані доступні через API | Перевірка на сервері |

---

## 17. Контрольні запитання

1. Як SPA змінює URL без перезавантаження сторінки?
2. Чому при відкритті `/items/42` напряму сервер може повернути 404 і як це
   виправити?
3. Чим `<Link>` відрізняється від `<a href>`?
4. Навіщо `NavLink` і як позначити активний пункт для екранного читача?
5. Коли потрібен `navigate(path, { replace: true })`?
6. Якого типу значення повертає `useParams()`?
7. Що робить `<Outlet />`?
8. Навіщо тримати стан списку в query-параметрах?
9. Чому при зміні пошуку потрібен `replace: true`?
10. Як реалізувати повернення на потрібну сторінку після входу?
11. Що ловить і чого **не** ловить Error Boundary?
12. Чому клієнтський захист маршруту не є безпекою?
13. Коли показувати помилку валідації, а коли — прибирати?
14. Чому не варто блокувати кнопку відправки при невалідній формі?
15. Які ARIA-атрибути потрібні полю з помилкою?
16. Що дає нативний `<dialog>` порівняно з `<div>`-модалкою?

---

## 18. Практичні вправи

**Вправа 1 (маршрути, 30 хв).** Налаштуйте шість маршрутів зі спільним
макетом і сторінкою 404. Перевірте роботу кнопок «Назад»/«Вперед» та пряме
відкриття кожного URL.

**Вправа 2 (деталі, 25 хв).** Сторінка `/items/:id`: показ запису, обробка
неіснуючого `id`, кнопки «Редагувати» й «Назад до списку».

**Вправа 3 (стан в URL, 45 хв).** Перенесіть пошук, фільтр за категорією,
сортування й номер сторінки у query-параметри. Перевірте: скопіюйте URL,
відкрийте в новій вкладці — має відновитися той самий вигляд списку.

**Вправа 4 (форма, 60 хв).** Реалізуйте форму з усіма типами полів,
компонентом `Field`, схемою валідації з п'яти правил і правильним UX помилок.

**Вправа 5 (зображення, 30 хв).** Додайте поле зображення з двома способами
введення, попереднім переглядом, валідацією типу й розміру та заглушкою при
помилці завантаження.

**Вправа 6 (доступність, 30 хв).** Пройдіть свою форму лише клавіатурою.
Перевірте: чи видно фокус; чи озвучуються помилки (увімкніть екранний читач —
VoiceOver на macOS, NVDA на Windows); чи модальне вікно повертає фокус.
Запустіть Lighthouse — Accessibility має бути ≥ 90.

**Вправа 7 (незбережені зміни, 25 хв).** Додайте попередження при спробі
залишити сторінку з незбереженою формою — і для закриття вкладки, і для
внутрішнього переходу.

---

## 19. Корисні посилання

- [React Router — офіційна документація](https://reactrouter.com/) — почніть
  з [Picking a Mode](https://reactrouter.com/start/modes).
- [React Router: Navigating](https://reactrouter.com/start/declarative/navigating).
- [MDN: History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API).
- [react.dev: Reacting to Input with State](https://react.dev/learn/reacting-to-input-with-state) —
  як мислити про стани форми.
- [W3C ARIA APG: Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) —
  еталонна реалізація, з пасткою фокуса.
- [W3C WAI: Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/) —
  доступні форми, включно з повідомленнями про помилки.
- [MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation).
- [Adam Silver: Form Design Patterns](https://adamsilver.io/articles/) —
  статті про UX форм; автор однойменної книги.
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary).
- [Zod](https://zod.dev/) — подивіться після виконання завдання, щоб оцінити,
  що саме ви реалізували вручну.

---

## 20. Література

1. **Barklund, M.** *React in Depth.* — Manning, 2024. — Маршрутизація, форми,
   робота з даними, продакшен-практики.
2. **Silver, A.** *Form Design Patterns.* — Smashing Magazine, 2018. —
   Найкраща книга про проєктування форм: валідація, помилки, доступність.
3. **Pickering, H.** *Inclusive Components.* — Smashing Magazine, 2018. —
   Доступні модальні вікна, меню, вкладки.
4. **Firth, A.** *Practical Web Accessibility.* 2nd ed. — Apress, 2024. —
   Керування фокусом і ARIA у динамічних інтерфейсах.

---

## 21. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Односторінковий застосунок | SPA | Застосунок без перезавантаження сторінок |
| Маршрутизація | routing | Зіставлення URL із компонентом |
| Маршрут | route | Правило «шлях → компонент» |
| Параметр шляху | path parameter | Змінна частина URL (`/items/:id`) |
| Параметри запиту | query parameters | Пари після `?` |
| Вкладений маршрут | nested route | Маршрут усередині іншого |
| Місце виводу | outlet | Точка вставки дочірнього маршруту |
| Захищений маршрут | protected route | Доступний лише авторизованим |
| Ліниве завантаження | lazy loading | Завантаження коду на вимогу |
| Розділення коду | code splitting | Розбиття збірки на частини |
| Межа помилок | error boundary | Компонент, що ловить помилки рендерингу |
| Керований компонент | controlled component | Поле, значення якого зберігає React |
| Торкнуте поле | touched field | Поле, з якого користувач уже виходив |
| Забруднена форма | dirty form | Форма зі зміненими значеннями |
| Пастка фокуса | focus trap | Утримання фокуса всередині модального вікна |

---

**Попередня:** [Лекція 8. React: керування станом — Context і Reducer](08-react-context-reducer.md)
**Наступна:** [Лекція 10. React: робота з API, архітектура та якість застосунку](10-react-api-architecture.md)

[← До змісту курсу](README.md)
