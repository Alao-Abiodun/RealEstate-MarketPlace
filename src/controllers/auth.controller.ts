import { Request, Response, NextFunction } from 'express';
import { sendWelcomeEmail } from '../utils/helpers/email.helper';


export const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    try {
        await sendWelcomeEmail(email);
        return res.status(200).json({
            message: "Welcome Email Sent. Please follow the instructions",
        })
    } catch (error) {
        throw new Error(error);
    }
}