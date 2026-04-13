import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Navbar } from "../components";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import axios from "axios";
import "../styles/Login.css";

const ResetPassword = () => {
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
    <>
      <Navbar />

      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Reset Password</h1>
          <div className="login-divider"></div>

          <p className="login-helper-text">
            Enter your new password below. This reset link expires automatically for safety.
          </p>

          <Formik
            initialValues={{ password: "", confirmPassword: "" }}
            validationSchema={validationSchema}
            onSubmit={async (values, { resetForm, setSubmitting }) => {
              try {
                const response = await axios.post(
                  `${import.meta.env.VITE_API_URL}/api/users/reset-password/${token}`,
                  { password: values.password }
                );
                toast.success(response?.data?.message || "Password reset successful");
                resetForm();
                navigate("/login");
              } catch (error) {
                toast.error(
                  error?.response?.data?.message || "Unable to reset password right now"
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
            <p>Remembered your password?</p>
            <Link to="/login" className="login-secondary-link">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
