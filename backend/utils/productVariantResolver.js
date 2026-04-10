const normalizeType = (value = "") => String(value).trim().toLowerCase();

const normalizeValue = (value = "") => String(value).trim().toLowerCase();

const isColorType = (type = "") => {
  const normalized = normalizeType(type);
  return normalized.includes("color") || normalized.includes("colour");
};

const scoreVariant = (variant = {}) => {
  let score = 0;
  score += Array.isArray(variant.images) ? variant.images.length * 4 : 0;
  score += Array.isArray(variant.videos) ? variant.videos.length * 2 : 0;
  score += Number(variant.price) > 0 ? 2 : 0;
  score += Number(variant.priceAfterDiscount) > 0 ? 1 : 0;
  return score;
};

const toPlainVariant = (variant = {}) => ({
  variantType: variant.variantType || "",
  variantValue: variant.variantValue || "",
  price: Number(variant.price) || 0,
  discount: Number(variant.discount) || 0,
  flatDiscount: Number(variant.flatDiscount) || 0,
  discountValidityDays: Number(variant.discountValidityDays) || 0,
  discountUserLimit: Number(variant.discountUserLimit) || 0,
  priceAfterDiscount: Number(variant.priceAfterDiscount) || Number(variant.price) || 0,
  images: Array.isArray(variant.images) ? variant.images.filter(Boolean) : [],
  videos: Array.isArray(variant.videos) ? variant.videos.filter(Boolean) : [],
});

export const buildVariantGroups = (variants = []) => {
  const groups = [];
  const groupMap = new Map();

  variants.forEach((variant) => {
    const plainVariant = toPlainVariant(variant);
    const typeKey = normalizeType(plainVariant.variantType);
    const valueKey = normalizeValue(plainVariant.variantValue);

    if (!typeKey || !valueKey) return;

    let group = groupMap.get(typeKey);
    if (!group) {
      group = {
        type: plainVariant.variantType,
        normalizedType: typeKey,
        isColorType: isColorType(plainVariant.variantType),
        options: [],
      };
      groupMap.set(typeKey, group);
      groups.push(group);
    }

    const existingIndex = group.options.findIndex(
      (option) => normalizeValue(option.variantValue) === valueKey
    );

    if (existingIndex === -1) {
      group.options.push(plainVariant);
      return;
    }

    if (scoreVariant(plainVariant) > scoreVariant(group.options[existingIndex])) {
      group.options[existingIndex] = plainVariant;
    }
  });

  return groups;
};

export const serializeProductVariants = (product) => {
  if (!product) return product;

  const plainProduct =
    typeof product.toObject === "function" ? product.toObject() : { ...product };

  const variantGroups = buildVariantGroups(plainProduct.variants || []);
  const defaultSelections = variantGroups.reduce((acc, group) => {
    if (group.options[0]?.variantValue) {
      acc[group.type] = group.options[0].variantValue;
    }
    return acc;
  }, {});

  return {
    ...plainProduct,
    variantGroups,
    defaultVariantSelections: defaultSelections,
  };
};
