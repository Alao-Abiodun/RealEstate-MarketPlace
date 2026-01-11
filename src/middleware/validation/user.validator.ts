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
export const updateProfileValidator = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await Promise.all([
    body("name").notEmpty().withMessage("name is required").run(req),
    body("phone").notEmpty().withMessage("phone is required").run(req),
    body("company")
      .trim()
      .notEmpty()
      .withMessage("company is required")
      .run(req),
    body("address")
      .trim()
      .notEmpty()
      .withMessage("address is required")
      .run(req),
    body("about").trim().notEmpty().withMessage("about is required").run(req),
  ]);
  const errors = validationResult(req).formatWith(errorFormatter);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array().join(', ')
    })
  }
  next();
};
