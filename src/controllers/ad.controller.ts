import { Request, Response, NextFunction } from "express";
import {
  deleteImageFromS3,
  uploadImageToS3,
} from "../utils/helpers/imageHandler.helper";
import { geocodeAddress } from "../services/geocoder.services";
import Ad from "../models/ad.model";
import User from "../models/user.model";
import slugify from "slugify";
import { nanoid } from "nanoid";

export const createAd = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id } = req.app.get("user");
    const {
      photos,
      description,
      address,
      propertyType,
      price,
      landSize,
      landSizeType,
      action,
    } = req.body;

    let geo;
    try {
      geo = await geocodeAddress(address);

      await Promise.all([
        Ad.create({
            photos,
            description,
            address,
            propertyType,
            landSize,
            landSizeType,
            action,
            slug: slugify(
              `${propertyType}-for-${action}-address-${address}-price-${price}-${nanoid(
                6
              )}`
            ),
            postedBy: _id,
            location: {
              type: "Point",
              coordinates: [
                geo?.location?.coordinates[0],
                geo?.location?.coordinates[1],
              ],
            },
            googleMap: geo.googleMap,
        }),
        User.findByIdAndUpdate(_id, { $addToSet: { role: "Seller" } })
      ])

      res.json({ success: true, message: `Successfully uploaded a ${propertyType}` });
    } catch (error) {
      console.error("Geocoding error:", error);
      return res.json({
        error: "Please enter a valid address.",
      });
    }
  } catch (error) {
    console.error("Ad creation error:", error);
    res
      .status(500)
      .json({ error: "Failed to create ad. Please try again later." });
  }
};

export const uploadImage = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No image files provided" });
    }
    // If only one file is uploaded, multer returns it as a single object, not an array
    const files = Array.isArray(req.files) ? req.files : [req.files];
    const results = await uploadImageToS3(files, _id);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error processing image uploads" });
  }
};

export const removeImage = async (req, res) => {
  const { _id } = req.app.get("user");
  const { Key, uploadedBy } = req.body;
  // Check if the current user ID matches the uploadedBy ID
  if (_id.toString() !== uploadedBy.toString()) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    await deleteImageFromS3(Key);
    return res.json({ success: true });
  } catch (error) {
    console.error("Error removing image:", error);
    return res.status(500).json({ error: "Error removing image. Try again." });
  }
};
