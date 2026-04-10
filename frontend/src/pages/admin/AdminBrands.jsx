import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SquarePen } from "lucide-react";
import * as brandService from "../../service/brandService";
import "../styles/AdminBrands.css";
import { hasAdminPermission } from "../../utils/adminPermissions";

const AdminBrands = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewingBrand, setViewingBrand] = useState(null);
  const canCreateBrands = hasAdminPermission("brands", "create");
  const canViewBrands = hasAdminPermission("brands", "view");
  const canEditBrands = hasAdminPermission("brands", "edit");
  const canDeleteBrands = hasAdminPermission("brands", "delete");

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await brandService.getAllBrands();
      setBrands(response);
    } catch (error) {
      console.error("Failed to fetch brands:", error);
      alert("Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const response = await brandService.toggleBrandStatus(id);
      setBrands(brands.map((b) => (b._id === id ? response.brand : b)));
      alert(`Brand marked as ${response.brand.status}`);
    } catch (error) {
      console.error("Failed to toggle brand status:", error);
      alert("Failed to toggle brand status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this brand?")) {
      try {
        await brandService.deleteBrand(id);
        setBrands(brands.filter((b) => b._id !== id));
        alert("Brand deleted successfully");
      } catch (error) {
        console.error("Failed to delete brand:", error);
        alert("Failed to delete brand");
      }
    }
  };

  const filteredBrands = brands.filter((brand) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      (brand.name && brand.name.toLowerCase().includes(searchLower)) ||
      (brand.brandId && brand.brandId.toLowerCase().includes(searchLower)) ||
      (brand._id && brand._id.toString().toLowerCase().includes(searchLower));

    const matchesStatus = statusFilter === "all" || brand.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="admin-brands"><p>Loading brands...</p></div>;
  }

  return (
    <div className="admin-brands">
      <div className="brands-header">
        <h1>Brands Management</h1>
        <div className="header-actions">
          {canCreateBrands && (
            <Link to="/admin/brands/add" className="btn btn-success btn-add-admin">
              + Add New Brand
            </Link>
          )}
        </div>
      </div>

      <div className="brands-search-toolbar">
        <div className="toolbar-main-row">
          <div className="toolbar-search">
            <i className="fa fa-search toolbar-search-icon" />
            <input
              type="text"
              placeholder="Search brands by name..."
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

      {filteredBrands.length === 0 ? (
        <p className="no-brands">No brands found</p>
      ) : (
        <div className="brands-table">
          <table>
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "21%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>ID</th>
                <th>Logo</th>
                <th>Brand</th>
                <th>Products</th>
                <th>Categories</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBrands.map((brand) => (
                <tr key={brand._id}>
                  <td>
                    <div 
                      className={`brand-id-badge ${canViewBrands ? "clickable-id" : ""}`}
                      onClick={() => canViewBrands && setViewingBrand(brand)}
                      title={canViewBrands ? "View Brand Details" : ""}
                    >
                      {brand.brandId || "N/A"}
                    </div>
                  </td>
                  <td className="logo-cell">
                    {brand.logo ? (
                      <img 
                        src={brand.logo} 
                        alt={brand.name}
                        className="brand-logo-thumbnail"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/80?text=No+Logo";
                        }}
                      />
                    ) : (
                      <span className="no-logo">No Logo</span>
                    )}
                  </td>
                  <td>
                    <div className="brand-name-with-id">
                      <div className="brand-name">{brand.name}</div>
                    </div>
                  </td>
                  <td className="product-count">
                    <span className="badge badge-primary">{brand.productCount || 0}</span>
                  </td>
                  <td className="category-count">
                    <span className="badge badge-secondary">{brand.categoryCount || 0}</span>
                  </td>
                  <td>
                    <span className={`status-badge status-${brand.status}`}>
                      {brand.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="actions">
                    {canViewBrands && (
                      <button
                        onClick={() => setViewingBrand(brand)}
                        className="btn-small btn-view icon-action-btn"
                        title="View Brand Details"
                        aria-label="View Brand Details"
                      >
                        <i className="fa fa-eye" aria-hidden="true" />
                      </button>
                    )}
                    {canEditBrands && (
                      <Link
                        to={`/admin/brands/edit/${brand._id}`}
                        className="btn-small btn-edit icon-action-btn"
                        title="Edit Brand"
                        aria-label="Edit Brand"
                      >
                        <SquarePen size={14} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    )}
                    {canEditBrands && (
                      <button
                        onClick={() => handleToggleStatus(brand._id, brand.status)}
                        className={`btn-small icon-action-btn ${brand.status === "active" ? "btn-inactive" : "btn-active"}`}
                        title={brand.status === "active" ? "Mark as Inactive" : "Mark as Active"}
                        aria-label={brand.status === "active" ? "Mark as Inactive" : "Mark as Active"}
                      >
                        <i className={`fa ${brand.status === "active" ? "fa-toggle-off" : "fa-toggle-on"}`} aria-hidden="true" />
                      </button>
                    )}
                    {canDeleteBrands && (
                      <button
                        onClick={() => handleDelete(brand._id)}
                        className="btn-small btn-delete icon-action-btn"
                        title="Delete Brand"
                        aria-label="Delete Brand"
                      >
                        <i className="fa fa-trash" aria-hidden="true" />
                      </button>
                    )}
                    {!canViewBrands && !canEditBrands && !canDeleteBrands && <span>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Brand Details Modal */}
      {viewingBrand && canViewBrands && (
        <div className="brand-details-modal-overlay" onClick={() => setViewingBrand(null)}>
          <div className="brand-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Brand Details</h2>
              <button
                className="close-btn"
                onClick={() => setViewingBrand(null)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className="modal-content">
              {/* Brand Logo */}
              <div className="detail-section brand-logo-section">
                {viewingBrand.logo ? (
                  <img
                    src={viewingBrand.logo}
                    alt={viewingBrand.name}
                    className="detail-brand-logo"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/200?text=No+Logo";
                    }}
                  />
                ) : (
                  <div className="no-logo-placeholder">No Logo Available</div>
                )}
              </div>

              {/* Basic Information */}
              <div className="detail-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="detail-row">
                  <div className="detail-label">Brand ID:</div>
                  <div className="detail-value">{viewingBrand.brandId || "N/A"}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Name:</div>
                  <div className="detail-value">{viewingBrand.name}</div>
                </div>
                {viewingBrand.description && (
                  <div className="detail-row">
                    <div className="detail-label">Description:</div>
                    <div className="detail-value">{viewingBrand.description}</div>
                  </div>
                )}
                {viewingBrand.website && (
                  <div className="detail-row">
                    <div className="detail-label">Website:</div>
                    <div className="detail-value">
                      <a
                        href={viewingBrand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="brand-website-link"
                      >
                        {viewingBrand.website}
                      </a>
                    </div>
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
                      {viewingBrand.productCount || 0} Products
                    </span>
                  </div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Categories:</div>
                  <div className="detail-value">
                    <span className="modal-stat-badge modal-stat-orange">
                      {viewingBrand.categoryCount || 0} Categories
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
                    <span className={`status-badge status-${viewingBrand.status}`}>
                      {viewingBrand.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="detail-section">
                <h3 className="section-title">Additional Information</h3>
                {viewingBrand.createdAt && (
                  <div className="detail-row">
                    <div className="detail-label">Created At:</div>
                    <div className="detail-value">
                      {new Date(viewingBrand.createdAt).toLocaleDateString()}{" "}
                      {new Date(viewingBrand.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                )}
                {viewingBrand.updatedAt && (
                  <div className="detail-row">
                    <div className="detail-label">Last Updated:</div>
                    <div className="detail-value">
                      {new Date(viewingBrand.updatedAt).toLocaleDateString()}{" "}
                      {new Date(viewingBrand.updatedAt).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setViewingBrand(null)}
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

export default AdminBrands;
