# Лекція 2. CSS: макетування, адаптивність, ефекти

> **Курс:** Основи web програмування · ЛНУ ім. Івана Франка · ФПМІ
> **Тривалість:** 2 академічні години (+ ~8 годин самостійної роботи)
> **Пов'язане завдання:** №1 «Студентське портфоліо (mobile first)»
> **Попередня лекція:** [Лекція 1](01-web-html-css-basics.md)

---

## Про що ця лекція

У першій лекції ми навчилися описувати **що** є на сторінці й **як воно
виглядає в дрібницях** (кольори, шрифти, відступи). Тепер найважче й
найцікавіше: **як розташувати елементи на площині** й зробити так, щоб макет
однаково добре працював на телефоні шириною 320 px і на моніторі 2560 px.

Історично це було найболючішою частиною вебу. Верстку робили таблицями, потім
плаваючими блоками (`float`) із милицями на кшталт «clearfix», потім
`inline-block` із хаками для пробілів. Сьогодні є два повноцінні інструменти —
**Flexbox** і **Grid** — і верстка стала передбачуваною. Ця лекція майже
повністю про них.

---

## Зміст

1. [Нормальний потік і контексти форматування](#1-нормальний-потік-і-контексти-форматування)
2. [Позиціонування та z-index](#2-позиціонування-та-z-index)
3. [Flexbox](#3-flexbox)
4. [CSS Grid](#4-css-grid)
5. [Flexbox чи Grid: як обрати](#5-flexbox-чи-grid-як-обрати)
6. [Mobile first і медіа-запити](#6-mobile-first-і-медіа-запити)
7. [Контейнерні запити](#7-контейнерні-запити)
8. [Плинна типографіка та відступи](#8-плинна-типографіка-та-відступи)
9. [Адаптивні зображення та співвідношення сторін](#9-адаптивні-зображення-та-співвідношення-сторін)
10. [Темна тема та вподобання користувача](#10-темна-тема-та-вподобання-користувача)
11. [Псевдокласи й псевдоелементи: просунутий рівень](#11-псевдокласи-й-псевдоелементи-просунутий-рівень)
12. [Трансформації, переходи, анімації](#12-трансформації-переходи-анімації)
13. [Сучасний CSS: вкладеність, логічні властивості, `@supports`](#13-сучасний-css-вкладеність-логічні-властивості-supports)
14. [Організація CSS: BEM і структура файлів](#14-організація-css-bem-і-структура-файлів)
15. [Готові рецепти макетів](#15-готові-рецепти-макетів)
16. [Типові помилки](#16-типові-помилки)
17. [Контрольні запитання](#17-контрольні-запитання)
18. [Практичні вправи](#18-практичні-вправи)
19. [Корисні посилання](#19-корисні-посилання)
20. [Література](#20-література)
21. [Глосарій](#21-глосарій)

---

## Мета лекції

Після опрацювання ви:

- пояснюватимете, чому елемент опинився саме там, де опинився;
- впевнено користуватиметеся Flexbox і CSS Grid та свідомо обиратимете між ними;
- побудуєте макет за підходом *mobile first* із трьома різними розкладками;
- зробите плинну типографіку без десятка медіа-запитів;
- реалізуєте темну тему, змінивши лише набір змінних;
- зробите анімації, що не «підвішують» сторінку й поважають налаштування
  користувача.

---

## 1. Нормальний потік і контексти форматування

### 1.1. Нормальний потік

Без жодного CSS браузер розкладає елементи за простими правилами:

- **блокові** елементи йдуть згори вниз, кожен займає всю доступну ширину;
- **рядкові** — зліва направо в межах рядка, переносяться при потребі;
- висота блоку визначається його вмістом.

🔑 **Головна порада:** не боріться з потоком без потреби. Найнадійніші макети —
ті, що використовують природну поведінку: блок займає ширину батька, висота
підлаштовується під вміст. Фіксовані висоти й абсолютне позиціонування — те, що
ламається першим.

### 1.2. Контексти форматування

**Контекст форматування (formatting context)** — «пісочниця», всередині якої
діють свої правила розкладки і яка ізолює вміст від зовнішнього світу.

| Контекст | Як створюється |
|---|---|
| Блоковий (BFC) | `display: flow-root`, `overflow: auto/hidden`, `float`, `position: absolute`, flex/grid-елементи |
| Флексовий | `display: flex` |
| Ґратковий | `display: grid` |

Навіщо це знати: новий BFC **зупиняє схлопування відступів** і **містить у
собі плаваючі елементи**. Класична проблема «дитина з `margin-top` виштовхує
батька» розв'язується одним рядком:

```css
.parent { display: flow-root; }
```

---

## 2. Позиціонування та z-index

```css
.el { position: static; }    /* за замовчуванням: у потоці */
.el { position: relative; }  /* у потоці, але зміщується відносно себе */
.el { position: absolute; }  /* ВИПАДАЄ з потоку, відносно позиціонованого предка */
.el { position: fixed; }     /* відносно вікна перегляду, не прокручується */
.el { position: sticky; }    /* у потоці, «прилипає» при прокручуванні */
```

### 2.1. `relative` + `absolute` — робоча пара

```css
.card {
  position: relative;         /* стає системою координат */
}

.card__badge {
  position: absolute;         /* відлік від .card, а не від сторінки */
  top: var(--space-2);
  right: var(--space-2);
}
```

🔑 **Правило:** `absolute` рахує координати від найближчого предка, у якого
`position` **не** `static`. Якщо такого немає — від початкового блока
(фактично від сторінки). Забути `position: relative` на батькові — помилка №1
у роботі з абсолютним позиціонуванням.

### 2.2. `sticky` — липка шапка без JavaScript

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--color-bg);
}
```

⚠️ `sticky` не працює, якщо:

- не задано жодного зі зміщень (`top`, `bottom`, `left`, `right`);
- у якогось предка `overflow: hidden` / `auto` / `scroll`;
- батьківський контейнер не вищий за сам елемент (нема куди «липнути»).

### 2.3. Контекст накладання (stacking context) і `z-index`

`z-index` працює **тільки** для позиціонованих елементів (не `static`), а також
для flex/grid-дітей.

Найважче в `z-index` — **контекст накладання**. Це «капсула»: усередині неї
елементи впорядковуються між собою, але вся капсула як ціле стає на своє місце
у батьківському контексті.

Новий контекст створюють:

- `position` (не `static`) разом із `z-index` ≠ `auto`;
- `opacity` менша за 1;
- `transform`, `filter`, `perspective`, `will-change`, `backdrop-filter`;
- `isolation: isolate`;
- `position: fixed` або `sticky` (завжди).

```html
<div class="a">           <!-- z-index: 1, створює контекст -->
  <div class="a-child">   <!-- z-index: 9999 -->
</div>
<div class="b"></div>     <!-- z-index: 2 -->
```

Хоч у `.a-child` і `z-index: 9999`, він опиниться **під** `.b`, бо замкнений
у контексті `.a` зі значенням 1.

🧪 У DevTools є вкладка **Layers** — вона наочно показує контексти накладання.

🔑 **Практична порада:** тримайте невелику шкалу `z-index` у змінних, а не
магічні числа:

```css
:root {
  --z-base: 0;
  --z-dropdown: 10;
  --z-sticky: 20;
  --z-modal: 100;
  --z-toast: 200;
}
```

---

## 3. Flexbox

**Flexbox** — одновимірна розкладка: елементи вибудовуються в **рядок** або в
**колонку**. Ідеальний для панелей навігації, груп кнопок, карток у ряд,
вирівнювання по центру.

### 3.1. Дві осі

```
flex-direction: row (за замовчуванням)

  main axis (головна вісь) ──────────────────►
  ┌──────┐ ┌──────┐ ┌──────┐              │
  │  1   │ │  2   │ │  3   │              │ cross axis
  └──────┘ └──────┘ └──────┘              │ (поперечна)
                                          ▼
```

При `flex-direction: column` осі міняються місцями. Це джерело плутанини:
`justify-content` **завжди** керує головною віссю, `align-items` — поперечною.

### 3.2. Властивості контейнера

```css
.flex {
  display: flex;                    /* або inline-flex */

  flex-direction: row;              /* row | row-reverse | column | column-reverse */
  flex-wrap: wrap;                  /* nowrap (за замовч.) | wrap | wrap-reverse */
  flex-flow: row wrap;              /* скорочення для двох попередніх */

  justify-content: space-between;   /* уздовж ГОЛОВНОЇ осі */
  align-items: center;              /* уздовж ПОПЕРЕЧНОЇ осі */
  align-content: flex-start;        /* між рядками, якщо їх кілька (тільки з wrap) */

  gap: 1rem;                        /* відступи між елементами */
  row-gap: 1rem;
  column-gap: 2rem;
}
```

**Значення `justify-content`:**

| Значення | Результат |
|---|---|
| `flex-start` | усі на початку |
| `flex-end` | усі в кінці |
| `center` | по центру |
| `space-between` | перший на початку, останній у кінці, решта рівномірно |
| `space-around` | однакові відступи навколо кожного (крайні — вдвічі менші) |
| `space-evenly` | абсолютно однакові проміжки, зокрема крайні |

**Значення `align-items`:**

| Значення | Результат |
|---|---|
| `stretch` (за замовч.) | розтягнути на всю висоту контейнера |
| `flex-start` / `flex-end` | притиснути вгору / вниз |
| `center` | по центру вертикалі |
| `baseline` | вирівняти за базовою лінією тексту |

🔑 `gap` замість `margin` — велика зручність. Не треба прибирати відступ в
останнього елемента (`:last-child { margin-right: 0 }`), і немає схлопування.
`gap` працює у flex, grid та multi-column.

### 3.3. Властивості елементів

```css
.item {
  flex-grow: 1;      /* наскільки жадібно росте (частка вільного місця) */
  flex-shrink: 1;    /* наскільки охоче стискається */
  flex-basis: auto;  /* базовий розмір ДО розподілу вільного місця */

  flex: 1;           /* = 1 1 0%   — «займи рівну частку» */
  flex: auto;        /* = 1 1 auto — «рости від власного розміру» */
  flex: none;        /* = 0 0 auto — «не рости й не стискатися» */
  flex: 0 0 240px;   /* фіксована ширина 240px */

  align-self: flex-end;  /* перевизначити align-items для себе */
  order: 2;              /* змінити візуальний порядок */
}
```

⚠️ **Різниця `flex: 1` і `flex: auto`.** Обидва ростуть, але:

- `flex: 1` (basis `0%`) — усі елементи стануть **однакової ширини**, вміст не
  враховується;
- `flex: auto` (basis `auto`) — спочатку кожен займає стільки, скільки потрібно
  вмісту, і лише **надлишок** ділиться порівну; довший текст дасть ширший блок.

⚠️ **`order` і доступність.** `order` та `row-reverse` змінюють лише **візуальний**
порядок. Клавіатурна навігація і екранні читачі йдуть за порядком у DOM. Якщо
візуальний і DOM-порядок розходяться, користувач `Tab`-а стрибає по сторінці
хаотично. Використовуйте `order` дуже помірно.

### 3.4. Класичні рецепти

```css
/* Ідеальне центрування — те, за чим тужили 15 років */
.center {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100dvh;
}

/* Шапка: логотип ліворуч, меню праворуч */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

/* «Липкий» підвал: контент розтягується, підвал завжди внизу */
body {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}
main { flex: 1; }

/* Медіа-об'єкт: аватар + текст */
.media { display: flex; gap: 1rem; align-items: flex-start; }
.media__avatar { flex: 0 0 64px; }
.media__body   { flex: 1; }

/* Панель кнопок, що переноситься на вузьких екранах */
.toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; }
```

---

## 4. CSS Grid

**Grid** — двовимірна розкладка: рядки **і** стовпці одночасно. Ідеальний для
сіток карток, галерей і загальної структури сторінки.

### 4.1. Оголошення сітки

```css
.grid {
  display: grid;

  grid-template-columns: 200px 1fr 200px;   /* три стовпці */
  grid-template-rows: auto 1fr auto;        /* три рядки */
  gap: 1.5rem;
}
```

**Одиниця `fr`** — частка вільного простору. `1fr 2fr` означає «поділи вільне
місце у пропорції 1:2». Це не те саме, що `33% 66%`: `fr` враховує `gap`,
відсотки — ні.

### 4.2. `repeat()`, `minmax()`, `auto-fit`

```css
/* Чотири однакові стовпці */
grid-template-columns: repeat(4, 1fr);

/* Стовпці не вужчі за 250px, автоматично стільки, скільки влізе */
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
```

🔑 **Найкорисніший рядок у сучасному CSS:**

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}
```

Це **адаптивна сітка без жодного медіа-запиту**. На вузькому екрані — одна
колонка, ширшає — стає дві, три, чотири. Саме її вимагає Завдання №1.

**`auto-fit` проти `auto-fill`:**

- `auto-fit` — «схлопує» порожні треки, елементи розтягуються на всю ширину;
- `auto-fill` — залишає порожні треки, елементи зберігають мінімальну ширину.

Якщо в сітці мало елементів, `auto-fit` розтягне їх на весь ряд, а `auto-fill`
залишить праворуч порожнє місце. Здебільшого потрібен `auto-fit`.

⚠️ Пастка: `minmax(250px, 1fr)` на екрані вужчому за 250 px спричинить
горизонтальне прокручування. Надійний варіант:

```css
grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));
```

### 4.3. Розміщення елементів

```css
/* За номерами ліній (їх на одну більше, ніж треків) */
.item {
  grid-column: 1 / 3;     /* від лінії 1 до лінії 3 = два стовпці */
  grid-row: 2 / 4;
}

/* Через span */
.item { grid-column: span 2; }

/* До кінця сітки */
.item { grid-column: 1 / -1; }   /* на всю ширину */
```

### 4.4. Іменовані області — найчитабельніший спосіб

```css
.layout {
  display: grid;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer footer";
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto 1fr auto;
  min-height: 100dvh;
  gap: 1rem;
}

.layout__header  { grid-area: header; }
.layout__sidebar { grid-area: sidebar; }
.layout__main    { grid-area: main; }
.layout__footer  { grid-area: footer; }
```

Макет видно прямо в коді. Перебудувати його для мобільного — три рядки:

```css
@media (max-width: 767px) {
  .layout {
    grid-template-areas:
      "header"
      "main"
      "sidebar"
      "footer";
    grid-template-columns: 1fr;
  }
}
```

(Тут `max-width` доречний як виняток; у Завданні №1 основну розкладку робимо
через `min-width` — див. розділ 6.)

### 4.5. Вирівнювання в Grid

```css
.grid {
  justify-items: center;    /* горизонтально ВСЕРЕДИНІ комірок */
  align-items: center;      /* вертикально всередині комірок */
  place-items: center;      /* скорочення для обох */

  justify-content: center;  /* уся сітка по горизонталі в контейнері */
  align-content: center;    /* уся сітка по вертикалі */
  place-content: center;
}

.item {
  justify-self: end;        /* для конкретного елемента */
  align-self: start;
}
```

### 4.6. Неявна сітка й автоматичне розміщення

```css
.grid {
  grid-auto-rows: minmax(120px, auto);  /* висота рядків, створених автоматично */
  grid-auto-flow: dense;                /* заповнювати «дірки» дрібнішими елементами */
}
```

`grid-auto-flow: dense` стане в пригоді для галереї-мозаїки, де частина
зображень займає дві клітинки.

⚠️ `dense` змінює візуальний порядок елементів відносно DOM — та сама
пересторога щодо доступності, що й для `order`.

### 4.7. `subgrid`

Дозволяє дитині успадкувати треки батьківської сітки. Класична проблема, яку
це розв'язує: у ряді карток заголовки різної довжини, і кнопки внизу
розташовані на різній висоті.

```css
.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }

.card {
  grid-row: span 3;
  display: grid;
  grid-template-rows: subgrid;   /* заголовок, текст і кнопка вирівняються між картками */
}
```

`subgrid` доступний у всіх основних браузерах; для старих можна залишити
звичайну поведінку як запасний варіант.

---

## 5. Flexbox чи Grid: як обрати

| Питання | Flexbox | Grid |
|---|---|---|
| Вимір | один (рядок **або** колонка) | два (рядки **і** колонки) |
| Хто визначає розмір | переважно вміст | переважно контейнер |
| Перенесення | елементи «течуть» і переносяться | елементи стоять у визначених треках |
| Типовий випадок | панель навігації, група кнопок, вирівнювання | сітка карток, галерея, каркас сторінки |

🔑 **Просте правило:** якщо ви розкладаєте елементи **в лінію** — Flexbox. Якщо
будуєте **сітку** — Grid. І їх постійно комбінують: Grid для загального
каркаса, Flexbox усередині кожної картки.

```css
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }

.card {
  display: flex;              /* усередині картки — колонка */
  flex-direction: column;
  gap: 0.75rem;
}
.card__footer { margin-top: auto; }   /* притиснути кнопку до низу картки */
```

---

## 6. Mobile first і медіа-запити

### 6.1. Чому саме mobile first

**Mobile first** — писати базові стилі для найвужчого екрана, а розширення
додавати медіа-запитами `min-width`.

Аргументи:

1. **Понад половина трафіку — мобільні.** Робити для них «залишковий» варіант
   нелогічно.
2. **Обмеження змушує пріоритезувати.** На екрані 360 px влізе лише
   найважливіше — і це корисна дисципліна для дизайну.
3. **Код виходить простішим.** Мобільний макет зазвичай однією колонкою — це
   майже нормальний потік, тобто мінімум CSS. Ускладнення додаються поступово.
4. **Продуктивність:** мобільні пристрої не завантажують стилі, призначені для
   десктопу (якщо використовувати `min-width`).

```css
/* ❌ Desktop first: складне спочатку, потім розбираємо */
.cards { display: grid; grid-template-columns: repeat(4, 1fr); }
@media (max-width: 1199px) { .cards { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 767px)  { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 479px)  { .cards { grid-template-columns: 1fr; } }

/* ✅ Mobile first: просте спочатку, потім нарощуємо */
.cards { display: grid; gap: 1rem; }                       /* одна колонка */
@media (min-width: 480px)  { .cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 768px)  { .cards { grid-template-columns: repeat(3, 1fr); } }
@media (min-width: 1200px) { .cards { grid-template-columns: repeat(4, 1fr); } }
```

### 6.2. Синтаксис медіа-запитів

```css
@media (min-width: 768px) { }
@media (max-width: 767.98px) { }
@media (min-width: 768px) and (max-width: 1199px) { }
@media (orientation: landscape) { }
@media print { }

/* Сучасний синтаксис діапазонів (Baseline) */
@media (width >= 768px) { }
@media (400px <= width <= 700px) { }
```

⚠️ **Не змішуйте `min-width` і `max-width` для однієї властивості.** Класична
помилка — `max-width: 768px` і `min-width: 768px`: на рівно 768 px спрацюють
обидва. Якщо вже потрібен `max-width`, пишіть `767.98px`.

### 6.3. Вибір брейкпойнтів

🔑 **Брейкпойнти визначає ваш контент, а не список моделей телефонів.**
Розтягуйте вікно браузера й дивіться, де макет «ламається» — там і ставте
брейкпойнт. Гнатися за розмірами конкретних пристроїв безглуздо: їх сотні, і
щороку з'являються нові.

Практичний орієнтир для Завдання №1:

| Брейкпойнт | Приблизно | Що змінюється |
|---|---|---|
| базові стилі | від 320 px | одна колонка, «бургер»-меню, компактні відступи |
| `480px` | великий телефон | дві колонки в сітці карток |
| `768px` | планшет | горизонтальне меню, фото поруч із текстом |
| `1200px` | десктоп | контейнер із `max-width`, три-чотири колонки, просторі відступи |

Зручно винести їх у коментар на початку файлу:

```css
/* Брейкпойнти проєкту:
   sm: 480px  — великий телефон
   md: 768px  — планшет
   lg: 1200px — десктоп                                    */
```

⚠️ У медіа-запитах **не можна** використовувати CSS-змінні:
`@media (min-width: var(--md))` не працює. Це обмеження специфікації.

### 6.4. Контейнер сторінки

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;                 /* центрування */
  padding-inline: var(--space-3);      /* «повітря» біля країв на мобільному */
}
```

### 6.5. Меню-«бургер» без JavaScript

У Завданні №1 JavaScript заборонений, а меню на мобільному має згортатися.
Рішення — нативний елемент `<details>`:

```html
<nav class="site-nav" aria-label="Основна навігація">
  <details class="site-nav__disclosure">
    <summary class="site-nav__toggle">Меню</summary>
    <ul class="site-nav__list">
      <li><a href="#about">Про мене</a></li>
      <li><a href="#skills">Навички</a></li>
      <li><a href="#contacts">Контакти</a></li>
    </ul>
  </details>
</nav>
```

```css
/* Мобільний: згорнуте меню */
.site-nav__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding-block: var(--space-3);
}

/* Десктоп: «розгортаємо» назавжди й ховаємо кнопку */
@media (min-width: 768px) {
  .site-nav__toggle { display: none; }

  .site-nav__disclosure > .site-nav__list {
    display: flex;
    flex-direction: row;
    gap: var(--space-4);
  }
  /* details у відкритому стані незалежно від атрибута open */
  .site-nav__disclosure { display: contents; }
}
```

🔑 `<details>` дає безкоштовно: керування з клавіатури, правильні ARIA-стани,
роботу без JavaScript. Це набагато краще за «чекбокс-хак».

---

## 7. Контейнерні запити

Медіа-запит питає про **вікно**. Але компонент часто має адаптуватися до
**свого контейнера**: та сама картка може стояти і в широкій головній колонці,
і у вузькій бічній панелі.

```css
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

.card {
  display: grid;
  gap: 1rem;
}

/* Коли КОНТЕЙНЕР ширший за 400px — незалежно від ширини вікна */
@container card (min-width: 400px) {
  .card {
    grid-template-columns: 140px 1fr;
    align-items: start;
  }
}
```

Є й спеціальні одиниці, відносні до контейнера: `cqw`, `cqh`, `cqi`, `cqb`.

```css
.card__title { font-size: clamp(1rem, 5cqi, 1.5rem); }
```

🔑 Контейнерні запити вже широко доступні. Це саме той інструмент, який робить
компоненти справді переносними: компонент більше не мусить «знати», у якому
місці сторінки він опинився.

---

## 8. Плинна типографіка та відступи

### 8.1. `clamp()`

```css
font-size: clamp(МІНІМУМ, БАЖАНЕ, МАКСИМУМ);
```

```css
h1   { font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3.5rem); }
h2   { font-size: clamp(1.375rem, 1.1rem + 1.4vw, 2.25rem); }
body { font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem); }
```

Розмір плавно зростає разом із шириною вікна, але ніколи не виходить за межі.
Один рядок замінює три-чотири медіа-запити.

⚠️ **Не пишіть `font-size: 4vw` без `clamp()`.** По-перше, текст стане
мікроскопічним на вузькому екрані. По-друге — і це важливіше — чисті `vw`
ігнорують налаштування розміру шрифту користувача, що є порушенням WCAG.
Тому в середньому аргументі завжди має бути складник у `rem`:
`1.2rem + 2.5vw`.

### 8.2. Плинні відступи

```css
:root {
  --space-section: clamp(2rem, 1rem + 5vw, 6rem);
}

.section { padding-block: var(--space-section); }
```

### 8.3. Типографічна шкала

Розміри заголовків приємніше сприймаються, коли утворюють геометричну
прогресію (класичні коефіцієнти — 1.2, 1.25, 1.333):

```css
:root {
  --ratio: 1.25;
  --fs-0: 1rem;
  --fs-1: calc(var(--fs-0) * var(--ratio));   /* 1.25rem */
  --fs-2: calc(var(--fs-1) * var(--ratio));   /* 1.563rem */
  --fs-3: calc(var(--fs-2) * var(--ratio));   /* 1.953rem */
  --fs-4: calc(var(--fs-3) * var(--ratio));   /* 2.441rem */
}
```

📚 Зручний генератор плинних шкал: [utopia.fyi](https://utopia.fyi/).

---

## 9. Адаптивні зображення та співвідношення сторін

```css
img, video, svg, picture {
  display: block;      /* прибирає «зайві» 4px під зображенням */
  max-width: 100%;     /* ніколи не вилазить за контейнер */
  height: auto;        /* зберігає пропорції */
}
```

**`aspect-ratio`** — фіксує пропорції без хаків із `padding-top: 56.25%`:

```css
.video-embed { aspect-ratio: 16 / 9; }
.avatar      { aspect-ratio: 1; border-radius: 50%; }
```

**`object-fit`** — як зображення вписується у відведену коробку:

```css
.card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;          /* заповнити, обрізавши зайве */
  object-position: center 30%;/* яку частину лишити видимою */
}
```

| Значення | Поведінка |
|---|---|
| `fill` (за замовч.) | розтягнути, спотворивши пропорції |
| `contain` | вписати цілком, лишивши порожні поля |
| `cover` | заповнити, обрізавши зайве |
| `none` | оригінальний розмір |
| `scale-down` | менше з `none` і `contain` |

**Галерея-мозаїка** (для Завдання №1):

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
  grid-auto-rows: 180px;
  gap: 0.75rem;
}

@media (min-width: 1200px) {
  .gallery__item--wide { grid-column: span 2; }
  .gallery__item--tall { grid-row: span 2; }
}

.gallery img { width: 100%; height: 100%; object-fit: cover; }
```

---

## 10. Темна тема та вподобання користувача

### 10.1. `prefers-color-scheme`

```css
:root {
  color-scheme: light dark;   /* браузер стилізує смуги прокручування й поля форм */

  --color-bg:      #ffffff;
  --color-surface: #f6f8fb;
  --color-text:    #17202a;
  --color-muted:   #5c6b7a;
  --color-accent:  #1f6fb2;
  --color-border:  #d8e0e9;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:      #10151b;
    --color-surface: #18202a;
    --color-text:    #e8eef5;
    --color-muted:   #9aa9b8;
    --color-accent:  #6fb2e8;
    --color-border:  #263241;
  }
}
```

🔑 **Перевизначайте лише змінні, а не правила.** Уся решта CSS написана один
раз і працює в обох темах. Якщо доводиться дублювати `.card { … }` усередині
медіа-запиту — значить, кольори не винесені у змінні.

Практичні поради щодо темної теми:

- **не використовуйте чистий чорний** `#000` — надто високий контраст втомлює;
  беріть `#10151b`—`#1a1a1a`;
- **приглушуйте насиченість** акцентів: яскраві кольори на темному «пливуть»;
- **тіні майже не працюють** на темному тлі — замініть їх на світліший фон
  поверхні (`--color-surface`);
- **зображення** можна трохи притлумити: `filter: brightness(0.9)`;
- **перевіряйте контраст в обох темах окремо**.

### 10.2. Інші вподобання користувача

```css
/* Користувач попросив менше руху (налаштування ОС) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Підвищений контраст */
@media (prefers-contrast: more) {
  :root { --color-border: #000; --color-muted: #333; }
}
```

⚠️ `prefers-reduced-motion` — не забаганка. Для людей із вестибулярними
розладами паралакс і великі анімації можуть спричинити нудоту й запаморочення.
Це обов'язкова вимога Завдання №1.

---

## 11. Псевдокласи й псевдоелементи: просунутий рівень

### 11.1. `:has()` на практиці

```css
/* Картка з зображенням має інший макет */
.card:has(> img) { grid-template-rows: auto 1fr auto; }

/* Форма, у якій є помилка, підсвічує кнопку */
form:has(:user-invalid) button[type="submit"] { opacity: 0.6; }

/* Заголовок, після якого одразу йде параграф, має менший нижній відступ */
h2:has(+ p) { margin-block-end: 0.5rem; }

/* Меню, у якому активний пункт, змінює фон */
.nav:has(.nav__link--active) { background: var(--color-surface); }
```

### 11.2. `:is()` і `:where()` для компактності

```css
/* Було */
.article h1, .article h2, .article h3, .article h4 { line-height: 1.2; }

/* Стало */
.article :is(h1, h2, h3, h4) { line-height: 1.2; }

/* Базові стилі, які легко перевизначити (специфічність 0) */
:where(ul, ol)[class] { list-style: none; padding: 0; }
```

### 11.3. Структурні селектори

```css
/* Кожен другий рядок таблиці */
tbody tr:nth-child(even) { background: var(--color-surface); }

/* Перші три елементи */
.list li:nth-child(-n + 3) { font-weight: 600; }

/* Усі, крім останнього */
.list li:not(:last-child) { border-block-end: 1px solid var(--color-border); }

/* Якщо елементів рівно 3 */
.grid:has(> :last-child:nth-child(3)) { grid-template-columns: repeat(3, 1fr); }
```

### 11.4. Псевдоелементи в оформленні

```css
/* Декоративна лінія під заголовком */
.section__title {
  position: relative;
  padding-block-end: 0.5rem;
}
.section__title::after {
  content: "";
  position: absolute;
  inset-inline-start: 0;
  inset-block-end: 0;
  width: 3rem;
  height: 3px;
  background: var(--color-accent);
}

/* Лапки навколо цитати */
.quote::before { content: "«"; }
.quote::after  { content: "»"; }

/* Позначка зовнішнього посилання */
a[target="_blank"]::after { content: " ↗"; font-size: 0.85em; }
```

---

## 12. Трансформації, переходи, анімації

### 12.1. `transform`

```css
.el {
  transform: translateX(20px);
  transform: translate(10px, 20px);
  transform: scale(1.05);
  transform: rotate(45deg);
  transform: skewX(10deg);

  /* Комбінація — порядок має значення! */
  transform: translateY(-4px) scale(1.02);

  transform-origin: center;   /* точка перетворення */
}
```

🔑 `transform` **не впливає на потік**: сусідні елементи не зсуваються.
Перетворення виконуються на GPU, тому вони дешеві.

Сучасний синтаксис дозволяє задавати складники окремо (це зручно, коли різні
стани змінюють різні перетворення):

```css
.el {
  translate: 0 0;
  scale: 1;
  rotate: 0deg;
}
.el:hover { translate: 0 -4px; scale: 1.02; }
```

### 12.2. `transition`

```css
.button {
  background: var(--color-accent);
  transition: background-color 200ms ease, transform 200ms ease;
}

.button:hover {
  background: var(--color-accent-dark);
  transform: translateY(-2px);
}
```

Повний запис: `transition: властивість тривалість функція затримка;`

Функції згладжування: `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`,
`cubic-bezier(0.4, 0, 0.2, 1)`, `steps(4, end)`.

⚠️ **Не пишіть `transition: all`.** Браузер буде відстежувати всі властивості,
включно з тими, що спричиняють layout; це дає непередбачувані ефекти й зайве
навантаження. Перелічуйте властивості явно.

**Тривалості, що виглядають природно:**

| Дія | Тривалість |
|---|---|
| Наведення, зміна кольору | 150–200 мс |
| Поява/зникнення елемента | 200–300 мс |
| Модальне вікно, велика панель | 300–400 мс |
| Понад 500 мс | сприймається як гальмування |

### 12.3. `@keyframes`

```css
@keyframes fade-in-up {
  from { opacity: 0; translate: 0 12px; }
  to   { opacity: 1; translate: 0 0; }
}

.card {
  animation: fade-in-up 400ms ease-out both;
}

@keyframes pulse {
  0%, 100% { scale: 1; }
  50%      { scale: 1.05; }
}

.badge {
  animation: pulse 1.5s ease-in-out infinite;
}
```

Повний запис:

```css
animation: назва тривалість функція затримка кількість напрямок заповнення стан;
animation: fade-in-up 400ms ease-out 100ms 1 normal both running;
```

### 12.4. Продуктивність анімацій

🔑 **Анімуйте лише `transform` і `opacity`.** Вони обробляються на стадії
composite (GPU) і не спричиняють ані layout, ані paint.

| Властивість | Що запускає | Вартість |
|---|---|---|
| `transform`, `opacity`, `filter` | composite | 🟢 дешево |
| `background-color`, `box-shadow`, `color` | paint | 🟡 середньо |
| `width`, `height`, `top`, `left`, `margin`, `padding`, `font-size` | **layout** | 🔴 дорого |

```css
/* ❌ Дорого: кожен кадр — перерахунок геометрії всієї сторінки */
.menu { left: -300px; transition: left 300ms; }
.menu.is-open { left: 0; }

/* ✅ Дешево */
.menu { translate: -100% 0; transition: translate 300ms ease; }
.menu.is-open { translate: 0 0; }
```

🧪 DevTools → Performance: запишіть анімацію і подивіться на смугу FPS. Зелена
рівна лінія — добре; часті червоні «зубці» (long tasks) — щось перераховується
щокадру.

### 12.5. Прокручування

```css
html { scroll-behavior: smooth; }              /* плавний перехід за якорем */
:target { scroll-margin-block-start: 5rem; }   /* щоб липка шапка не закривала заголовок */

.snap-container {
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  display: flex;
  gap: 1rem;
}
.snap-container > * { scroll-snap-align: start; flex: 0 0 80%; }
```

⚠️ `scroll-behavior: smooth` теж має вимикатися при `prefers-reduced-motion`
(у нашому скиді це вже враховано).

---

## 13. Сучасний CSS: вкладеність, логічні властивості, `@supports`

### 13.1. Нативна вкладеність

CSS тепер підтримує вкладеність без препроцесорів:

```css
.card {
  padding: var(--space-4);
  border-radius: var(--radius);

  & .card__title {
    font-size: var(--fs-2);
  }

  &:hover {
    box-shadow: var(--shadow);
  }

  @media (min-width: 768px) {
    padding: var(--space-5);
  }
}
```

⚠️ **Не вкладайте глибше двох рівнів.** Глибока вкладеність породжує довгі
селектори з високою специфічністю — саме те, від чого ми тікали. З BEM
вкладеність узагалі майже не потрібна.

### 13.2. Логічні властивості

Замість фізичних `left/right/top/bottom` — логічні, прив'язані до напрямку
письма:

| Фізична | Логічна |
|---|---|
| `margin-left` / `margin-right` | `margin-inline-start` / `margin-inline-end` |
| `margin-left` **і** `margin-right` | `margin-inline` |
| `margin-top` **і** `margin-bottom` | `margin-block` |
| `width` / `height` | `inline-size` / `block-size` |
| `text-align: left` | `text-align: start` |
| `top: 0; right: 0; bottom: 0; left: 0` | `inset: 0` |

```css
.container { margin-inline: auto; padding-inline: 1rem; }
.section   { padding-block: 3rem; }
.overlay   { position: absolute; inset: 0; }
```

Це не лише про підтримку арабської чи івриту: `margin-inline: auto` коротше й
виразніше за `margin-left: auto; margin-right: auto`.

### 13.3. `@supports`

```css
@supports (display: grid) {
  .layout { display: grid; }
}

@supports not (aspect-ratio: 1) {
  .avatar { padding-block-start: 100%; }   /* старий хак як запасний варіант */
}

@supports selector(:has(a)) {
  .card:has(a) { cursor: pointer; }
}
```

### 13.4. Корисні функції

```css
width: min(100%, 1200px);        /* менше з двох */
width: max(320px, 50%);          /* більше з двох */
width: clamp(320px, 50%, 800px); /* із обмеженнями */
width: calc(100% - 2rem);        /* обчислення (пробіли навколо знаків обов'язкові!) */
```

⚠️ У `calc()` пробіли навколо `+` і `−` обов'язкові: `calc(100%-2rem)` не
працює, бо `-2rem` парситься як від'ємне число.

---

## 14. Організація CSS: BEM і структура файлів

### 14.1. BEM

```
.block                      /* самостійний компонент */
.block__element             /* частина блоку */
.block--modifier            /* варіант блоку */
.block__element--modifier   /* варіант елемента */
```

```html
<article class="card card--featured">
  <img class="card__image" src="…" alt="…">
  <div class="card__body">
    <h3 class="card__title">Назва проєкту</h3>
    <p class="card__text">Опис…</p>
    <a class="card__link card__link--primary" href="#">Детальніше</a>
  </div>
</article>
```

```css
.card { }
.card--featured { }
.card__image { }
.card__body { }
.card__title { }
.card__link { }
.card__link--primary { }
```

Що це дає:

- **плоскі селектори** зі специфічністю (0,1,0) — жодних воєн;
- за класом у HTML одразу видно, до якого компонента належить елемент;
- компонент можна перенести в інше місце сторінки — стилі не зламаються;
- немає залежності від структури вкладеності.

⚠️ Типова помилка — `.card__body__title` (два рівні елементів). У BEM елемент
завжди належить **блоку**, а не іншому елементу: правильно `.card__title`.

### 14.2. Структура файлів

Для невеликого проєкту (Завдання №1) достатньо двох файлів:

```
css/
├── reset.css     — скид стилів браузера
└── style.css     — усе інше
```

Усередині `style.css` тримайте чіткий порядок:

```css
/* =========================================
   1. Змінні та налаштування
   ========================================= */
:root { … }

/* =========================================
   2. Базові стилі елементів
   ========================================= */
body { … }
h1, h2, h3 { … }
a { … }

/* =========================================
   3. Утиліти
   ========================================= */
.container { … }
.visually-hidden { … }

/* =========================================
   4. Компоненти
   ========================================= */
/* --- Шапка --- */
.site-header { … }
/* --- Картка --- */
.card { … }

/* =========================================
   5. Секції сторінки
   ========================================= */
.about { … }
```

Для більших проєктів застосовують `@layer` (див. лекцію 1) та розбиття на
файли з `@import` або збірником.

### 14.3. Дві утиліти, які потрібні завжди

```css
/* Приховати візуально, але лишити для екранних читачів */
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* Обмежити ширину рядка для читабельності */
.prose { max-width: 65ch; }
```

`.visually-hidden` — стандартний прийом для підписів, які потрібні екранному
читачу, але зайві візуально (наприклад, «Пошук по сайту» біля іконки лупи).

---

## 15. Готові рецепти макетів

**Каркас сторінки з липким підвалом:**

```css
body {
  min-height: 100dvh;
  display: grid;
  grid-template-rows: auto 1fr auto;
}
```

**Центрована колонка з «повними» секціями:**

```css
.section > .container { max-width: 1200px; margin-inline: auto; padding-inline: 1rem; }
.section--full-bleed  { background: var(--color-surface); }
```

**Дві колонки, що стають однією:**

```css
.split {
  display: grid;
  gap: var(--space-4);
}
@media (min-width: 768px) {
  .split { grid-template-columns: 1fr 1fr; align-items: center; }
}
```

**Секція «Про мене»: фото + текст + бічна панель (три різні макети):**

```css
/* Мобільний: фото зверху, все в колонку */
.about {
  display: grid;
  gap: var(--space-3);
  justify-items: center;
  text-align: center;
}
.about__photo { width: min(220px, 60%); aspect-ratio: 1; object-fit: cover; border-radius: 50%; }

/* Планшет: фото ліворуч, текст праворуч */
@media (min-width: 768px) {
  .about {
    grid-template-columns: 200px 1fr;
    justify-items: start;
    text-align: start;
    align-items: center;
  }
}

/* Десктоп: додається бічна панель із контактами */
@media (min-width: 1200px) {
  .about {
    grid-template-columns: 240px 1fr 260px;
    gap: var(--space-5);
  }
}
```

**Таблиця, що не ламає верстку на мобільному:**

```css
.table-wrapper {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.table-wrapper table { min-width: 480px; }
```

**Шкала навички лише засобами CSS:**

```html
<li class="skill">
  <span class="skill__name">CSS</span>
  <span class="skill__bar" style="--level: 80%"><span class="visually-hidden">80 зі 100</span></span>
</li>
```

```css
.skill__bar {
  display: block;
  height: 8px;
  border-radius: 999px;
  background: var(--color-border);
  position: relative;
  overflow: hidden;
}
.skill__bar::before {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  inline-size: var(--level);
  background: var(--color-accent);
}
```

(Тут `style="--level: 80%"` — рідкісний і прийнятний випадок інлайнового
атрибута: ми передаємо **дані**, а не оформлення.)

---

## 16. Типові помилки

| # | Помилка | Наслідок | Правильно |
|---|---|---|---|
| 1 | Desktop first із купою `max-width` | Складний, крихкий CSS | Mobile first, `min-width` |
| 2 | Брейкпойнти «під iPhone 14» | Ламається на інших пристроях | Брейкпойнти за контентом |
| 3 | `position: absolute` для всієї розкладки | Макет розсипається при зміні вмісту | Flexbox / Grid |
| 4 | Фіксовані висоти (`height: 400px`) | Текст обрізається або вилазить | `min-height`, автовисота |
| 5 | `z-index: 9999` | Не працює через контекст накладання | Шкала змінних, розуміння контекстів |
| 6 | Забули `position: relative` у батька | Абсолютний елемент летить у куток сторінки | Задати контекст |
| 7 | `transition: all` | Непередбачувані ефекти, гальмування | Перелічити властивості |
| 8 | Анімація `width`/`left` | Падіння FPS | `transform`, `opacity` |
| 9 | Немає `prefers-reduced-motion` | Шкодить людям із вестибулярними розладами | Додати медіа-запит |
| 10 | `font-size: 4vw` | Порушення WCAG, нечитабельно на краях | `clamp()` зі складником у `rem` |
| 11 | `100vh` на мобільному | Секція стрибає при появі панелей | `100dvh` |
| 12 | `minmax(300px, 1fr)` без `min()` | Горизонтальна прокрутка на вузьких екранах | `minmax(min(300px, 100%), 1fr)` |
| 13 | `justify-content` замість `align-items` | «Не центрується» | Пам'ятати про головну/поперечну вісь |
| 14 | Глибока вкладеність селекторів | Специфічність, крихкість | BEM, плоскі селектори |
| 15 | `overflow: hidden` на предку `sticky` | Липкість не працює | Прибрати `overflow` |
| 16 | Порядок у DOM ≠ візуальний (`order`, `dense`) | Хаотична навігація `Tab` | Правильний порядок у розмітці |

---

## 17. Контрольні запитання

1. Що таке контекст форматування і як `display: flow-root` розв'язує проблему
   схлопування відступів?
2. Відносно чого позиціонується елемент з `position: absolute`?
3. Чому елемент із `z-index: 9999` може опинитися під елементом із `z-index: 2`?
4. У чому різниця між `flex: 1` і `flex: auto`?
5. `justify-content` чи `align-items` центрує по вертикалі у
   `flex-direction: column`? Чому?
6. Що робить `repeat(auto-fit, minmax(250px, 1fr))` і чим `auto-fit`
   відрізняється від `auto-fill`?
7. Навіщо `min()` усередині `minmax()`?
8. Наведіть три аргументи на користь mobile first.
9. Чому не можна використати CSS-змінну в умові медіа-запиту?
10. Чим контейнерний запит принципово кращий за медіа-запит для компонента?
11. Чому `font-size: clamp(1rem, 2.5vw, 2rem)` кращий за `font-size: 2.5vw`?
12. Які властивості можна анімувати «дешево» і чому саме їх?
13. Що робить `prefers-reduced-motion: reduce` і для кого це критично?
14. Чим `:is()` відрізняється від `:where()`?
15. Наведіть приклад, коли `:has()` розв'язує задачу, для якої раніше був
    потрібен JavaScript.
16. Чому `.card__body__title` — неправильний BEM-клас?
17. Що робить `margin-inline: auto` і чим воно краще за пару `margin-left/right`?

---

## 18. Практичні вправи

**Вправа 1 (Flexbox, 20 хв).** Побудуйте шапку сайту: логотип ліворуч, меню з
чотирьох пунктів праворуч, кнопка «Зв'язатися» в кінці. На екранах < 640 px усе
має переноситися в колонку по центру. Використайте лише Flexbox і `gap`.

**Вправа 2 (Grid, 25 хв).** Зробіть сітку з 9 карток, яка:
- на < 480 px показує одну колонку;
- на 480–767 px — дві;
- на ≥ 768 px — стільки, скільки влізе, за мінімальної ширини картки 260 px
  (без медіа-запиту);
- перша картка на ≥ 1200 px займає дві колонки.

**Вправа 3 (три макети, 45 хв).** Реалізуйте секцію «Про мене» з розділу 15
самостійно, не підглядаючи. Перевірте в DevTools Device Mode на ширинах
320, 480, 768, 1024, 1440 px.

**Вправа 4 (плинність, 20 хв).** Замініть у своєму проєкті всі медіа-запити,
що змінюють лише `font-size` і `padding`, на `clamp()`. Скільки медіа-запитів
вдалося прибрати?

**Вправа 5 (темна тема, 25 хв).** Додайте темну тему до портфоліо, змінивши
**лише** значення змінних у `@media (prefers-color-scheme: dark)`. Якщо
довелося щось дублювати — знайдіть, які кольори не винесені у змінні, і
винесіть. Перевірте контраст в обох темах.

**Вправа 6 (анімації, 25 хв).** Додайте:
- плавну появу карток при завантаженні (`@keyframes`, `opacity` + `translate`);
- підняття картки при наведенні (`translate` + `box-shadow`);
- анімований підкреслювач у пункті меню (`::after` + `scale`).
Переконайтеся, що всі три вимикаються при `prefers-reduced-motion: reduce`, і
що у DevTools → Performance немає падіння FPS.

**Вправа 7 (налагодження, 20 хв).** Знайдіть помилки в коді:

```css
.wrapper { display: flex; }
.sidebar { width: 300px; }
.content { width: 100%; }
.badge   { position: absolute; top: 10px; right: 10px; z-index: 5; }
.card    { overflow: hidden; }
.header  { position: sticky; }
```

Підказка: тут щонайменше чотири проблеми.

---

## 19. Корисні посилання

### Розкладка

- [MDN: CSS flexible box layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout) —
  повний довідник із Flexbox.
- [MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) —
  те саме для Grid.
- [CSS-Tricks: A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) —
  найпопулярніша шпаргалка з ілюстраціями.
- [CSS-Tricks: A Complete Guide to CSS Grid](https://css-tricks.com/snippets/css/complete-guide-grid/).
- [Flexbox Froggy](https://flexboxfroggy.com/#uk) — гра-тренажер, є українська.
- [Grid Garden](https://cssgridgarden.com/#uk) — те саме для Grid.
- [Grid by Example](https://gridbyexample.com/) — колекція готових прикладів
  від Рейчел Ендрю.
- [Layout Land](https://www.youtube.com/c/LayoutLand) — відеокурс від Jen
  Simmons (Mozilla/Apple) про сучасну розкладку.

### Адаптивність і сучасний CSS

- [web.dev: Learn Responsive Design](https://web.dev/learn/design/) —
  систематичний безкоштовний курс.
- [web.dev: Learn CSS](https://web.dev/learn/css) — базовий курс, теж
  безкоштовний.
- [MDN: CSS container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries).
- [Every Layout](https://every-layout.dev/) — набір «алгоритмічних» макетів із
  глибоким поясненням, чому саме так.
- [Utopia](https://utopia.fyi/) — генератор плинних шкал типографіки й відступів.
- [Modern CSS Solutions](https://moderncss.dev/) — Стефані Еклс розбирає
  класичні задачі сучасними засобами.

### Інструменти

- [Can I use](https://caniuse.com/) — підтримка можливостей.
- [CSS Gradient](https://cssgradient.io/) — конструктор градієнтів.
- [Cubic-bezier.com](https://cubic-bezier.com/) — підбір функції згладжування.
- [Fancy Border Radius](https://9elements.github.io/fancy-border-radius/) —
  складні заокруглення.
- [Open Props](https://open-props.style/) — готовий набір CSS-змінних
  (кольори, тіні, анімації), який можна брати як приклад системи.
- [Realtime Colors](https://www.realtimecolors.com/) — підбір палітри одразу на
  макеті.

---

## 20. Література

**Основна**

1. **Grant, K. J.** *CSS in Depth.* 2nd ed. — Manning, 2024. —
   Розділи 4–9 присвячені саме темі цієї лекції: Flexbox, Grid, позиціонування,
   адаптивність. Найкраща книга з CSS на сьогодні.
2. **Meyer, E. A., Weyl, E.** *CSS: The Definitive Guide.* 5th ed. —
   O'Reilly, 2023. — Розділи про розкладку, трансформації й анімації як
   вичерпний довідник.
3. **Marcotte, E.** *Responsive Web Design.* 2nd ed. — A Book Apart, 2014. —
   Книга, що ввела сам термін. Технічні деталі частково застаріли, ідеї — ні.

**Додаткова**

4. **Andrew, R.** *The New CSS Layout.* — A Book Apart, 2017. —
   Про перехід від `float` до Flexbox і Grid; корисно, щоб зрозуміти, чому
   сучасні інструменти влаштовані саме так.
5. **Pickering, H.** *Inclusive Components.* — Smashing Magazine, 2018. —
   Доступні меню, вкладки, картки; є онлайн:
   [inclusive-components.design](https://inclusive-components.design/).
6. **Firth, A.** *Practical Web Accessibility.* 2nd ed. — Apress, 2024. —
   Розділи про контраст, рух і адаптивність.

---

## 21. Глосарій

| Українською | English | Пояснення |
|---|---|---|
| Нормальний потік | normal flow | Типова розкладка елементів без втручання CSS |
| Контекст форматування | formatting context | Ізольована область із власними правилами розкладки |
| Контекст накладання | stacking context | Ієрархія, що визначає порядок перекриття по осі Z |
| Головна вісь | main axis | Напрямок вибудовування у Flexbox |
| Поперечна вісь | cross axis | Перпендикулярна до головної |
| Гнучка коробка | flexbox | Одновимірна система розкладки |
| Ґраткова розкладка | grid layout | Двовимірна система розкладки |
| Трек | track | Рядок або стовпець сітки |
| Область сітки | grid area | Прямокутник із кількох комірок |
| Підсітка | subgrid | Успадкування треків батьківської сітки |
| Медіа-запит | media query | Умова, що залежить від параметрів пристрою/вікна |
| Контейнерний запит | container query | Умова, що залежить від розміру контейнера |
| Брейкпойнт | breakpoint | Ширина, на якій змінюється макет |
| Mobile first | mobile first | Проєктування від найвужчого екрана |
| Плинна типографіка | fluid typography | Розмір шрифту, що плавно залежить від ширини |
| Співвідношення сторін | aspect ratio | Пропорція ширини до висоти |
| Вподобання руху | prefers-reduced-motion | Системне налаштування «менше анімацій» |
| Перехід | transition | Плавна зміна властивості між двома станами |
| Ключові кадри | keyframes | Опис проміжних станів анімації |
| Логічні властивості | logical properties | Властивості, прив'язані до напрямку письма |
| Каскадний шар | cascade layer | Групування правил із заданим пріоритетом (`@layer`) |

---

**Попередня:** [Лекція 1. Вступ до веб-розробки. HTML та основи CSS](01-web-html-css-basics.md)
**Наступна:** [Лекція 3. JavaScript: мова, об'єкти та колекції](03-javascript-language.md)

[← До змісту курсу](README.md)
