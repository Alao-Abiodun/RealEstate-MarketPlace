import path from 'path';
import { Router } from 'express';

import { uploadImage, removeImage } from '../controllers/ad.controller';
import { uploadFile } from '../utils/helpers/imageHandler.helper';


export default (router: Router) => {
    router.post('/ad/upload-image', uploadFile.any(), uploadImage);
    router.delete('/ad/remove-image', uploadFile.any(), removeImage);
}