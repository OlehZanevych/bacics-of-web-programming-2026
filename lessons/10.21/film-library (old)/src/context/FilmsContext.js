import { createContext, useContext } from 'react';

// Два контексти замість одного:
//  • FilmsContext — сам список (змінюється часто);
//  • FilmActionsContext — функції для змін (не змінюються ніколи).
// Компонент, якому потрібні лише дії, не перемальовується, коли змінюється список.
export const FilmsContext = createContext(null);
export const FilmActionsContext = createContext(null);

export function useFilms() {
  const films = useContext(FilmsContext);
  if (films === null) {
    throw new Error('useFilms() має викликатися всередині <FilmsProvider>.');
  }
  return films;
}

export function useFilmActions() {
  const actions = useContext(FilmActionsContext);
  if (actions === null) {
    throw new Error('useFilmActions() має викликатися всередині <FilmsProvider>.');
  }
  return actions;
}
