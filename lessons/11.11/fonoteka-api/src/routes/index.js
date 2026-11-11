import { Router } from 'express';
import albumsRoutes from './albums.routes.js';
import artistsRoutes from './artists.routes.js';

// ТИМЧАСОВА ВЕРСІЯ (крок 11): маршрути /auth додамо в кроці 12
const router = Router();

router.use('/albums', albumsRoutes);
router.use('/artists', artistsRoutes);

export default router;
