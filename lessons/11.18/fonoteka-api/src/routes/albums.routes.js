import { Router } from 'express';
import * as controller from '../controllers/albums.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate, requireRole } from '../middlewares/auth.js';
import { uuidParamSchema } from '../validators/common.js';
import {
  albumCreateSchema,
  albumFiltersSchema,
  albumListQuerySchema,
  albumPatchSchema,
} from '../validators/album.schemas.js';

const router = Router();
const validId = validate(uuidParamSchema, 'params');

// GET — публічні; змінювати дані — лише з токеном; видаляти — лише ADMIN
router.get('/', validate(albumListQuerySchema, 'query'), controller.list);
router.get('/count', validate(albumFiltersSchema, 'query'), controller.count); // ← до /:id!
router.get('/:id', validId, controller.getById);
router.post('/', authenticate, validate(albumCreateSchema), controller.create);
router.put('/:id', authenticate, validId, validate(albumCreateSchema), controller.update);
router.patch('/:id', authenticate, validId, validate(albumPatchSchema), controller.update);
router.delete('/:id', authenticate, requireRole('ADMIN'), validId, controller.remove);

export default router;
