import { useEffect } from 'react';

/**
 * Заголовок вкладки браузера для поточної сторінки.
 * @param {string} title
 */
export function useDocumentTitle(title) {
    useEffect(() => {
        const previous = document.title;
        document.title = `${title} · Кінотека`;

        // Очищення: повертаємо попередній заголовок, коли сторінка зникає
        return () => {
            document.title = previous;
        };
    }, [title]);
}