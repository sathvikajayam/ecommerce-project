import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Navbar } from "../components";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../styles/Login.css";
import axios from "axios";


const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location?.state?.from || "/";

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  return (
    <>
      <Navbar />

      <div className="login-page">
        <div className="login-card">
          <h1 className="login-title">Login</h1>
          <div className="login-divider"></div>

          <Formik
            initialValues={{ email: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={(values, { resetForm, setFieldError }) => {
  axios
    .post(`${process.env.REACT_APP_API_URL}/api/users/login`, values)
    .then((res) => {
      localStorage.setItem("user", JSON.stringify(res.data.user));
      // Keep a simple userId key too since other pages (Cart/Checkout) rely on it.
      try {
        const id = res?.data?.user?._id || res?.data?.user?.id;
        if (id) localStorage.setItem("userId", String(id));
        else localStorage.removeItem("userId");
      } catch {}
      alert(`Welcome back ${res.data.user.name}!`);
      navigate(redirectTo);
    })
    .catch(() => {
      setFieldError("email", "Invalid email or password");
      setFieldError("password", " ");
    })
    .finally(() => {
      resetForm(); // ✅ clears fields every time
    });
}}
          >
            {({ isValid, dirty }) => (
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

                <div className="form-group">
                  <label>Password</label>
                  <Field
                    type="password"
                    name="password"
                    placeholder="Password"
                  />
                  <span className="error-text">
                    <ErrorMessage name="password" />
                  </span>
                </div>

                <div className="login-link-row">
                  <Link to="/forgot-password" className="login-secondary-link">
                    Forgot Password?
                  </Link>
                </div>

                <p className="signup-text">
                  New user?{" "}
                  <Link to="/register">Create Account</Link>
                </p>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={!(dirty && isValid)}
                >
                  Login
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default Login;
