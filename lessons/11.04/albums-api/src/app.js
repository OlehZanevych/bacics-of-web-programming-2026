// Налаштування Express: middleware і маршрути.
// Тут НЕМАЄ app.listen() — запуск окремо, у server.js (так app зручно тестувати).
import express from 'express';

const app = express();

app.use(express.json()); // розбирає JSON-тіло запиту в req.body

// Перевірка стану сервера
app.get('/api/v1/health', (req, res) => {
    res.json({ status: 'ok', uptime: Math.round(process.uptime()) });
});

// Тимчасовий маршрут для знайомства з req: GET /api/v1/echo/42?sort=title
app.get('/api/v1/echo/:id', (req, res) => {
    res.json({
        method: req.method,
        path: req.path,
        params: req.params, // з шаблону шляху :id — ЗАВЖДИ рядки
        query: req.query, // з ?sort=title — теж рядки
        userAgent: req.get('User-Agent'),
    });
});

// POST /api/v1/echo — що прийшло в тілі
app.post('/api/v1/echo', (req, res) => {
    res.status(201).json({ received: req.body });
});

export default app;