import React from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import axios from "axios";
import "../styles/AdminAddUser.css";

const AdminAddUser = () => {
  const navigate = useNavigate();

  const resources = ["products", "brands", "categories", "users", "admin"];
  const actions = ["view", "create", "edit", "delete"];

  const validationSchema = Yup.object({
    name: Yup.string().required("Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    password: Yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
    role: Yup.string().oneOf(["super_admin", "admin"], "Invalid role").required("Role is required"),
  });

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
        email: values.email,
        password: values.password,
        role: values.role,
        isAdmin: true,
        permissions,
        createdAt: new Date().toISOString(),
      };

      await axios.post(`${process.env.REACT_APP_API_URL}/api/admin/users`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          "Content-Type": "application/json",
        },
      });

      alert("Admin user created successfully");
      navigate("/admin/admins");
    } catch (err) {
      console.error("Failed to create user:", err);
      alert("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-add-admin">
      <h1>Add New Admin</h1>

      <Formik
        initialValues={{
          name: "",
          email: "",
          password: "",
          role: "admin",
          ...Object.fromEntries(
            resources.flatMap((resource) =>
              actions.map((action) => [`${resource}_${action}`, false])
            )
          ),
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ isSubmitting, setFieldValue, values }) => (
          <Form className="admin-form">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <Field type="text" id="name" name="name" className="form-control" placeholder="Enter admin name" />
              <ErrorMessage name="name" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <Field type="email" id="email" name="email" className="form-control" placeholder="Enter admin email" />
              <ErrorMessage name="email" component="div" className="error-message" />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <Field
                type="password"
                id="password"
                name="password"
                className="form-control"
                placeholder="Enter password"
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
                  } else {
                    // Reset permissions when switching back to admin
                    resources.forEach((resource) => {
                      actions.forEach((action) => {
                        setFieldValue(`${resource}_${action}`, false);
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
                {isSubmitting ? "Adding..." : "Add Admin"}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/admins')}>
                Cancel
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default AdminAddUser;
