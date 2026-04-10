// Size variants mapping based on categories
export const sizeVariantsMap = {
  "women's clothing": [
    { size: "XS", label: "Extra Small" },
    { size: "S", label: "Small" },
    { size: "M", label: "Medium" },
    { size: "L", label: "Large" },
    { size: "XL", label: "Extra Large" },
    { size: "XXL", label: "Double XL" },
  ],
  "Womens Clothing": [
    { size: "XS", label: "Extra Small" },
    { size: "S", label: "Small" },
    { size: "M", label: "Medium" },
    { size: "L", label: "Large" },
    { size: "XL", label: "Extra Large" },
    { size: "XXL", label: "Double XL" },
  ],
  "men's clothing": [
    { size: "XS", label: "Extra Small" },
    { size: "S", label: "Small" },
    { size: "M", label: "Medium" },
    { size: "L", label: "Large" },
    { size: "XL", label: "Extra Large" },
    { size: "XXL", label: "Double XL" },
  ],
  "Mens Clothing": [
    { size: "XS", label: "Extra Small" },
    { size: "S", label: "Small" },
    { size: "M", label: "Medium" },
    { size: "L", label: "Large" },
    { size: "XL", label: "Extra Large" },
    { size: "XXL", label: "Double XL" },
  ],
  "jewelery": [
    { size: "One Size", label: "One Size Fits All" },
    { size: "S", label: "Small" },
    { size: "M", label: "Medium" },
    { size: "L", label: "Large" },
  ],
  "Jewelery": [
    { size: "One Size", label: "One Size Fits All" },
    { size: "S", label: "Small" },
    { size: "M", label: "Medium" },
    { size: "L", label: "Large" },
  ],
  "electronics": [], // Electronics don't have size variants
  "Electronics": [], // Electronics don't have size variants
};

/**
 * Get available sizes for a given category
 * @param {string} category - The product category
 * @returns {array} Array of size objects with 'size' and 'label' properties
 */
export const getSizesByCategory = (category) => {
  if (!category) return [];
  
  // Try exact match first
  if (sizeVariantsMap[category]) {
    return sizeVariantsMap[category];
  }
  
  // Try case-insensitive match
  const lowerCategory = category.toLowerCase();
  for (const key in sizeVariantsMap) {
    if (key.toLowerCase() === lowerCategory) {
      return sizeVariantsMap[key];
    }
  }
  
  return [];
};

/**
 * Check if a category requires size selection
 * @param {string} category - The product category
 * @returns {boolean} True if category requires sizes
 */
export const requiresSizes = (category) => {
  const sizes = getSizesByCategory(category);
  return sizes.length > 0;
};
