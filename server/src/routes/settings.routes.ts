import { Router } from 'express';
import { getSettings } from '../controllers/settings.controller';

const router = Router();

router.get('/settings', getSettings);

export default router;
