import { Router } from 'express';
import { forgotPassword, login } from '../controllers/auth.controller';

export default (router: Router) => {
    router.post('/auth/login', login)
    router.post('/auth/forgot-password', forgotPassword)
}