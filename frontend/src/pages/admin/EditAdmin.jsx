import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import "../styles/AdminAddUser.css";

const EditAdmin = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const resources = ["products", "brands", "categories", "users", "admin"];
  const actions = ["view", "create", "edit", "delete"];

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().test(
      "password-length",
      "Password must be at least 6 characters",
      (value) => !value || value.length >= 6
    ),
    role: Yup.string().oneOf(["super_admin", "admin"], "Invalid role").required("Role is required"),
  });

  const fetchAdmin = useCallback(async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );
      setAdmin(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch admin:", error);
      alert("Failed to load admin details");
      navigate("/admin/admins");
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      // Build permissions object from form values
      const permissions = {};
      resources.forEach((resource) => {
        permissions[resource] = {};
        actions.forEach((action) => {
          permissions[resource][action] = values[`${resource}_${action}`] || false;
        });
      });

      const payload = {
        name: values.name,
        role: values.role,
        permissions,
      };

      if (values.password && values.password.trim()) {
        payload.password = values.password.trim();
      }

      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/users/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Admin updated successfully");
      navigate("/admin/admins");
    } catch (err) {
      console.error("Failed to update admin:", err);
      alert("Failed to update admin");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="admin-add-admin"><p>Loading admin details...</p></div>;
  }

  if (!admin) {
    return <div className="admin-add-admin"><p>Admin not found</p></div>;
  }

  // Build initial values for permissions
  const initialPermissions = {};
  resources.forEach((resource) => {
    actions.forEach((action) => {
      initialPermissions[`${resource}_${action}`] =
        admin.permissions?.[resource]?.[action] || false;
    });
  });

  return (
    <div className="admin-add-admin">
      <h1>Edit Admin: {admin.name}</h1>

      <Formik
        initialValues={{
          name: admin.name || "",
          email: admin.email || "",
          password: "",
          role: admin.role || "admin",
          ...initialPermissions,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue }) => (
          <Form className="admin-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <Field
                type="text"
                id="name"
                name="name"
                className="form-control"
                placeholder="Enter admin name"
              />
              <ErrorMessage name="name" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email (Read-only) *</label>
              <Field
                type="email"
                id="email"
                name="email"
                className="form-control"
                placeholder="Enter admin email"
                disabled
              />
              <ErrorMessage name="email" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <Field
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Leave empty to keep current password"
              />
              <ErrorMessage name="password" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <Field
                as="select"
                id="role"
                name="role"
                className="form-control"
                onChange={(e) => {
                  const role = e.target.value;
                  setFieldValue("role", role);
                  if (role === "super_admin") {
                    resources.forEach((resource) => {
                      actions.forEach((action) => {
                        setFieldValue(`${resource}_${action}`, true);
                      });
                    });
                  }
                }}
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
              </Field>
              <ErrorMessage name="role" component="div" className="error-message" />
            </div>

            {/* Permissions Matrix */}
            <div className="permissions-section">
              <h3>Permissions</h3>
              <p className="permissions-help">
                Enable or disable permissions for each module:
              </p>
              <table className="permissions-table">
                <thead>
                  <tr>
                    <th>Resource</th>
                    {actions.map((action) => (
                      <th key={action} className="action-header">
                        {action.charAt(0).toUpperCase() + action.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource}>
                      <td className="resource-name">
                        {resource.charAt(0).toUpperCase() + resource.slice(1)}
                      </td>
                      {actions.map((action) => (
                        <td key={action} className="checkbox-cell">
                          <Field
                            type="checkbox"
                            name={`${resource}_${action}`}
                            id={`${resource}_${action}`}
                            className="permission-checkbox"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Admin"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate("/admin/admins")}
              >
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default EditAdmin;
