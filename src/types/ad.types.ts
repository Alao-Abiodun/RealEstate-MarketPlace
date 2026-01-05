import { Types, Document } from 'mongoose';

export interface AdDocument extends Document {
    location: {
        type: "Point",
        coordinates: [number, number]
    },
    action: string;
    propertyType: string;
    postedBy: Types.ObjectId;
}