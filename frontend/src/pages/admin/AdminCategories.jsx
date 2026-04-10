import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SquarePen } from "lucide-react";
import * as categoryService from "../../service/categoryService";
import "../styles/AdminCategories.css";
import { hasAdminPermission } from "../../utils/adminPermissions";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingCategory, setViewingCategory] = useState(null);
  const canCreateCategories = hasAdminPermission("categories", "create");
  const canViewCategories = hasAdminPermission("categories", "view");
  const canEditCategories = hasAdminPermission("categories", "edit");
  const canDeleteCategories = hasAdminPermission("categories", "delete");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getAllCategories();
      setCategories(response);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      alert("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await categoryService.toggleCategoryStatus(id);
      setCategories(categories.map((c) => (c._id === id ? response.category : c)));
      alert(`Category marked as ${response.category.status}`);
    } catch (error) {
      console.error("Failed to toggle category status:", error);
      alert("Failed to toggle category status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryService.deleteCategory(id);
        setCategories(categories.filter((c) => c._id !== id));
        alert("Category deleted successfully");
      } catch (error) {
        console.error("Failed to delete category:", error);
        alert("Failed to delete category");
      }
    }
  };

  const filteredCategories = categories.filter((category) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (category.name && category.name.toLowerCase().includes(searchLower)) ||
      (category.categoryId && category.categoryId.toLowerCase().includes(searchLower)) ||
      (category._id && category._id.toString().toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "all" || category.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="admin-categories"><p>Loading categories...</p></div>;
  }

  return (
    <div className="admin-categories">
      <div className="categories-header">
        <h1>Categories Management</h1>
        <div className="header-actions">
          {canCreateCategories && (
            <Link to="/admin/categories/add" className="btn btn-success btn-add-admin">
              + Add New Category
            </Link>
          )}
        </div>
      </div>

      <div className="categories-search-toolbar">
        <div className="toolbar-main-row">
          <div className="toolbar-search">
            <i className="fa fa-search toolbar-search-icon" />
            <input
              type="text"
              placeholder="Search categories by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="toolbar-search-input"
            />
          </div>
          <div className="toolbar-filter">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="status-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <p className="no-categories">No categories found</p>
      ) : (
        <div className="categories-table">
          <table>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "22%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Image</th>
                <th>Category</th>
                <th>Main Category Name</th>
                <th>Products</th>
                <th>Brands</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <div 
                      className={`category-id-badge ${canViewCategories ? "clickable-id" : ""}`}
                      onClick={() => canViewCategories && setViewingCategory(category)}
                      title={canViewCategories ? "View Category Details" : ""}
                    >
                      {category.categoryId || "N/A"}
                    </div>
                  </td>
                  <td className="image-cell">
                    {category.image ? (
                      <img 
                        src={category.image} 
                        alt={category.name}
                        className="category-thumbnail"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80?text=No+Image";
                        }}
                      />
                    ) : (
                      <span className="no-image">No Image</span>
                    )}
                  </td>
                  <td>
                    <div className="category-name-with-id">
                      <div className="category-name">{category.name}</div>
                    </div>
                  </td>
                  <td className="main-category-name">
                    {category.parentCategory ? category.parentCategory : <span className="no-value">-</span>}
                  </td>
                  <td className="product-count">
                    <span className="badge">{category.productCount || 0}</span>
                  </td>
                  <td className="brand-count">
                    <span className="badge badge-secondary">{category.brandCount || 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${category.status}`}>
                      {category.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions">
                    {canViewCategories && (
                      <button
                        onClick={() => setViewingCategory(category)}
                        className="btn-small btn-view icon-action-btn"
                        title="View Category Details"
                        aria-label="View Category Details"
                      >
                        <i className="fa fa-eye" aria-hidden="true" />
                      </button>
                    )}
                    {canEditCategories && (
                      <Link
                        to={`/admin/categories/edit/${category._id}`}
                        className="btn-small btn-edit icon-action-btn"
                        title="Edit Category"
                        aria-label="Edit Category"
                      >
                        <SquarePen size={14} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    )}
                    {canEditCategories && (
                      <button
                        onClick={() => handleToggleStatus(category._id, category.status)}
                        className={`btn-small icon-action-btn ${category.status === "active" ? "btn-inactive" : "btn-active"}`}
                        title={category.status === "active" ? "Mark as Inactive" : "Mark as Active"}
                        aria-label={category.status === "active" ? "Mark as Inactive" : "Mark as Active"}
                      >
                        <i className={`fa ${category.status === "active" ? "fa-toggle-off" : "fa-toggle-on"}`} aria-hidden="true" />
                      </button>
                    )}
                    {canDeleteCategories && (
                      <button
                        onClick={() => handleDelete(category._id)}
                        className="btn-small btn-delete icon-action-btn"
                        title="Delete Category"
                        aria-label="Delete Category"
                      >
                        <i className="fa fa-trash" aria-hidden="true" />
                      </button>
                    )}
                    {!canViewCategories && !canEditCategories && !canDeleteCategories && <span>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Category Details Modal */}
      {viewingCategory && canViewCategories && (
        <div className="category-details-modal-overlay" onClick={() => setViewingCategory(null)}>
          <div className="category-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Category Details</h2>
              <button
                className="close-btn"
                onClick={() => setViewingCategory(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-content">
              {/* Category Image */}
              <div className="detail-section category-image-section">
                {viewingCategory.image ? (
                  <img
                    src={viewingCategory.image}
                    alt={viewingCategory.name}
                    className="detail-category-image"
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
                  <div className="detail-label">Category ID:</div>
                  <div className="detail-value">{viewingCategory.categoryId || "N/A"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Name:</div>
                  <div className="detail-value">{viewingCategory.name}</div>
                </div>
                {viewingCategory.description && (
                  <div className="detail-row">
                    <div className="detail-label">Description:</div>
                    <div className="detail-value">{viewingCategory.description}</div>
                  </div>
                )}
              </div>

              {/* Classification */}
              <div className="detail-section">
                <h3 className="section-title">Classification</h3>
                <div className="detail-row">
                  <div className="detail-label">Type:</div>
                  <div className="detail-value">
                    {viewingCategory.parentCategory ? "Sub-Category" : "Main Category"}
                  </div>
                </div>
                {viewingCategory.parentCategory && (
                  <div className="detail-row">
                    <div className="detail-label">Parent Category:</div>
                    <div className="detail-value">{viewingCategory.parentCategory}</div>
                  </div>
                )}
              </div>

              {/* Statistics */}
              <div className="detail-section">
                <h3 className="section-title">Statistics</h3>
                <div className="detail-row">
                  <div className="detail-label">Products:</div>
                  <div className="detail-value">
                    <span className="modal-stat-badge modal-stat-purple">
                      {viewingCategory.productCount || 0} Products
                    </span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Brands:</div>
                  <div className="detail-value">
                    <span className="modal-stat-badge modal-stat-orange">
                      {viewingCategory.brandCount || 0} Brands
                    </span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="detail-section">
                <h3 className="section-title">Status</h3>
                <div className="detail-row">
                  <div className="detail-label">Current Status:</div>
                  <div className="detail-value">
                    <span className={`status-badge status-${viewingCategory.status}`}>
                      {viewingCategory.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="detail-section">
                <h3 className="section-title">Additional Information</h3>
                {viewingCategory.createdAt && (
                  <div className="detail-row">
                    <div className="detail-label">Created At:</div>
                    <div className="detail-value">
                      {new Date(viewingCategory.createdAt).toLocaleDateString()}{" "}
                      {new Date(viewingCategory.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                {viewingCategory.updatedAt && (
                  <div className="detail-row">
                    <div className="detail-label">Last Updated:</div>
                    <div className="detail-value">
                      {new Date(viewingCategory.updatedAt).toLocaleDateString()}{" "}
                      {new Date(viewingCategory.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setViewingCategory(null)}
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

export default AdminCategories;
