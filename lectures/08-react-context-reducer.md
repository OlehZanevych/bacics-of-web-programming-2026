# Лекція 8. React: керування станом — Context і Reducer

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №3 «SPA на React.js» — це ядро завдання
> **Попередня лекція:** [Лекція 7](07-react-hooks-effects.md)

---

## Про що ця лекція

Ви вмієте піднімати стан до спільного предка. Але коли застосунок зростає, це
дає дві проблеми: стан «розповзається» по десятку `useState`, а props
доводиться протягувати через компоненти, яким вони не потрібні.

Ця лекція — про два вбудовані інструменти, що це розв'язують: **`useReducer`**
(упорядковує логіку зміни стану) і **Context** (доставляє дані вглиб дерева без
протягування). Разом вони дають повноцінний менеджер стану без жодної
сторонньої бібліотеки — саме те, що вимагає Завдання №3.

---

## Зміст

1. [Проблема: багато `useState`](#1-проблема-багато-usestate)
2. [`useReducer`: ідея](#2-usereducer-ідея)
3. [Дії та їх творці](#3-дії-та-їх-творці)
4. [Чистий редюсер](#4-чистий-редюсер)
5. [Проєктування структури стану](#5-проєктування-структури-стану)
6. [Проблема prop drilling](#6-проблема-prop-drilling)
7. [Context API](#7-context-api)
8. [Власний хук доступу](#8-власний-хук-доступу)
9. [Context + Reducer: повний приклад](#9-context--reducer-повний-приклад)
10. [Похідні дані](#10-похідні-дані)
11. [Оптимізація перерендерів](#11-оптимізація-перерендерів)
12. [Синхронізація з `localStorage`](#12-синхронізація-з-localstorage)
13. [Огляд екосистеми](#13-огляд-екосистеми)
14. [Типові помилки](#14-типові-помилки)
15. [Контрольні запитання](#15-контрольні-запитання)
16. [Практичні вправи](#16-практичні-вправи)
17. [Корисні посилання](#17-корисні-посилання)
18. [Література](#18-література)
19. [Глосарій](#19-глосарій)

---

## 1. Проблема: багато `useState`

Типова сторінка списку швидко обростає станом:

```jsx
function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState('');
  const [genreId, setGenreId] = useState(null);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // …і так далі
}
```

Що тут не так:

1. **Пов'язані оновлення розсипані.** Зміна пошуку має скидати сторінку на
   першу. Про це треба пам'ятати в **кожному** місці, де змінюється пошук.
2. **Логіка змішана з розміткою.** Функція компонента займається і тим, і тим.
3. **Неможливо протестувати** без рендерингу компонента.
4. **Важко відстежити,** що і чому змінилося.

```jsx
// Ця пара має бути нерозривною, але легко забути другий рядок
setQuery(value);
setPage(1);        // ← забули в одному з трьох місць → баг
```

🔑 **Сигнали, що час переходити на `useReducer`:**

- понад 4–5 пов'язаних змінних стану;
- одна дія змінює кілька змінних одночасно;
- нове значення залежить від попереднього нетривіально;
- логіку оновлення хочеться протестувати окремо.

---

## 2. `useReducer`: ідея

**Редюсер** — чиста функція, що приймає поточний стан і **дію** та повертає
новий стан:

```
(state, action) => newState
```

```jsx
import { useReducer } from 'react';

const initialState = { count: 0, step: 1 };

function counterReducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    case 'reset':
      return initialState;
    default:
      throw new Error(`Невідома дія: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(counterReducer, initialState);

  return (
    <>
      <p>{state.count}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+{state.step}</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>−{state.step}</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Скинути</button>
      <input
        type="number"
        value={state.step}
        onChange={e => dispatch({ type: 'setStep', payload: Number(e.target.value) })}
      />
    </>
  );
}
```

### Що змінилося порівняно з `useState`

| | `useState` | `useReducer` |
|---|---|---|
| Опис зміни | «встанови значення X» | «сталася подія Y» |
| Логіка | у компоненті | у чистій функції поза компонентом |
| Пов'язані оновлення | вручну, у кожному місці | в одному місці — у редюсері |
| Тестування | потрібен рендер | звичайний виклик функції |
| Відстеження | важко | усі дії проходять через `dispatch` |

🔑 Головна ідея: компонент **описує, що сталося**, а не **як змінити стан**.
Це те саме розділення, що й між «клікнули кнопку видалення» та «прибрати
елемент із масиву і скинути виділення».

---

## 3. Дії та їх творці

### 3.1. Структура дії

Усталена форма (стандарт Flux):

```js
{ type: 'ITEM_UPDATED', payload: { id, changes } }
```

- `type` — рядок, **що саме сталося** (обов'язково);
- `payload` — дані, потрібні для обробки.

### 3.2. Константи типів

```js
// store/actionTypes.js
export const ITEMS_LOADED   = 'ITEMS_LOADED';
export const ITEM_CREATED   = 'ITEM_CREATED';
export const ITEM_UPDATED   = 'ITEM_UPDATED';
export const ITEM_DELETED   = 'ITEM_DELETED';
export const SEARCH_CHANGED = 'SEARCH_CHANGED';
export const FILTER_CHANGED = 'FILTER_CHANGED';
export const SORT_CHANGED   = 'SORT_CHANGED';
export const PAGE_CHANGED   = 'PAGE_CHANGED';
export const FILTERS_RESET  = 'FILTERS_RESET';
```

Навіщо константи: описка в рядку `'ITEM_UPDTED'` мовчки не спрацює, а описка
в імені константи одразу дасть `ReferenceError`. Плюс автодоповнення в редакторі.

### 3.3. Творці дій

```js
// store/actions.js
import * as T from './actionTypes.js';

export const itemsLoaded  = (items)        => ({ type: T.ITEMS_LOADED, payload: items });
export const itemCreated  = (item)         => ({ type: T.ITEM_CREATED, payload: item });
export const itemUpdated  = (id, changes)  => ({ type: T.ITEM_UPDATED, payload: { id, changes } });
export const itemDeleted  = (id)           => ({ type: T.ITEM_DELETED, payload: id });
export const searchChanged = (query)       => ({ type: T.SEARCH_CHANGED, payload: query });
export const filterChanged = (name, value) => ({ type: T.FILTER_CHANGED, payload: { name, value } });
export const sortChanged  = (field, order) => ({ type: T.SORT_CHANGED, payload: { field, order } });
export const pageChanged  = (page)         => ({ type: T.PAGE_CHANGED, payload: page });
export const filtersReset  = ()            => ({ type: T.FILTERS_RESET });
```

Це дає:

- **єдине місце** знання про форму дії;
- зрозумілий виклик у компоненті: `dispatch(itemDeleted(id))`;
- місце для перевірок і нормалізації даних.

---

## 4. Чистий редюсер

### 4.1. Вимоги

Редюсер **зобов'язаний** бути чистою функцією:

1. Не мутує `state` — повертає новий об'єкт.
2. Не має побічних ефектів: жодних запитів, `localStorage`, `Math.random()`,
   `Date.now()`, `console.log` у бойовому коді.
3. За однакових `(state, action)` завжди повертає однаковий результат.

```jsx
// ❌ Нечисто
function badReducer(state, action) {
  state.items.push(action.payload);          // мутація
  localStorage.setItem('items', …);          // побічний ефект
  return { ...state, id: Date.now() };       // недетермінованість
}

// ✅ Чисто
function reducer(state, action) {
  switch (action.type) {
    case T.ITEM_CREATED:
      return { ...state, items: [...state.items, action.payload] };
    default:
      return state;
  }
}
```

Ідентифікатор і час створення генеруються **у творці дії** або в обробнику,
а в редюсер приходять уже готовими:

```js
export const itemCreated = (data) => ({
  type: T.ITEM_CREATED,
  payload: { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
});
```

### 4.2. Повний редюсер для Завдання №3

```js
// store/reducer.js
import * as T from './actionTypes.js';

export const initialState = {
  items: [],
  search: '',
  filters: { categoryId: null, tagIds: [], yearFrom: null, yearTo: null },
  sort: { field: 'title', order: 'asc' },
  page: 1,
  pageSize: 12,
  selectedId: null,
};

export function reducer(state, action) {
  switch (action.type) {
    case T.ITEMS_LOADED:
      return { ...state, items: action.payload, page: 1 };

    case T.ITEM_CREATED:
      return { ...state, items: [action.payload, ...state.items] };

    case T.ITEM_UPDATED: {
      const { id, changes } = action.payload;
      return {
        ...state,
        items: state.items.map(item =>
          item.id === id ? { ...item, ...changes } : item
        ),
      };
    }

    case T.ITEM_DELETED:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
        selectedId: state.selectedId === action.payload ? null : state.selectedId,
      };

    case T.SEARCH_CHANGED:
      // Пов'язане оновлення в ОДНОМУ місці — забути неможливо
      return { ...state, search: action.payload, page: 1 };

    case T.FILTER_CHANGED: {
      const { name, value } = action.payload;
      return {
        ...state,
        filters: { ...state.filters, [name]: value },
        page: 1,
      };
    }

    case T.SORT_CHANGED:
      return { ...state, sort: { field: action.payload.field, order: action.payload.order } };

    case T.PAGE_CHANGED:
      return { ...state, page: Math.max(1, action.payload) };

    case T.FILTERS_RESET:
      return {
        ...state,
        search: '',
        filters: initialState.filters,
        page: 1,
      };

    default:
      return state;
  }
}
```

🔑 Зверніть увагу на `SEARCH_CHANGED` і `FILTER_CHANGED`: скидання сторінки
описане **один раз**. Проблема з розділу 1 зникла структурно, а не завдяки
уважності розробника.

### 4.3. Тестування редюсера

Оскільки це звичайна функція, її можна перевірити без React:

```js
// reducer.test.js
import { reducer, initialState } from './reducer.js';
import { searchChanged, itemDeleted } from './actions.js';

test('зміна пошуку скидає сторінку', () => {
  const state = { ...initialState, page: 5 };
  const next = reducer(state, searchChanged('матриця'));

  expect(next.search).toBe('матриця');
  expect(next.page).toBe(1);
});

test('видалення знімає виділення з видаленого елемента', () => {
  const state = { ...initialState, items: [{ id: 'a' }], selectedId: 'a' };
  const next = reducer(state, itemDeleted('a'));

  expect(next.items).toHaveLength(0);
  expect(next.selectedId).toBeNull();
  expect(state.items).toHaveLength(1);   // оригінал не змінився
});
```

---

## 5. Проєктування структури стану

### 5.1. Пласка структура краща за вкладену

```js
// ❌ Глибока вкладеність — болісні оновлення
{
  data: { movies: { byGenre: { action: { list: [...] } } } }
}

// ✅ Пласко
{
  items: [...],
  filters: {...},
  page: 1,
}
```

### 5.2. Нормалізація для великих наборів

Якщо елементів багато й до них часто звертаються за `id`:

```js
// Замість масиву
{ items: [{ id: 'a', … }, { id: 'b', … }] }

// Словник + порядок
{
  itemsById: { a: {…}, b: {…} },
  itemIds: ['a', 'b'],
}
```

Пошук за `id` стає O(1), оновлення одного елемента не зачіпає інші. Для
Завдання №3 (25+ записів) достатньо звичайного масиву — але знати підхід
корисно.

### 5.3. Не зберігайте похідне

```js
// ❌
{ items: [...], filteredItems: [...], totalCount: 42, hasResults: true }

// ✅ Обчислюємо (розділ 10)
{ items: [...], search: '', filters: {…} }
```

### 5.4. Уникайте суперечливих станів

```js
// ❌ Можливий стан isLoading && hasError && data — що це означає?
{ isLoading: false, hasError: false, data: null }

// ✅ Один статус — суперечності неможливі
{ status: 'idle' | 'loading' | 'success' | 'error', data: null, error: null }
```

---

## 6. Проблема prop drilling

```jsx
// Стан живе тут
<App items={items} onDelete={handleDelete}>
  <Layout items={items} onDelete={handleDelete}>          {/* не потрібно */}
    <MainContent items={items} onDelete={handleDelete}>   {/* не потрібно */}
      <ItemList items={items} onDelete={handleDelete}>    {/* не потрібно */}
        <ItemCard item={item} onDelete={onDelete} />      {/* ← ось кому треба */}
```

Наслідки: зайві props у проміжних компонентах, перейменування prop зачіпає
п'ять файлів, компоненти неможливо переставити місцями.

⚠️ Але **prop drilling через один-два рівні — це нормально**. Не тягніть
Context туди, де достатньо props: Context ускладнює перевикористання
компонентів (вони починають залежати від контексту).

**Альтернатива без Context — композиція через `children`:**

```jsx
// Замість того, щоб Layout приймав items і передавав далі,
// передаємо йому вже готовий вміст
<Layout>
  <ItemList items={items} onDelete={handleDelete} />
</Layout>
```

---

## 7. Context API

**Context** дозволяє «телепортувати» дані з компонента-провайдера до будь-якого
нащадка, оминаючи проміжні рівні.

```jsx
import { createContext, useContext } from 'react';

// 1. Створюємо контекст
const ThemeContext = createContext('light');

// 2. Надаємо значення піддереву
function App() {
  const [theme, setTheme] = useState('light');
  return (
    <ThemeContext.Provider value={theme}>
      <Layout />
    </ThemeContext.Provider>
  );
}

// 3. Споживаємо на будь-якій глибині
function Button() {
  const theme = useContext(ThemeContext);
  return <button className={`btn btn--${theme}`}>Кнопка</button>;
}
```

У React 19 сам контекст можна використовувати як провайдер — `.Provider`
необов'язковий:

```jsx
<ThemeContext value={theme}>
  <Layout />
</ThemeContext>
```

### 7.1. Важливі деталі

- Значення за замовчуванням (`createContext('light')`) використовується
  **лише якщо провайдера немає** вище в дереві.
- Провайдерів може бути кілька, вкладених один в одного; спрацює **найближчий**.
- При зміні `value` перерендеряться **всі** споживачі цього контексту.

⚠️ Найпоширеніша помилка: передавати в `value` об'єктний літерал.

```jsx
// ❌ Новий об'єкт на кожному рендері App → усі споживачі перемальовуються завжди
<AuthContext value={{ user, login, logout }}>

// ✅
const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
<AuthContext value={value}>
```

---

## 8. Власний хук доступу

Прямий `useContext` у компонентах має недолік: якщо провайдера забули, ви
отримаєте `undefined` і незрозумілу помилку десь глибше. Тому контекст завжди
загортають у власний хук:

```jsx
// context/DataContext.jsx
import { createContext, useContext } from 'react';

const DataContext = createContext(null);

export function useData() {
  const context = useContext(DataContext);

  if (context === null) {
    throw new Error(
      'useData() має викликатися всередині <DataProvider>. ' +
      'Переконайтеся, що компонент обгорнуто провайдером.'
    );
  }

  return context;
}
```

🔑 Це прямо прописано у вимогах Завдання №3: «створити власний хук `useData()`,
який інкапсулює `useContext` і кидає зрозумілу помилку, якщо його викликано
поза провайдером».

Переваги: зрозуміле повідомлення замість `Cannot read property of undefined`;
компоненти не імпортують сам контекст; реалізацію можна змінити, не чіпаючи
споживачів.

---

## 9. Context + Reducer: повний приклад

Складаємо все разом — це і є архітектура Завдання №3.

```jsx
// context/DataContext.jsx
import { createContext, useContext, useMemo, useReducer } from 'react';
import { reducer, initialState } from '../store/reducer.js';
import * as actions from '../store/actions.js';
import { seedItems, categories, tags } from '../data/seed.js';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => ({
    ...init,
    items: seedItems,           // ліниве початкове значення
  }));

  // Прив'язані до dispatch дії — компоненти не знають про типи дій
  const api = useMemo(() => ({
    createItem: (data)       => dispatch(actions.itemCreated(data)),
    updateItem: (id, changes)=> dispatch(actions.itemUpdated(id, changes)),
    deleteItem: (id)         => dispatch(actions.itemDeleted(id)),
    setSearch:  (query)      => dispatch(actions.searchChanged(query)),
    setFilter:  (name, value)=> dispatch(actions.filterChanged(name, value)),
    setSort:    (field, order)=> dispatch(actions.sortChanged(field, order)),
    setPage:    (page)       => dispatch(actions.pageChanged(page)),
    resetFilters: ()         => dispatch(actions.filtersReset()),
  }), []);   // dispatch стабільний — залежностей немає

  const value = useMemo(
    () => ({ ...state, categories, tags, ...api }),
    [state, api]
  );

  return <DataContext value={value}>{children}</DataContext>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === null) {
    throw new Error('useData() має викликатися всередині <DataProvider>');
  }
  return context;
}
```

```jsx
// main.jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>
);
```

```jsx
// Використання — компоненти не знають ні про reducer, ні про типи дій
function SearchBar() {
  const { search, setSearch } = useData();

  return (
    <input
      type="search"
      value={search}
      onChange={e => setSearch(e.target.value)}
      placeholder="Пошук за назвою"
    />
  );
}

function ItemCard({ item }) {
  const { deleteItem } = useData();

  return (
    <article className="card">
      <h3>{item.title}</h3>
      <button type="button" onClick={() => deleteItem(item.id)}>Видалити</button>
    </article>
  );
}
```

🔑 `dispatch` **гарантовано стабільний** між рендерами — React це обіцяє. Тому
його не треба додавати в залежності й не треба мемоізувати.

---

## 10. Похідні дані

Фільтрація, сортування й пагінація **не зберігаються в стані** — вони
обчислюються з нього. Це вимога Завдання №3.

```jsx
// hooks/useVisibleItems.js
import { useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';

export function useVisibleItems() {
  const { items, search, filters, sort, page, pageSize } = useData();

  // 1. Фільтрація
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return items.filter(item => {
      if (q && !item.title.toLowerCase().includes(q)) return false;
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters.tagIds.length > 0 &&
          !filters.tagIds.every(tagId => item.tagIds.includes(tagId))) return false;
      if (filters.yearFrom && item.year < filters.yearFrom) return false;
      if (filters.yearTo && item.year > filters.yearTo) return false;
      return true;
    });
  }, [items, search, filters]);

  // 2. Сортування
  const sorted = useMemo(() => {
    const direction = sort.order === 'asc' ? 1 : -1;

    return filtered.toSorted((a, b) => {
      const x = a[sort.field];
      const y = b[sort.field];

      if (typeof x === 'string') return x.localeCompare(y, 'uk') * direction;
      return (x - y) * direction;
    });
  }, [filtered, sort]);

  // 3. Пагінація
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize]
  );

  return {
    items: pageItems,
    total: sorted.length,
    totalPages,
    page: safePage,
    from: sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    to: Math.min(safePage * pageSize, sorted.length),
    isEmpty: sorted.length === 0,
  };
}
```

```jsx
function ItemList() {
  const { items, total, from, to, isEmpty } = useVisibleItems();
  const { resetFilters } = useData();

  if (isEmpty) {
    return (
      <div className="empty-state">
        <p>Нічого не знайдено.</p>
        <button type="button" onClick={resetFilters}>Скинути фільтри</button>
      </div>
    );
  }

  return (
    <>
      <p className="results-info">Показано {from}–{to} з {total}</p>
      <ul className="cards">
        {items.map(item => (
          <li key={item.id}><ItemCard item={item} /></li>
        ))}
      </ul>
    </>
  );
}
```

🔑 `localeCompare(y, 'uk')` обов'язковий: без нього «Ґанок» опиниться після
«Ялина», бо сортування піде за кодами символів.

---

## 11. Оптимізація перерендерів

### 11.1. Проблема

Будь-яка зміна значення контексту перемальовує **всіх** споживачів. Якщо в
одному контексті і список, і рядок пошуку, то введення кожного символа
перемальовує список.

### 11.2. Розділення контекстів

Найдієвіший прийом — розділити стан і дії на два контексти:

```jsx
const StateContext = createContext(null);
const DispatchContext = createContext(null);

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <DispatchContext value={dispatch}>
      <StateContext value={state}>
        {children}
      </StateContext>
    </DispatchContext>
  );
}

export const useDataState = () => { … };
export const useDataDispatch = () => { … };
```

Компоненти, що лише **надсилають** дії (кнопки, форми), підписуються тільки на
`DispatchContext`. Оскільки `dispatch` стабільний, вони не перемальовуються
взагалі.

За потреби можна розділити й далі: окремий контекст для фільтрів, окремий —
для списку.

### 11.3. `memo` для елементів списку

```jsx
const ItemCard = memo(function ItemCard({ item }) {
  const { deleteItem } = useDataDispatch();
  return …;
});
```

Тепер картка перемальовується, лише якщо змінився саме її `item`.

### 11.4. Коли оптимізувати

🔑 Спочатку — профайлер. Для списку на 25–100 елементів (Завдання №3) жодних
проблем не буде навіть без оптимізацій. Розділення контекстів варто зробити
одразу — воно нічого не коштує й одразу правильно структурує код.

---

## 12. Синхронізація з `localStorage`

```jsx
export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    try {
      const raw = localStorage.getItem('app-state:v1');
      if (!raw) return { ...init, items: seedItems };

      const saved = JSON.parse(raw);
      return { ...init, ...saved };
    } catch {
      return { ...init, items: seedItems };
    }
  });

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        // Зберігаємо лише те, що варто зберігати
        const { items, filters, sort, pageSize } = state;
        localStorage.setItem('app-state:v1', JSON.stringify({ items, filters, sort, pageSize }));
      } catch (error) {
        console.warn('Не вдалося зберегти стан:', error);
      }
    }, 300);                       // debounce

    return () => clearTimeout(id);
  }, [state]);

  …
}
```

🔑 Три деталі, які легко пропустити:

1. **Ключ із версією** (`:v1`). Коли структура стану зміниться, стара
   збережена версія не зламає застосунок — просто зміните на `:v2`.
2. **Зберігайте не все.** `selectedId`, `page`, відкриті модальні вікна
   відновлювати не треба.
3. **Debounce.** Без нього запис відбуватиметься на кожен символ у полі пошуку.

⚠️ Побічні ефекти (робота зі сховищем) — **у компоненті чи ефекті**, ніколи не
в редюсері.

---

## 13. Огляд екосистеми

Context + Reducer — не єдиний і не завжди найкращий варіант.

| Інструмент | Коли доречний | Особливості |
|---|---|---|
| `useState` | локальний стан компонента | найпростіше |
| `useReducer` + Context | середній застосунок, складна логіка | без залежностей, вбудовано |
| **Redux Toolkit** | великий застосунок, багато розробників | DevTools із машиною часу, усталені практики, чимало коду |
| **Zustand** | коли Context незручний, а Redux завеликий | дуже мало коду, без провайдерів |
| **TanStack Query** | **серверні** дані | кешування, повтори, інвалідація, фонове оновлення |
| **Jotai / Recoil** | атомарний стан | дрібнозернисті оновлення |

🔑 **Найважливіша думка:** розрізняйте **клієнтський** і **серверний** стан.
Відкрите модальне вікно, обраний фільтр, чернетка форми — клієнтський стан
(Context/Reducer). Список фільмів із сервера — серверний стан: він має кеш,
може застаріти, потребує повторів і фонового оновлення. Для нього створені
спеціальні бібліотеки (TanStack Query), і робити це вручну через
`useState + useEffect` — багато зайвої роботи.

У Завданні №3 сторонні менеджери стану **заборонені** — саме щоб ви зрозуміли,
що вони автоматизують. У реальних проєктах вибирайте за задачею.

---

## 14. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Мутація стану в редюсері | Інтерфейс не оновлюється | Spread, `map`, `filter` |
| 2 | Побічні ефекти в редюсері | Непередбачувано, StrictMode ламає | Ефекти в компонентах |
| 3 | `Date.now()` / `randomUUID()` у редюсері | Недетермінованість, неможливо тестувати | У творці дії |
| 4 | Об'єктний літерал у `value` контексту | Усі споживачі перемальовуються завжди | `useMemo` |
| 5 | Немає гілки `default` у `switch` | Стан «зникає» при невідомій дії | `return state` або `throw` |
| 6 | Похідні дані в стані | Розсинхронізація | `useMemo` під час рендеру |
| 7 | `useContext` без перевірки провайдера | Незрозуміла помилка | Власний хук із `throw` |
| 8 | Один контекст на весь застосунок | Зайві перерендери | Розділити за призначенням |
| 9 | Context там, де вистачає props | Компоненти неможливо перевикористати | Props або композиція |
| 10 | `sort()` замість `toSorted()` | Мутація стану | `toSorted` |
| 11 | Сортування рядків без `localeCompare(…, 'uk')` | Неправильний український порядок | Вказати локаль |
| 12 | `dispatch` у масиві залежностей | Зайвий шум (він і так стабільний) | Не додавати |
| 13 | Збереження всього стану в `localStorage` | Відновлюються модалки й сторінка | Зберігати вибірково |
| 14 | Немає версії в ключі сховища | Стара структура ламає застосунок | `'state:v1'` |
| 15 | Глибоко вкладений стан | Болісні оновлення | Пласка структура |

---

## 15. Контрольні запитання

1. Назвіть чотири ознаки того, що час переходити від `useState` до
   `useReducer`.
2. Яка сигнатура редюсера? Яким трьом вимогам він має відповідати?
3. Чому генерація `id` має бути у творці дії, а не в редюсері?
4. Навіщо виносити типи дій у константи?
5. Як `useReducer` розв'язує проблему «забули скинути сторінку при зміні
   пошуку»?
6. Чому редюсер легко тестувати?
7. Що таке prop drilling і коли він **не** є проблемою?
8. Коли використовується значення за замовчуванням у `createContext`?
9. Чому об'єктний літерал у `value` контексту — проблема?
10. Навіщо загортати `useContext` у власний хук?
11. Чому `dispatch` не треба мемоізувати?
12. Як розділення контекстів зменшує кількість перерендерів?
13. Чому похідні дані не зберігають у стані?
14. Чим клієнтський стан відрізняється від серверного?
15. Навіщо версія в ключі `localStorage`?

---

## 16. Практичні вправи

**Вправа 1 (перший редюсер, 25 хв).** Перепишіть форму з чотирьох `useState`
на `useReducer` із діями `FIELD_CHANGED`, `FORM_RESET`, `FORM_SUBMITTED`.

**Вправа 2 (кошик, 40 хв).** Реалізуйте редюсер кошика: `ITEM_ADDED`
(якщо товар уже є — збільшити кількість), `ITEM_REMOVED`,
`QUANTITY_CHANGED` (0 → видалити), `CART_CLEARED`, `PROMO_APPLIED`.
Сума й кількість — **обчислюються**, а не зберігаються.

**Вправа 3 (тести, 25 хв).** Напишіть 8 тестів для редюсера з вправи 2 без
рендерингу компонентів. Обов'язково перевірте, що вхідний стан не мутується.

**Вправа 4 (Context, 30 хв).** Зробіть `ThemeProvider` із перемиканням
світлої/темної теми, збереженням вибору в `localStorage` і хуком `useTheme()`,
що кидає помилку поза провайдером. Тема має застосовуватися через
`data-theme` на `<html>`.

**Вправа 5 (повна архітектура, 60 хв).** Складіть для свого Завдання №3:
`actionTypes.js`, `actions.js`, `reducer.js`, `DataContext.jsx`,
`useVisibleItems.js`. Перевірте, що компоненти не імпортують нічого зі
`store/` напряму — лише `useData()`.

**Вправа 6 (оптимізація, 30 хв).** Розділіть контекст на `StateContext` і
`DispatchContext`. У React DevTools увімкніть підсвічування рендерів і
порівняйте, що перемальовується при введенні символа в пошук до і після.

**Вправа 7 (аналіз, 20 хв).** Знайдіть шість помилок:

```jsx
function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      state.items.push({ ...action.payload, id: Date.now() });
      return state;
    case 'REMOVE':
      localStorage.setItem('items', JSON.stringify(state.items));
      return { ...state, items: state.items.filter(i => i.id !== action.id) };
    case 'SORT':
      return { ...state, items: state.items.sort((a, b) => a.title > b.title) };
  }
}

