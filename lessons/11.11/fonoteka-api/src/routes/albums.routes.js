import { Router } from 'express';
import * as controller from '../controllers/albums.controller.js';
import { validate } from '../middlewares/validate.js';
import { uuidParamSchema } from '../validators/common.js';
import {
  albumCreateSchema,
  albumFiltersSchema,
  albumListQuerySchema,
  albumPatchSchema,
} from '../validators/album.schemas.js';

const router = Router();
const validId = validate(uuidParamSchema, 'params');

// ТИМЧАСОВА ВЕРСІЯ (крок 11): поки що без автентифікації — її додамо в кроці 12
router.get('/', validate(albumListQuerySchema, 'query'), controller.list);
router.get('/count', validate(albumFiltersSchema, 'query'), controller.count); // ← до /:id!
router.get('/:id', validId, controller.getById);
router.post('/', validate(albumCreateSchema), controller.create);
router.put('/:id', validId, validate(albumCreateSchema), controller.update);
router.patch('/:id', validId, validate(albumPatchSchema), controller.update);
router.delete('/:id', validId, controller.remove);

export default router;
