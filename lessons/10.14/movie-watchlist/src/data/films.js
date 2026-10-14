// Початкові дані (seed). У реальній аплікації вони прийдуть із сервера —
// про це лекція 10. Кожен фільм має стабільний унікальний id: саме він
// стане key у списку.
export const initialFilms = [
    { id: 'f1', title: 'Тіні забутих предків', year: 1964, watched: true },
    { id: 'f2', title: 'Осяяння', year: 1971, watched: false },
    { id: 'f3', title: 'Білий птах з чорною ознакою', year: 1971, watched: false },
    { id: 'f4', title: 'Камінний хрест', year: 1968, watched: true },
    { id: 'f5', title: 'Земля', year: 1930, watched: false },
];