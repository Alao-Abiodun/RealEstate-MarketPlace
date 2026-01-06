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

    const adData = { ...req.body };

    const { propertyType, action, address, price } = adData;

    let geo;
    try {
      geo = await geocodeAddress(address);

      await Promise.all([
        Ad.create({
          ...adData,
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
        User.findByIdAndUpdate(_id, { $addToSet: { role: "Seller" } }),
      ]);

      res.json({
        success: true,
        message: `Successfully uploaded a ${propertyType}`,
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      return res.status(400).json({
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

export const fetchNearAd = async (req, res) => {
  try {
    const { slug } = req.params;

    const ad = await Ad.findOne({ slug })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company photo logo");

    if (!ad) {
      return res.status(404).json({ error: "Ad not found" });
    }

    const related = await Ad.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: ad.location.coordinates,
          },
          distanceField: "dist.calculated",
          maxDistance: 100000, // 50 km
          spherical: true,
        },
      },
      {
        $match: {
          _id: { $ne: ad._id },
          action: ad.action,
          propertyType: ad.propertyType,
        },
      },
      { $limit: 3 },
      {
        $project: {
          googleMap: 0,
        },
      },
    ]);

    const relatedWithPopulatedPostedBy = await Ad.populate(related, {
      path: "postedBy",
      select: "name username email phone company photo logo",
    });

    res.json({ ad, related: relatedWithPopulatedPostedBy });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch. Try again." });
  }
};

export const adsForSellOrRent = async (req, res) => {
  try {
    const { actionType } = req.params;
    let { page, limit } = req.query;
    let filter: any = {};
    
    if (page & limit) {
      filter.page = Number(page) || 1;
      filter.limit = Number(limit) || 2;
    }

    const skip = (page - 1) * limit;

    const totalAds = await Ad.countDocuments({ action: actionType });
    const ads = await Ad.find({ action: actionType })
      .populate("postedBy", "name username email phone company photo logo")
      .select("-googleMap")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.json({
      ads,
      totalAds,
      page: Number(page),
      totalPages: Math.ceil(totalAds / limit),
    });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Failed to fetch. Try again." });
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
