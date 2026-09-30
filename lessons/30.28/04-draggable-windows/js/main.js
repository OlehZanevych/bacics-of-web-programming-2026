/* ==========================================================================
   Перетягувані вікна.

   Стан (масив windows) — джерело істини. Порядок у масиві = порядок
   накладання: останнє вікно — найвище. DOM лише відображає стан.

   Під час перетягування змінюємо ЛИШЕ transform одного елемента, а в стан
   і localStorage пишемо один раз — на pointerup (лекція 4, розділ 16.2).
   ========================================================================== */

// enableDragging оголошено в drag.js, який підключено в index.html раніше.

/* --- 1. Елементи сторінки ----------------------------------------------- */

const desktop = document.querySelector('#desktop');
const toolbarEl = document.querySelector('.toolbar');
const lab = document.querySelector('#lab');
const debug = document.querySelector('#debug');

/* --- 2. Стан ------------------------------------------------------------- */

const STORAGE_KEY = 'lecture-04:windows:v1';

/** @type {{ id: string, title: string, text: string, x: number, y: number, hue: number, maximized: boolean }[]} */
let windows = [];

const experiments = {
    grabOffset: true,
    clamp: true,
    listenOnDocument: true,
    pointerCapture: true,
};

const findWindow = id => windows.find(win => win.id === id);
const elementOf = id => desktop.querySelector(`[data-id="${id}"]`);

function saveWindows() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(windows));
    } catch (error) {
        console.warn('Не вдалося зберегти вікна:', error);
    }
}

function loadWindows() {
    try {
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        return Array.isArray(parsed)
            ? parsed.filter(win => typeof win?.id === 'string' && Number.isFinite(win.x) && Number.isFinite(win.y))
            : [];
    } catch {
        return [];
    }
}

// Для тексту, який змінюється на кожну літеру, — відкладене збереження
let saveTimer;
function saveWindowsLater() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveWindows, 400);
}

/* --- 3. Створення та відображення вікна ----------------------------------- */

function createWindowElement(win) {
    const element = document.createElement('article');
    element.className = 'window';
    element.dataset.id = win.id;
    element.tabIndex = 0;                     // вікно може отримати фокус з клавіатури
    element.setAttribute('aria-label', win.title);
    element.style.setProperty('--hue', win.hue);   // колір задаємо CSS-змінною

    const header = document.createElement('header');
    header.className = 'window__header';

    const title = document.createElement('h2');
    title.className = 'window__title';
    title.textContent = win.title;

    const maximizeButton = document.createElement('button');
    maximizeButton.className = 'window__button';
    maximizeButton.type = 'button';
    maximizeButton.dataset.action = 'maximize';
    maximizeButton.setAttribute('aria-label', 'Розгорнути');
    maximizeButton.textContent = '□';

    const closeButton = document.createElement('button');
    closeButton.className = 'window__button';
    closeButton.type = 'button';
    closeButton.dataset.action = 'close';
    closeButton.setAttribute('aria-label', 'Закрити');
    closeButton.textContent = '×';

    header.append(title, maximizeButton, closeButton);

    const text = document.createElement('p');
    text.className = 'window__text';
    text.contentEditable = 'plaintext-only';   // редагування на місці, лише текст
    text.textContent = win.text;

    const footer = document.createElement('footer');
    footer.className = 'window__footer';

    element.append(header, text, footer);
    applyPosition(element, win);
    return element;
}

function applyPosition(element, { x, y, maximized }) {
    element.classList.toggle('window--maximized', maximized);
    // Розгорнуте вікно позиціонує CSS (inset: 0), тому transform прибираємо
    element.style.transform = maximized ? 'none' : `translate(${x}px, ${y}px)`;
    element.querySelector('.window__footer').textContent =
        maximized ? 'розгорнуто' : `x: ${Math.round(x)}  y: ${Math.round(y)}`;
}

// Порядок у масиві → z-index; останнє вікно — активне
function applyStacking() {
    windows.forEach((win, index) => {
        const element = elementOf(win.id);
        element.style.zIndex = index + 1;
        element.classList.toggle('window--active', index === windows.length - 1);
    });
}

function bringToFront(id) {
    const win = findWindow(id);
    if (!win || windows.at(-1) === win) return;
    windows = [...windows.filter(w => w !== win), win];
    applyStacking();
}

/* --- 4. Операції --------------------------------------------------------- */

let windowCounter = 0;

