import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import axios from "axios";
import "../../styles/Login.css";

const AdminResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();

  const validationSchema = Yup.object({
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref("password")], "Passwords must match")
      .required("Confirm your password"),
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Admin Reset Password</h1>
        <div className="login-divider"></div>

        <p className="login-helper-text">
          Set a new password for your admin account.
        </p>

        <Formik
          initialValues={{ password: "", confirmPassword: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm, setSubmitting }) => {
            try {
              const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/admin/users/reset-password/${token}`,
                { password: values.password }
              );
              toast.success(response?.data?.message || "Admin password reset successful");
              resetForm();
              navigate("/admin/login");
            } catch (error) {
              toast.error(
                error?.response?.data?.message || "Unable to reset admin password"
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isValid, dirty, isSubmitting }) => (
            <Form className="login-form">
              <div className="form-group">
                <label>New Password</label>
                <Field
                  type="password"
                  name="password"
                  placeholder="Enter new password"
                />
                <span className="error-text">
                  <ErrorMessage name="password" />
                </span>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <Field
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm new password"
                />
                <span className="error-text">
                  <ErrorMessage name="confirmPassword" />
                </span>
              </div>

              <button
                type="submit"
                className="login-btn"
                disabled={!(dirty && isValid) || isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </Form>
          )}
        </Formik>

        <div className="forgot-password-panel">
          <p>Back to admin sign in</p>
          <Link to="/admin/login" className="login-secondary-link">
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
