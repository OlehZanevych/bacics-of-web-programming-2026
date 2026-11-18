// Налаштування Express: middleware, маршрути, документація, обробники помилок.
// Тут НЕМАЄ app.listen() — запуск у server.js (так app зручно тестувати).
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { readFileSync } from 'node:fs';
import { config } from './config/index.js';
import { requestId } from './middlewares/requestId.js';
import { httpLogger } from './middlewares/httpLogger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import healthRoutes from './routes/health.routes.js';
import apiRoutes from './routes/index.js';

const app = express();

// За проксі хостингу (Render, Railway, nginx) — щоб req.ip був IP клієнта, а не проксі
app.set('trust proxy', 1);

app.use(requestId); // 1. id запиту — першим, щоб його бачили всі наступні
app.use(httpLogger); // 2. лог кожного запиту
app.use(helmet()); // 3. захисні HTTP-заголовки
app.use(
  cors({
    origin: config.corsOrigins, // явний список дозволених джерел, а не '*'
    exposedHeaders: ['X-Total-Count', 'Location', 'X-Request-Id', 'Authorization'], // щоб клієнт їх бачив
  }),
);
app.use(express.json({ limit: '100kb' })); // 4. розбір JSON з обмеженням розміру

// Документація OpenAPI: http://localhost:3000/api-docs
const openApiSpec = YAML.parse(
  readFileSync(new URL('../docs/openapi.yaml', import.meta.url), 'utf8'),
);
app.get('/api-docs.json', (req, res) => res.json(openApiSpec));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, { customSiteTitle: 'Фонотека API' }),
);

app.use('/health', healthRoutes);
app.use('/api/v1', apiRoutes);

// Обробники помилок — ЗАВЖДИ останні
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
