import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: false
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    role: {
      type: String,
      enum: ["user", "admin", "super_admin"],
      default: "user"
    },
    password: {
      type: String,
      required: true
    },
    resetPasswordToken: {
      type: String,
      default: null
    },
    resetPasswordExpires: {
      type: Date,
      default: null
    },
    permissions: {
      products: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
      brands: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
      categories: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
      users: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean },
      admin: { view: Boolean, create: Boolean, edit: Boolean, delete: Boolean }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
