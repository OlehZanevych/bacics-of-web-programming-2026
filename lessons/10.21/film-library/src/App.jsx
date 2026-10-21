import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import Layout from './components/Layout.jsx';
import FilmsPage from './pages/FilmsPage.jsx';
import FilmDetailsPage from './pages/FilmDetailsPage.jsx';
import FilmFormPage from './pages/FilmFormPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Рідко відвідувана сторінка — окремим файлом, завантажується при першому переході
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));

function App() {
  return (
      <Routes>
        {/* Батьківський маршрут — спільний макет; вкладені сторінки з'являються в його <Outlet /> */}
        <Route path="/" element={<Layout />}>
          <Route index element={<FilmsPage />} />
          <Route path="films/new" element={<FilmFormPage />} />
          <Route path="films/:id" element={<FilmDetailsPage />} />
          <Route path="films/:id/edit" element={<FilmFormPage />} />
          <Route
              path="about"
              element={
                <Suspense fallback={<p className="muted">Завантаження…</p>}>
                  <AboutPage />
                </Suspense>
              }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
  );
}

export default App;