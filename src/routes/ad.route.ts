import { Router } from "express";
import {
  uploadImage,
  removeImage,
  createAd,
  fetchNearAd,
  adsForSellOrRent
} from "../controllers/ad.controller";
import { uploadFile } from "../utils/helpers/imageHandler.helper";
import { userAuth } from "../middleware/authorization.middleware";
import { createAdValidator } from "../middleware/validation/realestate.validator";

export default (router: Router) => {
  router.use(userAuth);
  router.post("/ad", createAdValidator, createAd);
  router.get('/ad/for-sell-and-rent/:actionType', adsForSellOrRent);
  router.get("/ad/:slug", fetchNearAd);
  router.post("/ad/upload-image", uploadFile.any(), uploadImage);
  router.delete("/ad/remove-image", uploadFile.any(), removeImage);
};
