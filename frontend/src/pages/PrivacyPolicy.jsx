import React from "react";
import { Navbar, Footer } from "../components";
import "../styles/PolicyPages.css";

const PrivacyPolicy = () => {
  return (
    <>
      <Navbar />
      <section className="policy-page">
        <div className="policy-page__inner">
          <h1 className="policy-page__title">Privacy Policy</h1>
          <div className="policy-page__divider" />

          <p className="policy-page__text">
            This Privacy Policy explains how we collect, use, and protect your information when you
            use our website and services.
          </p>

          <h2 className="policy-page__heading">Information We Collect</h2>
          <p className="policy-page__text">
            We may collect information you provide (such as name, email, phone number, and shipping
            address) and technical information (such as device/browser details and usage data).
          </p>

          <h2 className="policy-page__heading">How We Use Information</h2>
          <p className="policy-page__text">
            We use your information to process orders, provide customer support, improve our
            services, and communicate important updates.
          </p>

          <h2 className="policy-page__heading">Contact</h2>
          <p className="policy-page__text">
            For privacy-related questions, contact us via the Contact Us page.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;

