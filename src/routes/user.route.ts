import { Router } from 'express';
import { changeProfile } from '../controllers/auth.controller';
import { updateProfileValidator } from '../middleware/validation/user.validator';
import { userAuth } from '../middleware/authorization.middleware';


export default (router: Router) => {
    router.use(userAuth);
    router.put('/user/update-profile', updateProfileValidator, changeProfile)
}