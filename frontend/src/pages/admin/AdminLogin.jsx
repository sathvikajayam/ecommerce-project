import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../../styles/Login.css";

import axios from "axios";

const AdminLogin = () => {
    const navigate = useNavigate();

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

            <div className="login-page">
                <div className="login-card">
                    <h1 className="login-title">Admin Login</h1>
                    <div className="login-divider"></div>

                    <Formik
                        initialValues={{ email: "", password: "" }}
                        validationSchema={validationSchema}
                        onSubmit={(values, { resetForm, setFieldError }) => {
                            axios
                                .post("http://localhost:5000/api/users/login", values)
                                .then((res) => {
                                    if (res.data.user.isAdmin) {
                                        localStorage.setItem("adminUser", JSON.stringify(res.data.user));
                                        localStorage.setItem("adminToken", res.data.token);
                                        alert(`Welcome Admin ${res.data.user.name}!`);
                                        navigate("/admin/dashboard");
                                    } else {
                                        setFieldError("email", "Access denied. Admins only.");
                                        alert("Access denied. You do not have admin privileges.");
                                    }
                                })
                                .catch((error) => {
                                    setFieldError("email", "Invalid email or password");
                                    setFieldError("password", " ");
                                });
                        }}
                    >
                        {({ isSubmitting, errors, touched }) => (
                            <Form className="login-form">
                                <div className="form-group mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email Address
                                    </label>
                                    <Field
                                        type="email"
                                        id="email"
                                        name="email"
                                        className={`form-control ${
                                            errors.email && touched.email ? "is-invalid" : ""
                                        }`}
                                        placeholder="Enter your email"
                                    />
                                    <ErrorMessage name="email" component="div" className="invalid-feedback d-block" />
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="password" className="form-label">
                                        Password
                                    </label>
                                    <Field
                                        type="password"
                                        id="password"
                                        name="password"
                                        className={`form-control ${
                                            errors.password && touched.password ? "is-invalid" : ""
                                        }`}
                                        placeholder="Enter your password"
                                    />
                                    <ErrorMessage name="password" component="div" className="invalid-feedback d-block" />
                                </div>

                                <div className="login-link-row">
                                    <Link to="/admin/forgot-password" className="login-secondary-link">
                                        Forgot Password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary w-100 mb-3"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Logging in..." : "Login"}
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </>
    );
};

export default AdminLogin;
