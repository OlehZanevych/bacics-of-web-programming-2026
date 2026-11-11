// Той самий код, але як CommonJS-модуль (розширення .cjs).
// Запуск: node examples/event-loop-order.cjs

console.log('1: синхронно');

setTimeout(() => console.log('2: timers'), 0);
setImmediate(() => console.log('3: check'));

Promise.resolve().then(() => console.log('4: мікрозадача (проміс)'));
process.nextTick(() => console.log('5: nextTick'));

console.log('6: синхронно');