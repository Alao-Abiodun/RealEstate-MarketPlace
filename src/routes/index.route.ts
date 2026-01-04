import { Router } from 'express';
import authRoute from './auth.route';
import adRoute from './ad.route';

const router = Router();

authRoute(router);
adRoute(router);

export default router;