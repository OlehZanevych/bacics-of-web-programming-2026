import styles from './Button.module.css';

/**
 * Кнопка з варіантами оформлення.
 *
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'danger'} [props.variant='primary']
 * @param {'button' | 'submit'} [props.type='button']
 * @param {string} [props.className] — додатковий клас від батька
 * Усі інші props (children, onClick, aria-*, disabled…) потрапляють
 * у ...rest і передаються на <button> як є.
 */
function Button({ variant = 'primary', type = 'button', className = '', ...rest }) {
    return (
        <button
            type={type}
            className={`${styles.button} ${styles[variant]} ${className}`}
            {...rest}
        />
    );
}

export default Button;