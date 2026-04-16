import fs from "fs";
import SiteSettings from "../models/SiteSettings.js";
import supabase from "../config/supabaseClient.js";

const NAVBAR_LOGO_BUCKET = process.env.SUPABASE_NAVBAR_BUCKET || "Ecommerce";
const NAVBAR_LOGO_FOLDER = process.env.SUPABASE_NAVBAR_FOLDER || "navbar-logo";

const uploadNavbarLogo = async (file) => {
  if (!file) return "";

  try {
    if (!supabase) {
      throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_KEY).");
    }

    const safeOriginalName = String(file.originalname || "logo")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9._-]/g, "");
    const filePath = `${NAVBAR_LOGO_FOLDER}/${Date.now()}-${safeOriginalName}`;

    if (!fs.existsSync(file.path)) {
      throw new Error("Uploaded file not found on disk.");
    }

    const fileBuffer = fs.readFileSync(file.path);

    const { error: uploadError } = await supabase.storage
      .from(NAVBAR_LOGO_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase navbar logo upload error:", uploadError);
      throw new Error("Failed to upload navbar logo to Supabase.");
    }

    const { data } = supabase.storage.from(NAVBAR_LOGO_BUCKET).getPublicUrl(filePath);
    const publicUrl = data?.publicUrl || "";

    if (!publicUrl) {
      throw new Error("Failed to generate public URL for uploaded navbar logo.");
    }

    return publicUrl;
  } catch (err) {
    console.error("Error uploading navbar logo:", err.message);
    throw err;
  } finally {
    try {
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    } catch (unlinkErr) {
      console.error("Error deleting temp file:", unlinkErr.message);
    }
  }
};

// @desc    Get navbar settings (logo)
// @route   GET /api/settings/navbar
// @access  Public
export const getNavbarSettings = async (req, res) => {
  try {
    const settings = await SiteSettings.findOne();
    res.status(200).json({ navbarLogoUrl: settings?.navbarLogoUrl || "" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update navbar logo
// @route   PUT /api/settings/navbar/logo
// @access  Private/Admin
export const updateNavbarLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a logo image" });
    }

    const navbarLogoUrl = await uploadNavbarLogo(req.file);

    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { navbarLogoUrl },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ navbarLogoUrl: settings?.navbarLogoUrl || "" });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to update navbar logo" });
  }
};
