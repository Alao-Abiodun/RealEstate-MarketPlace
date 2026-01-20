import { Request, Response, NextFunction } from "express";
import {
  deleteImageFromS3,
  uploadImageToS3,
} from "../utils/helpers/imageHandler.helper";
import { geocodeAddress } from "../services/geocoder.services";
import Ad from "../models/ad.model";
import User from "../models/user.model";
import slugify from "slugify";
import { sendContactEmailToAgent } from "../utils/helpers/email.helper";
import mongoose from "mongoose";
import { tokenGenerator } from "@/utils/libs/keyGenerator";

export const createAd = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id, username } = req.app.get("user");

    let adData = { ...req.body };

    const { propertyType, action, address, price } = adData;

    if (req.files && Array.isArray(req.files)) {
      const photos = req.files;
      let photoObjs = []
      for (const photo of photos) {
        const uploadedPhotos = await uploadImageToS3(photo, username);
        if (uploadedPhotos) {
          photoObjs.push(...uploadedPhotos)
        }
      }
      adData.photos = photoObjs;
    } 

    let geo;
    try {
      geo = await geocodeAddress(address);

      await Promise.all([
        Ad.create({
          ...adData,
          slug: slugify(
            `${propertyType}-for-${action}-address-${address}-price-${price}-${tokenGenerator(
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

    await Ad.findByIdAndUpdate(ad._id, { $inc: { views: 1 } });

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

export const changeAd = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    const { id } = req.params;

    const adOwner = await Ad.findOne({ _id: id, postedBy: _id });
    if (!adOwner) {
      return res.status(404).json({
        message: "Ad Not Found!",
      });
    }

    let updatedValues: any = {};

    const allowedProps = [
      "photos",
      "price",
      "address",
      "propertyType",
      "action",
      "description",
    ];

    for (const prop in req.body) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, prop) &&
        allowedProps.includes(prop)
      ) {
        updatedValues[prop] = req.body[prop];
      }
    }

    let geo;
    try {
      geo = await geocodeAddress(updatedValues.address);

      updatedValues.slug = slugify(
        `${updatedValues.propertyType}-for-${updatedValues.action}-address-${
          updatedValues.address
        }-price-${updatedValues.price}-${tokenGenerator(6)}`
      );
      updatedValues.location = {
        type: "Point",
        coordinates: [
          geo?.location?.coordinates[0],
          geo?.location?.coordinates[1],
        ],
      };
      updatedValues.googleMap = geo.googleMap;

      await Ad.findByIdAndUpdate(
        { _id: id },
        { ...updatedValues },
        { new: true }
      ).lean();

      return res.status(200).json({
        message: "Ad updated successfully",
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      return res.status(400).json({
        error: "Please enter a valid address.",
      });
    }
  } catch (error) {
    console.error("Ad update error:", error);
    res
      .status(500)
      .json({ error: "Failed to update ad. Please try again later." });
  }
};

export const removeAd = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    const { id } = req.params;

    const adOwner = await Ad.findOne({ _id: id, postedBy: _id });
    if (!adOwner) {
      return res.status(404).json({
        message: "Ad not Found!",
      });
    }

    await Ad.deleteOne({ _id: id, postedBy: _id });

    return res.status(200).json({
      message: "Ad deleted successfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      error: "Error while trying to delete. Please try later",
    });
  }
};

export const userAd = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    let { page, limit } = req.query;

    if (page && limit) {
      page = Number(page) || 1;
      limit = Number(page) || 2;
    }

    const skip = (page - 1) * limit;

    const totalAds = await Ad.countDocuments({ postedBy: _id });

    const userAds = await Ad.find({ postedBy: _id })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "User ads retrieved successfully",
      userAds,
      totalAds,
      page: Number(page),
      totalPages: Math.ceil(totalAds / limit),
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Error while trying to fetch user ads. Please try again later.",
    });
  }
};

export const changeAdStatus = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    const { id } = req.params;
    const { adStatus } = req.body;

    const adOwner = await Ad.findOne({ _id: id, postedBy: _id });
    if (!adOwner) {
      return res.status(404).json({
        error: "Ad not found",
      });
    }

    const adStatusEnum = [
      "In Market",
      "Deposit taken",
      "Under offer",
      "Sold",
      "Rented",
      "Off Market",
    ];
    if (!adStatusEnum.includes(adStatus)) {
      return res.status(400).json({
        error: "Invalid status",
      });
    }

    await Ad.findByIdAndUpdate(id, { status: adStatus }, { new: true });

    return res.status(200).json({
      message: "Ad status updated successfully",
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Error while trying to update user ads. Please try again later.",
    });
  }
};

export const contactAgent = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    const { adId, message } = req.body;
    const adOwner = await Ad.findById(adId).populate("postedBy");
    if (!adOwner) {
      return res.status(404).json({
        message: "Ad not found",
      });
    }

    const user = await User.findByIdAndUpdate(_id, {
      $addToSet: { enquiredProperties: adOwner._id },
    });

    await sendContactEmailToAgent(adOwner, user, message);

    return res.status(200).json({
      success: true,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Error while trying to update user ads. Please try again later.",
    });
  }
};

export const enquiredAds = async (req, res) => {
  try {
    const { enquiredProperties } = req.app.get("user");
    let { page, limit } = req.query;
    if (page && limit) {
      page = Number(page) || 1;
      limit = Number(limit) || 2;
    }
    const skip = (page - 1) * limit;

    const totalAds = await Ad.countDocuments({
      _id: {
        $in: enquiredProperties,
      },
    });

    const ads = await Ad.find({ _id: { $in: enquiredProperties } })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Enquired Properties fetched",
      ads,
      totalAds,
      totalPages: Math.ceil(totalAds / limit),
    });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({
      message: "Error while fetching the enquired properties, Try again later.",
    });
  }
};

export const toggleUserWishlist = async (req, res) => {
  try {
    const { _id, wishlist } = req.app.get("user");
    const { id: adId } = req.params;

    const adObjectId = new mongoose.Types.ObjectId(adId);

    const isInWishlist = wishlist.some((id) => id.toString() === adId);

    const update = isInWishlist
      ? {
          $pull: { wishlist: adObjectId },
        }
      : { $addToSet: { wishlist: adObjectId } };

    const updatedUser = await User.findByIdAndUpdate(_id, update, {
      lean: true,
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: isInWishlist
        ? "Ad removed from user wishlist"
        : "Ad added to user wishlist",
      wishlist: updatedUser.wishlist,
    });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({
      message:
        "Error while trying to add or remove ads to user wishlist, Try again later.",
    });
  }
};

export const getUserWishlist = async (req, res) => {
  try {
    const { wishlist } = req.app.get("user");
    let { page, limit } = req.query;
    if (page && limit) {
      page = Number(page) || 1;
      limit = Number(limit) || 2;
    }
    const skip = (page - 1) * limit;

    const totalAds = await Ad.countDocuments({ _id: { $in: wishlist } });

    const ads = await Ad.find({ _id: { $in: wishlist } })
      .select("-googleMap")
      .populate("postedBy", "name username email phone company")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "User ad wishlist",
      ads: { data: ads },
      totalAds,
      totalPages: Math.ceil(totalAds / page),
    });
  } catch (error) {
    console.log("Error", error);
    return res.status(500).json({
      message: "Error while trying to fetch user wishlist, Try again later.",
    });
  }
};

export const searchAds = async (req, res) => {
  try {
    const { address, price, action, propertyType, bedrooms, bathrooms } =
      req.body;
    let { page = 1, limit } = req.query;
    const skip = (page - 1) * limit;

    let geo = await geocodeAddress(address);

    let query: any = {
      location: {
        $geoWithin: {
          $centerSphere: [
            [geo?.location?.coordinates[0], geo?.location?.coordinates[1]],
            10 / 6371,
          ],
        },
      },
    };

    if (action) {
      query.action - action;
    }
    if (propertyType && propertyType !== "All") {
      query.propertyType = propertyType;
    }
    if (bedrooms && bedrooms !== "All") {
      query.bedrooms = parseInt(bedrooms);
    }
    if (bathrooms && bathrooms !== "All") {
      query.bathrooms = parseInt(bathrooms);
    }
    if (parseFloat(price)) {
      const numericPrice = parseFloat(price);
      const minPrice = numericPrice * 0.8;
      const maxPrice = numericPrice * 1.2;
      query.price = {
        $regex: new RegExp(
          `^(${minPrice.toFixed(0)} | ${maxPrice.toFixed(0)})`
        ),
      };
    }

    let ads = await Ad.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ createdAt: -1 })
      .select("-googleMap");

    let totalAds = await Ad.countDocuments(query);

    return res.json({
      ads: { data: ads },
      total: totalAds,
      page,
      totalPages: Math.ceil(totalAds / limit),
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Error while trying to search for ads. Try again later.",
    });
  }
};

export const publishAds = async (req, res) => {
  try {
    const { id: adId } = req.params;

    const ad = await Ad.findById(adId);
    if (!ad) {
      return res.status(404).json({
        message: "Ad not found",
      });
    }

    const updatedAd = await Ad.findByIdAndUpdate(adId, {
      published: ad.published ? false : true,
    });

    return res.status(200).json({
      success: true,
      message: ad.published ? "Ad unpublished" : "Ad is published",
      ad: updatedAd,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while publishing/unpublishing the ad. Try again later.",
    });
  }
};
