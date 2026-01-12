import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/helpers/jwt.helper";
import User from "../models/user.model";

export const userAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer')) {
        return res.status(400).json({
            error: 'Authorization is missing'
        })
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({
            error: 'Authorization is missing'
        })
    }

    const decodedToken = verifyToken(token);

    const user = await User.findById(decodedToken.id).lean();
    if (!user) {
        return res.status(404).json({
            error: 'User not found'
        })
    }

    req.app.set('user', user);

    next();
  } catch (error) {
    console.log('Error while verifying the token', error);
    return res.status(500).json({
        error: 'Failed to verify token. Please try again later.'
    })
  }
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.app.get('user');
    
    if (!user.role.includes("Admin")) {
      return res.status(403).json({
        error: "Access denied. Admin role required."
      })
    }

    next();
  } catch (error) {
    console.error("isAdmin middleware error:", error);
    return res.status(500).json({
      error: "Internal server error"
    })
  }
}
