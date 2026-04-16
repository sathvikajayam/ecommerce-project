import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Navbar, Footer } from "../components";
import { addCart as addCartApi } from "./action";
import { addCart as addCartLocal } from "../redux/action";
import "../styles/OrderHistory.css";

const ORDER_TABS = [
  { id: "orders", label: "Orders" },
  { id: "buyAgain", label: "Buy Again" },
  { id: "notYetShipped", label: "Not Yet Shipped" },
];

const DATE_FILTERS = [
  { value: "3m", label: "past 3 months" },
  { value: "6m", label: "past 6 months" },
  { value: "12m", label: "past 12 months" },
  { value: "all", label: "all time" },
];

const formatMoney = (value) =>
  `\u20b9${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatOrderDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const normalizeStatus = (status) => String(status || "Pending").trim().toLowerCase();

const getStatusTone = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "delivered") return "delivered";
  if (normalized === "shipped") return "shipped";
  if (normalized === "processing") return "processing";
  return "pending";
};

const isWithinRange = (dateValue, range) => {
  if (range === "all") return true;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const monthsBack = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const threshold = new Date(now);
  threshold.setMonth(now.getMonth() - monthsBack);

  return date >= threshold;
};

const getImageSrc = (image) => {
  const value = String(image || "").trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return value;
};

const formatAddress = (shippingAddress) => {
  if (!shippingAddress) return "N/A";

  return [
    shippingAddress.line1,
    shippingAddress.line2,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.pincode,
  ]
    .filter(Boolean)
    .join(", ");
};

const generateInvoicePDF = (order) => {
  if (!order) return null;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const rs = "Rs.";

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

  doc.setFillColor(31, 41, 55);
  doc.rect(0, 0, pageWidth, 45, "F");

  addText("INVOICE", margin, 22, { size: 24, style: "bold", color: [255, 255, 255] });
  addText("Tax Invoice / Receipt", margin, 30, { size: 10, color: [156, 163, 175] });

  addText(`Order: ${order.orderId || "N/A"}`, pageWidth - margin, 18, {
    size: 10,
    style: "bold",
    color: [255, 255, 255],
    align: "right",
  });
  const orderDate = order.date ? new Date(order.date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "N/A";
  addText(`Date: ${orderDate}`, pageWidth - margin, 26, {
    size: 9,
    color: [156, 163, 175],
    align: "right",
  });
  addText(`Status: ${order.orderStatus || "Pending"}`, pageWidth - margin, 34, {
    size: 9,
    color: [156, 163, 175],
    align: "right",
  });
  addText(`Payment: ${order.paymentMethod || "N/A"}`, pageWidth - margin, 42, {
    size: 9,
    color: [156, 163, 175],
    align: "right",
  });

  let y = 58;
  const rightColX = margin + contentWidth / 2 + 10;
  const rightColMaxW = pageWidth - margin - rightColX;
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

  const colNumX = margin + 3;
  const colItemX = margin + 14;
  const colQtyX = margin + contentWidth * 0.62;
  const colPriceX = margin + contentWidth * 0.78;
  const colTotalX = pageWidth - margin - 3;
  const itemNameMaxWidth = colQtyX - colItemX - 6;

  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y - 5, contentWidth, 10, 1, 1, "F");

  addText("#", colNumX, y + 1, { size: 8, style: "bold", color: [107, 114, 128] });
  addText("ITEM", colItemX, y + 1, { size: 8, style: "bold", color: [107, 114, 128] });
  addText("QTY", colQtyX, y + 1, { size: 8, style: "bold", color: [107, 114, 128], align: "center" });
  addText("PRICE", colPriceX, y + 1, { size: 8, style: "bold", color: [107, 114, 128], align: "right" });
  addText("TOTAL", colTotalX, y + 1, { size: 8, style: "bold", color: [107, 114, 128], align: "right" });

  y += 10;

  (order.items || []).forEach((item, index) => {
    const unitPrice = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    const itemTotal = unitPrice * qty;
    const itemName = item.title || "Product";

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const nameLines = doc.splitTextToSize(String(itemName), itemNameMaxWidth);
    const rowHeight = Math.max(nameLines.length * 5 + 4, 9);

    if (index % 2 === 0) {
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, y - 4, contentWidth, rowHeight, "F");
    }

    addText(String(index + 1), colNumX, y + 1, { size: 9, color: [107, 114, 128] });
    let nameY = y + 1;
    nameLines.forEach((line) => {
      addText(line, colItemX, nameY, { size: 9 });
      nameY += 5;
    });

    addText(String(qty), colQtyX, y + 1, { size: 9, align: "center" });
    addText(`${rs}${unitPrice.toFixed(2)}`, colPriceX, y + 1, { size: 9, align: "right" });
    addText(`${rs}${itemTotal.toFixed(2)}`, colTotalX, y + 1, { size: 9, style: "bold", align: "right" });

    y += rowHeight;
  });

  y += 6;
  drawLine(y, [229, 231, 235]);
  y += 10;

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

  const shipping = 30;
  addText("Shipping", summaryX, y, { size: 10, color: [107, 114, 128] });
  addText(`${rs}${shipping.toFixed(2)}`, summaryValX, y, { size: 10, align: "right" });
  y += 10;

  drawLine(y - 3, [209, 213, 219]);
  doc.setFillColor(31, 41, 55);
  doc.roundedRect(summaryX - 5, y - 1, pageWidth - margin - summaryX + 8, 12, 2, 2, "F");

  addText("Amount Payable", summaryX, y + 7, { size: 11, style: "bold", color: [255, 255, 255] });
  addText(`${rs}${(Number(order.total) || 0).toFixed(2)}`, summaryValX, y + 7, { size: 12, style: "bold", color: [255, 255, 255], align: "right" });

  y += 24;
  doc.setFillColor(243, 244, 246);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
  addText("Payment Method", margin + 8, y + 8, { size: 9, style: "bold", color: [107, 114, 128] });
  addText(order.paymentMethod || "N/A", margin + 55, y + 8, { size: 9 });
  addText("Payment Status", margin + 8, y + 14, { size: 9, style: "bold", color: [107, 114, 128] });
  const payStatus = order.paymentStatus || "Pending";
  const payColor = payStatus === "Paid" ? [34, 197, 94] : [234, 179, 8];
  addText(payStatus, margin + 55, y + 14, { size: 9, style: "bold", color: payColor });

  y += 28;
  drawLine(y, [229, 231, 235]);
  y += 8;
  addText("Thank you for your purchase!", pageWidth / 2, y, { size: 10, style: "italic", color: [107, 114, 128], align: "center" });
  y += 6;
  addText("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, y, {
    size: 7,
    color: [156, 163, 175],
    align: "center",
  });

  return doc;
};

const getInvoiceFileName = (order) => {
  const safeOrderId = String(order?.orderId || order?._id || "order").replace(/[^a-zA-Z0-9]/g, "");
  return `Invoice_${safeOrderId}.pdf`;
};

const downloadInvoice = (order) => {
  const doc = generateInvoicePDF(order);
  if (doc) doc.save(getInvoiceFileName(order));
};

const openInvoice = (order) => {
  const doc = generateInvoicePDF(order);
  if (!doc) return;
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

const OrderHistory = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("3m");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [addingOrderId, setAddingOrderId] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      toast.error("Please login first");
      navigate("/login", { state: { from: "/order-history" } });
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login", { state: { from: "/order-history" } });
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("/api/orders/history", {
          params: {
            userId: user?._id || user?.id || "",
            email: user?.email || "",
          },
        });
        setOrders(Array.isArray(data?.orders) ? data.orders : []);
      } catch (error) {
        console.error("Failed to load order history:", error);
        toast.error("Unable to load your orders");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const visibleOrders = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const orderDate = order?.createdAt || order?.date;
      if (!isWithinRange(orderDate, dateFilter)) return false;

      const status = normalizeStatus(order?.orderStatus);
      if (activeTab === "notYetShipped" && ["shipped", "delivered"].includes(status)) {
        return false;
      }

      if (activeTab === "buyAgain") {
        const hasItems = Array.isArray(order?.items) && order.items.length > 0;
        if (!hasItems) return false;
      }

      if (!search) return true;

      const itemMatch = (order?.items || []).some((item) =>
        String(item?.title || "").toLowerCase().includes(search)
      );

      return (
        String(order?.orderId || "").toLowerCase().includes(search) ||
        String(order?.customer?.name || "").toLowerCase().includes(search) ||
        String(order?.orderStatus || "").toLowerCase().includes(search) ||
        itemMatch
      );
    });
  }, [orders, searchTerm, dateFilter, activeTab]);

  const totalOrdersText = `${visibleOrders.length} order${visibleOrders.length === 1 ? "" : "s"} placed`;

  const getTabHeading = () => {
    if (activeTab === "notYetShipped") {
      return {
        title: "Not yet shipped orders",
        subtitle: "Showing only pending and processing orders with their product details.",
      };
    }

    if (activeTab === "buyAgain") {
      return {
        title: "Buy again",
        subtitle: "Reorder items from your previous purchases.",
      };
    }

    return {
      title: "Your Orders",
      subtitle: `Order history for ${user?.name || "your account"}`,
    };
  };

  const tabHeading = getTabHeading();

  const toggleExpanded = (orderKey) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderKey]: !prev[orderKey],
    }));
  };

  const handleAddAllToCart = async (order) => {
    const userId = user?._id || user?.id || localStorage.getItem("userId");
    const items = Array.isArray(order?.items) ? order.items : [];
    if (!items.length) {
      toast.error("No items found in this order");
      return;
    }

    try {
      setAddingOrderId(order?._id || order?.orderId || "");

      if (userId) {
        await Promise.all(
          items.map((item) =>
            dispatch(addCartApi(item.productId, userId, Number(item.qty) || 1))
          )
        );
      } else {
        items.forEach((item) => {
          dispatch(
            addCartLocal({
              _id: item?.productId,
              title: item?.title,
              image: item?.image,
              price: item?.price,
            }, Number(item.qty) || 1)
          );
        });
      }

      toast.success("Items added to cart");
    } catch (error) {
      console.error("Failed to add items to cart:", error);
      toast.error("Could not add items to cart");
    } finally {
      setAddingOrderId("");
    }
  };

  if (!user) {
    return (
      <div className="order-history-page">
        <Navbar />
        <Footer />
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <Navbar />

      <div className="order-history-container">
        <div className="order-history-topbar">
          <div>
            <h1>{tabHeading.title}</h1>
            <p className="order-history-subtitle">
              {tabHeading.subtitle}
            </p>
          </div>

          <div className="order-history-search-wrap">
            <div className="order-history-search">
              <i className="fa fa-search" aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search all orders"
              />
            </div>
            <button type="button" className="order-search-btn">
              Search Orders
            </button>
          </div>
        </div>

        <div className="order-history-tabs" role="tablist" aria-label="Order sections">
          {ORDER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`order-history-tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => {
                if (tab.id === "buyAgain") {
                  navigate("/search?category=all&brand=all");
                  return;
                }
                setActiveTab(tab.id);
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="order-history-toolbar">
          <div className="order-history-summary">
            <strong>{totalOrdersText}</strong>
            <span>in</span>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              {DATE_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="order-history-empty">
            <i className="fa fa-spinner fa-spin" aria-hidden="true" />
            <p>Loading your orders...</p>
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="order-history-empty">
            <i className="fa fa-shopping-bag" aria-hidden="true" />
            <h2>No orders found</h2>
            <p>Try another search or date filter, or place your first order.</p>
          </div>
        ) : (
          <div className="order-history-list">
            {visibleOrders.map((order) => {
              const orderKey = order?._id || order?.orderId;
              const isExpanded = Boolean(expandedOrders[orderKey]);
              const showDetails = activeTab === "notYetShipped" || isExpanded;
              const statusTone = getStatusTone(order?.orderStatus);

              return (
                <article key={orderKey} className="order-card">
                  <div className="order-card-head">
                    <div className="order-meta-grid">
                      <div>
                        <span className="label">Order placed</span>
                        <strong>{formatOrderDate(order?.createdAt || order?.date)}</strong>
                      </div>
                      <div>
                        <span className="label">Total</span>
                        <strong>{formatMoney(order?.total)}</strong>
                      </div>
                      <div>
                        <span className="label">Ship to</span>
                        <strong>{order?.customer?.name || user?.name}</strong>
                      </div>
                      <div className="order-number-block">
                        <span className="label">Order {order?.orderId || "N/A"}</span>
                        <strong className={`status-pill ${statusTone}`}>
                          {order?.orderStatus || "Pending"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="order-card-body">
                    <div className="order-card-content">
                      <div className="order-card-copy">
                        <h2>{order?.orderStatus || "Order placed"}</h2>
                        <p>
                          Payment: {order?.paymentMethod || "N/A"} · Payment status:{" "}
                          {order?.paymentStatus || "Pending"}
                        </p>
                        <div className="order-items-preview">
                          {(order?.items || []).map((item, index) => (
                            <div key={`${orderKey}-${index}`} className="order-item-row">
                              <img
                                src={getImageSrc(item?.image)}
                                alt={item?.title || "Product"}
                                className="order-item-thumb"
                              />
                              <div className="order-item-info">
                                <h3>{item?.title || "Product"}</h3>
                                <p>Qty: {item?.qty || 0}</p>
                                <p>{formatMoney(item?.price)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {showDetails ? (
                          <div className="order-detail-panel">
                            <div className="order-detail-grid">
                              <div className="order-detail-card">
                                <h3>Delivery Details</h3>
                                <p>
                                  <span>Name:</span> {order?.customer?.name || user?.name || "N/A"}
                                </p>
                                <p>
                                  <span>Mobile Number:</span> {order?.customer?.phone || "N/A"}
                                </p>
                                <p>
                                  <span>Address:</span> {formatAddress(order?.shippingAddress)}
                                </p>
                              </div>

                              <div className="order-detail-card">
                                <h3>Order Summary</h3>
                                <p>
                                  <span>Items:</span> {(order?.items || []).length}
                                </p>
                                <p>
                                  <span>Subtotal:</span> {formatMoney(order?.subtotal)}
                                </p>
                                <p>
                                  <span>Discount:</span> {formatMoney(order?.discountAmount)}
                                </p>
                                <p>
                                  <span>Total:</span> {formatMoney(order?.total)}
                                </p>
                                <p>
                                  <span>Payment Method:</span> {order?.paymentMethod || "N/A"}
                                </p>
                                {order?.couponCode ? (
                                  <p>
                                    <span>Coupon:</span> {order.couponCode}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="invoice-section">
                              <h3>Invoice</h3>
                              <div className="invoice-preview">
                                <div className="invoice-preview-icon">
                                  <i className="fa fa-file-pdf-o" />
                                </div>
                                <div className="invoice-preview-info">
                                  <span className="invoice-preview-title">Invoice</span>
                                  <span className="invoice-preview-detail">
                                    {(order?.items?.length || 0)} item(s) · {formatMoney(order?.total)}
                                  </span>
                                </div>
                                <div className="invoice-preview-actions">
                                  <button
                                    type="button"
                                    className="icon-action-btn"
                                    onClick={() => openInvoice(order)}
                                    title="Open Invoice"
                                  >
                                    <i className="fa fa-external-link" />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-action-btn"
                                    onClick={() => downloadInvoice(order)}
                                    title="Download Invoice"
                                  >
                                    <i className="fa fa-download" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="order-card-actions">
                        <button
                          type="button"
                          className="action-btn primary"
                          onClick={() => handleAddAllToCart(order)}
                          disabled={addingOrderId === orderKey}
                        >
                          {addingOrderId === orderKey ? "Adding..." : "Add all items to Cart"}
                        </button>
                        {activeTab === "notYetShipped" ? (
                          <button
                            type="button"
                            className="action-btn secondary"
                            disabled
                          >
                            Order details shown below
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="action-btn secondary"
                            onClick={() => toggleExpanded(orderKey)}
                          >
                            {isExpanded ? "Hide order details" : "View order details"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default OrderHistory;
