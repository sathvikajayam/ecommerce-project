import React, { useEffect, useMemo, useState } from "react";
import { SquarePen } from "lucide-react";
import "../styles/AdminCoupons.css";
import * as categoryService from "../../service/categoryService";
import * as brandService from "../../service/brandService";
import * as couponService from "../../service/couponService";

const isExpired = (expiryDate) => {
  if (!expiryDate) return false;
  const date = new Date(expiryDate);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
};

const CouponModal = ({ isOpen, onClose, onSaved, coupon = null }) => {
  const isEditing = Boolean(coupon);

  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    value: "",
    startDate: "",
    expiryDate: "",
    totalUsageLimit: "",
    perUserLimit: "",
    brandId: "",
    categoryId: "",
    isActive: true,
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [optionsError, setOptionsError] = useState("");
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Handle form population when editing
  useEffect(() => {
    if (isOpen) {
      if (coupon) {
        setForm({
          code: coupon.code || "",
          discountType: coupon.discountType || "percentage",
          value: coupon.value || "",
          startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split("T")[0] : "",
          expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split("T")[0] : "",
          totalUsageLimit: coupon.totalUsageLimit || "",
          perUserLimit: coupon.perUserLimit || "",
          brandId: (coupon.applicableBrands || [])[0] || "",
          categoryId: (coupon.applicableCategories || [])[0] || "",
          isActive: coupon.isActive ?? true,
        });
      } else {
        setForm({
          code: "",
          discountType: "percentage",
          value: "",
          startDate: "",
          expiryDate: "",
          totalUsageLimit: "",
          perUserLimit: "",
          brandId: "",
          categoryId: "",
          isActive: true,
        });
      }
      setSubmitError("");
    }
  }, [isOpen, coupon]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let ignore = false;

    const loadOptions = async () => {
      setIsLoadingOptions(true);
      setOptionsError("");
      try {
        const [cats, brs] = await Promise.all([categoryService.getAllCategories(), brandService.getAllBrands()]);
        if (ignore) return;

        const normalizeName = (item) =>
          String(item?.name || item?.title || item?.label || item?._id || item?.id || "Unnamed");

        const sortByName = (a, b) => normalizeName(a).localeCompare(normalizeName(b));

        setCategories([...(cats || [])].sort(sortByName));
        setBrands([...(brs || [])].sort(sortByName));
      } catch (error) {
        if (ignore) return;
        setOptionsError("Failed to load brands/categories. Make sure you are logged in as admin.");
      } finally {
        if (!ignore) setIsLoadingOptions(false);
      }
    };

    loadOptions();
    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const updateField = (key) => (e) => {
    const nextValue = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submit = async () => {
      setIsSubmitting(true);
      setSubmitError("");
      try {
        const payload = {
          code: form.code,
          discountType: form.discountType,
          value: Number(form.value),
          startDate: form.startDate || null,
          expiryDate: form.expiryDate || null,
          totalUsageLimit: form.totalUsageLimit || null,
          perUserLimit: form.perUserLimit || null,
          applicableBrands: form.brandId ? [form.brandId] : [],
          applicableCategories: form.categoryId ? [form.categoryId] : [],
          isActive: Boolean(form.isActive),
        };

        if (isEditing) {
          await couponService.updateCoupon(coupon._id, payload);
        } else {
          await couponService.createCoupon(payload);
        }
        
        onSaved?.();
        onClose?.();
      } catch (error) {
        const message =
          error?.response?.data?.message ||
          error?.message ||
          `Failed to ${isEditing ? "update" : "create"} coupon. Please try again.`;
        setSubmitError(String(message));
      } finally {
        setIsSubmitting(false);
      }
    };
    submit();
  };

  return (
    <div className="coupean-modal-overlay" role="dialog" aria-modal="true" aria-label={isEditing ? "Edit Coupon" : "Create Coupon"}>
      <div className="coupean-modal" onClick={(e) => e.stopPropagation()}>
        <div className="coupean-modal-header">
          <h2>{isEditing ? "Edit Coupon" : "Create Coupon"}</h2>
          <button type="button" className="coupean-modal-close" onClick={onClose} aria-label="Close">
            <i className="fa fa-times" aria-hidden="true" />
          </button>
        </div>

        <form className="coupean-modal-body" onSubmit={handleSubmit}>
          <div className="coupean-field">
            <label className="coupean-label">
              <i className="fa fa-tag" aria-hidden="true" /> Coupon Code <span className="coupean-required">*</span>
            </label>
            <input
              className="coupean-input"
              value={form.code}
              onChange={updateField("code")}
              placeholder="e.g., SAVE20, WELCOME10"
              minLength={3}
              maxLength={20}
              required
            />
            <div className="coupean-help">3-20 characters, alphanumeric with hyphens/underscores allowed</div>
          </div>

          <div className="coupean-grid-2">
            <div className="coupean-field">
              <label className="coupean-label">Discount Type <span className="coupean-required">*</span></label>
              <select className="coupean-input" value={form.discountType} onChange={updateField("discountType")} required>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div className="coupean-field">
              <label className="coupean-label">Value <span className="coupean-required">*</span></label>
              <input
                className="coupean-input"
                type="number"
                value={form.value}
                onChange={updateField("value")}
                placeholder={form.discountType === "percentage" ? "1-100" : "Amount"}
                min={1}
                max={form.discountType === "percentage" ? 100 : undefined}
                required
              />
            </div>
          </div>

          <div className="coupean-grid-2">
            <div className="coupean-field">
              <label className="coupean-label">
                <i className="fa fa-calendar" aria-hidden="true" /> Start Date
              </label>
              <input className="coupean-input" type="date" value={form.startDate} onChange={updateField("startDate")} />
            </div>

            <div className="coupean-field">
              <label className="coupean-label">
                <i className="fa fa-calendar" aria-hidden="true" /> Expiry Date <span className="coupean-required">*</span>
              </label>
              <input className="coupean-input" type="date" value={form.expiryDate} onChange={updateField("expiryDate")} required />
            </div>
          </div>

          <div className="coupean-grid-2">
            <div className="coupean-field">
              <label className="coupean-label">
                <i className="fa fa-users" aria-hidden="true" /> Total Usage Limit
              </label>
              <input
                className="coupean-input"
                type="number"
                min={1}
                value={form.totalUsageLimit}
                onChange={updateField("totalUsageLimit")}
                placeholder="Unlimited"
              />
            </div>

            <div className="coupean-field">
              <label className="coupean-label">
                <i className="fa fa-user" aria-hidden="true" /> Per User Limit
              </label>
              <input
                className="coupean-input"
                type="number"
                min={1}
                value={form.perUserLimit}
                onChange={updateField("perUserLimit")}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <div className="coupean-divider" />

          <div className="coupean-section-title">
            <i className="fa fa-cube" aria-hidden="true" /> Applicability <span>(Leave empty for all products)</span>
          </div>

          {optionsError ? <div className="coupean-help coupean-help--error">{optionsError}</div> : null}
          {submitError ? <div className="coupean-help coupean-help--error">{submitError}</div> : null}

          <div className="coupean-field">
            <label className="coupean-label">Brand</label>
            <select className="coupean-input" value={form.brandId} onChange={updateField("brandId")}>
              <option value="">Select Brand</option>
              {isLoadingOptions && brands.length === 0 ? <option disabled>Loading...</option> : null}
              {brands.map((brand) => {
                const id = brand?._id || brand?.id;
                if (!id) return null;
                const name = brand?.name || brand?.title || "Unnamed";
                const status = brand?.status && brand.status !== "active" ? ` (${brand.status})` : "";
                return (
                  <option key={String(id)} value={String(name)}>
                    {String(name)}
                    {status}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="coupean-field">
            <label className="coupean-label">Category</label>
            <select className="coupean-input" value={form.categoryId} onChange={updateField("categoryId")}>
              <option value="">Select Category</option>
              {isLoadingOptions && categories.length === 0 ? <option disabled>Loading...</option> : null}
              {categories.map((category) => {
                const id = category?._id || category?.id;
                if (!id) return null;
                const name = category?.name || category?.title || "Unnamed";
                const status = category?.status && category.status !== "active" ? ` (${category.status})` : "";
                return (
                  <option key={String(id)} value={String(name)}>
                    {String(name)}
                    {status}
                  </option>
                );
              })}
            </select>
          </div>

          <label className="coupean-checkbox">
            <input type="checkbox" checked={form.isActive} onChange={updateField("isActive")} />
            <span>Active (coupon can be used)</span>
          </label>

          <div className="coupean-modal-footer">
            <button type="button" className="btn-coupean-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-coupean-primary" disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Coupon" : "Create Coupon")}
            </button>
          </div>
        </form>
      </div>
      <button type="button" className="coupean-modal-backdrop" onClick={onClose} aria-label="Close modal" />
    </div>
  );
};

const CouponDetailsModal = ({ coupon, onClose }) => {
  const [brandLookup, setBrandLookup] = useState({});
  const [categoryLookup, setCategoryLookup] = useState({});

  const couponId = String(coupon?._id || "");

  useEffect(() => {
    if (!couponId) return undefined;
    let ignore = false;

    const loadLookups = async () => {
      try {
        const [cats, brs] = await Promise.all([
          categoryService.getAllCategories(),
          brandService.getAllBrands(),
        ]);
        if (ignore) return;

        const nextCategoryLookup = {};
        (cats || []).forEach((cat) => {
          const id = cat?._id || cat?.id;
          if (!id) return;
          nextCategoryLookup[String(id)] = String(cat?.name || cat?.title || id);
        });

        const nextBrandLookup = {};
        (brs || []).forEach((brand) => {
          const id = brand?._id || brand?.id;
          if (!id) return;
          nextBrandLookup[String(id)] = String(brand?.name || brand?.title || id);
        });

        setCategoryLookup(nextCategoryLookup);
        setBrandLookup(nextBrandLookup);
      } catch (error) {
        // Keep fallbacks (ids) if lookups fail.
      }
    };

    loadLookups();
    return () => {
      ignore = true;
    };
  }, [couponId]);

  if (!coupon) return null;

  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Invalid date";
    return `${date.toLocaleDateString()} · ${date.toLocaleTimeString()}`;
  };

  const formatUsageLimit = (limit) => (limit ? limit : "Unlimited");

  const formatApplicableList = (values, lookup, fallbackAll) => {
    const list = Array.isArray(values) ? values : [];
    if (list.length === 0) return fallbackAll;

    const normalized = list
      .map((value) => {
        if (value && typeof value === "object") {
          return String(value?.name || value?.title || value?._id || value?.id || "").trim();
        }
        return String(value || "").trim();
      })
      .filter(Boolean);

    if (normalized.length === 0) return fallbackAll;

    const display = normalized.map((idOrName) => lookup[idOrName] || idOrName);
    return [...new Set(display)].join(", ");
  };

  const applicableBrands = formatApplicableList(coupon.applicableBrands, brandLookup, "All brands");
  const applicableCategories = formatApplicableList(
    coupon.applicableCategories,
    categoryLookup,
    "All categories"
  );

  return (
    <div className="coupon-details-overlay" role="dialog" aria-modal="true" aria-label="Coupon details" onClick={onClose}>
      <div className="coupon-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="coupon-details-header">
          <div>
            <p className="coupon-details-label">Coupon Code</p>
            <h2>{coupon.code}</h2>
          </div>
          <button type="button" className="coupon-details-close" onClick={onClose} aria-label="Close">
            <i className="fa fa-times" aria-hidden="true" />
          </button>
        </div>
        <div className="coupon-details-grid">
          <div className="coupon-detail-row">
            <span>Discount</span>
            <strong>
              {coupon.discountType === "percentage"
                ? `${coupon.value || 0}% off`
                : `â‚¹${Number(coupon.value || 0).toFixed(0)} off`}
            </strong>
          </div>
          <div className="coupon-detail-row">
            <span>Starts</span>
            <strong>{formatDateTime(coupon.startDate)}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Expires</span>
            <strong>{formatDateTime(coupon.expiryDate)}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Total usage limit</span>
            <strong>{formatUsageLimit(coupon.totalUsageLimit)}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Per user limit</span>
            <strong>{formatUsageLimit(coupon.perUserLimit)}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Active status</span>
            <strong>{coupon.isActive ? "Active" : "Inactive"}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Times used</span>
            <strong>{Number(coupon.usageCount || 0)}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Applicable brands</span>
            <strong>{applicableBrands}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Applicable categories</span>
            <strong>{applicableCategories}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Created at</span>
            <strong>{formatDateTime(coupon.createdAt)}</strong>
          </div>
          <div className="coupon-detail-row">
            <span>Last updated</span>
            <strong>{formatDateTime(coupon.updatedAt)}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | expired
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [viewingCoupon, setViewingCoupon] = useState(null);

  const loadCoupons = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await couponService.getAllCoupons();
      setCoupons(Array.isArray(data) ? data : []);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load coupons. Make sure you are logged in as admin.";
      setLoadError(String(message));
      setCoupons([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const counts = useMemo(() => {
    const total = (coupons || []).length;
    const active = (coupons || []).filter((c) => c?.isActive && !isExpired(c?.expiryDate)).length;
    const expired = (coupons || []).filter((c) => isExpired(c?.expiryDate)).length;
    return { total, active, expired };
  }, [coupons]);

  const filteredCoupons = useMemo(() => {
    const term = String(searchTerm || "").trim().toLowerCase();
    return (coupons || [])
      .filter((c) => {
        if (!term) return true;
        return String(c?.code || "").toLowerCase().includes(term);
      })
      .filter((c) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return c?.isActive && !isExpired(c?.expiryDate);
        if (statusFilter === "expired") return isExpired(c?.expiryDate);
        return true;
      });
  }, [coupons, searchTerm, statusFilter]);

  const handleCreateCoupon = () => {
    setEditingCoupon(null);
    setIsCouponModalOpen(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setIsCouponModalOpen(true);
  };

  const handleToggleStatus = async (id) => {
    try {
      await couponService.toggleCouponStatus(id);
      await loadCoupons();
    } catch (error) {
      window.alert(error?.response?.data?.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this coupon?");
    if (!ok) return;
    try {
      await couponService.deleteCoupon(id);
      await loadCoupons();
    } catch (error) {
      window.alert(error?.response?.data?.message || "Failed to delete coupon");
    }
  };

  return (
    <div className="admin-coupons">
      <div className="coupons-topbar">
        <div className="coupons-title-row">
          <h1 className="coupons-title">Coupons</h1>
          <span className="coupons-count-badge">{counts.total} coupons</span>
        </div>

        <button className="btn-coupon-primary" type="button" onClick={handleCreateCoupon}>
          <i className="fa fa-plus" aria-hidden="true" />
          Create Coupon
        </button>
      </div>

      <p className="coupons-subtitle">Manage discount coupons and promotions</p>

      <div className="coupons-stats">
        <div className="coupon-stat-card">
          <div className="coupon-stat-value">{counts.total}</div>
          <div className="coupon-stat-label">Total</div>
        </div>

        <div className="coupon-stat-card coupon-stat-card--active">
          <div className="coupon-stat-value">{counts.active}</div>
          <div className="coupon-stat-label">Active</div>
        </div>

        <div className="coupon-stat-card coupon-stat-card--expired">
          <div className="coupon-stat-value">{counts.expired}</div>
          <div className="coupon-stat-label">Expired</div>
        </div>
      </div>

      <div className="coupons-toolbar">
        <div className="coupons-search">
          <i className="fa fa-search coupons-search-icon" aria-hidden="true" />
          <input
            className="coupons-search-input"
            type="text"
            placeholder="Search by coupon code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="coupons-filter-group" role="tablist" aria-label="Coupon status filter">
          <button
            type="button"
            className={`coupon-filter-btn${statusFilter === "all" ? " active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`coupon-filter-btn${statusFilter === "active" ? " active" : ""}`}
            onClick={() => setStatusFilter("active")}
          >
            Active
          </button>
          <button
            type="button"
            className={`coupon-filter-btn${statusFilter === "expired" ? " active" : ""}`}
            onClick={() => setStatusFilter("expired")}
          >
            Expired
          </button>
        </div>
      </div>

      <div className="coupons-body">
        {isLoading ? (
          <div className="coupons-list-placeholder">Loading coupons...</div>
        ) : loadError ? (
          <div className="coupons-list-placeholder">{loadError}</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="coupons-empty">
            <div className="coupons-empty-icon" aria-hidden="true">
              <i className="fa fa-ticket" />
            </div>
            <h3>No coupons yet</h3>
            <p>Create your first coupon to offer discounts.</p>
            <button className="btn-coupon-primary btn-coupon-primary--center" type="button" onClick={handleCreateCoupon}>
              Create Coupon
            </button>
          </div>
        ) : (
          <div className="coupons-table-wrap">
            <table className="coupons-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Expiry</th>
                  <th>Status</th>
                  <th className="coupons-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => {
                  const expired = isExpired(coupon?.expiryDate);
                  const status = expired ? "Expired" : coupon?.isActive ? "Active" : "Inactive";
                  const valueText =
                    coupon?.discountType === "percentage" ? `${coupon?.value || 0}%` : `₹${Number(coupon?.value || 0).toFixed(0)}`;
                  const expiryText = coupon?.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "-";
                  return (
                    <tr key={coupon?._id || coupon?.code}>
                      <td className="coupon-code">{coupon?.code}</td>
                      <td className="coupon-type">{coupon?.discountType}</td>
                      <td className="coupon-value">{valueText}</td>
                      <td className="coupon-expiry">{expiryText}</td>
                      <td>
                        <span className={`coupon-status coupon-status--${String(status).toLowerCase()}`}>{status}</span>
                      </td>
                      <td className="coupon-actions">
                        <button
                          onClick={() => setViewingCoupon(coupon)}
                          className="btn-small btn-view icon-action-btn"
                          title="View Coupon Details"
                          aria-label="View Coupon Details"
                        >
                          <i className="fa fa-eye" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="btn-small btn-edit icon-action-btn"
                          title="Edit Coupon"
                          aria-label="Edit Coupon"
                        >
                          <SquarePen size={14} strokeWidth={2.2} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(coupon._id)}
                          className={`btn-small icon-action-btn ${coupon?.isActive ? "btn-toggle-off" : "btn-toggle-on"}`}
                          title={coupon?.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                          aria-label={coupon?.isActive ? "Deactivate Coupon" : "Activate Coupon"}
                        >
                          <i className={`fa ${coupon?.isActive ? "fa-toggle-off" : "fa-toggle-on"}`} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(coupon._id)}
                          className="btn-small btn-delete icon-action-btn"
                          title="Delete Coupon"
                          aria-label="Delete Coupon"
                        >
                          <i className="fa fa-trash" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => {
          setIsCouponModalOpen(false);
          setEditingCoupon(null);
        }}
        onSaved={() => loadCoupons()}
        coupon={editingCoupon}
      />
      <CouponDetailsModal coupon={viewingCoupon} onClose={() => setViewingCoupon(null)} />
    </div>
  );
};

export default AdminCoupons;
