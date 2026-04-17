import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { hasPermission } from "../middleware/permissionMiddleware.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

const router = express.Router();
const SUPER_ADMIN_EMAIL = "admin@example.com";
const ADMIN_ROLES = ["admin", "super_admin"];
const MIN_ADMIN_PASSWORD_LENGTH = 6;

const RESOURCES = [
  "products",
  "brands",
  "categories",
  "users",
  "admin",
  "coupons",
  "homepage",
  "navbar",
  "orders",
  "contacts",
];
const ACTIONS = ["view", "create", "edit", "delete"];

const can = (user, resource, action) => hasPermission(user, resource, action);
const isCurrentUserSuperAdmin = (user) =>
  user?.role === "super_admin" || (user?.email || "").toLowerCase() === SUPER_ADMIN_EMAIL;

const canViewAnyUsers = (user) => 
  can(user, "users", "view") || can(user, "users", "create") || can(user, "users", "edit") || can(user, "users", "delete") ||
  can(user, "admin", "view") || can(user, "admin", "create") || can(user, "admin", "edit") || can(user, "admin", "delete");

const canManageByTarget = (user, targetUser, action) => {
  if (targetUser?.isAdmin) {
    return can(user, "admin", action);
  }
  return can(user, "users", action);
};

const validatePermissions = (permissions) => {
  if (!permissions || typeof permissions !== "object") {
    return false;
  }

  for (const resource of RESOURCES) {
    if (!permissions[resource] || typeof permissions[resource] !== "object") {
      return false;
    }
    for (const action of ACTIONS) {
      if (typeof permissions[resource][action] !== "boolean") {
        return false;
      }
    }
  }
  return true;
};

const defaultPermissions = {
  products: { view: false, create: false, edit: false, delete: false },
  brands: { view: false, create: false, edit: false, delete: false },
  categories: { view: false, create: false, edit: false, delete: false },
  users: { view: false, create: false, edit: false, delete: false },
  admin: { view: false, create: false, edit: false, delete: false },
  coupons: { view: false, create: false, edit: false, delete: false },
  homepage: { view: false, create: false, edit: false, delete: false },
  navbar: { view: false, create: false, edit: false, delete: false },
  orders: { view: false, create: false, edit: false, delete: false },
  contacts: { view: false, create: false, edit: false, delete: false },
};

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

