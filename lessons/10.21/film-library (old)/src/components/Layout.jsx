import { Link, NavLink, Outlet, useLocation } from 'react-router';
import ErrorBoundary from './ErrorBoundary.jsx';
import { useTheme } from '../context/ThemeContext.js';
import styles from './Layout.module.css';

// NavLink сам знає, чи він активний, і передає це у функцію className
const navLinkClass = ({ isActive }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

function Layout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className={styles.layout}>
      <a className="skip-link" href="#main">
        Перейти до основного вмісту
      </a>

      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          Кінотека
        </Link>

        <nav className={styles.nav} aria-label="Основна навігація">
          <ul className={styles.navList}>
            <li>
              <NavLink to="/" end className={navLinkClass}>
                Фільми
              </NavLink>
            </li>
            <li>
              <NavLink to="/films/new" className={navLinkClass}>
                Додати фільм
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={navLinkClass}>
                Про застосунок
              </NavLink>
            </li>
          </ul>
        </nav>

        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === 'light' ? 'Увімкнути темну тему' : 'Увімкнути світлу тему'}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      <main id="main" className={styles.main}>
        {/* Якщо сторінка «впаде», шапка й меню лишаться робочими.
            resetKey: на новій адресі межа помилок спробує відмалювати сторінку знову. */}
        <ErrorBoundary resetKey={location.pathname}>
          {/* Сюди React Router підставляє сторінку поточного маршруту */}
          <Outlet />
        </ErrorBoundary>
      </main>

      <footer className={styles.footer}>
        Навчальний проєкт · Основи web програмування · ЛНУ ім. Івана Франка
      </footer>
    </div>
  );
}

export default Layout;
