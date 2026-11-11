import { Router } from 'express';
import { checkConnection } from '../db/pool.js';

const router = Router();

// Стан сервісу й бази: його опитують Docker, хостинг, моніторинг
router.get('/', async (req, res) => {
  const database = await checkConnection().then(
    () => 'up',
    () => 'down',
  );
  res.status(database === 'up' ? 200 : 503).json({
    status: database === 'up' ? 'ok' : 'degraded',
    database,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// «Чи живий процес» — без звернення до бази (для health check хостингу)
router.get('/live', (req, res) => res.json({ status: 'ok' }));

export default router;
