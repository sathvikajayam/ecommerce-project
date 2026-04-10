import React from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "../components";
import "../styles/OrderSuccess.css";

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentMethod = searchParams.get("paymentMethod") || "Unknown";

  const isCOD = paymentMethod === "Cash on Delivery";

  return (
    <div className="order-success-page-root">
      <Navbar />
      <div className="order-success-container">
        <div className="order-success-card">
          <div className="success-icon" aria-hidden="true">
            <i className="fa fa-check-circle" />
          </div>
          <h1 className="title">Order Placed Successfully</h1>
          <p className="subtitle">
            {isCOD 
              ? "Your order has been received. Please pay in cash when the delivery agent arrives."
              : "Your order has been placed successfully."
            }
          </p>
          <div className="order-id">
            <span className="label">Order ID:</span>{" "}
            <span className="value">{orderId || "N/A"}</span>
          </div>
          <div className="actions">
            <Link to="/" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;

