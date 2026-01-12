import { Router } from 'express';
import { forgotPassword, createOrLogin, resetPassword } from '../controllers/auth.controller';

export default (router: Router) => {
    router.post('/auth/login', createOrLogin)
    router.post('/auth/password/forgot', forgotPassword)
    router.post('/auth/password/reset', resetPassword)
}