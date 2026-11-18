import { Router } from 'express';
import albumsRoutes from './albums.routes.js';
import artistsRoutes from './artists.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/albums', albumsRoutes);
router.use('/artists', artistsRoutes);
router.use('/auth', authRoutes);

export default router;
