import mongoose from "mongoose";

const heroSchema = new mongoose.Schema({
  title: {
    type: String,
    required: false
  },
  subtitle: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: false
  },
  position: {
    type: Number,
    default: 0
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ["Live", "Hidden"],
    default: "Live"
  }
}, { timestamps: true });

const Hero = mongoose.model("Hero", heroSchema);

export default Hero;