function addWindow(text = 'Перетягніть мене за заголовок. Цей текст можна редагувати.') {
    windowCounter += 1;
    const offset = (windows.length % 8) * 32;

    const win = {
        id: `w${Date.now().toString(36)}${windowCounter}`,
        title: `Вікно №${windowCounter}`,
        text,
        x: 24 + offset,
        y: 24 + offset,
        hue: Math.floor(Math.random() * 360),
        maximized: false,
    };

    windows = [...windows, win];

    const element = createWindowElement(win);
    desktop.append(element);
    applyStacking();

    // Web Animations API: анімація появи без жодного @keyframes
    element.animate(
        [{ opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1 }],
        { duration: 200, easing: 'ease-out' },
    );
    element.focus({ preventScroll: true });
    saveWindows();
}

function closeWindow(id) {
    const element = elementOf(id);
    if (!element || element.dataset.closing) return;
    element.dataset.closing = 'true';

    windows = windows.filter(win => win.id !== id);
    saveWindows();

    const animation = element.animate(
        [{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.8 }],
        { duration: 150, easing: 'ease-in' },
    );
    animation.addEventListener('finish', () => {
        element.remove();
        applyStacking();
        desktop.querySelector('.window--active')?.focus({ preventScroll: true });
    });
}

function toggleMaximize(id) {
    const win = findWindow(id);
    win.maximized = !win.maximized;
    applyPosition(elementOf(id), win);
    saveWindows();
}

function moveWindowBy(id, dx, dy) {
    const win = findWindow(id);
    if (win.maximized) return;
    const element = elementOf(id);

    win.x = Math.max(0, Math.min(win.x + dx, desktop.clientWidth - element.offsetWidth));
    win.y = Math.max(0, Math.min(win.y + dy, desktop.clientHeight - element.offsetHeight));
    applyPosition(element, win);
    saveWindowsLater();
}

// Розкласти вікна сіткою — з плавною анімацією transform
function arrangeWindows() {
    const gap = 16;
    let x = gap;
    let y = gap;
    let rowHeight = 0;

    for (const win of windows) {
        const element = elementOf(win.id);
        const from = element.style.transform;

        // Спершу згортаємо вікно — лише тоді його розміри «нормальні»
        win.maximized = false;
        element.classList.remove('window--maximized');
        const width = element.offsetWidth;
        const height = element.offsetHeight;

        if (x + width > desktop.clientWidth && x > gap) {   // не влазить — новий рядок
            x = gap;
            y += rowHeight + gap;
            rowHeight = 0;
        }

        Object.assign(win, { x, y });
        applyPosition(element, win);
        element.animate([{ transform: from }, { transform: element.style.transform }],
            { duration: 400, easing: 'ease-in-out' });

        x += width + gap;
        rowHeight = Math.max(rowHeight, height);
    }
    saveWindows();
}

/* --- 5. Перетягування ----------------------------------------------------- */

enableDragging(desktop, {
    itemSelector: '.window',
    handleSelector: '.window__header',
    getOptions: () => experiments,
    canStart: element => !findWindow(element.dataset.id).maximized,

    onStart(element) {
        element.classList.add('window--dragging');
        element.focus({ preventScroll: true });
    },

    // Викликається десятки разів на секунду — лише transform і текст
    onMove(element, position, info) {
        applyPosition(element, { ...position, maximized: false });
        const rows = [
            ['pointerType / pointerId', `${info.pointerType} / ${info.pointerId}`],
            ['clientX, clientY', `${Math.round(info.clientX)}, ${Math.round(info.clientY)}`],
            ['зсув захоплення', `${Math.round(info.grabX)}, ${Math.round(info.grabY)}`],
            ['позиція на столі (x, y)', `${Math.round(position.x)}, ${Math.round(position.y)}`],
            ['pointermove слухаємо на', info.listener],
            ['pointer capture', info.hasCapture ? 'так' : 'ні'],
        ];
        // padEnd вирівнює підписи в колонку (у <pre> моноширинний шрифт)
        debug.textContent = rows.map(([label, value]) => `${label.padEnd(26)}${value}`).join('\n');
    },

    // Один раз — у стан і localStorage
    onEnd(element, position) {
        element.classList.remove('window--dragging');
        if (!position) return;   // був просто клік

        const win = findWindow(element.dataset.id);
        Object.assign(win, position);
        saveWindows();
        debug.textContent += '\n\n✔ Відпущено: позицію записано в стан і localStorage.';
    },
});

/* --- 6. Події: делегування на робочому столі ------------------------------ */

const idOf = target => target.closest('.window')?.dataset.id;

// Натиснули будь-де у вікні — підняти його нагору
desktop.addEventListener('pointerdown', event => {
    const id = idOf(event.target);
    if (id) bringToFront(id);
});

