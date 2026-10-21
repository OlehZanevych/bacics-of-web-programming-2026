import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

// Ця сторінка підключена через lazy(): її код — окремий файл (chunk),
// який браузер завантажує лише при першому переході на /about.
// Перевірте у DevTools → Network.
function AboutPage() {
  useDocumentTitle('Про застосунок');

  return (
    <div className="stack">
      <h1 className="page-title">Про застосунок</h1>
      <p>
        «Кінотека» — навчальний проєкт до лекцій 7–9: хуки й ефекти, Context і Reducer,
        маршрутизація та форми.
      </p>
      <p className="muted">Дані зберігаються лише у вашому браузері (localStorage).</p>
    </div>
  );
}

export default AboutPage;
