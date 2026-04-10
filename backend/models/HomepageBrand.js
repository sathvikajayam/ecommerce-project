import mongoose from "mongoose";

const homepageBrandSchema = new mongoose.Schema({
  slot: {
    type: Number,
    required: true,
    unique: true
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    default: null
  }
}, { timestamps: true });

const HomepageBrand = mongoose.model("HomepageBrand", homepageBrandSchema);

export default HomepageBrand;