router.post("/forgot-password", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email, isAdmin: true });
    if (!user) {
      return res.status(200).json({
        message: "If an admin account exists for that email, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const adminResetUrl = `${frontendBaseUrl.replace(/\/$/, "")}/admin/reset-password/${resetToken}`;

    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl: adminResetUrl,
      });
    } catch (mailError) {
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();
      return res.status(500).json({
        message: "Unable to send admin reset email. Please verify SMTP settings.",
      });
    }

    return res.status(200).json({
      message: "If an admin account exists for that email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Admin forgot password error:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const token = String(req.params?.token || "").trim();
    const password = String(req.body?.password || "").trim();

    if (!token) {
      return res.status(400).json({ message: "Reset token is required" });
    }

    if (password.length < MIN_ADMIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`,
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      isAdmin: true,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Admin password reset successful" });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return res.status(500).json({ message: error.message });
  }
});

router.use(protect, adminOnly);

router.get("/", async (req, res) => {
  try {
    if (!canViewAnyUsers(req.user)) {
      return res.status(403).json({ message: "Permission denied: users.view or admin.view required" });
    }

    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id).select("-password");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageByTarget(req.user, targetUser, "view")) {
      return res.status(403).json({ message: "Permission denied for this user type" });
    }

    res.json(targetUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, email, password, isAdmin, permissions, role } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedRole = (role || "").toString().trim().toLowerCase().replace(/\s+/g, "_");
    const roleFromRequest = ADMIN_ROLES.includes(normalizedRole) ? normalizedRole : null;
    const isSuperAdminEmail = normalizedEmail === SUPER_ADMIN_EMAIL;
    const creatingAdmin = isSuperAdminEmail || !!isAdmin || roleFromRequest !== null;
    const finalRole = creatingAdmin
      ? (isSuperAdminEmail || roleFromRequest === "super_admin" ? "super_admin" : "admin")
      : "user";
    const isSuperAdminAccount = finalRole === "super_admin";

    if (creatingAdmin && !can(req.user, "admin", "create")) {
      return res.status(403).json({ message: "Permission denied: admin.create required" });
    }
    if (!creatingAdmin && !can(req.user, "users", "create")) {
      return res.status(403).json({ message: "Permission denied: users.create required" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (role !== undefined && roleFromRequest === null) {
      return res.status(400).json({ message: "Role must be either 'admin' or 'super_admin'" });
    }

    if (roleFromRequest === "super_admin" && !isCurrentUserSuperAdmin(req.user)) {
      return res.status(403).json({ message: "Only super admin can create super admin accounts" });
    }

    if (creatingAdmin && (!password || !password.trim())) {
      return res.status(400).json({ message: "Password is required for admin creation" });
    }

    if (
      creatingAdmin &&
      String(password || "").trim().length < MIN_ADMIN_PASSWORD_LENGTH
    ) {
      return res.status(400).json({
        message: `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`,
      });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    if (permissions && !validatePermissions(permissions)) {
      return res.status(400).json({ message: "Invalid permissions structure" });
    }

    const pwd = password || Math.random().toString(36).slice(-8);
    const hashed = await bcrypt.hash(pwd, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      isAdmin: creatingAdmin,
      role: finalRole,
      permissions: isSuperAdminAccount ? fullPermissions : (permissions || defaultPermissions),
    });

    const userToReturn = user.toObject();
    delete userToReturn.password;

    res.status(201).json({
      message: "User created successfully",
      user: userToReturn,
      defaultPassword: !password ? pwd : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { isAdmin, permissions, name, role, password } = req.body;

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isSuperAdminTarget =
      targetUser.role === "super_admin" ||
      (targetUser.email || "").toLowerCase() === SUPER_ADMIN_EMAIL;
    const normalizedRole = (role || "").toString().trim().toLowerCase().replace(/\s+/g, "_");
    const roleFromRequest = role === undefined ? undefined : (ADMIN_ROLES.includes(normalizedRole) ? normalizedRole : null);

    const updatesAdminType =
      targetUser.isAdmin ||
      isAdmin === true ||
      (typeof isAdmin === "boolean" && isAdmin !== targetUser.isAdmin) ||
      permissions !== undefined ||
      role !== undefined;

    if (updatesAdminType) {
      if (!can(req.user, "admin", "edit")) {
        return res.status(403).json({ message: "Permission denied: admin.edit required" });
      }
    } else if (!can(req.user, "users", "edit")) {
      return res.status(403).json({ message: "Permission denied: users.edit required" });
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ message: "Name cannot be empty" });
      }
      updateData.name = name;
    }

    if (isAdmin !== undefined) {
      if (typeof isAdmin !== "boolean") {
        return res.status(400).json({ message: "isAdmin must be a boolean" });
      }
      if (isSuperAdminTarget && isAdmin === false) {
        return res.status(400).json({ message: "Super admin cannot be downgraded from admin" });
      }
      updateData.isAdmin = isAdmin;
    }

    if (role !== undefined) {
      if (roleFromRequest === null) {
        return res.status(400).json({ message: "Role must be either 'admin' or 'super_admin'" });
      }
      if (roleFromRequest === "super_admin" && !isCurrentUserSuperAdmin(req.user)) {
        return res.status(403).json({ message: "Only super admin can assign super admin role" });
      }
      if (isSuperAdminTarget && roleFromRequest !== "super_admin") {
        return res.status(400).json({ message: "Super admin role cannot be downgraded" });
      }
      updateData.role = roleFromRequest;
      updateData.isAdmin = true;
    }

    if (password !== undefined) {
      const trimmedPassword = String(password).trim();
      if (trimmedPassword.length < MIN_ADMIN_PASSWORD_LENGTH) {
        return res.status(400).json({
          message: `Password must be at least ${MIN_ADMIN_PASSWORD_LENGTH} characters`,
        });
      }
      updateData.password = await bcrypt.hash(trimmedPassword, 10);
    }

    if (permissions !== undefined) {
      if (!validatePermissions(permissions)) {
        return res.status(400).json({
          message: "Invalid permissions structure. Expected: { resource: { action: boolean } }",
        });
      }
      if (isSuperAdminTarget) {
        updateData.permissions = fullPermissions;
      } else {
      updateData.permissions = permissions;
      }
    } else if (isSuperAdminTarget) {
      updateData.permissions = fullPermissions;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      message: "User updated successfully",
      user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canManageByTarget(req.user, targetUser, "delete")) {
      return res.status(403).json({ message: "Permission denied for this user type" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      message: "User deleted successfully",
      userId: targetUser._id,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
