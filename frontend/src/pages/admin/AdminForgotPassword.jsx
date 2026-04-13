import React from "react";
import { Link } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import axios from "axios";
import "../../styles/Login.css";

const AdminForgotPassword = () => {
  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Admin Forgot Password</h1>
        <div className="login-divider"></div>

        <p className="login-helper-text">
          Enter your admin email address and we will send you a reset link.
        </p>

        <Formik
          initialValues={{ email: "" }}
          validationSchema={validationSchema}
          onSubmit={async (values, { resetForm, setSubmitting }) => {
            try {
              const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/admin/users/forgot-password`,
                { email: values.email }
              );
              toast.success(response?.data?.message || "Admin reset email sent");
              resetForm();
            } catch (error) {
              toast.error(
                error?.response?.data?.message || "Unable to send admin reset email"
              );
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isValid, dirty, isSubmitting }) => (
            <Form className="login-form">
              <div className="form-group">
                <label>Email</label>
                <Field
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                />
                <span className="error-text">
                  <ErrorMessage name="email" />
                </span>
              </div>

              <button
                type="submit"
                className="login-btn admin-forgot-btn"
                disabled={!(dirty && isValid) || isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
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

export default AdminForgotPassword;
