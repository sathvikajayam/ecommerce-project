import React from "react";
import { Navbar, Footer } from "../components";
import "../styles/PolicyPages.css";

const TermsConditions = () => {
  return (
    <>
      <Navbar />
      <section className="policy-page">
        <div className="policy-page__inner">
          <h1 className="policy-page__title">Terms &amp; Conditions</h1>
          <div className="policy-page__divider" />

          <p className="policy-page__text">
            By using this website, you agree to comply with and be bound by these Terms &amp;
            Conditions. Please review them carefully.
          </p>

          <h2 className="policy-page__heading">Orders</h2>
          <p className="policy-page__text">
            Orders are subject to product availability and confirmation. We may refuse or cancel an
            order if required.
          </p>

          <h2 className="policy-page__heading">Pricing</h2>
          <p className="policy-page__text">
            Prices may change without notice. We try to ensure pricing accuracy, but errors may
            occur and will be corrected.
          </p>

          <h2 className="policy-page__heading">Limitation of Liability</h2>
          <p className="policy-page__text">
            To the maximum extent permitted by law, we are not liable for indirect or consequential
            damages arising from use of our services.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default TermsConditions;

