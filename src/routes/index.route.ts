import { Router } from 'express';
import authRoutes from './auth.route';
import adRoutes from './ad.route';
import userRoutes from './user.route';

const router = Router();

authRoutes(router);
userRoutes(router);
adRoutes(router);

export default router;