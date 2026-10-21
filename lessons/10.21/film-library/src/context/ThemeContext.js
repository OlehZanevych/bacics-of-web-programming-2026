import { createContext, useContext } from 'react';

export const ThemeContext = createContext(null);

// Власний хук доступу: зрозуміла помилка замість «Cannot read properties of null»
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === null) {
        throw new Error('useTheme() має викликатися всередині <ThemeProvider>.');
    }
    return context;
}