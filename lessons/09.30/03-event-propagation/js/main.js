/* ==========================================================================
   Подорож події: занурення (capturing) → ціль (target) → спливання (bubbling)

   Ідея: на КОЖЕН вузол шляху (window, document, <html>, <body> і вкладені
   блоки) вішаємо по два обробники click — для фази занурення і для фази
   спливання. Обробники нічого не малюють одразу, а лише ЗАПИСУЮТЬ, що їх
   викликали. Коли подія завершила свій шлях, записане «програється»
   повільно — крок за кроком — з підсвічуванням блоків.
   ========================================================================== */

/* --- 1. Маленький помічник для створення елементів ----------------------
   h('button', { className: 'x', textContent: 'OK' }, дитина1, дитина2)
   Замість десятків рядків createElement / className / append.           */

function h(tag, props = {}, ...children) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(props)) {
        if (key === 'dataset') Object.assign(element.dataset, value);
        else if (key in element) element[key] = value;         // властивість DOM
        else element.setAttribute(key, value);                  // звичайний атрибут
    }

    element.append(...children);   // append приймає і вузли, і рядки
    return element;
}

/* --- 2. Налаштування експерименту --------------------------------------- */

const settings = {
    capture: true,            // вішати обробники фази занурення
    stopAt: '',               // де викликати stopPropagation: 'вузол:фаза'
    immediate: false,         // stopImmediatePropagation замість stopPropagation
    extraListeners: false,    // ще два обробники на <article>
    delay: 600,               // пауза між кроками програвання, мс
};

const PHASES = {
    1: { key: 'capturing', title: 'занурення' },
    2: { key: 'target', title: 'ціль' },
    3: { key: 'bubbling', title: 'спливання' },
};

/* --- 3. Будуємо вкладені блоки ------------------------------------------ */

const stage = document.querySelector('#stage');
const controls = document.querySelector('#controls');
const routeEl = document.querySelector('#route');
const logList = document.querySelector('#log');

const LEVELS = [
    { tag: 'section', label: 'Секція' },
    { tag: 'article', label: 'Стаття' },
    { tag: 'p', label: 'Абзац' },
    { tag: 'button', label: 'Кнопка' },
];

// Кожен наступний блок вкладаємо в попередній.
// Підпис — ТЕКСТОВИЙ вузол, а не <span>: текстовий вузол не може бути
// event.target, тож клік по підпису має ціллю сам блок.
let currentParent = stage;
const boxes = LEVELS.map(({ tag, label }) => {
    const box = h(tag, { className: 'box' }, `<${tag}> ${label}`);
    currentParent.append(box);
    currentParent = box;
    return box;
});

const describe = target => {
    if (target === window) return 'window';
    if (target === document) return 'document';
    return `<${target.localName}>`;
};

// Усі вузли, на які повісимо обробники, — від найзовнішнього до найглибшого
const nodes = [window, document, document.documentElement, document.body, ...boxes]
    .map(target => ({ name: describe(target), target, box: boxes.includes(target) ? target : null }));

/* --- 4. Запис шляху події ------------------------------------------------ */

let recording = false;
let trace = [];
let route = '';
let clickNumber = 0;

// «Реєстратор» — найперший обробник на шляху (window, фаза занурення).
function startRecording(event) {
    recording = stage.contains(event.target);   // кліки по панелі налаштувань ігноруємо
    if (!recording) return;

    clickNumber += 1;
    trace = [];

    // composedPath() — масив вузлів від цілі до window. Перевертаємо.
    route = event.composedPath().map(describe).reverse().join(' → ');
    console.group(`Клік №${clickNumber}: ${route}`);

    // setTimeout(…, 0) виконається, коли браузер ЗАКІНЧИТЬ обробляти подію,
    // тобто після всіх обробників на всіх вузлах (цикл подій, лекція 5).
    setTimeout(finishRecording, 0);
}

function finishRecording() {
    recording = false;
    console.groupEnd();
    replay(trace, route);
}

function createHandler(node, kind, extraLabel = '') {
    const key = `${node.name}:${kind}`;

    return event => {
        if (!recording) return;

        const phase = PHASES[event.eventPhase];
        const entry = {
            node: node.name,
            box: node.box,
            kind,
            extraLabel,
            phase: event.eventPhase,
            target: describe(event.target),                 // де подія СТАЛАСЯ
            currentTarget: describe(event.currentTarget),   // де висить ЦЕЙ обробник
            stopped: '',
        };

        console.log(`${node.name} ${extraLabel} — фаза ${event.eventPhase} (${phase.title}), target: ${entry.target}`);

        if (settings.stopAt === key && !extraLabel) {
            if (settings.immediate) {
                event.stopImmediatePropagation();
                entry.stopped = 'stopImmediatePropagation()';
            } else {
                event.stopPropagation();
                entry.stopped = 'stopPropagation()';
            }
        }

        trace.push(entry);
    };
}

/* --- 5. Навішування обробників -------------------------------------------
   Щоразу, коли змінюються налаштування, знімаємо ВСІ старі обробники
   одним викликом controller.abort() і вішаємо нові.                    */

let listenersController = null;

