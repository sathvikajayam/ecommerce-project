import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import axios from "axios";
import "../styles/AdminHomepage.css";
import * as brandService from "../../service/brandService";
import * as categoryService from "../../service/publicCategoryService";
import { getStoredAdminUser, hasAdminPermission } from "../../utils/adminPermissions";

const normalizeSectionData = (section) => ({
  ...section,
  type: section.type || "products",
  products: Array.isArray(section.products) ? section.products : [],
  categories: Array.isArray(section.categories) ? section.categories : [],
  brands: Array.isArray(section.brands) ? section.brands : [],
  category: section.category || null,
  brand: section.brand || null,
});

const normalizeFilterValue = (value) => String(value || "").toLowerCase().trim();

const resolveProductDisplayPrice = (product) => {
  const firstVariant = product?.variants?.[0] || null;
  const priceCandidates = [
    Number(product?.priceAfterDiscount),
    Number(firstVariant?.priceAfterDiscount),
    Number(product?.price),
    Number(firstVariant?.price),
  ];

  return priceCandidates.find((value) => Number.isFinite(value) && value >= 0) ?? 0;
};

const SECTION_TYPES = [
  { value: "products", label: "Products" },
  { value: "categories", label: "Categories" },
  { value: "brands", label: "Brands" },
];


