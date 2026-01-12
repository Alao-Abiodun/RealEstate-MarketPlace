import { Router } from 'express';
import { changeProfile, changeUserName, fetchMe } from '../controllers/user.controller';
import { updateProfileValidator, updateUserNameValidator } from '../middleware/validation/user.validator';
import { userAuth } from '../middleware/authorization.middleware';


export default (router: Router) => {
    router.use(userAuth);
    router.get('/user/profile', fetchMe);
    router.put('/user/profile', updateProfileValidator, changeProfile);
    router.patch('/user/profile/username', updateUserNameValidator, changeUserName);
}