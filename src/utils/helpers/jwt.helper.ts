import jwt, { JwtPayload } from 'jsonwebtoken';


/**
 * JWT helper to generate a valid token for authorization
 * @param payload data encoded in the token
 * @param expiresIn time take for token to expire
 * @returns return a valid token
 */
export const generateJwtToken = (payload: any, expiresIn: string): string | Boolean => {
    try {
        const token = jwt.sign(payload, String(process.env.JWT_SECRET), expiresIn);
        return token;
    } catch (error) {
        return false;
    }
}

/**
 * JWT helper to verifiy token validation and expiration
 * @param token jwt token for validation.
 * @return string | boolean | JwtPayload
 */
export const verifyToken = (token: string): string | Boolean | JwtPayload => {
    try {
        return jwt.verify(token, String(process.env.JWT_SECRET));
    } catch (error) {
        return false;
    }
}

