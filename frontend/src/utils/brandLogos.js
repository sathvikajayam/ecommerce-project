/**
 * Brand Logo Utility
 * Provides logo URLs for all brands using Clearbit API
 * Clearbit API: https://clearbit.com/logo - Free service for brand logos
 */

export const BRAND_LOGOS = {
  // Electronics
  "apple": "https://logo.clearbit.com/apple.com",
  "samsung": "https://logo.clearbit.com/samsung.com",
  "sony": "https://logo.clearbit.com/sony.com",
  "lg": "https://logo.clearbit.com/lg.com",
  "hp": "https://logo.clearbit.com/hp.com",
  "dell": "https://logo.clearbit.com/dell.com",
  "lenovo": "https://logo.clearbit.com/lenovo.com",
  "canon": "https://logo.clearbit.com/canon.com",
  "nikon": "https://logo.clearbit.com/nikon.com",
  "panasonic": "https://logo.clearbit.com/panasonic.com",
  "intel": "https://logo.clearbit.com/intel.com",
  "nvidia": "https://logo.clearbit.com/nvidia.com",
  "amd": "https://logo.clearbit.com/amd.com",

  // Fashion & Luxury
  "nike": "https://logo.clearbit.com/nike.com",
  "adidas": "https://logo.clearbit.com/adidas.com",
  "puma": "https://logo.clearbit.com/puma.com",
  "gucci": "https://logo.clearbit.com/gucci.com",
  "tiffany": "https://logo.clearbit.com/tiffany.com",
  "zara": "https://logo.clearbit.com/zara.com",
  "h&m": "https://logo.clearbit.com/hm.com",
  "louis vuitton": "https://logo.clearbit.com/louisvuitton.com",
  "prada": "https://logo.clearbit.com/prada.com",
  "hermes": "https://logo.clearbit.com/hermes.com",
  "rolex": "https://logo.clearbit.com/rolex.com",
  "fossil": "https://logo.clearbit.com/fossil.com",
  "timex": "https://logo.clearbit.com/timex.com",
  "versace": "https://logo.clearbit.com/versace.com",
  "dolce & gabbana": "https://logo.clearbit.com/dolcegabbana.com",
  "calvin klein": "https://logo.clearbit.com/calvinklein.com",
  "tommy hilfiger": "https://logo.clearbit.com/tommy.com",
  "aeropostale": "https://logo.clearbit.com/aeropostale.com",

  // Sports
  "reebok": "https://logo.clearbit.com/reebok.com",
  "new balance": "https://logo.clearbit.com/newbalance.com",
  "skechers": "https://logo.clearbit.com/skechers.com",
  "under armour": "https://logo.clearbit.com/underarmour.com",

  // Home & Kitchen
  "dyson": "https://logo.clearbit.com/dyson.com",
  "philips": "https://logo.clearbit.com/philips.com",
  "whirlpool": "https://logo.clearbit.com/whirlpool.com",
  "bosch": "https://logo.clearbit.com/bosch.com",

  // Jewelry & Watches
  "swarovski": "https://logo.clearbit.com/swarovski.com",
  "cartier": "https://logo.clearbit.com/cartier.com",
  "bulgari": "https://logo.clearbit.com/bulgari.com",
};

/**
 * Get brand logo URL
 * @param {string} brand - Brand name
 * @returns {string} Logo URL
 */
export const getBrandLogo = (brand) => {
  if (!brand) return null;

  const brandLower = brand.toLowerCase().trim();

  // Check if brand is in our predefined logos
  if (BRAND_LOGOS[brandLower]) {
    return BRAND_LOGOS[brandLower];
  }

  // For unknown brands, construct URL from brand name
  const brandForUrl = brandLower.replace(/\s+/g, "");
  return `https://logo.clearbit.com/${brandForUrl}.com`;
};

/**
 * Get all brand logos
 * @returns {Object} Object with brand names as keys and logo URLs as values
 */
export const getAllBrandLogos = () => {
  return { ...BRAND_LOGOS };
};
