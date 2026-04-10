import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/AdminSidebar.css";
import { getStoredAdminUser, hasAdminPermission } from "../../utils/adminPermissions";

const AdminSidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  let adminName = "Admin";
  let adminRole = "Administrator";
  const adminUser = getStoredAdminUser();

  const canAccessProducts = hasAdminPermission("products", "view", adminUser);
  const canAccessBrands = hasAdminPermission("brands", "view", adminUser);
  const canAccessCategories = hasAdminPermission("categories", "view", adminUser);
  const canAccessOrders = hasAdminPermission("orders", "view", adminUser);
  const canAccessCoupons = hasAdminPermission("coupons", "view", adminUser);
  const canViewUsers = hasAdminPermission("users", "view", adminUser);
  const canViewAdmins = hasAdminPermission("admin", "view", adminUser);
  const canViewContacts = hasAdminPermission("admin", "view", adminUser);
  const canViewHomepage = hasAdminPermission("homepage", "view", adminUser) || hasAdminPermission("admin", "view", adminUser);
  try {
    const storedUser = adminUser || {};
    adminName = storedUser?.name || adminName;
    adminRole = storedUser?.role ? String(storedUser.role).replace(/_/g, " ") : adminRole;
  } catch (error) {
    adminName = "Admin";
    adminRole = "Administrator";
  }

  return (
    <aside className={`admin-sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {isOpen && <h2 className="sidebar-title">Admin pannel</h2>}
        </div>
        <button
          className="toggle-btn"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
        >
          <i className={`fa ${isOpen ? "fa-angle-left" : "fa-angle-right"}`} aria-hidden="true" />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/admin/dashboard" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
          <span className="icon"><i className="fa fa-th-large" aria-hidden="true" /></span>
          {isOpen && <span>Dashboard</span>}
        </NavLink>

        {canAccessProducts && (
          <NavLink to="/admin/products" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-cube" aria-hidden="true" /></span>
            {isOpen && <span>Products</span>}
          </NavLink>
        )}

        {canAccessBrands && (
          <NavLink to="/admin/brands" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-tags" aria-hidden="true" /></span>
            {isOpen && <span>Brands</span>}
          </NavLink>
        )}

        {canAccessCategories && (
          <NavLink to="/admin/categories" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-sitemap" aria-hidden="true" /></span>
            {isOpen && <span>Categories</span>}
          </NavLink>
        )}
        
        {canAccessOrders && (
          <NavLink to="/admin/orders" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-shopping-cart" aria-hidden="true" /></span>
            {isOpen && <span>Orders</span>}
          </NavLink>
        )}

        {canAccessCoupons && (
          <NavLink to="/admin/coupons" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-ticket" aria-hidden="true" /></span>
            {isOpen && <span>Coupons</span>}
          </NavLink>
        )}

        {canViewUsers && (
          <NavLink to="/admin/users" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-users" aria-hidden="true" /></span>
            {isOpen && <span>Users</span>}
          </NavLink>
        )}

        {canViewAdmins && (
          <NavLink to="/admin/admins" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-shield" aria-hidden="true" /></span>
            {isOpen && <span>Admins</span>}
          </NavLink>
        )}

        {canViewHomepage && (
          <NavLink to="/admin/homepage" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-home" aria-hidden="true" /></span>
            {isOpen && <span>Homepage</span>}
          </NavLink>
        )}

        {canViewContacts && (
          <NavLink to="/admin/contacts" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            <span className="icon"><i className="fa fa-envelope-o" aria-hidden="true" /></span>
            {isOpen && <span>Contact Forms</span>}
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        {isOpen && (
          <div className="admin-profile">
            <div className="profile-avatar">{String(adminName).charAt(0).toUpperCase()}</div>
            <div className="profile-info">
              <p className="profile-name">{adminName}</p>
              <p className="profile-role">{adminRole}</p>
            </div>
          </div>
        )}

        <button className="logout-btn" onClick={handleLogout} title="Logout" aria-label="Logout">
          <i className="fa fa-sign-out" aria-hidden="true" />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
