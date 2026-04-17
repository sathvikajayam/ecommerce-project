import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const SUPER_ADMIN_EMAIL = "admin@example.com";
const fullPermissions = {
  products: { view: true, create: true, edit: true, delete: true },
  brands: { view: true, create: true, edit: true, delete: true },
  categories: { view: true, create: true, edit: true, delete: true },
  users: { view: true, create: true, edit: true, delete: true },
  admin: { view: true, create: true, edit: true, delete: true },
  coupons: { view: true, create: true, edit: true, delete: true },
  homepage: { view: true, create: true, edit: true, delete: true },
  navbar: { view: true, create: false, edit: true, delete: false },
  orders: { view: true, create: false, edit: true, delete: false },
  contacts: { view: true, create: false, edit: false, delete: false },
};

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const adminExists = await User.findOne({ email: SUPER_ADMIN_EMAIL });
    if (adminExists) {
      adminExists.isAdmin = true;
      adminExists.role = "super_admin";
      adminExists.permissions = fullPermissions;
      await adminExists.save();
      console.log("Admin user already exists. Super admin permissions enforced.");
      process.exit(0);
    }

    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: "Admin User",
      email: SUPER_ADMIN_EMAIL,
      password: hashedPassword,
      isAdmin: true,
      role: "super_admin",
      permissions: fullPermissions,
    });

    console.log("Admin user created successfully");
    console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
    console.log("Password: admin123");
    console.log("Please change the password after first login.");

    process.exit(0);
  } catch (error) {
    console.error("Error creating admin user:", error);
    process.exit(1);
  }
};

createAdminUser();
