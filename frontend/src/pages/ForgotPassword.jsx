import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import toast from "react-hot-toast";
import axios from "axios";
import "../styles/Login.css";

const ForgotPassword = () => {
  const [submittedEmail, setSubmittedEmail] = useState("");

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
  });

  return (
    <>
      <Navbar />

      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Forgot Password</h1>
          <div className="login-divider"></div>

          <p className="login-helper-text">
            Enter your email address. This project does not have automated password reset yet, so
            we will guide you to support next.
          </p>

          <Formik
            initialValues={{ email: "" }}
            validationSchema={validationSchema}
            onSubmit={async (values, { resetForm, setSubmitting }) => {
              try {
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/forgot-password`, {
                  email: values.email,
                });
                setSubmittedEmail(values.email);
                toast.success(response?.data?.message || "Password reset email sent");
                resetForm();
              } catch (error) {
                toast.error(
                  error?.response?.data?.message || "Unable to send reset email right now"
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
                    placeholder="name@example.com"
                  />
                  <span className="error-text">
                    <ErrorMessage name="email" />
                  </span>
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={!(dirty && isValid) || isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
              </Form>
            )}
          </Formik>

          <div className="forgot-password-panel">
            <p>
              {submittedEmail
                ? `If ${submittedEmail} exists in our system, a reset link has been sent.`
                : "Need help recovering your password?"}
            </p>
            <Link to="/login" className="login-secondary-link muted">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
