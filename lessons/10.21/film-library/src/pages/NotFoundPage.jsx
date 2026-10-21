import { Link } from 'react-router';

/**
 * @param {Object} props
 * @param {string} [props.message]
 */
function NotFoundPage({ message = 'Такої сторінки не існує.' }) {
    return (
        <div className="stack">
            <h1 className="page-title">404</h1>
            <p>{message}</p>
            <Link to="/" className="button">
                На головну
            </Link>
        </div>
    );
}

export default NotFoundPage;