import styles from './Panel.module.css';

/**
 * Секція-картка із заголовком. Що всередині — вирішує батько.
 *
 * @param {Object} props
 * @param {string} props.title
 * @param {React.ReactNode} props.children — основний вміст
 * @param {React.ReactNode} [props.footer] — необов'язковий підвал
 */
function Panel({ title, children, footer }) {
    return (
        <section className={styles.panel}>
            <h2 className={styles.title}>{title}</h2>
            <div className={styles.body}>{children}</div>
            {footer && <footer className={styles.footer}>{footer}</footer>}
        </section>
    );
}

export default Panel;