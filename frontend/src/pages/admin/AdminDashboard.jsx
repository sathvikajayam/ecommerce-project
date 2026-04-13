import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/AdminDashboard.css";
import { getStoredAdminUser, hasAdminPermission } from "../../utils/adminPermissions";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  const adminUser = getStoredAdminUser();
  const canViewProducts = hasAdminPermission("products", "view", adminUser);
  const canCreateProducts = hasAdminPermission("products", "create", adminUser);
  const canViewUsers =
    hasAdminPermission("users", "view", adminUser) || hasAdminPermission("admin", "view", adminUser);

  const fetchStats = useCallback(async () => {
    try {
      const authHeaders = {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      };

      const [productsRes, usersRes] = await Promise.all([
        canViewProducts
          ? axios.get(`${process.env.REACT_APP_API_URL}/api/admin/products`, authHeaders)
          : Promise.resolve({ data: [] }),
        canViewUsers
          ? axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`, authHeaders)
          : Promise.resolve({ data: [] }),
      ]);

      setStats({
        totalProducts: productsRes.data.length,
        totalUsers: usersRes.data.length,
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [canViewProducts, canViewUsers]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-header">
        <div className="welcome-message">
          <h2>Welcome, {(adminUser && adminUser.name) || "Admin"}!</h2>
          <p>Here's an overview of your e-commerce platform</p>
        </div>
      </div>

      <div className="stats-grid">
        {canViewProducts && (
          <div className="stat-card">
            <div className="stat-icon products-icon">P</div>
            <div className="stat-content">
              <h3>Total Products</h3>
              <p className="stat-number">{stats.totalProducts}</p>
            </div>
          </div>
        )}

        {canViewUsers && (
          <div className="stat-card">
            <div className="stat-icon users-icon">U</div>
            <div className="stat-content">
              <h3>Total Users</h3>
              <p className="stat-number">{stats.totalUsers}</p>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-actions">
        <h3>Quick Management</h3>
        <div className="action-buttons">
          {canCreateProducts && (
            <Link to="/admin/products/add" className="btn btn-dashboard-manage">
              <i className="fa fa-folder-open-o" aria-hidden="true"></i> Manage Products
            </Link>
          )}

          {canViewProducts && (
            <Link to="/admin/products" className="btn btn-dashboard-manage">
              <i className="fa fa-list" aria-hidden="true"></i> View All Products
            </Link>
          )}

          {canViewUsers && (
            <Link to="/admin/users" className="btn btn-dashboard-manage">
              <i className="fa fa-users" aria-hidden="true"></i> Manage Users
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