function Provider({ children }) {
  const [state, dispatch] = useReducer(reducer, { items: [] });
  return (
    <Context.Provider value={{ state, dispatch }}>
      {children}
    </Context.Provider>
  );
}
```

---

## 17. Корисні посилання

- [react.dev: Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) —
  покроковий перехід від `useState` до `useReducer`.
- [react.dev: Passing Data Deeply with Context](https://react.dev/learn/passing-data-deeply-with-context).
- [react.dev: Scaling Up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context) —
  **саме архітектура Завдання №3.**
- [react.dev: Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) —
  п'ять принципів проєктування стану.
- [react.dev: Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) —
  як `key` впливає на збереження стану.
- [react.dev: useReducer](https://react.dev/reference/react/useReducer) та
  [useContext](https://react.dev/reference/react/useContext) — довідник.
- [Redux Style Guide](https://redux.js.org/style-guide/) — практики,
  застосовні й до чистого `useReducer`.
- [TanStack Query](https://tanstack.com/query/latest) — як правильно працювати
  з серверним станом (знадобиться після курсу).
- [Kent C. Dodds: Application State Management with React](https://kentcdodds.com/blog/application-state-management-with-react) —
  коли який інструмент потрібен.

---

## 18. Література

1. **Barklund, M.** *React in Depth.* — Manning, 2024. — Розділи про керування
   станом: `useReducer`, Context, порівняння з Redux Toolkit і Zustand.
2. **Kumar, T.** *Fluent React.* — O'Reilly, 2024. — Чому Context спричиняє
   перерендери й як із цим працювати.
3. **Banks, A., Porcello, E.** *Learning React.* 2nd ed. — O'Reilly, 2020. —
   Функціональний підхід до стану, чисті функції.
4. **Wieruch, R.** *The Road to React.* — Практичний приклад побудови
   Context + Reducer.

---

## 19. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Редюсер | reducer | Чиста функція `(state, action) => newState` |
| Дія | action | Об'єкт, що описує, що сталося |
| Творець дії | action creator | Функція, що будує об'єкт дії |
| Відправлення | dispatch | Надсилання дії редюсеру |
| Контекст | context | Механізм передавання даних углиб дерева |
| Провайдер | provider | Компонент, що задає значення контексту |
| Споживач | consumer | Компонент, що читає контекст |
| Протягування props | prop drilling | Передавання через проміжні рівні |
| Нормалізація | normalization | Зберігання даних словником за `id` |
| Похідні дані | derived state | Обчислюване з наявного стану |
| Клієнтський стан | client state | Стан інтерфейсу |
| Серверний стан | server state | Кешовані дані з сервера |
| Джерело істини | single source of truth | Єдине авторитетне місце зберігання |

---

**Попередня:** [Лекція 7. React: хуки та побічні ефекти](07-react-hooks-effects.md)
**Наступна:** [Лекція 9. React: маршрутизація, форми та валідація](09-react-routing-forms.md)

[← До змісту курсу](README.md)
