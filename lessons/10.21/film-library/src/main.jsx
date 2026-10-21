import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { ThemeProvider } from './context/ThemeProvider.jsx';
import { FilmsProvider } from './context/FilmsProvider.jsx';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter>
            <ThemeProvider>
                <FilmsProvider>
                    <App />
                </FilmsProvider>
            </ThemeProvider>
        </BrowserRouter>
    </StrictMode>,
);