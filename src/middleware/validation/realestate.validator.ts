import { Request, Response, NextFunction } from "express";
import { body, ValidationError, validationResult } from "express-validator";

const errorFormatter = ({ msg }: ValidationError) => {
  // Build your resulting errors however you want! String, object, whatever - it works!
  return msg;
};

/**
 * Validate create ad body
 * @param req The request function object
 * @param res The response function object
 * @param next The next function object
 * @returns 
 */ 
export const createAdValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await Promise.all([
    body("price").notEmpty().withMessage("price is required").run(req),
    body("address")
      .trim()
      .notEmpty()
      .withMessage("address is required")
      .run(req),
    body("propertyType")
      .trim()
      .notEmpty()
      .withMessage("propertyType is required")
      .custom((value, { req }) => {
        if (value.toLowerCase() === "land") {
          if (!req.body.landSize) {
            throw new Error("landSize is required when propertyType is land");
          }
          if (!req.body.landSizeType) {
            throw new Error(
              "landSizeType is required when propertyType is land"
            );
          }
        }
        return true;
      })
      .run(req),
    body("action").trim().notEmpty().withMessage("action is required").run(req),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("description is required")
      .run(req),
  ]);
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array().join(', ')
    })
  }
  next();
};
