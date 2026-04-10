import Category from "../models/Category.js";

const normalizeCategoryName = (value = "") =>
  (value ?? "")
    .toString()
    .trim()
    .toLowerCase();

export const buildCategoryHierarchy = async (categoryName) => {
  const normalizedStart = normalizeCategoryName(categoryName);
  if (!normalizedStart) return [];

  const categories = await Category.find({}, { name: 1, parentCategory: 1 }).lean();
  const categoriesByName = new Map(
    categories.map((category) => [normalizeCategoryName(category.name), category])
  );

  const hierarchy = [];
  const visited = new Set();
  let currentKey = normalizedStart;

  while (currentKey && !visited.has(currentKey)) {
    visited.add(currentKey);

    const currentCategory = categoriesByName.get(currentKey);
    hierarchy.push(currentCategory?.name || currentKey);

    const parentName = currentCategory?.parentCategory;
    const parentKey = normalizeCategoryName(parentName);
    if (!parentKey) break;

    currentKey = parentKey;
  }

  return hierarchy;
};
