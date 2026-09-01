# Лекція 7. React: хуки та побічні ефекти

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №3 «SPA на React.js»
> **Попередня лекція:** [Лекція 6](06-react-components-props-state.md)

---

## Про що ця лекція

`useState` ви вже знаєте. Але компонент часто мусить робити щось поза межами
рендерингу: підписатися на подію, поставити таймер, звернутися до DOM,
завантажити дані. Усе це — **побічні ефекти**, і для них є `useEffect`.

`useEffect` — найважчий хук у React і найчастіше джерело помилок. Тому в цій
лекції ми не лише розберемо, як ним користуватися, а й — що не менш важливо —
**коли він не потрібен**.

---

## Зміст

1. [Правила хуків](#1-правила-хуків)
2. [`useEffect`: основи](#2-useeffect-основи)
3. [Масив залежностей](#3-масив-залежностей)
4. [Функція очищення](#4-функція-очищення)
5. [Коли ефект НЕ потрібен](#5-коли-ефект-не-потрібен)
6. [`useRef`](#6-useref)
7. [Мемоізація: `useMemo`, `useCallback`, `memo`](#7-мемоізація-usememo-usecallback-memo)
8. [Власні хуки](#8-власні-хуки)
9. [Життєвий цикл у функціональній моделі](#9-життєвий-цикл-у-функціональній-моделі)
10. [Інші вбудовані хуки](#10-інші-вбудовані-хуки)
11. [Налагодження](#11-налагодження)
12. [Типові помилки](#12-типові-помилки)
13. [Контрольні запитання](#13-контрольні-запитання)
14. [Практичні вправи](#14-практичні-вправи)
15. [Корисні посилання](#15-корисні-посилання)
16. [Література](#16-література)
17. [Глосарій](#17-глосарій)

---

## 1. Правила хуків

Хуки — функції, що починаються з `use` і дають компоненту доступ до
можливостей React.

### 1.1. Два правила

**Правило 1: хуки викликаються лише на верхньому рівні.**
Не в умовах, не в циклах, не у вкладених функціях, не після раннього
`return`.

```jsx
// ❌ Заборонено
function Bad({ isLoggedIn }) {
  if (isLoggedIn) {
    const [name, setName] = useState('');   // умовний виклик
  }
  for (const item of items) {
    useEffect(() => {…});                   // у циклі
  }
}

// ✅ Правильно
function Good({ isLoggedIn }) {
  const [name, setName] = useState('');
  useEffect(() => {
    if (!isLoggedIn) return;                // умова ВСЕРЕДИНІ хука
    …
  }, [isLoggedIn]);
}
```

**Правило 2: хуки викликаються лише з компонентів React або з інших хуків.**
Не зі звичайних функцій, не з обробників подій, не з класів.

### 1.2. Чому саме так

React не знає імен ваших змінних. Він зіставляє хуки з їхнім станом **за
порядком виклику**: перший `useState` у цьому компоненті, другий, третій…

```jsx
// Рендер 1: isLoggedIn = true
useState('')      // → слот 0: name
useState(0)       // → слот 1: count

// Рендер 2: isLoggedIn = false — перший useState пропущено
useState(0)       // → слот 0 ⚠️ отримає значення name!
```

Порядок збився — стан «переїхав». Саме тому умовні виклики заборонені.

🔑 Правило контролює плагін **`eslint-plugin-react-hooks`**. Він увімкнений у
шаблоні Vite і має бути увімкнений у Завданні №3. Не ігноруйте його
попередження.

---

## 2. `useEffect`: основи

**Побічний ефект** — усе, що виходить за межі «обчислити JSX із props і
стану»: запити до мережі, підписки, таймери, робота з `document`,
`localStorage`, логування.

```jsx
import { useEffect, useState } from 'react';

function Title({ text }) {
  useEffect(() => {
    document.title = text;
  }, [text]);

  return <h1>{text}</h1>;
}
```

### 2.1. Коли виконується ефект

```
рендер → React оновлює DOM → браузер малює → ВИКОНУЄТЬСЯ ЕФЕКТ
```

Ефект завжди виконується **після** того, як браузер відмалював кадр. Тому він
не блокує показ інтерфейсу.

### 2.2. Три форми

```jsx
// 1. Після КОЖНОГО рендеру (майже завжди помилка)
useEffect(() => { … });

// 2. Один раз після монтування
useEffect(() => { … }, []);

// 3. Після монтування і при зміні залежностей
useEffect(() => { … }, [userId, filter]);
```

---

## 3. Масив залежностей

### 3.1. Правило

🔑 **У масиві залежностей має бути **все**, що ефект читає із зовнішньої
області: props, стан, обчислені значення, функції.**

```jsx
function UserProfile({ userId, showDetails }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetchUser(userId).then(data => {
      if (!cancelled) setUser(data);
    });

    return () => { cancelled = true; };
  }, [userId]);        // ← userId використовується, отже має бути тут

  …
}
```

### 3.2. Порівняння залежностей

React порівнює залежності через `Object.is` — тобто **за посиланням** для
об'єктів і функцій.

```jsx
// ❌ Новий об'єкт на кожному рендері → ефект спрацьовує нескінченно
function Bad({ id }) {
  const options = { id, limit: 10 };
  useEffect(() => { load(options); }, [options]);
}

// ✅ Варіант 1: примітивні залежності
function Good1({ id }) {
  useEffect(() => { load({ id, limit: 10 }); }, [id]);
}

// ✅ Варіант 2: мемоізувати об'єкт
function Good2({ id }) {
  const options = useMemo(() => ({ id, limit: 10 }), [id]);
  useEffect(() => { load(options); }, [options]);
}
```

### 3.3. Класичні помилки з залежностями

**Нескінченний цикл:**

```jsx
// ❌ Ефект змінює стан, від якого сам залежить
const [count, setCount] = useState(0);
useEffect(() => {
  setCount(count + 1);
}, [count]);         // → рендер → ефект → рендер → …
```

**Порожній масив, коли залежності є:**

```jsx
// ❌ При зміні userId дані не перезавантажаться
useEffect(() => {
  fetchUser(userId).then(setUser);
}, []);              // ESLint попередить
```

⚠️ **Ніколи не «затикайте» ESLint коментарем `// eslint-disable-next-line`,
щоб прибрати попередження про залежності.** Це не розв'язує проблему, а ховає
її. Якщо залежність зайва — переструктуруйте код (винесіть логіку у функцію,
використайте функціональне оновлення, перенесіть значення в `useRef`).

**Правильний спосіб позбутися залежності:**

```jsx
// ❌ count у залежностях
useEffect(() => {
  const id = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(id);
}, [count]);         // таймер перестворюється щосекунди

// ✅ функціональне оновлення прибирає залежність
useEffect(() => {
  const id = setInterval(() => setCount(prev => prev + 1), 1000);
  return () => clearInterval(id);
}, []);
```

---

## 4. Функція очищення

Якщо ефект щось «створює» (підписку, таймер, з'єднання), він **зобов'язаний**
це прибрати.

```jsx
useEffect(() => {
  const handleResize = () => setWidth(window.innerWidth);
  window.addEventListener('resize', handleResize);

  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

Функція очищення виконується:

- **перед кожним повторним запуском** ефекту;
- **при знятті компонента** (unmount).

### 4.1. Що обов'язково потребує очищення

| Ефект | Очищення |
|---|---|
| `addEventListener` | `removeEventListener` |
| `setInterval` / `setTimeout` | `clearInterval` / `clearTimeout` |
| Підписка на зовнішнє джерело | відписка |
| `IntersectionObserver` тощо | `disconnect()` |
| Мережевий запит | `AbortController.abort()` або прапорець |

### 4.2. Гонки при завантаженні даних

Класична проблема: користувач швидко перемикається між `id = 1` і `id = 2`.
Відповідь для `1` може прийти **після** відповіді для `2` і перезаписати її.

```jsx
// ✅ Прапорець-«ігнорування»
useEffect(() => {
  let ignore = false;

  setStatus('loading');
  fetchMovie(id)
    .then(data => { if (!ignore) { setMovie(data); setStatus('success'); } })
    .catch(err => { if (!ignore) { setError(err); setStatus('error'); } });

  return () => { ignore = true; };
}, [id]);

// ✅ Ще краще — реальне скасування запиту
useEffect(() => {
  const controller = new AbortController();

  loadMovie(id, { signal: controller.signal })
    .then(setMovie)
    .catch(err => { if (err.name !== 'AbortError') setError(err); });

  return () => controller.abort();
}, [id]);
```

🔑 У `<StrictMode>` React навмисно монтує компонент, знімає й монтує знову —
саме щоб виявити ефекти без очищення. Якщо ваш ефект після цього поводиться
дивно (два запити, подвійна підписка), очищення написано неправильно.

---

## 5. Коли ефект НЕ потрібен

Це найважливіший розділ лекції. Більшість `useEffect` у коді початківців —
зайві.

### 5.1. Похідні дані

```jsx
// ❌ Зайвий ефект і зайвий стан
const [movies, setMovies] = useState([]);
const [filtered, setFiltered] = useState([]);

useEffect(() => {
  setFiltered(movies.filter(m => m.title.includes(query)));
}, [movies, query]);

// ✅ Просто обчисліть під час рендеру
const filtered = movies.filter(m => m.title.includes(query));
```

Зайвий ефект дає **два рендери замість одного** і момент, коли `filtered` ще
не відповідає `movies`.

### 5.2. Реакція на дію користувача

```jsx
// ❌ Ефект як реакція на зміну стану
const [submitted, setSubmitted] = useState(false);
useEffect(() => {
  if (submitted) sendAnalytics();
}, [submitted]);

// ✅ Робіть це прямо в обробнику
function handleSubmit() {
  sendAnalytics();
  save(form);
}
```

🔑 Правило: **ефект — для синхронізації із зовнішньою системою**, а не для
реакції на дію користувача. Якщо ви можете назвати конкретну подію («натиснув
кнопку») — код належить обробнику.

### 5.3. Скидання стану при зміні props

```jsx
// ❌ Зайвий ефект
useEffect(() => { setDraft(''); }, [movieId]);

// ✅ key змушує React створити новий екземпляр із чистим станом
<MovieEditor key={movieId} movieId={movieId} />
```

### 5.4. Ініціалізація

```jsx
// ❌
const [notes, setNotes] = useState([]);
useEffect(() => { setNotes(loadFromStorage()); }, []);

// ✅ Ліниве початкове значення — без зайвого рендеру
const [notes, setNotes] = useState(() => loadFromStorage());
```

### 5.5. Коли ефект ПОТРІБЕН

- завантаження даних із сервера;
- підписка на подію `window` або зовнішнє джерело;
- таймери й інтервали;
- синхронізація з `localStorage`;
- зміна `document.title`, керування фокусом;
- інтеграція зі сторонньою бібліотекою, що працює з DOM напряму.

📚 Обов'язково прочитайте офіційну статтю
[You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) —
вона розбирає ще десяток випадків.

---

## 6. `useRef`

`useRef` створює «коробку» зі змінюваним полем `.current`, яка **зберігається
між рендерами** й **не спричиняє перерендер** при зміні.

### 6.1. Посилання на DOM-елемент

```jsx
function SearchBar() {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();      // фокус при монтуванні
  }, []);

  return <input ref={inputRef} type="search" />;
}
```

Типові випадки: фокус, прокручування до елемента, вимірювання розмірів,
керування `<video>`, інтеграція з не-React бібліотеками.

### 6.2. Змінне значення поза рендером

```jsx
function Stopwatch() {
  const [time, setTime] = useState(0);
  const intervalRef = useRef(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setTime(t => t + 1), 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  useEffect(() => stop, []);   // очищення при знятті

  return (
    <>
      <p>{time} с</p>
      <button onClick={start}>Старт</button>
      <button onClick={stop}>Стоп</button>
    </>
  );
}
```

### 6.3. `useRef` проти `useState`

| | `useState` | `useRef` |
|---|---|---|
| Спричиняє перерендер | так | **ні** |
| Зберігається між рендерами | так | так |
| Читання під час рендеру | так | **не варто** |
| Призначення | дані, що впливають на вигляд | таймери, DOM, попередні значення |

⚠️ Не використовуйте `useRef` як спосіб «обійти» перерендер для даних, які
мають відображатися. Якщо значення видно на екрані — це стан.

### 6.4. `ref` як звичайний prop (React 19)

Починаючи з React 19, `ref` можна передавати функціональним компонентам як
звичайний prop — `forwardRef` більше не потрібен:

```jsx
function TextField({ label, ref, ...rest }) {
  return (
    <label>
      {label}
      <input ref={ref} {...rest} />
    </label>
  );
}

// Використання
const inputRef = useRef(null);
<TextField label="Назва" ref={inputRef} />
```

---

## 7. Мемоізація: `useMemo`, `useCallback`, `memo`

### 7.1. Проблема

Кожен рендер компонента створює **нові** об'єкти й функції. Здебільшого це
дешево й неважливо. Але іноді має значення:

- **дороге обчислення** повторюється щоразу;
- **новий об'єкт/функція** потрапляє в залежності ефекту або в props
  мемоізованого компонента й ламає оптимізацію.

### 7.2. `useMemo`

```jsx
const sorted = useMemo(
  () => movies.toSorted((a, b) => a.title.localeCompare(b.title, 'uk')),
  [movies]
);

const filtered = useMemo(
  () => sorted.filter(m => m.title.toLowerCase().includes(query.toLowerCase())),
  [sorted, query]
);

const pageItems = useMemo(
  () => filtered.slice((page - 1) * pageSize, page * pageSize),
  [filtered, page, pageSize]
);
```

Це саме той ланцюжок, що потрібен у Завданні №3: похідні дані обчислюються, а
не зберігаються в стані, але й не перераховуються дарма.

### 7.3. `useCallback`

```jsx
const handleSelect = useCallback((id) => {
  setSelectedId(id);
}, []);

const handleSearch = useCallback((value) => {
  setQuery(value);
  setPage(1);
}, []);
```

`useCallback(fn, deps)` — те саме, що `useMemo(() => fn, deps)`.

### 7.4. `React.memo`

```jsx
const MovieCard = memo(function MovieCard({ movie, onSelect }) {
  return <article onClick={() => onSelect(movie.id)}>{movie.title}</article>;
});
```

`memo` пропускає перерендер, якщо props не змінилися (поверхневе порівняння).

⚠️ `memo` **марний**, якщо в props передається новий об'єкт або функція на
кожному рендері. Тому `memo` і `useCallback` зазвичай працюють у парі.

### 7.5. Коли мемоізувати

🔑 **Правило: спочатку пишіть просто. Мемоізуйте лише тоді, коли профайлер
показав проблему.**

Передчасна мемоізація:

- ускладнює код;
- сама коштує пам'яті й часу на порівняння залежностей;
- дає баги, коли залежності вказані неправильно.

Обґрунтовані випадки:

1. Обчислення справді дороге (сортування кількох тисяч записів, складні
   перетворення).
2. Значення потрапляє в масив залежностей ефекту.
3. Значення передається в `memo`-компонент, який рендериться часто.

📚 **React Compiler** (стабільний із жовтня 2025) робить цю оптимізацію
автоматично на етапі збірки. Якщо він увімкнений, ручні `useMemo`/`useCallback`
здебільшого не потрібні. У Завданні №3 достатньо застосувати `useMemo` для
похідних даних списку — це і вимога, і хороша практика.

---

## 8. Власні хуки

**Власний хук** — звичайна функція, що починається з `use` і викликає інші
хуки. Це головний спосіб перевикористання **логіки** (не розмітки).

### 8.1. `useDebounce`

```jsx
// hooks/useDebounce.js
import { useEffect, useState } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
```

```jsx
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 300);

const filtered = useMemo(
  () => movies.filter(m => m.title.toLowerCase().includes(debouncedQuery.toLowerCase())),
  [movies, debouncedQuery]
);
```

### 8.2. `useLocalStorage`

```jsx
import { useCallback, useEffect, useState } from 'react';

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Не вдалося зберегти в localStorage:', error);
    }
  }, [key, value]);

  const remove = useCallback(() => {
    localStorage.removeItem(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return [value, setValue, remove];
}
```

### 8.3. `useToggle` і `useMediaQuery`

```jsx
export function useToggle(initial = false) {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle, setValue];
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    mql.addEventListener('change', onChange);
    setMatches(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
```

### 8.4. Правила гарного хука

- ім'я обов'язково починається з `use`;
- хук інкапсулює **логіку**, а не розмітку;
- кожен виклик хука має **власний ізольований стан** — два компоненти з
  `useToggle()` не впливають один на одного;
- хук може приймати параметри й повертати що завгодно (значення, кортеж,
  об'єкт);
- якщо хук повертає більше трьох речей — краще об'єкт, ніж масив.

---

## 9. Життєвий цикл у функціональній моделі

Класові компоненти мали явні методи життєвого циклу. У функціональних їх немає
— є ефекти з різними залежностями.

| Класовий метод | Функціональний аналог |
|---|---|
| `componentDidMount` | `useEffect(() => {…}, [])` |
| `componentDidUpdate` | `useEffect(() => {…}, [deps])` |
| `componentWillUnmount` | `return () => {…}` усередині `useEffect` |
| `shouldComponentUpdate` | `memo` |

🔑 Але думати «мій ефект — це componentDidMount» — шкідливо. Правильна
ментальна модель: **«ефект синхронізує компонент із зовнішньою системою, поки
залежності незмінні»**. Не «коли змонтувався», а «доки актуально».

📚 Стаття [Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)
пояснює це детально.

---

## 10. Інші вбудовані хуки

```jsx
// Унікальні ідентифікатори для доступності
const id = useId();
<label htmlFor={`${id}-title`}>Назва</label>
<input id={`${id}-title`} aria-describedby={`${id}-hint`} />
<p id={`${id}-hint`}>Підказка</p>
```

⚠️ `useId` призначений **саме** для зв'язування `label`/`input`, а не для
ключів списку.

```jsx
// Позначити оновлення як неспішне: інтерфейс не «залипає»
const [isPending, startTransition] = useTransition();

const handleSearch = (value) => {
  setQuery(value);                       // терміново: поле реагує одразу
  startTransition(() => {
    setFilter(value);                    // неспішно: важкий список
  });
};

// Спрощений варіант: «відкладене» значення
const deferredQuery = useDeferredValue(query);
```

```jsx
// Підписка на зовнішнє джерело (наприклад, статус мережі)
const isOnline = useSyncExternalStore(
  (callback) => {
    window.addEventListener('online', callback);
    window.addEventListener('offline', callback);
    return () => {
      window.removeEventListener('online', callback);
      window.removeEventListener('offline', callback);
    };
  },
  () => navigator.onLine
);
```

Ще два хуки — `useContext` і `useReducer` — розберемо в лекції 8, бо вони
складають основу керування станом.

---

## 11. Налагодження

### 11.1. React DevTools

Розширення для Chrome/Firefox додає дві вкладки:

- **Components** — дерево компонентів, поточні props, стан і хуки; можна
  редагувати значення наживо;
- **Profiler** — запис рендерів: що і чому перерендерилося, скільки часу
  зайняло.

У налаштуваннях увімкніть «Highlight updates when components render» — на
сторінці підсвічуватимуться компоненти, що перемальовуються. Дуже наочно
показує зайві рендери.

### 11.2. Пошук причини зайвих рендерів

```jsx
// Тимчасовий хук для налагодження: що саме змінилося
function useWhyDidYouUpdate(name, props) {
  const previous = useRef();

  useEffect(() => {
    if (previous.current) {
      const changed = Object.entries(props).filter(
        ([key, value]) => previous.current[key] !== value
      );
      if (changed.length) console.log(`[${name}] змінилися:`, Object.fromEntries(changed));
    }
    previous.current = props;
  });
}
```

### 11.3. Типовий сценарій «нескінченний цикл»

Симптом: браузер підвисає, у консолі «Too many re-renders».

Перевірте по черзі:

1. Чи не викликається `setState` **під час рендеру** (а не в обробнику чи
   ефекті)?
2. Чи не змінює ефект стан, від якого сам залежить?
3. Чи не створюється новий об'єкт/масив/функція прямо в залежностях?
4. Чи не написано `onClick={handleClick()}` замість `onClick={handleClick}`?

---

## 12. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Хук в умові чи циклі | Стан «переїжджає», помилка | Верхній рівень компонента |
| 2 | Ефект без потреби (похідні дані) | Зайві рендери, розсинхронізація | Обчислювати під час рендеру |
| 3 | Неповний масив залежностей | Ефект працює зі старими значеннями | Додати всі залежності |
| 4 | `// eslint-disable` замість виправлення | Прихована помилка | Переструктурувати код |
| 5 | Ефект змінює стан зі своїх залежностей | Нескінченний цикл | Функціональне оновлення |
| 6 | Немає очищення підписки/таймера | Витік пам'яті, подвійні підписки | `return () => …` |
| 7 | Немає захисту від гонок при `fetch` | Дані «стрибають» | `ignore` або `AbortController` |
| 8 | Об'єкт/функція в залежностях без мемоізації | Ефект щоразу | `useMemo` / примітивні залежності |
| 9 | `useRef` для даних, що показуються | Інтерфейс не оновлюється | `useState` |
| 10 | Читання `ref.current` під час рендеру | Непередбачувано | Читати в ефектах і обробниках |
| 11 | Передчасна мемоізація всього | Складний код без користі | Спочатку профайлер |
| 12 | `memo` без `useCallback` у props | Оптимізація не працює | Мемоізувати й функції |
| 13 | `setState` під час рендеру | «Too many re-renders» | В обробнику або ефекті |
| 14 | Ефект як реакція на клік | Зайва складність | Логіка в обробнику |
| 15 | Власний хук без префікса `use` | ESLint не перевіряє правила | Іменувати `useЩось` |

---

## 13. Контрольні запитання

1. Сформулюйте два правила хуків. Чому вони саме такі?
2. Коли саме виконується `useEffect` відносно рендеру й малювання?
3. Чим `useEffect(fn)`, `useEffect(fn, [])` і `useEffect(fn, [x])`
   відрізняються?
4. Що має бути в масиві залежностей?
5. Як React порівнює залежності й чому об'єкт-літерал спричиняє нескінченний
   ефект?
6. Коли виконується функція очищення? Наведіть три випадки, де вона
   обов'язкова.
7. Що таке гонка при завантаженні даних і два способи її усунути?
8. Навіщо `<StrictMode>` монтує компонент двічі?
9. Наведіть чотири випадки, коли `useEffect` не потрібен.
10. Чим `useRef` відрізняється від `useState`?
11. Чому `memo` без `useCallback` часто марний?
12. Коли мемоізація виправдана, а коли шкідлива?
13. Що таке власний хук і чим два виклики одного хука ізольовані?
14. Чому думати про `useEffect` як про `componentDidMount` — шкідливо?
15. Навіщо потрібен `useId`?

---

## 14. Практичні вправи

**Вправа 1 (перший ефект, 20 хв).** Компонент `DocumentTitle`, що встановлює
`document.title` і повертає його до попереднього значення при знятті.
Перевірте очищення.

**Вправа 2 (підписка, 25 хв).** Хук `useWindowSize`, що повертає
`{ width, height }` й оновлюється при зміні розміру вікна. Обов'язково:
`throttle` і зняття обробника.

**Вправа 3 (завантаження, 40 хв).** Компонент, що завантажує список постів із
JSONPlaceholder. Реалізуйте всі чотири стани (завантаження, помилка, порожньо,
дані) і захист від гонок при швидкій зміні `userId`. Перевірте в Network із
затримкою Slow 3G.

**Вправа 4 (прибирання ефектів, 30 хв).** Знайдіть і приберіть **усі** зайві
ефекти:

```jsx
function ProductList({ products, category }) {
  const [filtered, setFiltered] = useState([]);
  const [total, setTotal] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  const [sorted, setSorted] = useState([]);

  useEffect(() => {
    setFiltered(products.filter(p => p.category === category));
  }, [products, category]);

  useEffect(() => {
    setSorted([...filtered].sort((a, b) => a.price - b.price));
  }, [filtered]);

  useEffect(() => {
    setTotal(filtered.reduce((sum, p) => sum + p.price, 0));
  }, [filtered]);

  useEffect(() => {
    setIsEmpty(filtered.length === 0);
  }, [filtered]);

  return …;
}
```

**Вправа 5 (useRef, 30 хв).** Реалізуйте: автофокус у полі пошуку при
натисканні `/`; кнопку «Нагору», що з'являється після 400 px прокрутки;
секундомір зі стартом, паузою й скиданням.

**Вправа 6 (власні хуки, 40 хв).** Напишіть і застосуйте у своєму проєкті:
`useDebounce`, `useLocalStorage`, `useToggle`, `useMediaQuery`,
`useClickOutside(ref, handler)` (закриття випадного меню кліком поза ним).

**Вправа 7 (мемоізація, 30 хв).** Візьміть список із 5000 елементів. Виміряйте
профайлером час рендеру при введенні в поле пошуку без `useMemo`, потім із
`useMemo` і `memo` на картці. Запишіть різницю.

---

## 15. Корисні посилання

- [react.dev: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects) —
  ключова стаття про ментальну модель ефектів.
- [react.dev: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect) —
  **обов'язково до прочитання перед Завданням №3.**
- [react.dev: Lifecycle of Reactive Effects](https://react.dev/learn/lifecycle-of-reactive-effects).
- [react.dev: Removing Effect Dependencies](https://react.dev/learn/removing-effect-dependencies) —
  як позбутися залежності правильно, а не через `eslint-disable`.
- [react.dev: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks).
- [react.dev: Referencing Values with Refs](https://react.dev/learn/referencing-values-with-refs)
  та [Manipulating the DOM with Refs](https://react.dev/learn/manipulating-the-dom-with-refs).
- [react.dev: useMemo](https://react.dev/reference/react/useMemo) —
  зокрема розділ «Should you add useMemo everywhere?».
- [react.dev: React Compiler](https://react.dev/learn/react-compiler).
- [usehooks.com](https://usehooks.com/) — колекція готових власних хуків із
  поясненнями (гарні приклади для наслідування).
- [React DevTools](https://react.dev/learn/react-developer-tools).

---

## 16. Література

1. **Kumar, T.** *Fluent React.* — O'Reilly, 2024. — Розділи про рендеринг,
   хуки й конкурентні можливості React; пояснює, **чому** правила хуків саме
   такі.
2. **Barklund, M.** *React in Depth.* — Manning, 2024. — Патерни компонентів,
   продуктивність, власні хуки, робота з даними.
3. **Banks, A., Porcello, E.** *Learning React.* 2nd ed. — O'Reilly, 2020. —
   Розділи 6–8 про хуки.
4. **Wieruch, R.** *The Road to React.* — Практичні приклади власних хуків.

---

## 17. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Побічний ефект | side effect | Дія поза обчисленням результату рендеру |
| Ефект | effect | Код, що синхронізує компонент із зовнішньою системою |
| Масив залежностей | dependency array | Значення, при зміні яких ефект перезапускається |
| Функція очищення | cleanup function | Прибирання за ефектом |
| Монтування | mounting | Перша поява компонента в дереві |
| Знімання | unmounting | Видалення компонента з дерева |
| Мемоізація | memoization | Кешування результату між рендерами |
| Посилання | ref | Змінюване значення, що не спричиняє перерендер |
| Власний хук | custom hook | Функція `useЩось`, що інкапсулює логіку |
| Гонка | race condition | Відповіді приходять не в порядку запитів |
| Перехід | transition | Оновлення з низьким пріоритетом |
| Строгий режим | StrictMode | Режим розробки з подвійним викликом для перевірок |

---

**Попередня:** [Лекція 6. React: компонентна модель, props, state](06-react-components-props-state.md)
**Наступна:** [Лекція 8. React: керування станом — Context і Reducer](08-react-context-reducer.md)

[← До змісту курсу](README.md)
