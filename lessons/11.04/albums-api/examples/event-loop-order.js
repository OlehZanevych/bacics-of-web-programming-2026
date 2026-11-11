// Порядок виконання в циклі подій. Запуск: node examples/event-loop-order.js
// Порівняйте з: node examples/event-loop-order.cjs (той самий код у CommonJS)

console.log('1: синхронно');

setTimeout(() => console.log('2: timers'), 0);
setImmediate(() => console.log('3: check'));

Promise.resolve().then(() => console.log('4: мікрозадача (проміс)'));
process.nextTick(() => console.log('5: nextTick'));

console.log('6: синхронно');