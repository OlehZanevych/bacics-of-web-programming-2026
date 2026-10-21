// «Сервер» для довідкової інформації про фільми.
// Дані лежать у public/data/film-info.json; затримку додаємо штучно,
// щоб побачити стан завантаження і гонки запитів.

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    // Якщо запит скасували — припиняємо очікування
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

/**
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{director: string, description: string} | null>}
 */
export async function fetchFilmInfo(id, { signal } = {}) {
  const response = await fetch('/data/film-info.json', { signal });
  if (!response.ok) {
    throw new Error(`Сервер відповів кодом ${response.status}`);
  }
  const allInfo = await response.json();

  await wait(300 + Math.random() * 1200, signal); // 0,3–1,5 с «мережі»

  return allInfo[id] ?? null;
}
