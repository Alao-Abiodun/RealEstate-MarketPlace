import { Router } from 'express';
import { forgotPassword, login } from '../controllers/auth.controller';

export default (router: Router) => {
    router.post('/login', login)
    router.post('/forgot-password', forgotPassword)
}