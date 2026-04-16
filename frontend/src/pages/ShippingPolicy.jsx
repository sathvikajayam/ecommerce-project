import React from "react";
import { Navbar, Footer } from "../components";
import "../styles/PolicyPages.css";

const ShippingPolicy = () => {
  return (
    <>
      <Navbar />
      <section className="policy-page">
        <div className="policy-page__inner">
          <h1 className="policy-page__title">Shipping Policy</h1>
          <div className="policy-page__divider" />

          <p className="policy-page__text">
            This Shipping Policy describes shipping timelines, fees, and delivery expectations.
          </p>

          <h2 className="policy-page__heading">Delivery Timelines</h2>
          <p className="policy-page__text">
            Delivery times vary by location and product availability. Estimated delivery is shown
            during checkout.
          </p>

          <h2 className="policy-page__heading">Shipping Fees</h2>
          <p className="policy-page__text">
            Shipping fees (if applicable) are calculated at checkout and displayed before you place
            an order.
          </p>

          <h2 className="policy-page__heading">Support</h2>
          <p className="policy-page__text">
            For shipping questions, reach out via the Contact Us page.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ShippingPolicy;

