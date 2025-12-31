import bcrypt from 'bcrypt';

/**
 * bcrypt helper to hash password
 * @param password password to be hash
 * @returns return the hashed password
 */
export const hashPassword = async (password: string): Promise<string> => {
    let salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);
    return hashPassword;
}

/**
 * bcrypt helper to compare password
 * @param password plain text password to be compare
 * @param hashPassword hash password to be compare again plaintext password.
 * @return return boolean value
 */
export const comparePassword = async (password: string, hashPassword: string): Promise<Boolean> => {
    return await bcrypt.compare(password, hashPassword);
}