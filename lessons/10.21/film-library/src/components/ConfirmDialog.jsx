import { useEffect, useId, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

/**
 * Модальне вікно підтвердження на основі нативного <dialog>.
 * showModal() безкоштовно дає підкладку, пастку фокуса й закриття клавішею Escape.
 *
 * @param {Object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {string} props.message
 * @param {string} [props.confirmLabel='Підтвердити']
 * @param {() => void} props.onConfirm
 * @param {() => void} props.onCancel
 */
function ConfirmDialog({ open, title, message, confirmLabel = 'Підтвердити', onConfirm, onCancel }) {
    const dialogRef = useRef(null);
    const titleId = useId();

    // React знає лише prop open, а <dialog> відкривається методами DOM.
    // Ефект синхронізує одне з іншим.
    useEffect(() => {
        const dialog = dialogRef.current;
        if (open && !dialog.open) dialog.showModal();
        if (!open && dialog.open) dialog.close();
    }, [open]);

    return (
        <dialog
            ref={dialogRef}
            className={styles.dialog}
            aria-labelledby={titleId}
            onClose={onCancel} // спрацьовує і на Escape
        >
            <h2 id={titleId} className={styles.title}>
                {title}
            </h2>
            <p>{message}</p>
            <div className={`actions ${styles.actions}`}>
                <button type="button" className="button button--secondary" onClick={onCancel}>
                    Скасувати
                </button>
                <button type="button" className="button button--danger" onClick={onConfirm}>
                    {confirmLabel}
                </button>
            </div>
        </dialog>
    );
}

export default ConfirmDialog;