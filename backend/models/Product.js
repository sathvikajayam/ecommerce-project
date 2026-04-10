import mongoose from "mongoose";

// Variant sub-schema
const variantSchema = new mongoose.Schema({
  variantType: {
    type: String,
    required: true
  },
  variantValue: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  flatDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountValidityDays: {
    type: Number,
    default: 0,
    min: 0
  },
  discountUserLimit: {
    type: Number,
    default: 0,
    min: 0
  },
  priceAfterDiscount: {
    type: Number,
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  videos: {
    type: [String],
    default: []
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  productId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  price: Number,
  brand: String,
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  flatDiscount: {
    type: Number,
    default: 0,
    min: 0
  },
  priceAfterDiscount: Number,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  description: String,
  image: String,
  category: {
    type: String,
    required: true
  },
  categoryHierarchy: {
    type: [String],
    default: []
  },
  variants: [variantSchema],
  isAdminProduct: {
    type: Boolean,
    default: false,
    index: true
  }
}, { timestamps: true });

const Product = mongoose.model("Product", productSchema);

export default Product;

