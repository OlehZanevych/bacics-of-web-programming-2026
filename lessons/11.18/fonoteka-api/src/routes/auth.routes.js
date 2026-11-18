import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
import { signInSchema, signUpSchema } from '../validators/auth.schemas.js';

const router = Router();

// Відповіді з токенами не кешуються ніде
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/sign-up', authLimiter, validate(signUpSchema), controller.signUp);
router.post('/sign-in', authLimiter, validate(signInSchema), controller.signIn);
router.post('/refresh-token', authenticate, controller.refresh);
router.get('/me', authenticate, controller.me);

export default router;
