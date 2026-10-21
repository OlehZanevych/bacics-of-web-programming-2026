import { useEffect, useState } from 'react';
import { fetchFilmInfo } from '../api/filmInfo.js';

const LOADING = { status: 'loading', data: null, error: null };

/**
 * Завантажує довідку про фільм із «сервера».
 * Один статус замість кількох прапорців: стани на кшталт
 * «завантажується і водночас помилка» стають неможливими.
 *
 * @param {string} id
 * @returns {{ status: 'loading' | 'success' | 'error', data: object | null, error: Error | null }}
 */
export function useFilmInfo(id) {
  // Запам'ятовуємо, ДЛЯ ЯКОГО id отримано результат
  const [result, setResult] = useState({ id: null, ...LOADING });

  useEffect(() => {
    const controller = new AbortController();

    fetchFilmInfo(id, { signal: controller.signal })
      .then((data) => setResult({ id, status: 'success', data, error: null }))
      .catch((error) => {
        // Скасований запит — не помилка: ми самі його скасували
        if (error.name !== 'AbortError') {
          setResult({ id, status: 'error', data: null, error });
        }
      });

    // Очищення: користувач перейшов до іншого фільму — старий запит більше не потрібен
    return () => controller.abort();
  }, [id]);

  // «Завантаження» не зберігаємо в стані, а обчислюємо: результат є,
  // але для іншого фільму — значить, новий ще в дорозі
  return result.id === id ? result : LOADING;
}
