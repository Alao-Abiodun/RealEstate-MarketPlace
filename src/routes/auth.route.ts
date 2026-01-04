import { Router } from 'express';
import { forgotPassword, createOrLogin } from '../controllers/auth.controller';

export default (router: Router) => {
    router.post('/auth/login', createOrLogin)
    router.post('/auth/forgot-password', forgotPassword)
}