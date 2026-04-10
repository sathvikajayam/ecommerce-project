import mongoose from "mongoose";

const homepageCategorySchema = new mongoose.Schema({
  slot: {
    type: Number,
    required: true,
    unique: true
  },
  categoryName: {
    type: String,
    default: null
  }
}, { timestamps: true });

const HomepageCategory = mongoose.model("HomepageCategory", homepageCategorySchema);

export default HomepageCategory;
