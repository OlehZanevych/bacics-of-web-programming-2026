import { useEffect, useState } from 'react';

/**
 * Як useState, але значення переживає перезавантаження сторінки.
 * @param {string} key — ключ у localStorage
 * @param {*} initialValue — значення, якщо в сховищі нічого немає
 */
export function useLocalStorage(key, initialValue) {
    // Ліниве початкове значення: читаємо сховище один раз, а не на кожному рендері
    const [value, setValue] = useState(() => {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? initialValue : JSON.parse(raw);
        } catch {
            return initialValue;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('Не вдалося зберегти в localStorage:', error);
        }
    }, [key, value]);

    return [value, setValue];
}