// focusin, на відміну від focus, СПЛИВАЄ — тому його можна делегувати.
// Спрацьовує і при переході Tab-ом між вікнами.
desktop.addEventListener('focusin', event => {
    const id = idOf(event.target);
    if (id) bringToFront(id);
});

desktop.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const id = idOf(button);
    if (button.dataset.action === 'close') closeWindow(id);
    if (button.dataset.action === 'maximize') toggleMaximize(id);
});

desktop.addEventListener('dblclick', event => {
    if (event.target.closest('.window__header') && !event.target.closest('button')) {
        toggleMaximize(idOf(event.target));
    }
});

// Редагування тексту: подія input спливає від contenteditable
desktop.addEventListener('input', event => {
    const win = findWindow(idOf(event.target));
    if (win && event.target.matches('.window__text')) {
        win.text = event.target.textContent;
        saveWindowsLater();
    }
});

const isTyping = element => element.isContentEditable || element.matches('input, textarea, select');

const ARROWS = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1],
};

desktop.addEventListener('keydown', event => {
    const element = event.target.closest('.window');
    if (!element) return;

    // Escape у тексті — вийти з редагування, фокус повертається на вікно
    if (isTyping(event.target)) {
        if (event.key === 'Escape') element.focus();
        return;
    }
    if (event.target !== element) return;   // фокус на кнопці всередині

    const id = element.dataset.id;

    if (event.key in ARROWS) {
        event.preventDefault();             // інакше сторінка прокрутиться
        const step = event.shiftKey ? 50 : 10;
        const [dx, dy] = ARROWS[event.key];
        moveWindowBy(id, dx * step, dy * step);
    }
    if (event.key === 'Enter') toggleMaximize(id);
    if (event.key === 'Escape') closeWindow(id);
});

/* --- 7. Панель інструментів і гаряча клавіша N ---------------------------- */

toolbarEl.addEventListener('click', event => {
    const action = event.target.closest('[data-action]')?.dataset.action;

    if (action === 'add') addWindow();
    if (action === 'arrange') arrangeWindows();
    if (action === 'close-all') windows.forEach(win => closeWindow(win.id));
});

document.addEventListener('keydown', event => {
    // event.code — фізична клавіша: N працює і в українській розкладці (там це «т»)
    if (event.code === 'KeyN' && !isTyping(event.target) && !event.ctrlKey && !event.metaKey) {
        addWindow();
    }
});

/* --- 8. Лабораторія: перемикачі будуємо з об'єкта ------------------------- */

const EXPERIMENT_LABELS = {
    grabOffset: 'враховувати зсув захоплення (grab offset)',
    clamp: 'не випускати за межі робочого столу (clamp)',
    listenOnDocument: 'слухати pointermove на document, а не на заголовку',
    pointerCapture: 'викликати setPointerCapture()',
};

for (const [name, text] of Object.entries(EXPERIMENT_LABELS)) {
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = name;
    checkbox.checked = experiments[name];

    const label = document.createElement('label');
    label.className = 'lab__option';
    label.append(checkbox, ` ${text}`);
    lab.append(label);
}

// Один обробник на всі перемикачі
lab.addEventListener('change', event => {
    experiments[event.target.name] = event.target.checked;
    console.table(experiments);
});

/* --- 9. Робочий стіл змінив розмір — повертаємо вікна в межі -------------
   ResizeObserver стежить за розміром ЕЛЕМЕНТА (а не лише вікна браузера). */

new ResizeObserver(() => {
    for (const win of windows) {
        if (win.maximized) continue;
        const element = elementOf(win.id);
        win.x = Math.max(0, Math.min(win.x, desktop.clientWidth - element.offsetWidth));
        win.y = Math.max(0, Math.min(win.y, desktop.clientHeight - element.offsetHeight));
        applyPosition(element, win);
    }
}).observe(desktop);

/* --- 10. Запуск ----------------------------------------------------------- */

windows = loadWindows();
// Продовжуємо нумерацію з найбільшого номера серед збережених вікон
windowCounter = Math.max(0, ...windows.map(win => Number.parseInt(win.title?.match(/\d+/)?.[0] ?? '0', 10)));
windows.forEach(win => desktop.append(createWindowElement(win)));

if (windows.length === 0) {
    addWindow();
    addWindow('Вимкніть щось у «Лабораторії» і спробуйте перетягнути ще раз.');
} else {
    applyStacking();
}

// Для експериментів у консолі DevTools:  app.windows, app.experiments
window.app = {
    get windows() { return windows; },
    experiments,
};