const AdminHomepage = () => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [heroImages, setHeroImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [link, setLink] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState("No file chosen");

  // Edit mode states
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Homepage Brands states
  const [allBrands, setAllBrands] = useState([]);
  const [homepageLayout, setHomepageLayout] = useState([
    { slot: 1, brandId: "" },
    { slot: 2, brandId: "" },
    { slot: 3, brandId: "" },
    { slot: 4, brandId: "" },
  ]);
  const [savingLayout, setSavingLayout] = useState(false);

  // Homepage Categories states
  const [allCategories, setAllCategories] = useState([]);
  const [homepageCategoryLayout, setHomepageCategoryLayout] = useState([
    { slot: 1, categoryName: "" },
    { slot: 2, categoryName: "" },
    { slot: 3, categoryName: "" },
    { slot: 4, categoryName: "" },
  ]);
  const [savingCategoryLayout, setSavingCategoryLayout] = useState(false);

  // Top Picks states
  const [allProducts, setAllProducts] = useState([]);
  const [topPicksLayout, setTopPicksLayout] = useState([
    { position: 1, productId: "" },
    { position: 2, productId: "" },
    { position: 3, productId: "" },
    { position: 4, productId: "" },
    { position: 5, productId: "" },
    { position: 6, productId: "" },
    { position: 7, productId: "" },
    { position: 8, productId: "" },
  ]);
  const [savingTopPicks, setSavingTopPicks] = useState(false);
  const [browseContext, setBrowseContext] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const browseSearchInputRef = useRef(null);
  const productsPerPage = 15;
  const [homepageSections, setHomepageSections] = useState([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [newSectionType, setNewSectionType] = useState("products");
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionCategoryFilterIds, setNewSectionCategoryFilterIds] = useState([]);
  const [newSectionBrandFilterIds, setNewSectionBrandFilterIds] = useState([]);
  const [newSectionDiscountType, setNewSectionDiscountType] = useState("percentage");
  const [newSectionMinDiscount, setNewSectionMinDiscount] = useState("");
  const [newSectionMaxDiscount, setNewSectionMaxDiscount] = useState("");
  const [newSectionProducts, setNewSectionProducts] = useState([""]);
  const [newSectionCategories, setNewSectionCategories] = useState([""]);
  const [newSectionBrands, setNewSectionBrands] = useState([""]);
  const [newSectionCategorySearch, setNewSectionCategorySearch] = useState("");
  const [newSectionBrandSearch, setNewSectionBrandSearch] = useState("");
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [sectionSavingId, setSectionSavingId] = useState(null);
  const [sectionDeletingId, setSectionDeletingId] = useState(null);

  const adminUser = getStoredAdminUser();
  const canCreate = hasAdminPermission("homepage", "create", adminUser);
  // eslint-disable-next-line no-unused-vars
  const canEdit = hasAdminPermission("homepage", "edit", adminUser);
  // eslint-disable-next-line no-unused-vars
  const canDelete = hasAdminPermission("homepage", "delete", adminUser);

  const resetNewSectionForm = () => {
    setNewSectionTitle("");
    setNewSectionCategoryFilterIds([]);
    setNewSectionBrandFilterIds([]);
    setNewSectionDiscountType("percentage");
    setNewSectionMinDiscount("");
    setNewSectionMaxDiscount("");
    setNewSectionCategorySearch("");
    setNewSectionBrandSearch("");
    setNewSectionProducts([""]);
    setNewSectionCategories([""]);
    setNewSectionBrands([""]);
  };

  const handleNewSectionProductChange = (slotIndex, productId) => {
    setNewSectionProducts((prev) =>
      prev.map((value, index) => (index === slotIndex ? productId : value))
    );
  };

  const addNewSectionProductSlot = () => {
    // Only add a new empty slot if the last slot is not empty
    setNewSectionProducts((prev) => {
      const lastSlot = prev[prev.length - 1];
      if (lastSlot === "" || lastSlot === undefined) {
        // Last slot is already empty, don't add another
        return prev;
      }
      // Add new empty slot only if last one is filled
      return [...prev, ""];
    });
  };

  const removeNewSectionProductField = (index) => {
    setNewSectionProducts((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleNewSectionCategoryItemChange = (index, categoryId) => {
    setNewSectionCategories((prev) =>
      prev.map((value, idx) => (idx === index ? categoryId : value))
    );
  };

  const addNewSectionCategoryField = () => {
    setNewSectionCategories((prev) => [...prev, ""]);
  };

  const removeNewSectionCategoryField = (index) => {
    setNewSectionCategories((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleNewSectionBrandItemChange = (index, brandId) => {
    setNewSectionBrands((prev) =>
      prev.map((value, idx) => (idx === index ? brandId : value))
    );
  };

  const addNewSectionBrandField = () => {
    setNewSectionBrands((prev) => [...prev, ""]);
  };

  const removeNewSectionBrandField = (index) => {
    setNewSectionBrands((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleOpenAddSection = () => {
    setNewSectionType("products");
    resetNewSectionForm();
    setIsAddingSection(true);
  };

  const handleNewSectionCategoryFiltersChange = (event) => {
    const selected = Array.from(event.target.selectedOptions || [])
      .map((option) => option.value)
      .filter(Boolean);
    setNewSectionCategoryFilterIds(selected);
  };

  const handleNewSectionBrandFiltersChange = (event) => {
    const selected = Array.from(event.target.selectedOptions || [])
      .map((option) => option.value)
      .filter(Boolean);
    setNewSectionBrandFilterIds(selected);
  };

  const selectedCategoryNames = useMemo(() => {
    const names = newSectionCategoryFilterIds
      .map((categoryId) => allCategories.find((cat) => cat._id === categoryId)?.name)
      .filter(Boolean)
      .map(normalizeFilterValue);
    return Array.from(new Set(names));
  }, [allCategories, newSectionCategoryFilterIds]);

  const selectedBrandNames = useMemo(() => {
    const names = newSectionBrandFilterIds
      .map((brandId) => allBrands.find((brand) => brand._id === brandId)?.name)
      .filter(Boolean)
      .map(normalizeFilterValue);
    return Array.from(new Set(names));
  }, [allBrands, newSectionBrandFilterIds]);

  const filteredCategories = useMemo(() => {
    const term = newSectionCategorySearch.trim().toLowerCase();
    if (!term) return allCategories;
    return allCategories.filter((category) =>
      String(category.name || "").toLowerCase().includes(term)
    );
  }, [allCategories, newSectionCategorySearch]);

  const filteredBrands = useMemo(() => {
    const term = newSectionBrandSearch.trim().toLowerCase();
    if (!term) return allBrands;
    return allBrands.filter((brand) =>
      String(brand.name || "").toLowerCase().includes(term)
    );
  }, [allBrands, newSectionBrandSearch]);

  const filteredProductsForNewSection = useMemo(() => {
    if (!Array.isArray(allProducts) || allProducts.length === 0) return [];

    const categoryFilter = new Set(selectedCategoryNames);
    const brandFilter = new Set(selectedBrandNames);
    const minDiscount = newSectionMinDiscount.trim() === "" ? null : Number(newSectionMinDiscount);
    const maxDiscount = newSectionMaxDiscount.trim() === "" ? null : Number(newSectionMaxDiscount);
    const hasMin = minDiscount !== null && !Number.isNaN(minDiscount);
    const hasMax = maxDiscount !== null && !Number.isNaN(maxDiscount);

    return allProducts.filter((product) => {
      const productCategory = normalizeFilterValue(product.category);
      const productBrand = normalizeFilterValue(product.brand);
      const categoryOk = categoryFilter.size === 0 || categoryFilter.has(productCategory);
      const brandOk = brandFilter.size === 0 || brandFilter.has(productBrand);
      if (!categoryOk || !brandOk) return false;

      if (!hasMin && !hasMax) return true;

      const firstVariant = product?.variants?.[0] || null;
      const percentageDiscount = Number(product?.discount) || Number(firstVariant?.discount) || 0;
      const flatDiscount = Number(product?.flatDiscount) || Number(firstVariant?.flatDiscount) || 0;
      const discountValue = newSectionDiscountType === "flat" ? flatDiscount : percentageDiscount;

      if (hasMin && discountValue < minDiscount) return false;
      if (hasMax && discountValue > maxDiscount) return false;
      return true;
    });
  }, [
    allProducts,
    newSectionDiscountType,
    newSectionMaxDiscount,
    newSectionMinDiscount,
    selectedBrandNames,
    selectedCategoryNames,
  ]);

  const availableProductsForNewSection = useMemo(() => {
    const selectedProductIds = new Set(
      newSectionProducts.map((productId) => String(productId || "").trim()).filter(Boolean)
    );

    const selectedProducts = allProducts.filter((product) =>
      selectedProductIds.has(String(product?._id || "").trim())
    );

    return Array.from(
      new Map(
        [...selectedProducts, ...filteredProductsForNewSection].map((product) => [product._id, product])
      ).values()
    );
  }, [allProducts, filteredProductsForNewSection, newSectionProducts]);

  const getAvailableProductsForSlot = useCallback(
    (slotIndex) => {
      const selectedByOtherSlots = new Set(
        newSectionProducts
          .filter((productId, index) => index !== slotIndex)
          .map((productId) => String(productId || "").trim())
          .filter(Boolean)
      );

      return availableProductsForNewSection.filter((product) => {
        const productId = String(product?._id || "").trim();
        return !selectedByOtherSlots.has(productId);
      });
    },
    [availableProductsForNewSection, newSectionProducts]
  );

  const fetchHeroes = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/hero`);
      setHeroImages(data);
    } catch (error) {
      console.error("Failed to fetch hero images:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [
        brands,
        categoryList,
        brandLayout,
        categoryLayout,
        topPicksLayout,
        productsRes,
        sectionsRes,
      ] = await Promise.all([
        brandService.getAllBrands(),
        categoryService.getAllCategories(),
        axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/brands`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/categories`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/top-picks`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/products?limit=1000`),
        axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/sections`)
      ]);
      setAllBrands(brands);
      setAllCategories(categoryList);
      
      // Handle products - could be array or paginated object
      const productsArray = Array.isArray(productsRes.data) 
        ? productsRes.data 
        : (productsRes.data?.products || []);
      setAllProducts(productsArray);

      if (brandLayout.data && brandLayout.data.length > 0) {
        const newBrandLayout = [
          { slot: 1, brandId: "" },
          { slot: 2, brandId: "" },
          { slot: 3, brandId: "" },
          { slot: 4, brandId: "" },
        ];
        brandLayout.data.forEach(item => {
          if (item.slot >= 1 && item.slot <= 4) {
            newBrandLayout[item.slot - 1].brandId = item.brand?._id || "";
          }
        });
        setHomepageLayout(newBrandLayout);
      }

      if (categoryLayout.data && categoryLayout.data.length > 0) {
        const newCategoryLayout = [
          { slot: 1, categoryName: "" },
          { slot: 2, categoryName: "" },
          { slot: 3, categoryName: "" },
          { slot: 4, categoryName: "" },
        ];
        categoryLayout.data.forEach(item => {
          if (item.slot >= 1 && item.slot <= 4) {
            newCategoryLayout[item.slot - 1].categoryName = item.categoryName || "";
          }
        });
        setHomepageCategoryLayout(newCategoryLayout);
      }

      if (topPicksLayout.data && topPicksLayout.data.length > 0) {
        const newTopPicksLayout = [
          { position: 1, productId: "" },
          { position: 2, productId: "" },
          { position: 3, productId: "" },
          { position: 4, productId: "" },
          { position: 5, productId: "" },
          { position: 6, productId: "" },
          { position: 7, productId: "" },
          { position: 8, productId: "" },
        ];
        topPicksLayout.data.forEach(item => {
          if (item.position >= 1 && item.position <= 8) {
            newTopPicksLayout[item.position - 1].productId = item.product?._id || "";
          }
        });
        setTopPicksLayout(newTopPicksLayout);
      }
      if (sectionsRes?.data && Array.isArray(sectionsRes.data)) {
        setHomepageSections(sectionsRes.data.map(normalizeSectionData));
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
    }
  }, []);

  useEffect(() => {
    fetchHeroes();
    fetchInitialData();
  }, [fetchHeroes, fetchInitialData]);

  useEffect(() => {
    if (!browseContext?.type || typeof window === "undefined") return;
    if (window.innerWidth > 480) return;

    const focusTimer = window.setTimeout(() => {
      browseSearchInputRef.current?.focus();
    }, 150);

    return () => window.clearTimeout(focusTimer);
  }, [browseContext]);

  const handleSlotChange = (slotIndex, brandId) => {
    const newLayout = [...homepageLayout];
    newLayout[slotIndex].brandId = brandId;
    setHomepageLayout(newLayout);
  };

  const handleCategorySlotChange = (slotIndex, categoryName) => {
    const newLayout = [...homepageCategoryLayout];
    newLayout[slotIndex].categoryName = categoryName;
    setHomepageCategoryLayout(newLayout);
  };

  const handleTopPicksPositionChange = (positionIndex, productId) => {
    const newLayout = [...topPicksLayout];
    newLayout[positionIndex].productId = productId;
    setTopPicksLayout(newLayout);
  };

  const handleAddProductToTopPicks = (productId) => {
    // Find the first empty position
    const emptyIndex = topPicksLayout.findIndex(item => !item.productId);
    if (emptyIndex !== -1) {
      handleTopPicksPositionChange(emptyIndex, productId);
    }
  };

  const handleRemoveProductFromTopPicks = (positionIndex) => {
    const newLayout = [...topPicksLayout];
    newLayout[positionIndex].productId = "";
    
    // Pack products to the left so no gaps exist
    const packedIds = newLayout.map(item => item.productId).filter(id => id !== "");
    const finalLayout = newLayout.map((item, i) => ({
      ...item,
      productId: packedIds[i] || ""
    }));
    
    setTopPicksLayout(finalLayout);
  };

  const moveProductInTopPicks = (positionIndex, direction) => {
    const newLayout = [...topPicksLayout];
    if (direction === "left" && positionIndex > 0) {
      const temp = newLayout[positionIndex].productId;
      newLayout[positionIndex].productId = newLayout[positionIndex - 1].productId;
      newLayout[positionIndex - 1].productId = temp;
      setTopPicksLayout(newLayout);
    } else if (direction === "right" && positionIndex < newLayout.length - 1 && newLayout[positionIndex + 1].productId) {
      const temp = newLayout[positionIndex].productId;
      newLayout[positionIndex].productId = newLayout[positionIndex + 1].productId;
      newLayout[positionIndex + 1].productId = temp;
      setTopPicksLayout(newLayout);
    }
  };

  const toggleTopPicksBrowser = () => {
    setCurrentPage(1);
    setBrowseContext((prev) =>
      prev?.type === "top-picks" ? null : { type: "top-picks" }
    );
  };

  const openSectionProductBrowser = (sectionId, slotIndex) => {
    setCurrentPage(1);
    setBrowseContext({ type: "section", sectionId, slotIndex });
  };

  const handleProductSelectionFromBrowser = (product) => {
    if (!browseContext || !product) return;
    if (browseContext.type === "top-picks") {
      handleAddProductToTopPicks(product._id);
      return;
    }
    if (browseContext.type === "section") {
      handleAddProductToSection(browseContext.sectionId, browseContext.slotIndex, product);
      setBrowseContext(null);
    }
  };

  const isProductInSection = (sectionId, productId) => {
    const section = homepageSections.find((item) => item._id === sectionId);
    if (!section) return false;
    return section.products.some((p) => (p && (p._id || p) === productId));
  };

  const handleAddProductToSection = (sectionId, slotIndex, product) => {
    setHomepageSections((prev) =>
      prev.map((section) => {
        if (section._id !== sectionId) return section;
        const updatedProducts = (section.products || []).filter(Boolean);
        if (slotIndex >= updatedProducts.length) {
          updatedProducts.push(product);
        } else {
          updatedProducts[slotIndex] = product;
        }
        return { ...section, products: updatedProducts };
      })
    );
  };

  const handleRemoveProductFromSection = (sectionId, slotIndex) => {
    setHomepageSections((prev) =>
      prev.map((section) => {
        if (section._id !== sectionId) return section;
        const updatedProducts = [...section.products];
        if (slotIndex >= 0 && slotIndex < updatedProducts.length) updatedProducts.splice(slotIndex, 1);
        return { ...section, products: updatedProducts };
      })
    );
  };

  const handleSectionTitleChange = (sectionId, value) => {
    setHomepageSections((prev) =>
      prev.map((section) => (section._id === sectionId ? { ...section, title: value } : section))
    );
  };

  const handleCreateSection = async () => {
    if (!newSectionTitle.trim()) {
      alert("Please enter a section title");
      return;
    }

    const payload = {
      title: newSectionTitle.trim(),
      displayOrder: homepageSections.length + 1,
      type: newSectionType,
    };

    if (newSectionType === "products") {
      const productsPayload = newSectionProducts.filter(Boolean);
      if (productsPayload.length === 0) {
        alert("Add at least one product to this section");
        return;
      }
      payload.products = productsPayload;
    } else if (newSectionType === "categories") {
      const categoryPayload = newSectionCategories.filter(Boolean);
      if (categoryPayload.length === 0) {
        alert("Add at least one category to this section");
        return;
      }
      payload.categories = categoryPayload;
    } else {
      const brandPayload = newSectionBrands.filter(Boolean);
      if (brandPayload.length === 0) {
        alert("Add at least one brand to this section");
        return;
      }
      payload.brands = brandPayload;
    }

    setSectionsLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      const { data } = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/homepage/sections`,
        payload,
        config
      );
      setHomepageSections((prev) => [...prev, normalizeSectionData(data)]);
      resetNewSectionForm();
      setNewSectionType("products");
      setIsAddingSection(false);
    } catch (error) {
      console.error("Failed to create section:", error);
      alert("Failed to create section");
    } finally {
      setSectionsLoading(false);
    }
  };

  const handleSaveSection = async (section) => {
    if (!section?._id) return;
    setSectionSavingId(section._id);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      const sectionType = section.type || "products";
      const payload = {
        title: section.title,
        displayOrder: section.displayOrder || 0,
        type: sectionType,
      };

      if (sectionType === "products") {
        payload.products = (section.products || [])
          .map((product) => (product ? (product._id || product) : null))
          .filter(Boolean);
        payload.categoryId = null;
        payload.brandId = null;
      } else if (sectionType === "categories") {
        payload.categories = (section.categories || [])
          .map((item) => (item ? (item._id || item) : null))
          .filter(Boolean);
      } else {
        payload.brands = (section.brands || [])
          .map((item) => (item ? (item._id || item) : null))
          .filter(Boolean);
      }
      const { data } = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/homepage/sections/${section._id}`,
        payload,
        config
      );
      setHomepageSections((prev) =>
        prev.map((item) => (item._id === data._id ? normalizeSectionData(data) : item))
      );
      alert("Section saved successfully");
    } catch (error) {
      console.error("Failed to save section:", error);
      alert("Failed to save section");
    } finally {
      setSectionSavingId(null);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!window.confirm("Delete this section?")) return;
    setSectionDeletingId(sectionId);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/api/homepage/sections/${sectionId}`,
        config
      );
      setHomepageSections((prev) => prev.filter((section) => section._id !== sectionId));
    } catch (error) {
      console.error("Failed to delete section:", error);
      alert("Failed to delete section");
    } finally {
      setSectionDeletingId(null);
    }
  };

  const getFilteredProducts = () => {
    let filtered = allProducts;

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getPaginatedProducts = () => {
    const filtered = getFilteredProducts();
    const startIndex = (currentPage - 1) * productsPerPage;
    return {
      products: filtered.slice(startIndex, startIndex + productsPerPage),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / productsPerPage),
    };
  };

  const isProductAdded = (productId) => {
    return topPicksLayout.some(item => item.productId === productId);
  };

  const saveBrandLayout = async () => {
    try {
      setSavingLayout(true);
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.post(`${process.env.REACT_APP_API_URL}/api/homepage/brands`, { layout: homepageLayout }, config);
      alert("Homepage brand layout saved successfully!");
    } catch (error) {
      console.error("Failed to save layout:", error);
      alert("Failed to save layout");
    } finally {
      setSavingLayout(false);
    }
  };

  const saveCategoryLayout = async () => {
    try {
      setSavingCategoryLayout(true);
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.post(`${process.env.REACT_APP_API_URL}/api/homepage/categories`, { layout: homepageCategoryLayout }, config);
      alert("Homepage category layout saved successfully!");
    } catch (error) {
      console.error("Failed to save category layout:", error);
      alert("Failed to save category layout");
    } finally {
      setSavingCategoryLayout(false);
    }
  };

  const saveTopPicksLayout = async () => {
    try {
      setSavingTopPicks(true);
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.post(`${process.env.REACT_APP_API_URL}/api/homepage/top-picks`, { layout: topPicksLayout }, config);
      alert("Top Picks layout saved successfully!");
    } catch (error) {
      console.error("Failed to save top picks layout:", error);
      alert("Failed to save top picks layout");
    } finally {
      setSavingTopPicks(false);
    }
  };



  const toggleUploadForm = () => {
    setShowUploadForm(!showUploadForm);
    setEditingId(null);
    setShowEditModal(false);
    if (showUploadForm || editingId) {
      // Reset form
      setHeadline("");
      setSubheadline("");
      setLink("");
      setDisplayOrder(0);
      setSelectedFile(null);
      setFileName("No file chosen");
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setFileName(e.target.files[0].name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile && !editingId) {
      alert("Please select a file first");
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      if (selectedFile) formData.append("image", selectedFile);
      formData.append("title", headline);
      formData.append("subtitle", subheadline);
      formData.append("link", link);
      formData.append("displayOrder", displayOrder);

      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };

      if (editingId) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/homepage/hero/${editingId}`, formData, config);
        alert("Hero image updated successfully!");
        setShowEditModal(false);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/homepage/hero`, formData, config);
        alert("Hero image uploaded successfully!");
      }

      toggleUploadForm();
      fetchHeroes();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(error.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (hero) => {
    setEditingId(hero._id);
    setHeadline(hero.title || "");
    setSubheadline(hero.subtitle || "");
    setLink(hero.link || "");
    setDisplayOrder(hero.displayOrder || 0);
    setFileName("Keep existing image");
    setShowEditModal(true);
  };

  const handleOrderUpdate = async (id, newOrder) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/homepage/hero/${id}`, { displayOrder: newOrder }, config);
      // Update local state for immediate feedback
      setHeroImages(prev => prev.map(h => h._id === id ? { ...h, displayOrder: newOrder } : h));
    } catch (error) {
      console.error("Order update failed:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this hero image?")) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/homepage/hero/${id}`, config);
      alert("Hero image deleted");
      fetchHeroes();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Delete failed");
    }
  };

  const handleStatusUpdate = async (id, currentStatus) => {
    const newStatus = currentStatus === "Live" ? "Hidden" : "Live";
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };
      await axios.put(`${process.env.REACT_APP_API_URL}/api/homepage/hero/${id}`, { status: newStatus }, config);
      fetchHeroes();
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  if (loading && heroImages.length === 0) {
    return <div className="admin-homepage"><p>Loading...</p></div>;
  }

  const paginatedProducts = getPaginatedProducts();
  const activeBrowseSection =
    browseContext?.type === "section"
      ? homepageSections.find((item) => item._id === browseContext.sectionId)
      : null;

  return (
    <div className="admin-homepage">
      <div className="homepage-header">
        <h1>Homepage Management</h1>
        <p>Manage hero carousel, featured brands, and categories</p>
      </div>

      <div className="management-card">
        <div className="card-header-main">
          <div className="header-info-container">
            <div className="header-icon">
              <i className="fa fa-image" aria-hidden="true" />
            </div>
            <div className="header-text">
              <h2>Hero Carousel</h2>
              <p>Manage homepage banner images</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-value">{heroImages.filter(h => h.status === 'Live').length}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{heroImages.length}</span>
              <span className="stat-label">Total</span>
            </div>
      </div>
    </div>

        <div className="card-content">
          <div className="add-btn-container">
            {canCreate ? (
              <button className="btn-add-hero" onClick={toggleUploadForm}>
                <i className={`fa ${showUploadForm ? 'fa-times' : 'fa-plus'}`} aria-hidden="true" />
                {showUploadForm ? 'Close Upload Form' : 'Add New Hero Image'}
              </button>
            ) : (
              <p className="text-muted">You don't have permission to add hero images.</p>
            )}
          </div>

          {showUploadForm && (
            <div className="upload-form">
              <div className="form-group-homepage">
                <label className="required-field">Hero Image</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    id="hero-file-input"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  <button
                    className="btn-choose-file"
                    onClick={() => document.getElementById('hero-file-input').click()}
                  >
                    Choose File
                  </button>
                  <span className="file-name-display">{fileName}</span>
                </div>
                <div className="upload-hint">
                  <i className="fa fa-info-circle" aria-hidden="true" />
                  Recommended: 1920×600px • Max 5MB • JPG, PNG, or WebP
                </div>
              </div>

              <div className="form-row-homepage">
                <div className="form-group-homepage">
                  <label>Headline</label>
                  <input
                    type="text"
                    className="form-input-homepage"
                    placeholder="e.g., Summer Sale 2026"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                  />
                </div>
                <div className="form-group-homepage">
                  <label>Subheadline</label>
                  <input
                    type="text"
                    className="form-input-homepage"
                    placeholder="e.g., Up to 70% off on all items"
                    value={subheadline}
                    onChange={(e) => setSubheadline(e.target.value)}
                  />
                </div>
                <div className="form-group-homepage">
                  <label>CTA Link (Optional)</label>
                  <input
                    type="text"
                    className="form-input-homepage"
                    placeholder="e.g., /product/123 or https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-actions-homepage">
                <button
                  className="btn-primary-homepage"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  <i className={`fa ${uploading ? 'fa-spinner fa-spin' : 'fa-upload'}`} aria-hidden="true" />
                  {uploading ? (editingId ? 'Updating...' : 'Uploading...') : (editingId ? 'Update Hero Image' : 'Upload Image')}
                </button>
                <button className="btn-secondary-homepage" onClick={toggleUploadForm}>Cancel</button>
              </div>
            </div>
          )}

          <div className="hero-list">
            {heroImages.length === 0 ? (
              <div className="empty-state-container">
                <div className="empty-icon-wrapper">
                  <i className="fa fa-picture-o" aria-hidden="true" />
                </div>
                <h3>No hero images yet</h3>
                <p>Start building an engaging homepage by uploading your first hero banner image.</p>
                {canCreate && !showUploadForm && (
                  <button className="btn-add-first-hero" onClick={toggleUploadForm}>
                    <i className="fa fa-plus" aria-hidden="true" />
                    Add First Hero Image
                  </button>
                )}
              </div>
            ) : (
              heroImages.map((hero) => (
                <div key={hero._id} className="hero-item-card">
                  <div className="hero-image-preview">
                    <img src={hero.imageUrl} alt={hero.title} />
                    <div className="position-badge">
                      <i className="fa fa-arrows-v" aria-hidden="true" />
                      Position {hero.displayOrder}
                    </div>
                  </div>

                  <div className="hero-details">
                    <div className="hero-info-header">
                      <div>
                        <h3>{hero.title || "Untitled"}</h3>
                        {hero.subtitle && <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>{hero.subtitle}</p>}
                        <div className="hero-date">
                          <i className="fa fa-calendar-o" aria-hidden="true" />
                          Added {new Date(hero.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`status-badge-live ${hero.status !== 'Live' ? 'hidden-status' : ''}`}
                        style={hero.status !== 'Live' ? { background: '#fef2f2', color: '#dc2626' } : {}}>
                        <span className="dot" style={hero.status !== 'Live' ? { background: '#dc2626' } : {}} />
                        {hero.status}
                      </div>
                    </div>

                    <div className="hero-controls">
                      <div className="order-input-group">
                        <label>Display Order:</label>
                        <input
                          type="number"
                          className="order-input"
                          value={hero.displayOrder}
                          onChange={(e) => handleOrderUpdate(hero._id, e.target.value)}
                        />
                      </div>

                      <div className="hero-actions">
                        {canEdit && (
                          <>
                            <button className="btn-action btn-edit-homepage" onClick={() => handleEdit(hero)}>
                              <i className="fa fa-pencil-square-o" aria-hidden="true" />
                              Edit
                            </button>
                            <button
                              className="btn-action btn-hide-homepage"
                              onClick={() => handleStatusUpdate(hero._id, hero.status)}
                            >
                              <i className={`fa ${hero.status === 'Live' ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
                              {hero.status === 'Live' ? 'Hide' : 'Show'}
                            </button>
                          </>
                        )}
                        {canDelete && (
                          <button
                            className="btn-action btn-delete-homepage"
                            onClick={() => handleDelete(hero._id)}
                          >
                            <i className="fa fa-trash-o" aria-hidden="true" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Homepage Brands Section */}
      <div className="management-card">
        <div className="card-header-white">
          <div>
            <h2>Homepage Brands</h2>
            <div className="header-subtitle">
              {homepageLayout.filter(s => s.brandId).length} of 4 slots filled
            </div>
          </div>
          <button
            className="btn-save-layout"
            onClick={saveBrandLayout}
            disabled={savingLayout}
          >
            {savingLayout && <i className="fa fa-spinner fa-spin" aria-hidden="true" />}
            {savingLayout ? ' Saving...' : ' Save Layout'}
          </button>
        </div>

        <div className="card-content">
          <div className="slot-grid">
            {homepageLayout.map((slot, index) => {
              const selectedBrand = allBrands.find(b => b._id === slot.brandId);
              return (
                <div key={slot.slot} className="slot-card">
                  <div className="slot-header-flex">
                    <span className="slot-header">Slot {slot.slot}</span>
                    {slot.brandId && (
                      <button className="btn-remove-slot" onClick={() => handleSlotChange(index, "")} title="clear slot">Remove</button>
                    )}
                  </div>

                  <div className="slot-container">
                    {selectedBrand ? (
                      <div className="slot-brand-preview">
                        <img src={selectedBrand.logo} alt={selectedBrand.name} />
                        <span className="slot-brand-name">{selectedBrand.name}</span>
                      </div>
                    ) : (
                      <div className="slot-placeholder">
                        <i className="fa fa-plus" aria-hidden="true" />
                        <span>Empty</span>
                      </div>
                    )}
                  </div>

                  <select
                    className="slot-select"
                    value={slot.brandId}
                    onChange={(e) => handleSlotChange(index, e.target.value)}
                  >
                    <option value="">Select item...</option>
                    {allBrands.map(brand => (
                      <option key={brand._id} value={brand._id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Homepage Categories Section */}
      <div className="management-card">
        <div className="card-header-white">
          <div>
            <h2>Homepage Categories</h2>
            <div className="header-subtitle">
              {homepageCategoryLayout.filter(s => s.categoryName).length} of 4 slots filled
            </div>
          </div>
          <button
            className="btn-save-layout"
            onClick={saveCategoryLayout}
            disabled={savingCategoryLayout}
          >
            {savingCategoryLayout && <i className="fa fa-spinner fa-spin" aria-hidden="true" />}
            {savingCategoryLayout ? ' Saving...' : ' Save Layout'}
          </button>
        </div>

        <div className="card-content">
          <div className="slot-grid">
            {homepageCategoryLayout.map((slot, index) => {
              const selectedCategory = allCategories.find(c => c.name === slot.categoryName);
              return (
                <div key={slot.slot} className="slot-card">
                  <div className="slot-header-flex">
                    <span className="slot-header">Slot {slot.slot}</span>
                    {slot.categoryName && (
                      <button className="btn-remove-slot" onClick={() => handleCategorySlotChange(index, "")} title="clear slot">Remove</button>
                    )}
                  </div>

                  <div className="category-badge-wrapper">
                    {selectedCategory ? (
                      <div className="category-badge-admin">
                        <span className="cat-name">{selectedCategory.name}</span>
                        <span className="cat-slug">{selectedCategory.name.toLowerCase()}</span>
                      </div>
                    ) : (
                      <div className="slot-placeholder">
                        <i className="fa fa-plus" aria-hidden="true" />
                        <span>Empty</span>
                      </div>
                    )}
                  </div>

                  <select
                    className="slot-select"
                    value={slot.categoryName}
                    onChange={(e) => handleCategorySlotChange(index, e.target.value)}
                  >
                    <option value="">Select item...</option>
                    {allCategories.map(cat => (
                      <option key={cat._id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top Picks for Homepage Section */}
      <div className="management-card">
        <div className="card-header-white">
          <div>
            <h2>Top Picks for Homepage</h2>
            <div className="header-subtitle">
              {topPicksLayout.filter(s => s.productId).length} of 8 products selected • Drag to reorder
            </div>
          </div>
          <button
            className="btn-save-layout btn-save-top-picks"
            onClick={saveTopPicksLayout}
            disabled={savingTopPicks}
          >
            {savingTopPicks && <i className="fa fa-spinner fa-spin" aria-hidden="true" />}
            {savingTopPicks ? ' Saving...' : ' Save Top Picks'}
          </button>
        </div>

        <div className="card-content">
          {/* Browse Products Section */}
          <div className="top-picks-browse-section">
            <div className="browse-header">
              <div className="browse-title">
                <i className="fa fa-search" aria-hidden="true" />
                <span>Add Products</span>
              </div>
              <input
                ref={browseSearchInputRef}
                type="search"
                className="browse-search-input"
                placeholder="Search products by name..."
                value={searchQuery}
                autoFocus={Boolean(browseContext?.type)}
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                onClick={(e) => e.currentTarget.focus()}
                onTouchStart={(e) => e.currentTarget.focus()}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="browse-toggle">
              <button
                className="browse-toggle-btn"
                onClick={toggleTopPicksBrowser}
              >
                <i className={`fa fa-th-large`} aria-hidden="true" />
                <span>{browseContext?.type === "top-picks" ? "Hide" : "Browse All"} Products</span>
                <i className={`fa fa-chevron-${browseContext?.type === "top-picks" ? "up" : "down"}`} aria-hidden="true" />
              </button>
            </div>

            {(browseContext?.type === "top-picks" || browseContext?.type === "section") && (
              <div className="browse-products-list">
                <div className="browse-context-row">
                  {browseContext.type === "section" ? (
                    <>
                      <span>
                        Pick product for "{activeBrowseSection?.title || "section"}"
                        {activeBrowseSection?.category?.name ? ` (category: ${activeBrowseSection.category.name})` : ""}
                      </span>
                      <button
                        className="browse-context-close"
                        type="button"
                        onClick={() => setBrowseContext(null)}
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <span>Top Picks browser</span>
                  )}
                </div>

                <div className="products-available-info">
                  {paginatedProducts.total} products available
                  {topPicksLayout.filter((s) => s.productId).length > 0 && (
                    <span> • {topPicksLayout.filter((s) => s.productId).length} added</span>
                  )}
                </div>

                <div className="products-items-list">
                  {paginatedProducts.products.length > 0 ? (
                    paginatedProducts.products.map((product) => {
                      const displayPrice = resolveProductDisplayPrice(product);
                      const isAlreadySelected =
                        browseContext.type === "section"
                          ? isProductInSection(browseContext.sectionId, product._id)
                          : isProductAdded(product._id);
                      const buttonLabel =
                        browseContext.type === "section"
                          ? isAlreadySelected
                            ? "Selected"
                            : "Select"
                          : isAlreadySelected
                            ? "Added"
                            : "Add";

                      return (
                        <div key={product._id} className="product-browse-item">
                          <div className="product-browse-image">
                            <img
                              src={product.image}
                              alt={product.title}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/80?text=No+Image";
                              }}
                            />
                          </div>
                          <div className="product-browse-info">
                            <h4 className="product-browse-name">{product.title}</h4>
                            <p className="product-browse-price">{`\u20B9${displayPrice}`}</p>
                          </div>
                          <button
                            className={`btn-add-to-picks ${isAlreadySelected ? "btn-added" : ""}`}
                            onClick={() => !isAlreadySelected && handleProductSelectionFromBrowser(product)}
                            disabled={isAlreadySelected}
                            title={
                              browseContext.type === "section"
                                ? "Already added to this section"
                                : "Already added to Top Picks"
                            }
                          >
                            {isAlreadySelected ? (
                              browseContext.type === "section" ? (
                                "Selected"
                              ) : (
                                <>
                                  <i className="fa fa-check" aria-hidden="true" />
                                  Added
                                </>
                              )
                            ) : (
                              buttonLabel
                            )}
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <div className="no-products-browse">No products available</div>
                  )}
                </div>

                {paginatedProducts.totalPages > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <i className="fa fa-chevron-left" aria-hidden="true" />
                    </button>
                      <span className="pagination-info">
                      Page {currentPage} of {paginatedProducts.totalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      disabled={currentPage === paginatedProducts.totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <i className="fa fa-chevron-right" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Products Slots */}
          <div className="top-picks-selected-section">
            <div className="selected-slots-grid">
              {topPicksLayout.map((position, index) => {
                const selectedProduct = allProducts.find(p => p._id === position.productId);
                if (!selectedProduct) return null;
                const selectedProductPrice = resolveProductDisplayPrice(selectedProduct);
                
                return (
                  <div key={position.position} className="selected-slot-card">
                    <div className="slot-number-badge">{position.position}</div>
                    
                    <div className="selected-product-display">
                      <div className="selected-product-image">
                        <img 
                          src={selectedProduct.image} 
                          alt={selectedProduct.title}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150?text=No+Image";
                          }}
                        />
                      </div>
                      <div className="selected-product-details">
                        <h4>{selectedProduct.title}</h4>
                        <p className="price">{`\u20B9${selectedProductPrice}`}</p>
                      </div>
                      <button
                        className="btn-remove-pick"
                        onClick={() => handleRemoveProductFromTopPicks(index)}
                        title="Remove product"
                      >
                        ×
                      </button>
                    </div>

                    <div className="slot-move-controls">
                      <button
                        className="move-btn move-left"
                        disabled={index === 0}
                        onClick={() => moveProductInTopPicks(index, "left")}
                        title="Move Left"
                      >
                        ← Move Left
                      </button>
                      <button
                        className="move-btn move-right"
                        disabled={index === topPicksLayout.length - 1 || !topPicksLayout[index + 1].productId}
                        onClick={() => moveProductInTopPicks(index, "right")}
                        title="Move Right"
                      >
                        Move Right →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
      </div>
    </div>

    {/* Homepage Sections */}
    <div className="management-card">
      <div className="card-header-white">
        <div>
          <h2>Homepage Sections</h2>
          <div className="header-subtitle">
            {homepageSections.length} section{homepageSections.length === 1 ? "" : "s"} configured
          </div>
        </div>
        {canEdit ? (
          <button
            className="btn-save-layout"
            onClick={handleOpenAddSection}
          >
            <i className="fa fa-plus" aria-hidden="true" />
            Add Section
          </button>
        ) : (
          <p className="text-muted">You need edit permission to add sections.</p>
        )}
      </div>

      <div className="card-content">
        {isAddingSection && (
          <div className="section-form">
            <div className="form-group-homepage">
              <label>Section Type</label>
              <div className="section-type-options">
                {SECTION_TYPES.map((type) => (
                  <label
                    key={type.value}
                    className={`section-type-option ${newSectionType === type.value ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="section-type"
                      value={type.value}
                      checked={newSectionType === type.value}
                      onChange={(e) => setNewSectionType(e.target.value)}
                    />
                    <span>{type.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group-homepage">
              <label>Section Title</label>
              <input
                type="text"
                className="form-input-homepage"
                placeholder="e.g., Trending Now"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
              />
            </div>

            {newSectionType === "products" && (
              <>
                <div className="section-filter-row">
                  <div className="form-group-homepage">
                    <div className="filter-label-row">
                      <label>Categories (Filter)</label>
                      <input
                        type="search"
                        className="filter-search-input"
                        placeholder="Search categories"
                        value={newSectionCategorySearch}
                        onChange={(e) => setNewSectionCategorySearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="form-input-homepage form-input-homepage--multiselect"
                      multiple
                      value={newSectionCategoryFilterIds}
                      onChange={handleNewSectionCategoryFiltersChange}
                    >
                      {filteredCategories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <div className="field-hint">Hold Ctrl to select multiple categories.</div>
                  </div>

                  <div className="form-group-homepage">
                    <div className="filter-label-row">
                      <label>Brands (Filter)</label>
                      <input
                        type="search"
                        className="filter-search-input"
                        placeholder="Search brands"
                        value={newSectionBrandSearch}
                        onChange={(e) => setNewSectionBrandSearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="form-input-homepage form-input-homepage--multiselect"
                      multiple
                      value={newSectionBrandFilterIds}
                      onChange={handleNewSectionBrandFiltersChange}
                    >
                      {filteredBrands.map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                    <div className="field-hint">Hold Ctrl to select multiple brands.</div>
                  </div>

                </div>

                <div className="discount-filters-row">
                  <div className="form-group-homepage">
                    <label>Discount Type</label>
                    <select
                      className="form-input-homepage"
                      value={newSectionDiscountType}
                      onChange={(e) => setNewSectionDiscountType(e.target.value)}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat (₹)</option>
                    </select>
                  </div>
                  <div className="form-group-homepage">
                    <label>Minimum Discount (optional)</label>
                    <input
                      type="number"
                      className="form-input-homepage"
                      value={newSectionMinDiscount}
                      onChange={(e) => setNewSectionMinDiscount(e.target.value)}
                      placeholder={newSectionDiscountType === "flat" ? "e.g., 100" : "e.g., 10"}
                      min="0"
                    />
                  </div>
                  <div className="form-group-homepage">
                    <label>Maximum Discount (optional)</label>
                    <input
                      type="number"
                      className="form-input-homepage"
                      value={newSectionMaxDiscount}
                      onChange={(e) => setNewSectionMaxDiscount(e.target.value)}
                      placeholder={newSectionDiscountType === "flat" ? "e.g., 500" : "e.g., 50"}
                      min="0"
                    />
                  </div>
                </div>
                <div className="section-subtitle">
                  Use the filters above to narrow down products. Only the title and products will be saved for this section.
                </div>
                <div className="section-slots-grid">
                  {newSectionProducts.map((productId, slotIndex) => {
                    const selectedProduct = allProducts.find((product) => product._id === productId);
                    const selectedProductPrice = selectedProduct
                      ? resolveProductDisplayPrice(selectedProduct)
                      : null;
                    const productsForCurrentSlot = getAvailableProductsForSlot(slotIndex);
                    
                    return (
                      <div
                        key={`new-slot-${slotIndex}`}
                        className={`section-slot-card ${selectedProduct ? "filled" : "empty"}`}
                      >
                        <div className="slot-header-flex">
                          <span className="slot-header">Product {slotIndex + 1}</span>
                        </div>
                        <div className="section-slot-image">
                          {selectedProduct ? (
                            <img
                              src={
                                selectedProduct.image ||
                                selectedProduct.variants?.[0]?.images?.[0] ||
                                selectedProduct.variants?.[0]?.image ||
                                "https://via.placeholder.com/120?text=No+Image"
                              }
                              alt={selectedProduct.title}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/120?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="slot-placeholder">
                              <i className="fa fa-plus" aria-hidden="true" />
                              <span>Add Product</span>
                            </div>
                          )}
                        </div>
                        {selectedProduct && (
                          <div className="section-slot-info">
                            <h4>{selectedProduct.title}</h4>
                            {selectedProductPrice !== null && <p>₹{selectedProductPrice}</p>}
                          </div>
                        )}
                        <select
                          className="section-slot-select"
                          value={productId}
                          onChange={(e) => {
                            handleNewSectionProductChange(slotIndex, e.target.value);
                          }}
                          disabled={productsForCurrentSlot.length === 0}
                        >
                          <option value="">
                            {productsForCurrentSlot.length === 0
                              ? "No products found"
                              : "Select item..."}
                          </option>
                          {productsForCurrentSlot.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.title}
                            </option>
                          ))}
                        </select>
                        <div className="section-slot-actions">
                          {slotIndex > 0 && (
                            <button
                              type="button"
                              className="btn-link-small"
                              onClick={() => removeNewSectionProductField(slotIndex)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="section-form-secondary-actions">
                  <button
                    type="button"
                    className="btn-secondary-homepage"
                    onClick={addNewSectionProductSlot}
                  >
                    Add More Products
                  </button>
                </div>
              </>
            )}

            {newSectionType === "categories" && (
              <>
                <div className="section-subtitle">
                  Select categories for this section. Each slot stores one category with its image.
                </div>
                <div className="section-slots-grid">
                  {newSectionCategories.map((categoryId, slotIndex) => {
                    const category = allCategories.find((item) => item._id === categoryId);
                    return (
                      <div
                        key={`category-slot-${slotIndex}`}
                        className={`section-slot-card ${category ? "filled" : "empty"}`}
                      >
                        <div className="slot-header-flex">
                          <span className="slot-header">Category {slotIndex + 1}</span>
                        </div>
                        <div className="section-slot-image">
                          {category?.image ? (
                            <img
                              src={category.image}
                              alt={category.name}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/120?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="slot-placeholder">
                              <i className="fa fa-image" aria-hidden="true" />
                              <span>No Image</span>
                            </div>
                          )}
                        </div>
                        <select
                          className="section-slot-select"
                          value={categoryId}
                          onChange={(e) => handleNewSectionCategoryItemChange(slotIndex, e.target.value)}
                        >
                          <option value="">Choose category</option>
                          {allCategories.map((cat) => (
                            <option key={cat._id} value={cat._id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                        <div className="section-slot-actions">
                          {slotIndex > 0 && (
                            <button
                              type="button"
                              className="btn-link-small"
                              onClick={() => removeNewSectionCategoryField(slotIndex)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="section-form-secondary-actions">
                  <button
                    type="button"
                    className="btn-secondary-homepage"
                    onClick={addNewSectionCategoryField}
                  >
                    Add Another Category
                  </button>
                </div>
              </>
            )}
            {newSectionType === "brands" && (
              <>
                <div className="section-subtitle">
                  Spotlight brands by assigning each slot to one brand with its logo.
                </div>
                <div className="section-slots-grid">
                  {newSectionBrands.map((brandId, slotIndex) => {
                    const brand = allBrands.find((item) => item._id === brandId);
                    return (
                      <div
                        key={`brand-slot-${slotIndex}`}
                        className={`section-slot-card section-slot-card--brand ${brand ? "filled" : "empty"}`}
                      >
                        <div className="slot-header-flex">
                          <span className="slot-header">Brand {slotIndex + 1}</span>
                        </div>
                        <div className="section-slot-image">
                          {brand?.logo ? (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/120?text=No+Logo";
                              }}
                            />
                          ) : (
                            <div className="slot-placeholder">
                              <i className="fa fa-briefcase" aria-hidden="true" />
                              <span>No Logo</span>
                            </div>
                          )}
                        </div>
                        <select
                          className="section-slot-select"
                          value={brandId}
                          onChange={(e) => handleNewSectionBrandItemChange(slotIndex, e.target.value)}
                        >
                          <option value="">Choose brand</option>
                          {allBrands.map((item) => (
                            <option key={item._id} value={item._id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <div className="section-slot-actions">
                          {slotIndex > 0 && (
                            <button
                              type="button"
                              className="btn-link-small"
                              onClick={() => removeNewSectionBrandField(slotIndex)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="section-form-secondary-actions">
                  <button
                    type="button"
                    className="btn-secondary-homepage"
                    onClick={addNewSectionBrandField}
                  >
                    Add Another Brand
                  </button>
                </div>
              </>
            )}
            <div className="form-actions-homepage">
              <button
                className="btn-primary-homepage"
                onClick={handleCreateSection}
                disabled={sectionsLoading}
              >
                {sectionsLoading ? (
                  <>
                    <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Creating...
                  </>
                ) : (
                  "Create Section"
                )}
              </button>
              <button
                className="btn-secondary-homepage"
                onClick={() => {
                  setIsAddingSection(false);
                  resetNewSectionForm();
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {homepageSections.length === 0 ? (
          <div className="empty-state-container">
            <div className="empty-icon-wrapper">
              <i className="fa fa-layer-group" aria-hidden="true" />
            </div>
            <h3>No sections yet</h3>
            <p>Create meaningful blocks by adding curated products below.</p>
          </div>
        ) : (
          <div className="sections-grid">
            {homepageSections.map((section) => (
              <div key={section._id} className="custom-section-card">
                <div className="section-header">
                  <div className="section-header-left">
                    <div className="title-type-row">
                      <input
                        type="text"
                        className="form-input-homepage section-title-input"
                        value={section.title}
                        onChange={(e) => handleSectionTitleChange(section._id, e.target.value)}
                        placeholder="Section title"
                      />
                      <span className={`section-type-pill section-type-pill--${section.type}`}>
                        {section.type === "products"
                          ? "Products"
                          : section.type === "categories"
                            ? "Categories"
                            : "Brands"}
                      </span>
                    </div>

                  </div>

                  <div className="section-actions">
                    <button
                      className="btn-save-layout"
                      onClick={() => handleSaveSection(section)}
                      disabled={sectionSavingId === section._id}
                    >
                      {sectionSavingId === section._id ? (
                        <>
                          <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Saving...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-save" aria-hidden="true" /> Save
                        </>
                      )}
                    </button>
                    <button
                      className="btn-action btn-delete-homepage"
                      onClick={() => handleDeleteSection(section._id)}
                      disabled={sectionDeletingId === section._id}
                    >
                      {sectionDeletingId === section._id ? (
                        <>
                          <i className="fa fa-spinner fa-spin" aria-hidden="true" /> Removing...
                        </>
                      ) : (
                        <>
                          <i className="fa fa-trash-o" aria-hidden="true" /> Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {section.type === "products" ? (
                  <>
                    <p className="section-subtitle">
                      {section.products.filter(Boolean).length} product
                      {section.products.filter(Boolean).length === 1 ? "" : "s"}
                    </p>
                    <div className="section-slots-grid">
                      {section.products.filter(Boolean).map((product, slotIndex) => {
                        const displayPrice = resolveProductDisplayPrice(product);

                        return (
                          <div
                            key={`${section._id}-${slotIndex}`}
                            className="section-slot-card filled"
                          >
                          <div className="section-slot-image">
                            <img
                              src={
                                product.image ||
                                product?.variants?.[0]?.images?.[0] ||
                                product?.variants?.[0]?.image ||
                                "https://via.placeholder.com/120?text=No+Image"
                              }
                              alt={product.title}
                              onError={(e) => {
                                e.target.src =
                                  "https://via.placeholder.com/120?text=No+Image";
                              }}
                            />
                          </div>
                          <div className="section-slot-info">
                            <h4>{product.title}</h4>
                            <p>₹{displayPrice}</p>
                          </div>
                          <div className="section-slot-actions">
                            <button
                              type="button"
                              className="btn-light"
                              onClick={() =>
                                openSectionProductBrowser(section._id, slotIndex)
                              }
                            >
                              Change
                            </button>
                            <button
                              type="button"
                              className="btn-light btn-light--danger"
                              onClick={() =>
                                handleRemoveProductFromSection(section._id, slotIndex)
                              }
                            >
                              Remove
                            </button>
                          </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : section.type === "categories" ? (
                  <div className="section-summary section-summary--categories">
                    <p className="section-subtitle">Selected categories</p>
                    <div className="section-summary-category-grid">
                      {section.categories.map((category, index) => {
                        const name = category?.name || category || "Category";
                        const label = String(name);
                        const keyValue =
                          category?._id || `${label}-${index}`.replace(/\s+/g, "-");
                        return (
                          <div
                            key={keyValue}
                            className="section-summary-category-card"
                          >
                            <div className="section-summary-category-wrapper">
                              {category?.image ? (
                                <>
                                  <img
                                    src={category.image}
                                    alt={label}
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/150?text=No+Image";
                                    }}
                                  />
                                  <div className="section-summary-category-overlay">
                                    <span>Preview</span>
                                  </div>
                                </>
                              ) : (
                                <div className="section-summary-category-fallback">
                                  {label.charAt(0)}
                                </div>
                              )}
                            </div>
                            <p className="section-summary-category-name">{label}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : section.type === "brands" ? (
                  <div className="section-summary section-summary--brands">
                    <p className="section-subtitle">Selected brands</p>
                    <div className="section-summary-category-grid">
                      {section.brands.map((brand) => (
                        <div
                          key={brand._id || brand}
                          className="section-summary-category-card"
                        >
                          <div className="section-summary-category-wrapper brand-summary-wrapper">
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
                                className="summary-brand-logo"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/150?text=No+Logo";
                                }}
                              />
                            ) : (
                              <div className="section-summary-category-fallback">
                                {brand.name?.charAt(0) || "B"}
                              </div>
                            )}
                          </div>
                          <p className="section-summary-category-name">{brand.name || brand}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Edit Hero Text Modal */}
      {showEditModal && (
        <div className="modal-overlay-homepage" onClick={() => setShowEditModal(false)}>
          <div className="edit-modal-homepage" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-homepage">
              <h2>Edit Hero Text</h2>
              <button className="btn-close-modal" onClick={() => setShowEditModal(false)}>
                &times;
              </button>
            </div>

            <div className="modal-body-homepage">
              <div className="form-group-homepage">
                <label>Headline</label>
                <input
                  type="text"
                  className="form-input-homepage"
                  placeholder="e.g., Summer Sale 2026"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group-homepage">
                <label>Subheadline</label>
                <input
                  type="text"
                  className="form-input-homepage"
                  placeholder="e.g., Up to 70% off on all items"
                  value={subheadline}
                  onChange={(e) => setSubheadline(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer-homepage">
              <button
                className="btn-save-changes-modal"
                onClick={handleUpload}
                disabled={uploading}
              >
                {uploading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="btn-cancel-modal"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomepage;
