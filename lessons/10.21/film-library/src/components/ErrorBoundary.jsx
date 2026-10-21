import { Component } from 'react';

// Межа помилок ловить помилки РЕНДЕРИНГУ в дочірніх компонентах
// і показує запасний інтерфейс замість «білого екрана».
// Єдине місце в сучасному React, де потрібен класовий компонент.
//
// props.resetKey — будь-яке значення; коли воно змінюється, помилка скидається.
class ErrorBoundary extends Component {
    state = { error: null, resetKey: this.props.resetKey };

    // Помилка в дочірньому компоненті → запам'ятовуємо її
    static getDerivedStateFromError(error) {
        return { error };
    }

    // Нова адреса (новий resetKey) → забуваємо помилку, сторінка пробує відмалюватися знову
    static getDerivedStateFromProps(props, state) {
        if (props.resetKey !== state.resetKey) {
            return { error: null, resetKey: props.resetKey };
        }
        return null;
    }

    componentDidCatch(error, info) {
        console.error('Помилка рендерингу:', error, info.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="stack" role="alert">
                    <h1 className="page-title">Щось пішло не так</h1>
                    <p className="muted">{this.state.error.message}</p>
                    <button type="button" className="button" onClick={() => this.setState({ error: null })}>
                        Спробувати ще раз
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;