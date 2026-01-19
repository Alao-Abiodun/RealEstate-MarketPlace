import { randomBytes } from 'crypto';

export const tokenGenerator = (len: number): string =>
    randomBytes(len).toString('hex');