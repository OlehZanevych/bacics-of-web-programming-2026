import { useEffect } from 'react';

/**
 * Попередження браузера при закритті вкладки чи перезавантаженні,
 * якщо у формі є незбережені зміни.
 * @param {boolean} isDirty
 */
export function useUnsavedChangesWarning(isDirty) {
    useEffect(() => {
        if (!isDirty) return; // змін немає — слухач не потрібен

        const handleBeforeUnload = (event) => event.preventDefault();
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Без очищення слухач лишився б і після збереження форми
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);
}