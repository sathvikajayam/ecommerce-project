import mongoose from "mongoose";

const brandSchema = new mongoose.Schema({
  brandId: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  logo: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: "",
  },
  website: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
