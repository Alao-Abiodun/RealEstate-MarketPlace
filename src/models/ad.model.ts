import mongoose from "mongoose";
import { AdDocument } from "../types/ad.types";
const { Schema, Types } = mongoose;

const adSchema = new Schema(
  {
    photos: [
      {
        key: {
          type: String,
        },
        location: {
          type: String,
        },
        uploadedBy: {
          type: String,
        },
      },
    ],
    price: {
      type: String,
      maxLength: 255,
      index: true,
    },
    address: {
      type: String,
      required: true,
      maxLength: 255,
    },
    propertyType: {
      type: String,
      default: "House",
      enum: ["House", "Land", "Warehouse"],
    },
    bedRooms: Number,
    bathRooms: Number,
    landSize: Number,
    landSizeType: String,
    carPark: Number,
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [85.323959, 27.717245],
      },
    },
    googleMap: {},
    title: {
      type: String,
      maxLength: 255,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    description: {},
    features: {},
    nearBy: {},
    postedBy: { type: Types.ObjectId, ref: "User" },
    sold: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    action: {
      type: String,
      default: "Sell",
      enum: ["Sell", "Rent", "Lease"],
    },
    views: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: [
        "In market",
        "Deposit taken",
        "Under offer",
        "Contact agent",
        "Sold",
        "Rented",
        "Off market",
      ],
      default: "In market",
    },
    inspectionTime: String,
  },
  { timestamps: true }
);

adSchema.index({ location: "2dsphere" });
export default mongoose.model<AdDocument>("Ad", adSchema);
