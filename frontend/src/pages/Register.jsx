import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../components";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../styles/Register.css";
import axios from "axios";


const Register = () => {
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Full name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Invalid phone number (10 digits)")
      .required("Phone number is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  return (
    <>
      <Navbar />

      <div className="register-page">
        <div className="register-card">
          <h1 className="register-title">Register</h1>
          <div className="register-divider"></div>

          <Formik
            initialValues={{ name: "", email: "", phone: "", password: "" }}
            validationSchema={validationSchema}
            onSubmit={(values, { resetForm }) => {
              axios.post(`${import.meta.env.VITE_API_URL}/api/users/register`, values)
  .then(res => {
    alert("Registered successfully");
    navigate("/login");
  })
  .catch(err => alert(err.response.data.message));

            }}
          >
            {({ isValid, dirty }) => (
              <Form className="register-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <Field
                    type="text"
                    name="name"
                    placeholder="Enter your full name"
                  />
                  <span className="error-text">
                    <ErrorMessage name="name" />
                  </span>
                </div>

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
                  <label>Phone Number</label>
                  <Field
                    type="text"
                    name="phone"
                    placeholder="Enter 10-digit number"
                  />
                  <span className="error-text">
                    <ErrorMessage name="phone" />
                  </span>
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <Field
                    type="password"
                    name="password"
                    placeholder="At least 6 characters"
                  />
                  <span className="error-text">
                    <ErrorMessage name="password" />
                  </span>
                </div>

                <p className="login-text">
                  Already have an account?{" "}
                  <Link to="/login">Login here</Link>
                </p>

                <button
                  type="submit"
                  className="register-btn"
                  disabled={!(dirty && isValid)}
                >
                  Create Account
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </>
  );
};

export default Register;
