import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components";
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
    </div>
  );
};

export default OrderHistory;
