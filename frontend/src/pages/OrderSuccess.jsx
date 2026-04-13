import React, { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Navbar } from "../components";
import axios from "axios";
import { jsPDF } from "jspdf";
import "../styles/OrderSuccess.css";

const OrderSuccess = () => {
  const { orderId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentMethod = searchParams.get("paymentMethod") || "Unknown";
  const isCOD = paymentMethod === "Cash on Delivery";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`/api/orders/by-order-id/${encodeURIComponent(orderId)}`);
        if (data.success && data.order) {
          setOrder(data.order);
        } else {
          setError("Could not load order details.");
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("Could not load order details.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const generateInvoicePDF = () => {
    if (!order) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;
    let y = 20;

    // Use "Rs." instead of ₹ since jsPDF's built-in Helvetica doesn't support the ₹ Unicode glyph
    const rs = "Rs.";

    // --- Helper functions ---
    const drawLine = (yPos, color = [200, 200, 200]) => {
      doc.setDrawColor(...color);
      doc.setLineWidth(0.5);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    const addText = (text, x, yPos, options = {}) => {
      const { size = 10, style = "normal", color = [15, 17, 17], align = "left" } = options;
      doc.setFontSize(size);
      doc.setFont("helvetica", style);
      doc.setTextColor(...color);
      doc.text(String(text), x, yPos, { align });
    };

    // --- Header: Invoice title + branding ---
    doc.setFillColor(31, 41, 55);
    doc.rect(0, 0, pageWidth, 45, "F");

    addText("INVOICE", margin, 22, { size: 24, style: "bold", color: [255, 255, 255] });
    addText("Tax Invoice / Receipt", margin, 30, { size: 10, color: [156, 163, 175] });

    // Order details on right side of header
    addText(`Order: ${order.orderId || "N/A"}`, pageWidth - margin, 18, {
      size: 10, style: "bold", color: [255, 255, 255], align: "right",
    });
    const orderDate = order.date ? new Date(order.date).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    }) : "N/A";
    addText(`Date: ${orderDate}`, pageWidth - margin, 26, {
      size: 9, color: [156, 163, 175], align: "right",
    });
    addText(`Status: ${order.orderStatus || "Pending"}`, pageWidth - margin, 34, {
      size: 9, color: [156, 163, 175], align: "right",
    });
    addText(`Payment: ${order.paymentMethod || "N/A"}`, pageWidth - margin, 42, {
      size: 9, color: [156, 163, 175], align: "right",
    });

    y = 58;

    // --- Customer & Shipping side-by-side ---
    const rightColX = margin + contentWidth / 2 + 10;
    const rightColMaxW = pageWidth - margin - rightColX; // available width for ship-to text

    // Billing To (left column)
    const billStartY = y;
    addText("BILL TO", margin, y, { size: 8, style: "bold", color: [107, 114, 128] });
    y += 8;
    addText(order.customer?.name || "N/A", margin, y, { size: 11, style: "bold" });
    y += 7;
    if (order.customer?.email && order.customer.email !== "N/A") {
      addText(order.customer.email, margin, y, { size: 9, color: [107, 114, 128] });
      y += 6;
    }
    if (order.customer?.phone) {
      addText(`Phone: ${order.customer.phone}`, margin, y, { size: 9, color: [107, 114, 128] });
      y += 6;
    }

    // Ship To (right column) — use splitTextToSize for long address lines
    let yRight = billStartY;
    addText("SHIP TO", rightColX, yRight, { size: 8, style: "bold", color: [107, 114, 128] });
    yRight += 8;

    const addr = order.shippingAddress || {};
    const addrLines = [];
    if (addr.line1) addrLines.push(addr.line1);
    if (addr.line2) addrLines.push(addr.line2);
    const cityState = [addr.city, addr.state].filter(Boolean).join(", ");
    if (cityState) addrLines.push(cityState);
    if (addr.pincode) addrLines.push(`PIN: ${addr.pincode}`);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    addrLines.forEach((line) => {
      const wrapped = doc.splitTextToSize(String(line), rightColMaxW);
      wrapped.forEach((wl) => {
        addText(wl, rightColX, yRight, { size: 9 });
        yRight += 6;
      });
    });

    y = Math.max(y, yRight) + 10;
    drawLine(y, [229, 231, 235]);
    y += 10;

    // --- Items Table Header ---
    const colNumX = margin + 3;
    const colItemX = margin + 14;
    const colQtyX = margin + contentWidth * 0.62;
    const colPriceX = margin + contentWidth * 0.78;
    const colTotalX = pageWidth - margin - 3;
    const itemNameMaxWidth = colQtyX - colItemX - 6; // max width for item name text

    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y - 5, contentWidth, 10, 1, 1, "F");

    addText("#", colNumX, y + 1, { size: 8, style: "bold", color: [107, 114, 128] });
    addText("ITEM", colItemX, y + 1, { size: 8, style: "bold", color: [107, 114, 128] });
    addText("QTY", colQtyX, y + 1, { size: 8, style: "bold", color: [107, 114, 128], align: "center" });
    addText("PRICE", colPriceX, y + 1, { size: 8, style: "bold", color: [107, 114, 128], align: "right" });
    addText("TOTAL", colTotalX, y + 1, { size: 8, style: "bold", color: [107, 114, 128], align: "right" });

    y += 10;

    // --- Items Rows ---
    const items = order.items || [];
    items.forEach((item, index) => {
      const unitPrice = Number(item.price) || 0;
      const qty = Number(item.qty) || 0;
      const itemTotal = unitPrice * qty;
      const itemName = item.title || "Product";

      // Wrap item name into multiple lines
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const nameLines = doc.splitTextToSize(String(itemName), itemNameMaxWidth);
      const rowHeight = Math.max(nameLines.length * 5 + 4, 9);

      // Alternate row background
      if (index % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 4, contentWidth, rowHeight, "F");
      }

      // Row number
      addText(String(index + 1), colNumX, y + 1, { size: 9, color: [107, 114, 128] });

      // Item name (multi-line)
      let nameY = y + 1;
      nameLines.forEach((line) => {
        addText(line, colItemX, nameY, { size: 9 });
        nameY += 5;
      });

      // Qty, Price, Total — vertically centered in the row
      const midY = y + 1;
      addText(String(qty), colQtyX, midY, { size: 9, align: "center" });
      addText(`${rs}${unitPrice.toFixed(2)}`, colPriceX, midY, { size: 9, align: "right" });
      addText(`${rs}${itemTotal.toFixed(2)}`, colTotalX, midY, { size: 9, style: "bold", align: "right" });

      y += rowHeight;
    });

    y += 6;
    drawLine(y, [229, 231, 235]);
    y += 10;

    // --- Summary Section ---
    const summaryX = margin + contentWidth * 0.55;
    const summaryValX = pageWidth - margin - 3;

    addText("Subtotal", summaryX, y, { size: 10, color: [107, 114, 128] });
    addText(`${rs}${(Number(order.subtotal) || 0).toFixed(2)}`, summaryValX, y, { size: 10, align: "right" });
    y += 8;

    if (Number(order.discountAmount) > 0) {
      addText(`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, summaryX, y, { size: 10, color: [34, 197, 94] });
      addText(`-${rs}${Number(order.discountAmount).toFixed(2)}`, summaryValX, y, { size: 10, color: [34, 197, 94], align: "right" });
      y += 8;
    }

    // Shipping
    const shipping = 30;
    addText("Shipping", summaryX, y, { size: 10, color: [107, 114, 128] });
    addText(`${rs}${shipping.toFixed(2)}`, summaryValX, y, { size: 10, align: "right" });
    y += 10;

    // Total line
    drawLine(y - 3, [209, 213, 219]);
    doc.setFillColor(31, 41, 55);
    doc.roundedRect(summaryX - 5, y - 1, pageWidth - margin - summaryX + 8, 12, 2, 2, "F");

    addText("Amount Payable", summaryX, y + 7, { size: 11, style: "bold", color: [255, 255, 255] });
    addText(`${rs}${(Number(order.total) || 0).toFixed(2)}`, summaryValX, y + 7, { size: 12, style: "bold", color: [255, 255, 255], align: "right" });

    y += 24;

    // --- Payment Info ---
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
    addText("Payment Method", margin + 8, y + 8, { size: 9, style: "bold", color: [107, 114, 128] });
    addText(order.paymentMethod || "N/A", margin + 55, y + 8, { size: 9 });
    addText("Payment Status", margin + 8, y + 14, { size: 9, style: "bold", color: [107, 114, 128] });
    const payStatus = order.paymentStatus || "Pending";
    const payColor = payStatus === "Paid" ? [34, 197, 94] : [234, 179, 8];
    addText(payStatus, margin + 55, y + 14, { size: 9, style: "bold", color: payColor });

    y += 28;

    // --- Footer ---
    drawLine(y, [229, 231, 235]);
    y += 8;
    addText("Thank you for your purchase!", pageWidth / 2, y, { size: 10, style: "italic", color: [107, 114, 128], align: "center" });
    y += 6;
    addText("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, y, {
      size: 7, color: [156, 163, 175], align: "center",
    });

    return doc;
  };

  const getInvoiceFileName = () => {
    const safeOrderId = (order?.orderId || "order").replace(/[^a-zA-Z0-9]/g, "");
    return `Invoice_${safeOrderId}.pdf`;
  };

  const downloadInvoice = () => {
    const doc = generateInvoicePDF();
    if (doc) doc.save(getInvoiceFileName());
  };

  const openInvoice = () => {
    const doc = generateInvoicePDF();
    if (!doc) return;
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

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

          {/* Invoice Section */}
          <div className="invoice-section">
            {loading ? (
              <div className="invoice-loading">
                <i className="fa fa-spinner fa-spin" /> Loading invoice...
              </div>
            ) : error ? (
              <div className="invoice-error">
                <i className="fa fa-exclamation-circle" /> {error}
              </div>
            ) : order ? (
              <div className="invoice-ready">
                <div className="invoice-preview">
                  <div className="invoice-preview-icon">
                    <i className="fa fa-file-pdf-o" />
                  </div>
                  <div className="invoice-preview-info">
                    <span className="invoice-preview-title">Invoice</span>
                    <span className="invoice-preview-detail">
                      {order.items?.length || 0} item(s) · Rs.{(Number(order.total) || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="invoice-preview-actions">
                    <button className="icon-action-btn" onClick={openInvoice} title="Open Invoice">
                      <i className="fa fa-external-link" />
                    </button>
                    <button className="icon-action-btn" onClick={downloadInvoice} title="Download Invoice">
                      <i className="fa fa-download" />
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
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
