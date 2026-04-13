import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { SquarePen } from "lucide-react";
import "../styles/AdminUsers.css";
import { hasAdminPermission } from "../../utils/adminPermissions";

const AdminAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const canCreateAdmins = hasAdminPermission("admin", "create");
  const canEditAdmins = hasAdminPermission("admin", "edit");
  const canDeleteAdmins = hasAdminPermission("admin", "delete");

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setAdmins(response.data);
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (userId) => {
    if (window.confirm("Are you sure you want to delete this admin?")) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });
        setAdmins(admins.filter((admin) => admin._id !== userId));
        alert("Admin deleted successfully");
      } catch (error) {
        console.error("Failed to delete admin:", error);
        alert("Failed to delete admin");
      }
    }
  };

  const filteredAdmins = admins
    .filter((admin) => admin.isAdmin)
    .filter(
      (admin) =>
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="admin-users">
        <p>Loading admins...</p>
      </div>
    );
  }

  return (
    <div className="admin-users">
      <div className="users-header">
        <h1>Admin Management</h1>
        <div className="header-actions">
          {canCreateAdmins && (
            <Link to="/admin/admins/add" className="btn btn-success btn-add-admin">
              + Add New Admin
            </Link>
          )}
        </div>
      </div>
      <p className="total-users">Total Admins: {filteredAdmins.length}</p>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search admins by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {filteredAdmins.length === 0 ? (
        <p className="no-users">No admins found</p>
      ) : (
        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>{admin.name}</td>
                  <td>{admin.email}</td>
                  <td className="admin-yes">
                    {String(admin.role || "admin")
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </td>
                  <td>{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="actions">
                    {canEditAdmins && (
                      <Link
                        to={`/admin/admins/edit/${admin._id}`}
                        className="btn-small btn-edit icon-action-btn"
                        title="Edit Permissions"
                        aria-label="Edit Permissions"
                      >
                        <SquarePen size={14} strokeWidth={2.2} aria-hidden="true" />
                      </Link>
                    )}
                    {canDeleteAdmins && (
                      <button
                        onClick={() => handleDeleteAdmin(admin._id)}
                        className="btn-small btn-delete icon-action-btn"
                        title="Delete Admin"
                        aria-label="Delete Admin"
                      >
                        <i className="fa fa-trash" aria-hidden="true" />
                      </button>
                    )}
                    {!canEditAdmins && !canDeleteAdmins && <span>-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAdmins;
