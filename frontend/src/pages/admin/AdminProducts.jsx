import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { SquarePen } from "lucide-react";
import "../styles/AdminProducts.css";
import { hasAdminPermission } from "../../utils/adminPermissions";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(10);
  const canCreateProducts = hasAdminPermission("products", "create");
  const canViewProducts = hasAdminPermission("products", "view");
  const canEditProducts = hasAdminPermission("products", "edit");
  const canDeleteProducts = hasAdminPermission("products", "delete");

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchBrands();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedBrand, minPrice, maxPrice]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setProducts(response.data);

      if (response.data && response.data.length > 0) {
        // Extract unique categories and brands from products for absolute completeness
        const prodCats = [...new Set(response.data.map((p) => p.category))].filter(Boolean);
        const prodBrands = [...new Set(response.data.map((p) => p.brand))].filter(Boolean);

        setCategories((prev) => {
          const combined = [...new Set([...prev, ...prodCats])];
          return combined.sort((a, b) => a.localeCompare(b));
        });

        setBrands((prev) => {
          const combined = [...new Set([...prev, ...prodBrands])];
          return combined.sort((a, b) => a.localeCompare(b));
        });
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/categories`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const catsFromDb = res.data.map((c) => (typeof c === "string" ? c : c.name)).filter(Boolean);
      setCategories((prev) => {
        const combined = [...new Set([...prev, ...catsFromDb])];
        return combined.sort((a, b) => a.localeCompare(b));
      });
    } catch {
      console.error("Failed to fetch categories from collections");
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/brands`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      const brandsFromDb = res.data.map((b) => (typeof b === "string" ? b : b.name)).filter(Boolean);
      setBrands((prev) => {
        const combined = [...new Set([...prev, ...brandsFromDb])];
        return combined.sort((a, b) => a.localeCompare(b));
      });
    } catch {
      console.error("Failed to fetch brands from collections");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/products/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        setProducts(products.filter((p) => p._id !== id));
        alert("Product deleted successfully");
      } catch (error) {
        console.error("Failed to delete product:", error);
        alert("Failed to delete product");
      }
    }
  };

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (product.title && product.title.toLowerCase().includes(searchLower)) ||
      (product.productId && product.productId.toLowerCase().includes(searchLower)) ||
      (product._id && product._id.toString().toLowerCase().includes(searchLower)) ||
      (product.category && product.category.toLowerCase().includes(searchLower)) ||
      (product.brand && product.brand.toLowerCase().includes(searchLower));

    const matchesCategory =
      selectedCategory === "all" ||
      (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase());

    const matchesBrand =
      selectedBrand === "all" ||
      (product.brand && product.brand.toLowerCase() === selectedBrand.toLowerCase());

    const price =
      product.price ||
      (product.variants && product.variants[0] && product.variants[0].price) ||
      0;
    const matchesMin = minPrice === "" || parseFloat(price) >= parseFloat(minPrice);
    const matchesMax = maxPrice === "" || parseFloat(price) <= parseFloat(maxPrice);

    return matchesSearch && matchesCategory && matchesBrand && matchesMin && matchesMax;
  });

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Generate page numbers to show
  const pageNumbers = [];
  let startPage = Math.max(1, currentPage - 1);
  let endPage = Math.min(totalPages, startPage + 2);
  
  if (endPage - startPage < 2) {
    startPage = Math.max(1, endPage - 2);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const activeFiltersCount = [
    searchTerm !== "",
    selectedCategory !== "all",
    selectedBrand !== "all",
    minPrice !== "",
    maxPrice !== ""
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setMinPrice("");
    setMaxPrice("");
  };

  if (loading) {
    return (
      <div className="admin-products">
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="products-header">
        <h1>Products Management</h1>
        <div className="header-actions">
          {canCreateProducts && (
            <Link to="/admin/products/add" className="btn btn-success btn-add-admin">
              + Add New Product
            </Link>
          )}
        </div>
      </div>

      {/* ── Search / Category / Filters toolbar ── */}
      <div className="products-search-toolbar">
        <div className="toolbar-main-row">
          <div className="toolbar-search">
            <i className="fa fa-search toolbar-search-icon" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="toolbar-search-input"
            />
          </div>

          <div className="toolbar-actions">
            <button
              className={`toolbar-filters-btn${showFilters ? " active" : ""}`}
              onClick={() => setShowFilters((prev) => !prev)}
            >
              <i className="fa fa-sliders" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="filter-count-badge">{activeFiltersCount}</span>
              )}
            </button>

            {activeFiltersCount > 0 && (
              <button className="toolbar-clear-btn" onClick={clearFilters}>
                <i className="fa fa-times" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Collapsible filter panel */}
        {showFilters && (
          <div className="toolbar-filter-panel">
            <div className="filter-panel-col">
              <label className="filter-panel-label">Product Name</label>
              <input
                type="text"
                placeholder="Filter by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-panel-input"
              />
            </div>
            <div className="filter-panel-col">
              <label className="filter-panel-label">Brand</label>
              <select
                className="filter-panel-select"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
              >
                <option value="all">All Brands</option>
                {brands.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="filter-panel-col">
              <label className="filter-panel-label">Category</label>
              <select
                className="filter-panel-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="filter-panel-col">
              <label className="filter-panel-label">Min Price (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="filter-panel-input"
                min="0"
              />
            </div>
            <div className="filter-panel-col">
              <label className="filter-panel-label">Max Price (₹)</label>
              <input
                type="number"
                placeholder="99999"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="filter-panel-input"
                min="0"
              />
            </div>
          </div>
        )}
      </div>

      {filteredProducts.length === 0 ? (
        <p className="no-products">No products found</p>
      ) : (
        <div className="products-table">
          <table>
            {/* colgroup removed to allow table-layout: auto to handle content width */}
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Product</th>
                <th>Category</th>
                <th>Brand</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => {
                const productImage = product.image || product?.variants?.[0]?.images?.[0] || "";

                return (
                  <tr key={product._id}>
                    <td>
                      <div 
                        className={`product-id-badge ${canViewProducts ? "clickable-id" : ""}`}
                        onClick={() => canViewProducts && setViewingProduct(product)}
                        title={canViewProducts ? "View Product Details" : ""}
                      >
                        {product.productId || "N/A"}
                      </div>
                    </td>
                    <td className="image-cell">
                      {productImage ? (
                        <img
                          src={productImage}
                          alt={product.title}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/80?text=No+Image";
                          }}
                        />
                      ) : (
                        <span className="no-image">No Image</span>
                      )}
                    </td>
                    <td>
                      <div className="product-name-with-id">
                        <div className="product-title">{product.title}</div>
                      </div>
                    </td>
                    <td className="category-cell">{product.category}</td>
                    <td className="brand-cell">{product.brand}</td>
                    <td className="actions">
                      {canViewProducts && (
                        <button
                          onClick={() => setViewingProduct(product)}
                          className="btn-small btn-view icon-action-btn"
                          title="View Product Details"
                          aria-label="View Product Details"
                        >
                          <i className="fa fa-eye" aria-hidden="true" />
                        </button>
                      )}
                      {canEditProducts && (
                        <Link
                          to={`/admin/products/edit/${product._id}`}
                          className="btn-small btn-edit icon-action-btn"
                          title="Edit Product"
                          aria-label="Edit Product"
                        >
                          <SquarePen size={14} strokeWidth={2.2} aria-hidden="true" />
                        </Link>
                      )}
                      {canDeleteProducts && (
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="btn-small btn-delete icon-action-btn"
                          title="Delete Product"
                          aria-label="Delete Product"
                        >
                          <i className="fa fa-trash" aria-hidden="true" />
                        </button>
                      )}
                      {!canViewProducts && !canEditProducts && !canDeleteProducts && <span>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination UI */}
          <div className="pagination-wrapper">
            <div className="pagination-info">
              Showing <strong>{indexOfFirstProduct + 1}</strong> to <strong>{Math.min(indexOfLastProduct, filteredProducts.length)}</strong> of <strong>{filteredProducts.length}</strong> results
            </div>
            <div className="pagination-controls">
              <button 
                onClick={() => paginate(1)} 
                disabled={currentPage === 1}
                title="First Page"
              >
                <i className="fa fa-angle-double-left" />
              </button>
              <button 
                onClick={() => paginate(currentPage - 1)} 
                disabled={currentPage === 1}
                title="Previous Page"
              >
                <i className="fa fa-angle-left" />
              </button>
              
              {pageNumbers.map(number => (
                <button 
                  key={number} 
                  onClick={() => paginate(number)}
                  className={currentPage === number ? 'active' : ''}
                >
                  {number}
                </button>
              ))}

              <button 
                onClick={() => paginate(currentPage + 1)} 
                disabled={currentPage === totalPages}
                title="Next Page"
              >
                <i className="fa fa-angle-right" />
              </button>
              <button 
                onClick={() => paginate(totalPages)} 
                disabled={currentPage === totalPages}
                title="Last Page"
              >
                <i className="fa fa-angle-double-right" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {viewingProduct && canViewProducts && (
        <div className="product-details-modal-overlay" onClick={() => setViewingProduct(null)}>
          <div className="product-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button 
                className="close-btn" 
                onClick={() => setViewingProduct(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-content">
              {/* Product Image */}
              <div className="detail-section product-image-section">
                {(viewingProduct.image || (viewingProduct?.variants?.[0]?.images?.length > 0)) ? (
                  <img
                    src={viewingProduct.image || viewingProduct?.variants?.[0]?.images?.[0]}
                    alt={viewingProduct.title}
                    className="detail-product-image"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="no-image-placeholder">No Image Available</div>
                )}
              </div>

              {/* Basic Information */}
              <div className="detail-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="detail-row">
                  <div className="detail-label">Product ID:</div>
                  <div className="detail-value">{viewingProduct.productId || "N/A"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Title:</div>
                  <div className="detail-value">{viewingProduct.title}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Description:</div>
                  <div className="detail-value">{viewingProduct.description || "No description provided"}</div>
                </div>
              </div>

              {/* Classification */}
              <div className="detail-section">
                <h3 className="section-title">Classification</h3>
                <div className="detail-row">
                  <div className="detail-label">Category:</div>
                  <div className="detail-value">{viewingProduct.category || "N/A"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Brand:</div>
                  <div className="detail-value">{viewingProduct.brand || "N/A"}</div>
                </div>
              </div>

              {/* Variants */}
              {viewingProduct.variants && viewingProduct.variants.length > 0 && (
                <div className="detail-section">
                  <h3 className="section-title">Product Variants ({viewingProduct.variants.length})</h3>
                  <div className="variants-container">
                    {viewingProduct.variants.map((variant, index) => (
                      <div key={index} className="variant-card">
                        <div className="variant-header">
                          <h4>Variant {index + 1}: {variant.variantType} - {variant.variantValue}</h4>
                        </div>
                        <div className="variant-media-row">
                          {variant.images && variant.images.map((img, i) => (
                            <div key={`img-${i}`} className="variant-media-item">
                              <img src={img} alt="variant" />
                            </div>
                          ))}
                          {variant.videos && variant.videos.map((vid, i) => (
                            <div key={`vid-${i}`} className="variant-media-item">
                              <video src={vid} controls muted />
                            </div>
                          ))}
                        </div>
                        <div className="variant-details">
                          <div className="detail-row">
                            <div className="detail-label">Price:</div>
                            <div className="detail-value">₹{parseFloat(variant.price).toFixed(2)}</div>
                          </div>
                          {variant.discount > 0 && (
                            <div className="detail-row">
                              <div className="detail-label">Discount (%):</div>
                              <div className="detail-value">{variant.discount}%</div>
                            </div>
                          )}
                          {variant.flatDiscount > 0 && (
                            <div className="detail-row">
                              <div className="detail-label">Flat Discount:</div>
                              <div className="detail-value">₹{parseFloat(variant.flatDiscount).toFixed(2)}</div>
                            </div>
                          )}
                          {(variant.discount > 0 || variant.flatDiscount > 0) && (
                            <div className="detail-row highlight">
                              <div className="detail-label">Final Price:</div>
                              <div className="detail-value">₹{parseFloat(variant.priceAfterDiscount || variant.price).toFixed(2)}</div>
                            </div>
                          )}
                          {variant.discountValidityDays > 0 && (
                            <div className="detail-row">
                              <div className="detail-label">Discount Valid For:</div>
                              <div className="detail-value">{variant.discountValidityDays} days</div>
                            </div>
                          )}
                          {variant.discountUserLimit > 0 && (
                            <div className="detail-row">
                              <div className="detail-label">Discount User Limit:</div>
                              <div className="detail-value">{variant.discountUserLimit} users</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="detail-section">
                <h3 className="section-title">Additional Information</h3>
                <div className="detail-row">
                  <div className="detail-label">Created At:</div>
                  <div className="detail-value">{new Date(viewingProduct.createdAt).toLocaleDateString()} {new Date(viewingProduct.createdAt).toLocaleTimeString()}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Last Updated:</div>
                  <div className="detail-value">{new Date(viewingProduct.updatedAt).toLocaleDateString()} {new Date(viewingProduct.updatedAt).toLocaleTimeString()}</div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn btn-secondary" 
                onClick={() => setViewingProduct(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
