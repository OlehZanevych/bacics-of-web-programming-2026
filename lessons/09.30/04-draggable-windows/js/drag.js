/* ==========================================================================
   drag.js — перетягування на Pointer Events (миша, палець, стилус).

   Використовує ДЕЛЕГУВАННЯ: один обробник pointerdown на контейнері
   обслуговує всі елементи — і ті, що є зараз, і ті, що з'являться пізніше.

   Підключається звичайним <script defer> і оголошує ОДНУ глобальну
   функцію enableDragging — її використовує main.js.

   Алгоритм:
     1. pointerdown на «ручці» → запам'ятати зсув захоплення, почати слухати
     2. pointermove           → обчислити нову позицію, обмежити межами
     3. pointerup / cancel    → зняти обробники, повідомити про кінець
   ========================================================================== */

/**
 * @param {HTMLElement} container — межі, в яких рухаються елементи
 * @param {object} config
 * @param {string} config.itemSelector — що рухаємо ('.window')
 * @param {string} config.handleSelector — за що тягнемо ('.window__header')
 * @param {() => {grabOffset: boolean, clamp: boolean, listenOnDocument: boolean, pointerCapture: boolean}} config.getOptions
 * @param {(item: HTMLElement) => boolean} [config.canStart]
 * @param {(item: HTMLElement) => void} [config.onStart]
 * @param {(item: HTMLElement, position: {x: number, y: number}, debug: object) => void} config.onMove
 * @param {(item: HTMLElement, position: {x: number, y: number} | null) => void} [config.onEnd]
 */
function enableDragging(container, config) {
    // Допоміжні функції — всередині, щоб не створювати зайвих глобальних імен
    // (це звичайний скрипт, а не модуль: усе верхнього рівня — глобальне).
    const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
    const describe = target => (target === document ? 'document' : `<${target.localName}>`);

    const { itemSelector, handleSelector, getOptions, canStart, onStart, onMove, onEnd } = config;

    // Контролер поточного перетягування. Якщо експерименти «зламали» drag і
    // обробники не знялися, новий pointerdown прибере старі.
    let activeController = null;

    container.addEventListener('pointerdown', event => {
        const handle = event.target.closest(handleSelector);

        // Не ручка, або кнопка всередині ручки (× у заголовку) — не тягнемо
        if (!handle || event.target.closest('button')) return;

        // Лише ліва кнопка миші / перший палець (не мультитач)
        if (event.button !== 0 || !event.isPrimary) return;

        const item = handle.closest(itemSelector);
        if (canStart && !canStart(item)) return;

        const options = getOptions();   // читаємо «лабораторні» перемикачі

        activeController?.abort();
        const controller = new AbortController();
        activeController = controller;
        const { signal } = controller;

        // Геометрію читаємо ОДИН раз, на початку (не в кожному pointermove)
        const itemRect = item.getBoundingClientRect();
        const boundsRect = container.getBoundingClientRect();

        // Зсув захоплення: де саме всередині елемента натиснули.
        // Без нього елемент «стрибає» лівим верхнім кутом під курсор.
        const grabX = options.grabOffset ? event.clientX - itemRect.left : 0;
        const grabY = options.grabOffset ? event.clientY - itemRect.top : 0;

        // Pointer capture: усі наступні події цього вказівника підуть на handle,
        // навіть якщо курсор вилетить за його межі.
        if (options.pointerCapture) handle.setPointerCapture(event.pointerId);

        // Де слухаємо рух: на всьому документі чи лише на самій ручці
        const listenTarget = options.listenOnDocument ? document : handle;

        event.preventDefault();   // не виділяти текст під час руху
        onStart?.(item);

        let lastPosition = null;   // null — якщо рух так і не почався

        function handleMove(moveEvent) {
            if (moveEvent.pointerId !== event.pointerId) return;   // інший палець

            let x = moveEvent.clientX - boundsRect.left - grabX;
            let y = moveEvent.clientY - boundsRect.top - grabY;

            if (options.clamp) {
                x = clamp(x, 0, boundsRect.width - itemRect.width);
                y = clamp(y, 0, boundsRect.height - itemRect.height);
            }

            lastPosition = { x, y };

            onMove(item, lastPosition, {
                pointerType: moveEvent.pointerType,
                pointerId: moveEvent.pointerId,
                clientX: moveEvent.clientX,
                clientY: moveEvent.clientY,
                grabX,
                grabY,
                listener: describe(listenTarget),
                hasCapture: handle.hasPointerCapture(moveEvent.pointerId),
            });
        }

        function handleEnd(endEvent) {
            if (endEvent.pointerId !== event.pointerId) return;

            controller.abort();   // знімаємо ВСІ три обробники одним викликом
            if (activeController === controller) activeController = null;

            // Якщо був лише клік без руху — lastPosition === null, і позицію
            // не чіпаємо (інакше елемент «стрибнув» би в куток (0, 0)).
            onEnd?.(item, lastPosition);
        }

        listenTarget.addEventListener('pointermove', handleMove, { signal });
        listenTarget.addEventListener('pointerup', handleEnd, { signal });
        // pointercancel: система перервала жест (дзвінок, жест ОС, прокрутка)
        listenTarget.addEventListener('pointercancel', handleEnd, { signal });
    });
}