function attachListeners() {
    listenersController?.abort();
    listenersController = new AbortController();
    const { signal } = listenersController;

    // Реєстратор — першим, щоб він спрацював раніше за всіх
    window.addEventListener('click', startRecording, { capture: true, signal });

    for (const node of nodes) {
        if (settings.capture) {
            // третій аргумент true / { capture: true } → фаза занурення
            node.target.addEventListener('click', createHandler(node, 'capture'), { capture: true, signal });
        }
        // за замовчуванням → фаза спливання
        node.target.addEventListener('click', createHandler(node, 'bubble'), { signal });
    }

    if (settings.extraListeners) {
        const article = nodes.find(node => node.name === '<article>');
        // Кілька обробників на одному елементі викликаються в порядку додавання
        article.target.addEventListener('click', createHandler(article, 'bubble', '(обробник №2)'), { signal });
        article.target.addEventListener('click', createHandler(article, 'bubble', '(обробник №3)'), { signal });
    }
}

/* --- 6. Програвання записаного ------------------------------------------- */

let replayTimers = [];
let lastRun = null;

function clearHighlights() {
    stage.classList.remove('stage--active');
    for (const box of boxes) {
        box.classList.remove('box--capturing', 'box--target', 'box--bubbling');
    }
}

function createLogItem(entry, index) {
    const phase = PHASES[entry.phase];

    return h('li', { className: `event-log__item event-log__item--${phase.key}` },
        h('b', { textContent: `${index + 1}. ${entry.node} ${entry.extraLabel}` }),
        ` · eventPhase ${entry.phase} (${phase.title}) · capture: ${entry.kind === 'capture'}`,
        entry.stopped ? h('strong', { textContent: ` ⛔ ${entry.stopped}` }) : '',
        h('span', {
            className: 'event-log__details',
            textContent: `target: ${entry.target}   currentTarget: ${entry.currentTarget}`,
        }),
    );
}

function showStep(entry, index) {
    clearHighlights();
    if (entry.box) {
        entry.box.classList.add(`box--${PHASES[entry.phase].key}`);
    } else {
        stage.classList.add('stage--active');   // window / document / html / body
    }
    logList.append(createLogItem(entry, index));
}

function showSummary(entries) {
    clearHighlights();
    const stopped = entries.find(entry => entry.stopped);

    const text = stopped
        ? `Подію зупинено: ${stopped.stopped} у ${stopped.node}. Обробники далі по шляху не викликались.`
        : `Подія пройшла весь шлях: спрацювало обробників — ${entries.length}.`;

    logList.append(h('li', { className: 'event-log__item event-log__item--summary', textContent: text }));
}

function replay(entries, routeText) {
    lastRun = { entries, routeText };

    // Якщо попереднє програвання ще триває — скасовуємо його
    replayTimers.forEach(clearTimeout);
    replayTimers = [];
    clearHighlights();
    logList.replaceChildren();

    routeEl.textContent = `Маршрут (event.composedPath()): ${routeText}`;

    entries.forEach((entry, index) => {
        replayTimers.push(setTimeout(showStep, index * settings.delay, entry, index));
    });
    replayTimers.push(setTimeout(showSummary, entries.length * settings.delay, entries));
}

/* --- 7. Панель налаштувань (теж будуємо з JS) ----------------------------- */

const field = (text, control) => h('label', { className: 'controls__field' }, control, ` ${text}`);

const stopSelect = h('select', { className: 'controls__select', name: 'stopAt' });
const delayOutput = h('output', { textContent: `${settings.delay} мс` });

function fillStopOptions() {
    const options = [h('option', { value: '', textContent: 'ніде' })];

    for (const node of nodes) {
        if (settings.capture) {
            options.push(h('option', { value: `${node.name}:capture`, textContent: `${node.name} · занурення` }));
        }
        options.push(h('option', { value: `${node.name}:bubble`, textContent: `${node.name} · спливання` }));
    }

    stopSelect.replaceChildren(...options);

    // Якщо вибраний пункт зник (вимкнули capture) — скидаємо на «ніде»
    const stillExists = options.some(option => option.value === settings.stopAt);
    if (!stillExists) settings.stopAt = '';
    stopSelect.value = settings.stopAt;
}

controls.append(
    field('обробники фази занурення  { capture: true }',
        h('input', { type: 'checkbox', name: 'capture', checked: settings.capture })),
    h('label', { className: 'controls__field' }, 'Зупинити поширення в: ', stopSelect),
    field('stopImmediatePropagation() замість stopPropagation()',
        h('input', { type: 'checkbox', name: 'immediate', checked: settings.immediate })),
    field('ще 2 обробники на <article>',
        h('input', { type: 'checkbox', name: 'extraListeners', checked: settings.extraListeners })),
    h('label', { className: 'controls__field' }, 'Пауза між кроками ',
        h('input', { type: 'range', name: 'delay', min: 100, max: 1500, step: 100, value: settings.delay }),
        ' ', delayOutput),
    h('button', { className: 'controls__button', type: 'button', name: 'replay', textContent: 'Повторити' }),
    h('button', { className: 'controls__button', type: 'button', name: 'clear', textContent: 'Очистити журнал' }),
);
fillStopOptions();

// ОДИН обробник input на всю форму: подія спливає від будь-якого поля.
// event.target.name підказує, яке саме налаштування змінилося.
controls.addEventListener('input', event => {
    const { name, type, checked, value } = event.target;

    if (type === 'checkbox') settings[name] = checked;
    else if (type === 'range') settings[name] = Number(value);
    else settings[name] = value;

    delayOutput.textContent = `${settings.delay} мс`;
    if (name === 'capture') fillStopOptions();
    attachListeners();
});

// Кліки по кнопках панелі — теж делегування
controls.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button?.name === 'clear') {
        replayTimers.forEach(clearTimeout);
        clearHighlights();
        logList.replaceChildren();
        routeEl.textContent = 'Журнал очищено.';
    }
    if (button?.name === 'replay' && lastRun) {
        replay(lastRun.entries, lastRun.routeText);
    }
});

attachListeners();
