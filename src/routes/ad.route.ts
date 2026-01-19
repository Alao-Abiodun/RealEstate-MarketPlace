import { Router } from "express";
import {
  createAd,
  fetchNearAd,
  adsForSellOrRent,
  changeAd,
  removeAd,
  userAd,
  changeAdStatus,
  contactAgent,
  enquiredAds,
  toggleUserWishlist,
  getUserWishlist,
  searchAds,
  publishAds,
} from "../controllers/ad.controller";
import { uploadFile } from "../utils/helpers/imageHandler.helper";
import { isAdmin, userAuth } from "../middleware/authorization.middleware";
import { createAdValidator } from "../middleware/validation/realestate.validator";

export default (router: Router) => {
  router.use(userAuth);
  router.post("/ad", uploadFile.array("photos"), createAdValidator, createAd);
  router.get("/ad/user", userAd);
  router.post("/ad/contact-agent", contactAgent);
  router.get("/ad/enquired-ad", enquiredAds);
  router.get("/ad/user/wishlist", getUserWishlist);
  router.post("/ad/search-ads", searchAds);
  router.patch("/ad/toggle-wishlist/:id", toggleUserWishlist);
  router.put("/ad/publish/:id", isAdmin, publishAds);
  router.get("/ad/for-sell-and-rent/:actionType", adsForSellOrRent);
  router.put("/ad/:id", changeAd);
  router.delete("/ad/:id", removeAd);
  router.patch("/ad/:id/status", changeAdStatus);
  router.get("/ad/:slug", fetchNearAd);
};
