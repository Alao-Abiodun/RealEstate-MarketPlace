import { Request, Response, NextFunction } from "express";
import {
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from "../utils/helpers/email.helper";
import validator from "email-validator";
import User from "../models/user.model";
import { nanoid } from "nanoid";
import { generateJwtToken } from "../utils/helpers/jwt.helper";
import { comparePassword, hashPassword } from "../utils/helpers/bcrypt.helper";

export const createOrLogin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  if (!validator.validate(email)) {
    return res.json({ error: "A valid email is required" });
  }
  if (!email?.trim()) {
    return res.json({ message: "Email is required" });
  }
  if (!password?.trim()) {
    return res.json({ message: "Password is required" });
  }
  if (!password?.trim() && password?.length < 6) {
    return res.json({
      message: `Password should be at least 6 characters long`,
    });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) {
      try {
        // await sendWelcomeEmail(email);

        const newUser = await User.create({
          email,
          password: await hashPassword(password),
          username: nanoid(6),
        });

        const token = generateJwtToken(
          {
            id: newUser._id,
            email: newUser.email,
          },
          "1h"
        );
        newUser.password = undefined;
        return res.json({
          user: newUser,
          token,
        });
      } catch (error) {
        console.log('error', error);
        return res.json({
          error: "Invalid email. Please use your valid email.",
        });
      }
    } else {
      const isMatch = await comparePassword(password, user.password);
      if (!isMatch) {
        return res.json({
          error: "Wrong password",
        });
      } else {
        const token = await generateJwtToken(
          {
            id: user._id,
            email: user.email,
          },
          "1h"
        );
        user.password = undefined;
        return res.json({
          user,
          token,
        });
      }
    }
  } catch (error) {
    console.log("error", error);
    res.json({
      error: `Something went wrong. Try again!`,
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    return res.json({
      error:
        "If we find your account, you will receive an email from us shortly",
    });
  } else {
    const password = nanoid(6);
    user.password = await hashPassword(password);
    await user.save();

    try {
      await sendPasswordResetEmail(email, password);
      return res.json({
        message: "Please check your email",
      });
    } catch (error) {
      return res.json({
        error:
          "If we find your account, you will receive an email from us shortly",
      });
    }
  }
};

export const fetchMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.app.get("user");

    const profile = await User.findById(user._id);

    return res.json({
      profile,
    });
  } catch (error) {
    return res.json({
      error: `Something went wrong`,
    });
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let { password } = req.body;

    password = password ? password?.trim() : "";

    if (!password) {
      return res.json({
        error: "Password is required",
      });
    }

    if (password?.length < 6) {
      return res.json({
        error: "Password should atleast 6 characters long.",
      });
    }

    const { _id } = req.app.get("user");
    const user = await User.findById(_id);

    const hashedPassword = await hashPassword(password);

    await User.findOneAndUpdate(
      { _id: user._id },
      { password: hashPassword },
      { new: true }
    );

    return res.json({
      success: true,
    });
  } catch (error) {
    return res.status(403).json({
      error: "An error occurred while updating the password",
    });
  }
};

export const changeUserName = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username } = req.body;

    if (!username || !username?.trim()) {
      return res.json({
        error: "Username is required",
      });
    }

    const trimmedUsername = username?.trim();

    const existingUser = await User.findOne({
      username: trimmedUsername,
    });

    if (existingUser) {
      return res.json({
        error: "Username is already taken",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      { username: trimmedUsername },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(400).json({
        error: "Updated failed. Try again",
      });
    }

    updatedUser.password = undefined;

    res.json(updatedUser);
  } catch (error) {
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
