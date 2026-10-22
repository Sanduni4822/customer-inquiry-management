import { Router } from 'express';
import { login, getMe, getStaffUsers } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import { loginSchema } from '../schemas/auth.schema';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.get('/me', requireAuth, getMe);
router.get('/staff', requireAuth, getStaffUsers);

export default router;
