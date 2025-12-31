import { Router } from 'express';
import authRoute from './auth.route';

const router = Router();

authRoute(router);

export default router;