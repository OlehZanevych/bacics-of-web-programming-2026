# Лекція 6. React: компонентна модель, props, state

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №3 «SPA на React.js»
> **Попередня лекція:** [Лекція 5](05-async-javascript-network.md)

---

## Про що ця лекція

У Завданні №2 ви побудували застосунок вручну: тримали стан у модулі, писали
функцію рендерингу, стежили, щоб DOM не розійшовся з даними. Це працює, але
зі зростанням застосунку стає дедалі важче.

**React** автоматизує саме цю частину: ви описуєте, **як має виглядати
інтерфейс для поточного стану**, а React сам обчислює, що змінити в DOM.
Це називають декларативним підходом.

Наступні п'ять лекцій — про React. Ця перша: як влаштовані компоненти, як
передавати їм дані та як зберігати стан.

---

## Зміст

1. [Чому React](#1-чому-react)
2. [Віртуальний DOM і узгодження](#2-віртуальний-dom-і-узгодження)
3. [Створення проєкту](#3-створення-проєкту)
4. [JSX](#4-jsx)
5. [Компоненти](#5-компоненти)
6. [Props](#6-props)
7. [Умовний рендеринг](#7-умовний-рендеринг)
8. [Списки та ключі](#8-списки-та-ключі)
9. [Стан і `useState`](#9-стан-і-usestate)
10. [Оновлення стану без мутацій](#10-оновлення-стану-без-мутацій)
11. [Обробка подій](#11-обробка-подій)
12. [Форми: керовані компоненти](#12-форми-керовані-компоненти)
13. [Підняття стану](#13-підняття-стану)
14. [Стилізація](#14-стилізація)
15. [Структура проєкту](#15-структура-проєкту)
16. [Типові помилки](#16-типові-помилки)
17. [Контрольні запитання](#17-контрольні-запитання)
18. [Практичні вправи](#18-практичні-вправи)
19. [Корисні посилання](#19-корисні-посилання)
20. [Література](#20-література)
21. [Глосарій](#21-глосарій)

---

## 1. Чому React

### 1.1. Імперативно проти декларативно

**Імперативно** (те, що ви робили в Завданні №2): описуємо **кроки**.

```js
const counter = document.querySelector('.counter');
const button = document.querySelector('.btn');
let count = 0;

button.addEventListener('click', () => {
  count++;
  counter.textContent = count;
  counter.classList.toggle('counter--high', count > 10);
  if (count > 10) button.disabled = true;
});
```

**Декларативно** (React): описуємо **результат**.

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p className={count > 10 ? 'counter counter--high' : 'counter'}>{count}</p>
      <button onClick={() => setCount(count + 1)} disabled={count > 10}>
        Додати
      </button>
    </>
  );
}
```

🔑 Різниця не в кількості рядків, а в **кількості станів, які треба тримати в
голові**. В імперативному коді ви мусите знати, у якому стані DOM зараз, і
акуратно перевести його в новий. У декларативному ви лише описуєте, як має
виглядати інтерфейс для будь-якого стану, — а React сам знайде мінімальний
набір змін.

### 1.2. Що дає React

| Проблема ручного підходу | Рішення React |
|---|---|
| DOM і дані розходяться | Одне джерело істини — стан |
| Дублювання розмітки | Компоненти багаторазового використання |
| Складно передавати дані між частинами | Явний потік через props |
| Ручне оновлення десятків елементів | Автоматичне узгодження |
| Немає стандартної структури | Усталені практики й екосистема |

### 1.3. Альтернативи

React — не єдиний варіант і не завжди найкращий. Vue вважають простішим у
вивченні, Angular (ним ви займатиметеся в наступному курсі) дає повний
фреймворк «із коробки», Svelte компілює компоненти в чистий JS без
рантайму. Ми беремо React, бо він найпоширеніший на ринку, має найбільшу
екосистему й найбільше навчальних матеріалів.

⚠️ І пам'ятайте: для статичного сайту-візитівки React не потрібен. Завдання №1
свідомо зроблено без нього.

---

## 2. Віртуальний DOM і узгодження

### 2.1. Як це працює

Операції з реальним DOM дорогі. React тримає в пам'яті легке подання дерева —
**віртуальний DOM** — і працює з ним.

```
Зміна стану
    │
    ▼
Виклик функцій компонентів → новий віртуальний DOM
    │
    ▼
Порівняння зі старим (reconciliation / «diffing»)
    │
    ▼
Мінімальний набір змін у реальному DOM
```

Алгоритм узгодження ґрунтується на двох припущеннях:

1. Елементи **різного типу** дають різні дерева — React не намагається їх
   зіставляти, а замінює цілком.
2. Розробник підказує сталість елементів у списку через атрибут **`key`**
   (розділ 8).

### 2.2. Що це означає на практиці

- **Рендер ≠ оновлення DOM.** React може викликати вашу функцію-компонент і
  нічого не змінити в DOM, якщо результат не відрізняється.
- **Компонент має бути чистою функцією:** ті самі props і стан → той самий
  результат, без побічних ефектів під час рендеру.
- **Не оптимізуйте передчасно.** React достатньо швидкий; спершу пишіть
  зрозуміло.

📚 З 2025 року доступний **React Compiler** (стабільна версія 1.0) — він
автоматично додає мемоізацію, знімаючи потребу вручну розставляти `useMemo` й
`useCallback`. У курсі ми розберемо ручний спосіб (лекція 7), бо розуміти
механізм усе одно потрібно.

---

## 3. Створення проєкту

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

**Vite** — сучасний інструмент збірки: миттєвий старт, гаряче оновлення модулів
(HMR), оптимізована продакшен-збірка. Актуальна мажорна версія — 8.

Структура:

```
my-app/
├── index.html          ← точка входу (не в public/!)
├── package.json
├── vite.config.js
├── public/             ← статичні файли «як є»
└── src/
    ├── main.jsx        ← монтування React у DOM
    ├── App.jsx         ← кореневий компонент
    ├── index.css
    └── components/
```

```jsx
// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**`<StrictMode>`** у режимі розробки навмисно викликає компоненти й ефекти
двічі, щоб виявити побічні ефекти й нечисті функції. У продакшен-збірці цього
немає.

⚠️ Якщо ви бачите, що `console.log` у компоненті виводиться двічі — це
StrictMode, а не помилка. Це сигнал: ваш компонент має бути чистим.

**Команди:**

```bash
npm run dev       # сервер розробки з HMR
npm run build     # збірка в dist/
npm run preview   # локальний перегляд продакшен-збірки
```

⚠️ Create React App більше не рекомендується офіційною документацією React.
Використовуйте Vite.

---

## 4. JSX

**JSX** — синтаксичне розширення JavaScript, що дозволяє писати розмітку прямо
в коді. Це не HTML і не рядок: збірник перетворює JSX на виклики функцій.

```jsx
const element = <h1 className="title">Привіт</h1>;
// перетворюється приблизно на:
// jsx('h1', { className: 'title', children: 'Привіт' })
```

### 4.1. Правила

```jsx
function Card({ title, count, isActive }) {
  return (
    // 1. Рівно один кореневий елемент (або фрагмент <>…</>)
    <article className="card">
      {/* 2. Атрибути в camelCase; class → className, for → htmlFor */}
      <label htmlFor="x" className="card__label">Мітка</label>

      {/* 3. JavaScript у фігурних дужках */}
      <h3>{title}</h3>
      <p>Кількість: {count * 2}</p>

      {/* 4. Стилі — об'єкт, властивості в camelCase */}
      <div style={{ backgroundColor: '#eee', paddingBlock: '1rem' }} />

      {/* 5. Порожні елементи обов'язково самозакривні */}
      <img src="/photo.jpg" alt="Фото" />
      <br />

      {/* 6. Коментарі — так */}
    </article>
  );
}
```

### 4.2. Фрагменти

```jsx
// Без зайвої обгортки в DOM
return (
  <>
    <h2>Заголовок</h2>
    <p>Текст</p>
  </>
);

// Якщо потрібен key — повна форма
return items.map(item => (
  <Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </Fragment>
));
```

### 4.3. Що можна вставляти у фігурні дужки

```jsx
{someVariable}                       // ✅ рядки, числа
{items.map(…)}                       // ✅ масиви елементів
{condition && <p>Текст</p>}          // ✅ вирази
{null} {undefined} {false}           // ✅ нічого не відрендериться
{someObject}                         // ❌ помилка: об'єкти не рендеряться
{if (x) {…}}                         // ❌ інструкції, лише вирази
```

⚠️ **Класична пастка з `&&` і числами:**

```jsx
{items.length && <List items={items} />}
// Якщо items порожній → 0 && … → 0 → на сторінці з'явиться «0» ⚠️

{items.length > 0 && <List items={items} />}   // ✅
```

### 4.4. JSX і безпека

```jsx
const userInput = '<img src=x onerror=alert(1)>';
return <p>{userInput}</p>;    // ✅ виведеться як текст — React екранує все
```

🔑 React екранує вставлені значення автоматично. Небезпечним є лише свідоме
використання `dangerouslySetInnerHTML` — назва навмисно лякає.

---

## 5. Компоненти

**Компонент** — функція, що повертає JSX. Ім'я обов'язково з великої літери.

```jsx
function Greeting({ name }) {
  return <h1>Привіт, {name}!</h1>;
}

export default Greeting;
```

```jsx
// Використання
<Greeting name="Оксана" />
```

⚠️ Ім'я з малої літери React вважатиме назвою HTML-тега: `<greeting />`
відрендериться як невідомий елемент і нічого не покаже.

### 5.1. Композиція

Компоненти вкладаються один в одного, як звичайні елементи:

```jsx
function MovieCard({ movie }) {
  return (
    <article className="card">
      <Poster src={movie.poster} alt={movie.title} />
      <div className="card__body">
        <h3 className="card__title">{movie.title}</h3>
        <Rating value={movie.rating} />
        <GenreList genres={movie.genres} />
      </div>
    </article>
  );
}
```

### 5.2. Коли виділяти компонент

Виділяйте, коли:

- фрагмент **повторюється** (картка, поле форми, кнопка);
- фрагмент має **власний стан** (акордеон, випадне меню);
- функція компонента стала **довшою за ~100 рядків**;
- фрагмент можна назвати **одним іменником** («Картка фільму», «Панель фільтрів»).

Не виділяйте заради самого виділення: компонент із двох рядків, що
використовується один раз, лише ускладнює навігацію кодом.

---

## 6. Props

**Props** — дані, які батьківський компонент передає дочірньому. Вони
**лише для читання**.

```jsx
function Badge({ text, variant = 'default', icon = null }) {
  return (
    <span className={`badge badge--${variant}`}>
      {icon}
      {text}
    </span>
  );
}

<Badge text="Новинка" variant="success" />
<Badge text="Чернетка" />
```

### 6.1. Передавання різних типів

```jsx
<Component
  text="рядок"                      // рядок — у лапках
  count={42}                        // число — у фігурних дужках
  isActive                          // true (скорочення для isActive={true})
  isVisible={false}
  items={['a', 'b']}                // масив
  user={{ name: 'Аня' }}            // об'єкт
  onSelect={handleSelect}           // функція
  icon={<StarIcon />}               // елемент JSX
/>
```

### 6.2. `children`

```jsx
function Panel({ title, children, footer }) {
  return (
    <section className="panel">
      <h2 className="panel__title">{title}</h2>
      <div className="panel__body">{children}</div>
      {footer && <footer className="panel__footer">{footer}</footer>}
    </section>
  );
}
```

```jsx
<Panel title="Налаштування" footer={<button>Зберегти</button>}>
  <p>Будь-який вміст тут</p>
  <Switch label="Темна тема" />
</Panel>
```

🔑 `children` — головний інструмент композиції. Замість того, щоб робити
компонент із двадцятьма props на всі випадки, дайте змогу передати вміст
усередину.

### 6.3. Props лише для читання

```jsx
function Bad({ user }) {
  user.name = 'Змінено';         // ❌ мутація props — заборонено
  return <p>{user.name}</p>;
}
```

Компонент має бути **чистою функцією**: не змінювати нічого, що прийшло ззовні.
Якщо потрібно змінити дані — це робить той, кому вони належать (розділ 13).

### 6.4. Розширення props

```jsx
function Button({ variant = 'primary', className = '', ...rest }) {
  return (
    <button className={`btn btn--${variant} ${className}`} {...rest} />
  );
}

<Button variant="danger" onClick={remove} type="button" aria-label="Видалити">
  Видалити
</Button>
```

Такий «прохідний» spread дозволяє передати будь-які стандартні атрибути, не
перелічуючи їх.

### 6.5. Документування props

Без TypeScript корисно описувати очікувані props у JSDoc:

```jsx
/**
 * Картка фільму.
 * @param {Object} props
 * @param {{id: string, title: string, year: number, poster?: string}} props.movie
 * @param {(id: string) => void} [props.onSelect]
 */
function MovieCard({ movie, onSelect }) { … }
```

📚 У Завданні №3 вітається TypeScript — він робить такий опис перевірюваним.

---

## 7. Умовний рендеринг

```jsx
function Status({ status, error, items }) {
  // 1. Раннє повернення — найчитабельніше для великих гілок
  if (status === 'loading') return <Skeleton />;
  if (status === 'error') return <ErrorBox error={error} />;
  if (items.length === 0) return <EmptyState />;

  return <List items={items} />;
}
```

```jsx
// 2. Тернарний оператор — для короткого вибору з двох
<button>{isSaving ? 'Збереження…' : 'Зберегти'}</button>

// 3. Логічне І — для «показати або нічого»
{hasError && <p className="error">{errorMessage}</p>}

// 4. Об'єкт-довідник — коли варіантів багато
const icons = { success: <CheckIcon />, error: <XIcon />, warning: <AlertIcon /> };
<span>{icons[type]}</span>
```

⚠️ Не вкладайте тернарні оператори один в одного більш ніж на один рівень —
такий код неможливо читати. Використайте раннє повернення або окремий
компонент.

---

## 8. Списки та ключі

```jsx
function MovieList({ movies }) {
  return (
    <ul className="movies">
      {movies.map(movie => (
        <li key={movie.id} className="movies__item">
          <MovieCard movie={movie} />
        </li>
      ))}
    </ul>
  );
}
```

### 8.1. Навіщо `key`

`key` каже React, який елемент списку якому відповідає між рендерами. Без
нього React зіставляє елементи за позицією — і при вставці, видаленні чи
сортуванні відбувається плутанина.

⚠️ **Чому індекс масиву — погана ідея:**

```jsx
{items.map((item, index) => <Row key={index} item={item} />)}
```

Уявіть список із трьох рядків, у кожному є поле введення. Ви видаляєте перший
рядок. Тепер елемент, що був `key={1}`, став `key={0}` — React вважає, що це
той самий елемент, і **лишає в ньому старий стан поля**. Користувач бачить, що
введений текст «переїхав» не туди.

Те саме стосується сортування, фільтрації та вставки на початок.

🔑 Правила для `key`:

- використовуйте **стабільний унікальний ідентифікатор** з даних (`item.id`);
- ключ має бути унікальним **серед сусідів**, не глобально;
- `key` ставиться на **зовнішній** елемент у `map`;
- індекс допустимий лише якщо список **ніколи** не змінює порядок, не
  фільтрується й елементи не мають власного стану;
- **не використовуйте `Math.random()`** — новий ключ на кожному рендері
  означає повне перестворення елементів (втрата стану, фокуса, анімацій).

---

## 9. Стан і `useState`

**Стан (state)** — дані, що змінюються з часом і впливають на вигляд.

```jsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  //     ↑      ↑                    ↑
  //  значення  функція оновлення  початкове значення

  return (
    <>
      <p>Значення: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <button onClick={() => setCount(0)}>Скинути</button>
    </>
  );
}
```

### 9.1. Як це працює

1. `useState` повертає поточне значення й функцію оновлення.
2. Виклик `setCount` **планує** перерендер.
3. React викликає функцію-компонент заново, і `useState` повертає **нове**
   значення.

🔑 **Стан не змінюється миттєво:**

```jsx
function handleClick() {
  console.log(count);      // 0
  setCount(count + 1);
  console.log(count);      // 0 ⚠️ усе ще 0!
}
```

Змінна `count` у поточному виклику функції зафіксована. Нове значення
з'явиться лише в наступному рендері. Це не помилка — це наслідок того, що
кожен рендер має власний «знімок» стану.

### 9.2. Функціональне оновлення

```jsx
// ❌ Обидва виклики бачать одне й те саме count → +1, а не +2
setCount(count + 1);
setCount(count + 1);

// ✅ Кожен отримує актуальне значення → +2
setCount(prev => prev + 1);
setCount(prev => prev + 1);
```

🔑 **Правило:** якщо нове значення залежить від попереднього — завжди
використовуйте функціональну форму. Це особливо важливо в обробниках подій,
таймерах і асинхронному коді.

### 9.3. Пакетування оновлень

React об'єднує кілька викликів `setState` в один перерендер (це називають
batching). Тому кілька оновлень поспіль не спричиняють кількох рендерів.

### 9.4. Ліниве початкове значення

```jsx
// ❌ Функція виконується на КОЖНОМУ рендері
const [notes, setNotes] = useState(loadFromStorage());

// ✅ Виконається лише один раз
const [notes, setNotes] = useState(() => loadFromStorage());
```

### 9.5. Що має бути станом, а що ні

Задайте три питання. Якщо на всі «ні» — це **не стан**.

1. Чи змінюється це з часом?
2. Чи не можна це обчислити з props або іншого стану?
3. Чи не передається це вже як prop?

```jsx
// ❌ Похідні дані в стані — джерело неузгодженості
const [movies, setMovies] = useState([]);
const [filtered, setFiltered] = useState([]);
const [count, setCount] = useState(0);

// ✅ Обчислюємо під час рендеру
const [movies, setMovies] = useState([]);
const [query, setQuery] = useState('');

const filtered = movies.filter(m =>
  m.title.toLowerCase().includes(query.toLowerCase())
);
const count = filtered.length;
```

🔑 **Мінімізуйте стан.** Кожна зайва змінна стану — це ще одна можливість
розсинхронізувати дані. Тримайте в стані лише те, що неможливо обчислити.

### 9.6. Стан локальний для екземпляра

```jsx
<Counter />   // свій count
<Counter />   // свій count, незалежний
```

Кожен виклик компонента має власний стан. Це наслідок того, що React зберігає
стан за позицією компонента в дереві.

---

## 10. Оновлення стану без мутацій

Це найважливіше правило React після `key`.

### 10.1. Масиви

```jsx
const [items, setItems] = useState([]);

// ❌ Мутація — React не побачить зміни (посилання те саме)
items.push(newItem);
setItems(items);

// ✅ Додати
setItems([...items, newItem]);
setItems(prev => [...prev, newItem]);

// ✅ Додати на початок
setItems(prev => [newItem, ...prev]);

// ✅ Видалити
setItems(prev => prev.filter(item => item.id !== id));

// ✅ Змінити один елемент
setItems(prev => prev.map(item =>
  item.id === id ? { ...item, done: !item.done } : item
));

// ✅ Відсортувати (не мутуючи!)
setItems(prev => prev.toSorted((a, b) => a.title.localeCompare(b.title, 'uk')));

// ✅ Вставити в середину
setItems(prev => [...prev.slice(0, index), newItem, ...prev.slice(index)]);
```

### 10.2. Об'єкти

```jsx
const [form, setForm] = useState({ title: '', year: 2026, genres: [] });

// ❌
form.title = 'Нова назва';
setForm(form);

// ✅
setForm(prev => ({ ...prev, title: 'Нова назва' }));

// ✅ Вкладений об'єкт — розгортаємо кожен рівень
setForm(prev => ({
  ...prev,
  author: { ...prev.author, name: 'Нове ім'я' },
}));
```

🔑 **Чому так.** React порівнює стан за посиланням (`Object.is`). Якщо ви
змінили масив «на місці», посилання лишилося тим самим — React вважає, що
нічого не змінилося, і не перемалює. Тому потрібен **новий об'єкт**.

⚠️ Глибока вкладеність робить оновлення громіздким. Це сигнал: варто або
**зробити структуру пласкішою**, або перейти на `useReducer` (лекція 8).

---

## 11. Обробка подій

```jsx
function Toolbar({ onCreate, onClear }) {
  const handleCreate = () => onCreate();

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') onCreate();
  };

  return (
    <div className="toolbar">
      <button type="button" onClick={handleCreate}>Додати</button>
      <button type="button" onClick={() => onClear()}>Очистити</button>
      <input onKeyDown={handleKeyDown} />
    </div>
  );
}
```

⚠️ **Передавайте функцію, а не результат її виклику:**

```jsx
<button onClick={handleClick}>       {/* ✅ */}
<button onClick={handleClick()}>     {/* ❌ викличеться під час рендеру! */}
<button onClick={() => remove(id)}>  {/* ✅ потрібен аргумент — обгортка */}
```

**Синтетичні події.** React обгортає нативні події у власний об'єкт із єдиною
поведінкою в усіх браузерах. API майже той самий:

```jsx
const handleSubmit = (event) => {
  event.preventDefault();
  event.stopPropagation();
  console.log(event.target, event.currentTarget);
  console.log(event.nativeEvent);        // оригінальна подія браузера
};
```

Найуживаніші: `onClick`, `onChange`, `onInput`, `onSubmit`, `onFocus`,
`onBlur`, `onKeyDown`, `onPointerDown`, `onMouseEnter`.

⚠️ У React `onChange` для текстових полів поводиться як нативний `input` —
спрацьовує на кожен символ, а не після втрати фокуса.

---

## 12. Форми: керовані компоненти

**Керований компонент** — поле, значення якого зберігається в стані React.

```jsx
function MovieForm({ onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    year: '',
    description: '',
    isPublished: false,
    format: 'digital',
    genreId: '',
  });

  // Один обробник на всі поля
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="title">Назва</label>
        <input
          id="title" name="title" type="text"
          value={form.title} onChange={handleChange}
        />
      </div>

      <div className="field">
        <label htmlFor="year">Рік</label>
        <input
          id="year" name="year" type="number" min="1888" max="2100"
          value={form.year} onChange={handleChange}
        />
      </div>

      <div className="field">
        <label htmlFor="description">Опис</label>
        <textarea
          id="description" name="description" rows="4"
          value={form.description} onChange={handleChange}
        />
      </div>

      <label className="checkbox">
        <input
          type="checkbox" name="isPublished"
          checked={form.isPublished} onChange={handleChange}
        />
        Опубліковано
      </label>

      <fieldset>
        <legend>Формат</legend>
        <label>
          <input type="radio" name="format" value="digital"
                 checked={form.format === 'digital'} onChange={handleChange} />
          Цифровий
        </label>
        <label>
          <input type="radio" name="format" value="disc"
                 checked={form.format === 'disc'} onChange={handleChange} />
          Диск
        </label>
      </fieldset>

      <div className="field">
        <label htmlFor="genreId">Жанр</label>
        <select id="genreId" name="genreId" value={form.genreId} onChange={handleChange}>
          <option value="">— оберіть —</option>
          <option value="1">Драма</option>
          <option value="2">Комедія</option>
        </select>
      </div>

      <button type="submit">Зберегти</button>
    </form>
  );
}
```

⚠️ **`value` без `onChange`** робить поле незмінним, і React виведе
попередження. Якщо потрібне справді незмінне поле — додайте `readOnly`.

⚠️ **`value={undefined}`** перетворює компонент на некерований. Завжди
ініціалізуйте поля порожнім рядком, а не `undefined`.

---

## 13. Підняття стану

Коли двом компонентам потрібні одні й ті самі дані, стан переносять до їхнього
**спільного предка** й передають униз як props, а зміни — через колбеки.

```jsx
function MoviesPage() {
  const [movies, setMovies] = useState(initialMovies);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  const visible = movies.filter(m =>
    m.title.toLowerCase().includes(query.trim().toLowerCase())
  );
  const selected = movies.find(m => m.id === selectedId) ?? null;

  const handleDelete = (id) => {
    setMovies(prev => prev.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="page">
      <SearchBar value={query} onChange={setQuery} />
      <MovieList
        movies={visible}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onDelete={handleDelete}
      />
      {selected && <MovieDetails movie={selected} />}
    </div>
  );
}
```

```
        MoviesPage  ← стан живе тут
       ╱     │      ╲
SearchBar  MovieList  MovieDetails
```

🔑 **Односпрямований потік даних:** дані течуть **вниз** (props), події —
**вгору** (колбеки). Дочірній компонент ніколи не змінює чужий стан напряму.

⚠️ **Prop drilling.** Якщо стан доводиться протягувати через п'ять рівнів
компонентів, які самі його не використовують, — це сигнал, що потрібен Context
(лекція 8).

**Іменування колбеків.** Домовленість: prop називається `onЩось`
(`onSelect`, `onDelete`), а функція-обробник усередині — `handleЩось`
(`handleSelect`, `handleDelete`).

---

## 14. Стилізація

### 14.1. Звичайний CSS

```jsx
import './MovieCard.css';

function MovieCard() {
  return <article className="movie-card">…</article>;
}
```

Просто, працює, добре поєднується з BEM. Ризик — глобальні конфлікти імен
(BEM їх і розв'язує).

### 14.2. CSS Modules

```css
/* MovieCard.module.css */
.card { padding: 1rem; }
.title { font-size: 1.25rem; }
```

```jsx
import styles from './MovieCard.module.css';

function MovieCard() {
  return (
    <article className={styles.card}>
      <h3 className={styles.title}>Назва</h3>
    </article>
  );
}
```

Vite підтримує CSS Modules «з коробки»: імена класів стають унікальними
автоматично, конфлікти неможливі.

### 14.3. Умовні класи

```jsx
// Вручну
<div className={`card ${isActive ? 'card--active' : ''}`}>

// З бібліотекою clsx (крихітна, зручна)
import clsx from 'clsx';
<div className={clsx('card', { 'card--active': isActive, 'card--wide': isWide })}>
```

⚠️ У Завданні №3 UI-кіти (MUI, Ant Design, Chakra) заборонені: акордеон і
модальне вікно треба реалізувати самостійно. CSS Modules або звичайний CSS із
BEM — правильний вибір.

---

## 15. Структура проєкту

```
src/
├── main.jsx
├── App.jsx
├── components/           ← переюзані «дурні» компоненти
│   ├── Button/
│   │   ├── Button.jsx
│   │   └── Button.module.css
│   ├── Modal/
│   ├── Accordion/
│   └── Pagination/
├── features/             ← компоненти конкретної предметної області
│   └── movies/
│       ├── MovieList.jsx
│       ├── MovieCard.jsx
│       ├── MovieForm.jsx
│       └── MovieFilters.jsx
├── pages/                ← сторінки-маршрути
│   ├── MoviesPage.jsx
│   ├── MovieDetailsPage.jsx
│   └── NotFoundPage.jsx
├── context/              ← провайдери (лекція 8)
├── hooks/                ← власні хуки (лекція 7)
├── api/                  ← робота з сервером (лекція 10)
├── utils/                ← чисті допоміжні функції
└── data/                 ← початкові дані (seed)
```

Дві корисні домовленості:

- **один компонент — один файл**, назва файлу збігається з назвою компонента;
- **«розумні» й «дурні» компоненти:** сторінки тримають стан і логіку,
  компоненти в `components/` лише приймають props і малюють.

---

## 16. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Мутація стану (`push`, `sort`, присвоєння полю) | Інтерфейс не оновлюється | Spread, `map`, `filter`, `toSorted` |
| 2 | `key={index}` у змінюваному списку | Стан «переїжджає» між рядками | `key={item.id}` |
| 3 | `key={Math.random()}` | Повне перестворення, втрата фокуса | Стабільний ідентифікатор |
| 4 | `onClick={handleClick()}` | Виклик під час рендеру | `onClick={handleClick}` |
| 5 | Похідні дані в окремому стані | Розсинхронізація | Обчислювати під час рендеру |
| 6 | Очікування, що стан оновиться миттєво | Читання старого значення | Функціональне оновлення |
| 7 | `setCount(count + 1)` двічі поспіль | Додасться 1, а не 2 | `setCount(prev => prev + 1)` |
| 8 | `{items.length && <List/>}` | На екрані «0» | `{items.length > 0 && …}` |
| 9 | `value` без `onChange` | Поле не редагується | Додати обробник або `readOnly` |
| 10 | `useState(loadFromStorage())` | Функція на кожному рендері | `useState(() => …)` |
| 11 | Компонент із малої літери | Не рендериться | `PascalCase` |
| 12 | Мутація props | Непередбачувана поведінка | Props лише для читання |
| 13 | `class` замість `className` | Атрибут ігнорується | `className` |
| 14 | Компонент на 400 рядків | Неможливо підтримувати | Декомпозиція |
| 15 | Prop drilling через 5 рівнів | Крихкий код | Context (лекція 8) |
| 16 | `dangerouslySetInnerHTML` з даними користувача | XSS | Ніколи так не робити |

---

## 17. Контрольні запитання

1. Чим декларативний підхід відрізняється від імперативного? Наведіть приклад.
2. Що таке віртуальний DOM і навіщо він потрібен?
3. На яких двох припущеннях побудовано алгоритм узгодження?
4. Чому компонент має бути чистою функцією?
5. Що робить `<StrictMode>` і чому в консолі все виводиться двічі?
6. Перелічіть п'ять відмінностей JSX від HTML.
7. Чому `{items.length && <List/>}` може вивести «0»?
8. Навіщо потрібен атрибут `key` і чому індекс — погана ідея?
9. Чому після `setCount(count + 1)` змінна `count` не змінюється одразу?
10. Коли обов'язково потрібне функціональне оновлення стану?
11. Чому не можна писати `items.push(x); setItems(items);`?
12. Як вирішити, чи має значення бути станом?
13. Що таке підняття стану і коли воно потрібне?
14. Що таке односпрямований потік даних?
15. Що таке prop drilling і чому це проблема?
16. Чим `children` кращий за десяток окремих props?

---

## 18. Практичні вправи

**Вправа 1 (перший компонент, 20 хв).** Створіть проєкт через Vite. Зробіть
компонент `Greeting`, що приймає `name` і `hour` та виводить «Доброго ранку/
дня/вечора, {name}!» залежно від години.

**Вправа 2 (props і композиція, 30 хв).** Зробіть компонент `Card` із props
`title`, `image`, `footer` і `children`. Використайте його тричі з різним
вмістом. Додайте компонент `Badge` із варіантами `success`, `warning`,
`danger`.

**Вправа 3 (стан, 30 хв).** Реалізуйте лічильник із кнопками `+1`, `−1`,
`+10`, «Скинути», обмеженням від 0 до 100 і зміною кольору при значенні > 80.
Використайте функціональне оновлення.

**Вправа 4 (списки, 40 хв).** Список справ: додавання, позначення виконаною,
видалення, фільтр «усі / активні / виконані», лічильник «залишилося N».
Вимоги: жодних мутацій; `key` за ідентифікатором; лічильник обчислюється, а
не зберігається в стані.

**Вправа 5 (форма, 40 хв).** Форма створення фільму з усіма типами полів із
розділу 12. Під формою — «живий» попередній перегляд картки, що оновлюється
при кожному введенні символа.

**Вправа 6 (підняття стану, 45 хв).** Сторінка зі списком фільмів (12+
записів у seed-файлі): поле пошуку, список карток, панель деталей обраного
фільму, кнопка видалення. Стан живе в батьківському компоненті; `SearchBar`,
`MovieList` і `MovieDetails` — «дурні» компоненти без власного стану.

**Вправа 7 (аналіз, 20 хв).** Знайдіть п'ять помилок:

```jsx
function TodoList({ todos }) {
  const [items, setItems] = useState(todos);
  const [completedCount, setCompletedCount] = useState(0);

  function toggle(id) {
    const item = items.find(i => i.id === id);
    item.done = !item.done;
    setItems(items);
    setCompletedCount(items.filter(i => i.done).length);
  }

  return (
    <ul>
      {items.map((item, i) => (
        <li key={i} class="item" onClick={toggle(item.id)}>
          {item.title}
        </li>
      ))}
    </ul>
  );
}
```

---

## 19. Корисні посилання

- [react.dev — Learn React](https://react.dev/learn) — **офіційний підручник,
  найкраще джерело.** Розділи «Describing the UI» та «Adding Interactivity» —
  прямо до цієї лекції. Є інтерактивні вправи.
- [react.dev: Thinking in React](https://react.dev/learn/thinking-in-react) —
  як розкласти макет на компоненти. Обов'язково до Завдання №3.
- [react.dev: Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) —
  як не наробити зайвого стану.
- [react.dev: Updating Objects / Arrays in State](https://react.dev/learn/updating-objects-in-state) —
  усі рецепти незмінного оновлення.
- [react.dev: Rendering Lists](https://react.dev/learn/rendering-lists) — про
  `key` докладно.
- [Vite Guide](https://vite.dev/guide/) — документація збірника.
- [React DevTools](https://react.dev/learn/react-developer-tools) —
  розширення для браузера: дерево компонентів, props, стан, профайлер.
- [React Compiler](https://react.dev/learn/react-compiler) — автоматична
  оптимізація.
- [clsx](https://github.com/lukeed/clsx) — умовні класи.

---

## 20. Література

1. **Kumar, T.** *Fluent React: Build Fast, Performant, and Intuitive Web
   Applications.* — O'Reilly, 2024. — Як React працює зсередини: віртуальний
   DOM, узгодження, рендеринг. Розділи 1–4 поглиблюють цю лекцію.
2. **Barklund, M., Mardan, A.** *React Quickly.* 2nd ed. — Manning, 2023. —
   Швидкий практичний вступ на прикладах; добра альтернатива, якщо офіційний
   підручник здається надто стислим.
3. **Banks, A., Porcello, E.** *Learning React: Modern Patterns for Developing
   React Apps.* 2nd ed. — O'Reilly, 2020. — Систематичний виклад із акцентом на
   функціональний стиль.
4. **Wieruch, R.** *The Road to React.* — Оновлюється щороку; проєкт від
   нуля до робочого застосунку.

---

## 21. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Компонент | component | Функція, що повертає опис інтерфейсу |
| Властивості | props | Дані, передані компоненту ззовні |
| Стан | state | Дані компонента, що змінюються з часом |
| Хук | hook | Функція, що дає доступ до можливостей React |
| Віртуальний DOM | virtual DOM | Легке подання дерева в пам'яті |
| Узгодження | reconciliation | Порівняння дерев і обчислення змін |
| Рендер | render | Виклик функції компонента |
| Перерендер | re-render | Повторний виклик після зміни стану |
| Ключ | key | Ідентифікатор елемента списку |
| Фрагмент | fragment | Обгортка без власного DOM-вузла |
| Керований компонент | controlled component | Поле, значення якого зберігає React |
| Підняття стану | lifting state up | Перенесення стану до спільного предка |
| Односпрямований потік | one-way data flow | Дані вниз, події вгору |
| Протягування props | prop drilling | Передавання props через проміжні рівні |
| Композиція | composition | Побудова складного з простого через `children` |
| Чиста функція | pure function | Без побічних ефектів, детермінована |
| Незмінність | immutability | Створення нових об'єктів замість зміни |
| Синтетична подія | synthetic event | Обгортка React над нативною подією |

---

**Попередня:** [Лекція 5. Асинхронний JavaScript та робота з мережею](05-async-javascript-network.md)
**Наступна:** [Лекція 7. React: хуки та побічні ефекти](07-react-hooks-effects.md)

[← До змісту курсу](README.md)
