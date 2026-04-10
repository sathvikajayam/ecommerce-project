import mongoose from "mongoose";

const topPicksProductSchema = new mongoose.Schema({
  position: {
    type: Number,
    required: true,
    unique: true,
    min: 1,
    max: 8
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  }
}, { timestamps: true });

const TopPicksProduct = mongoose.model("TopPicksProduct", topPicksProductSchema);

export default TopPicksProduct;
