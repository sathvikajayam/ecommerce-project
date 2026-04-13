import React from "react";
import { Navbar } from "../components";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import "../styles/Contact.css";
import axios from "axios";

const ContactPage = () => {
  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    phone: Yup.string()
      .matches(/^[0-9]{10}$/, "Invalid phone number (10 digits)")
      .required("Phone number is required"),
    message: Yup.string()
      .min(10, "Message must be at least 10 characters")
      .required("Message is required"),
  });

  return (
    <>
      <Navbar />

      <section className="contact-page">
        <h1 className="contact-title">Contact Us</h1>
        <div className="contact-divider"></div>

        <div className="contact-form-wrapper">
          <Formik
            initialValues={{ name: "", email: "", phone: "", message: "" }}
            validationSchema={validationSchema}
            onSubmit={(values, { resetForm }) => {
              axios.post(`${process.env.REACT_APP_API_URL}/api/contacts`, values)
  .then(() => alert("Message sent"));

            }}
          >
            {({ isValid, dirty }) => (
              <Form className="contact-form">
                {/* Name */}
                <div className="form-group">
                  <label>Name</label>
                  <Field
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                  />
                  <span className="error">
                    <ErrorMessage name="name" />
                  </span>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>Email</label>
                  <Field
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                  />
                  <span className="error">
                    <ErrorMessage name="email" />
                  </span>
                </div>

                {/* Phone */}
                <div className="form-group">
                  <label>Phone Number</label>
                  <Field
                    type="text"
                    name="phone"
                    placeholder="Enter 10-digit number"
                  />
                  <span className="error">
                    <ErrorMessage name="phone" />
                  </span>
                </div>

                {/* Message */}
                <div className="form-group">
                  <label>Message</label>
                  <Field
                    as="textarea"
                    name="message"
                    rows="5"
                    placeholder="Enter your message"
                  />
                  <span className="error">
                    <ErrorMessage name="message" />
                  </span>
                </div>

                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!(dirty && isValid)}
                >
                  Send Message
                </button>
              </Form>
            )}
          </Formik>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
