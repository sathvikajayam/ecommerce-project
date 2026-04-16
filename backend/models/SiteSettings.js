import mongoose from "mongoose";

const siteSettingsSchema = new mongoose.Schema(
  {
    navbarLogoUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

export default SiteSettings;

