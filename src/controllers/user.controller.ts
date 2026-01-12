import { Request, Response, NextFunction } from "express";
import User from "../models/user.model";
import { removePasswordFromObject } from "../utils/helpers/user.helper";

export const fetchMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.app.get("user");

    const profile = await User.findById(user._id).populate(
      "wishlist",
      "photos price address propertyType location"
    );

    return res.json({
      profile,
    });
  } catch (error) {
    return res.json({
      error: `Something went wrong`,
    });
  }
};

export const changeUserName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id } = req.app.get("user");
    const { username } = req.body;

    const trimmedUsername = username?.trim();

    const existingUser = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: _id }
    });

    if (existingUser) {
      return res.json({
        error: "Username is already taken",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { username: trimmedUsername },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        error: "Updated failed. Try again",
      });
    }

    updatedUser.password = undefined;

    res.json({
      message: "Username changed successfully",
      user: { data: removePasswordFromObject(updatedUser) },
    });
  } catch (error) {
    console.log("error", error);
    if (error.code === 11000) {
      return res.status(400).json({
        error: "Username is already taken",
      });
    } else {
      return res.status(500).json({
        error: "An error occurred while updating the profile",
      });
    }
  }
};

export const changeProfile = async (req, res) => {
  try {
    const { _id } = req.app.get("user");
    console.log("_id", _id);

    let updatedValues: any = {};

    const allowedProps = [
      "name",
      "phone",
      "company",
      "address",
      "about",
      "photo",
      "logo",
    ];

    for (const prop in req.body) {
      if (
        Object.prototype.hasOwnProperty.call(req.body, prop) &&
        allowedProps.includes(prop)
      ) {
        updatedValues[prop] = req.body[prop];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { ...updatedValues },
      { new: true }
    ).lean();

    return res.status(200).json({
      message: "User profile updated",
      user: removePasswordFromObject(updatedUser),
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({
      message: "Error while trying to update user profile. Try again later.",
    });
  }
};
