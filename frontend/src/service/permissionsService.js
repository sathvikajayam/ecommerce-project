/**
 * Admin Permissions Service
 * Handles admin user permissions management and API calls
 */

import axios from "axios";

const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/admin/users`;

// Permission resources and actions
export const RESOURCES = ["products", "brands", "categories", "users", "admin"];
export const ACTIONS = ["view", "create", "edit", "delete"];

/**
 * Get all permissions in a structured format
 */
export const getAllPermissions = () => {
  const permissions = {};
  RESOURCES.forEach((resource) => {
    permissions[resource] = {};
    ACTIONS.forEach((action) => {
      permissions[resource][action] = false;
    });
  });
  return permissions;
};

/**
 * Create default permission structure
 */
export const getDefaultPermissions = () => {
  return getAllPermissions();
};

/**
 * Check if user has specific permission
 * @param {Object} permissions - User permissions object
 * @param {String} resource - Resource name (e.g., 'products')
 * @param {String} action - Action name (e.g., 'view')
 * @returns {Boolean}
 */
export const hasPermission = (permissions, resource, action) => {
  return permissions?.[resource]?.[action] ?? false;
};

/**
 * Grant multiple permissions to a resource
 * @param {Object} permissions - Current permissions
 * @param {String} resource - Resource name
 * @param {Array} actions - Array of action names to grant
 * @returns {Object} Updated permissions
 */
export const grantResourcePermissions = (permissions, resource, actions) => {
  const updated = { ...permissions };
  if (updated[resource]) {
    actions.forEach((action) => {
      if (updated[resource].hasOwnProperty(action)) {
        updated[resource][action] = true;
      }
    });
  }
  return updated;
};

/**
 * Revoke multiple permissions from a resource
 * @param {Object} permissions - Current permissions
 * @param {String} resource - Resource name
 * @param {Array} actions - Array of action names to revoke
 * @returns {Object} Updated permissions
 */
export const revokeResourcePermissions = (permissions, resource, actions) => {
  const updated = { ...permissions };
  if (updated[resource]) {
    actions.forEach((action) => {
      if (updated[resource].hasOwnProperty(action)) {
        updated[resource][action] = false;
      }
    });
  }
  return updated;
};

/**
 * Grant all permissions for a resource
 * @param {Object} permissions - Current permissions
 * @param {String} resource - Resource name
 * @returns {Object} Updated permissions
 */
export const grantAllResourcePermissions = (permissions, resource) => {
  return grantResourcePermissions(permissions, resource, ACTIONS);
};

/**
 * Revoke all permissions for a resource
 * @param {Object} permissions - Current permissions
 * @param {String} resource - Resource name
 * @returns {Object} Updated permissions
 */
export const revokeAllResourcePermissions = (permissions, resource) => {
  return revokeResourcePermissions(permissions, resource, ACTIONS);
};

/**
 * Check if a resource has all permissions
 * @param {Object} permissions - Current permissions
 * @param {String} resource - Resource name
 * @returns {Boolean}
 */
export const hasAllResourcePermissions = (permissions, resource) => {
  return ACTIONS.every((action) => hasPermission(permissions, resource, action));
};

/**
 * Grant all permissions (full access)
 * @param {Object} permissions - Current permissions
 * @returns {Object} Updated permissions
 */
export const grantAllPermissions = (permissions) => {
  const updated = { ...permissions };
  RESOURCES.forEach((resource) => {
    ACTIONS.forEach((action) => {
      updated[resource][action] = true;
    });
  });
  return updated;
};

/**
 * Revoke all permissions (no access)
 * @param {Object} permissions - Current permissions
 * @returns {Object} Updated permissions
 */
export const revokeAllPermissions = (permissions) => {
  return getAllPermissions();
};

/**
 * Get permission summary stats
 * @param {Object} permissions - User permissions
 * @returns {Object} Summary stats
 */
export const getPermissionsSummary = (permissions) => {
  let totalPermissions = 0;
  let grantedPermissions = 0;

  RESOURCES.forEach((resource) => {
    ACTIONS.forEach((action) => {
      totalPermissions++;
      if (hasPermission(permissions, resource, action)) {
        grantedPermissions++;
      }
    });
  });

  return {
    total: totalPermissions,
    granted: grantedPermissions,
    percentage: totalPermissions > 0 ? Math.round((grantedPermissions / totalPermissions) * 100) : 0,
  };
};

/**
 * Fetch all admins
 */
export const fetchAllAdmins = async () => {
  try {
    const response = await axios.get(API_BASE_URL, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Fetch single admin by ID
 */
export const fetchAdminById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Failed to fetch admin:", error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Create new admin user
 */
export const createAdmin = async (adminData) => {
  try {
    const response = await axios.post(API_BASE_URL, adminData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        "Content-Type": "application/json",
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Failed to create admin:", error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Update admin user (permissions and/or name)
 */
export const updateAdmin = async (id, updateData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/${id}`, updateData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        "Content-Type": "application/json",
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Failed to update admin:", error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Delete admin user
 */
export const deleteAdmin = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Failed to delete admin:", error);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Remove admin status from user (downgrade to regular user)
 */
export const removeAdminStatus = async (id) => {
  return updateAdmin(id, { isAdmin: false });
};

export default {
  // Constants
  RESOURCES,
  ACTIONS,
  // Utility functions
  getAllPermissions,
  getDefaultPermissions,
  hasPermission,
  grantResourcePermissions,
  revokeResourcePermissions,
  grantAllResourcePermissions,
  revokeAllResourcePermissions,
  hasAllResourcePermissions,
  grantAllPermissions,
  revokeAllPermissions,
  getPermissionsSummary,
  // API functions
  fetchAllAdmins,
  fetchAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  removeAdminStatus,
};
