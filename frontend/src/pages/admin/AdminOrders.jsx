import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../styles/AdminOrders.css";

const formatDateTime = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const statusClass = (value, fallback = "pending") =>
  String(value || fallback).toLowerCase();

const formatMoney = (value) =>
  `${"\u20B9"}${Number(value || 0).toLocaleString("en-IN")}`;

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/api/orders");
        setOrders(response.data || []);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const filteredOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      const orderId = String(order?.orderId || "").toLowerCase();
      const customerName = String(order?.customer?.name || "").toLowerCase();
      const customerEmail = String(order?.customer?.email || "").toLowerCase();

      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        orderId.includes(term) ||
        customerName.includes(term) ||
        customerEmail.includes(term);

      const matchesStatus =
        statusFilter === "All Statuses" || order?.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const totals = useMemo(() => {
    const list = orders || [];
    return {
      total: list.length,
      pending: list.filter((o) => o?.orderStatus === "Pending").length,
      processing: list.filter((o) => o?.orderStatus === "Processing").length,
      shipped: list.filter((o) => o?.orderStatus === "Shipped").length,
      delivered: list.filter((o) => o?.orderStatus === "Delivered").length,
    };
  }, [orders]);

  if (loading) {
    return (
      <div className="admin-orders-container">
        <div className="loading-state">
          <i className="fa fa-spinner fa-spin" /> Loading orders...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
      <div className="orders-header">
        <div className="title-section">
          <h1>
            Orders <span className="order-badge">{orders.length} orders</span>
          </h1>
          <p className="subtitle">View and manage customer orders</p>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card total">
          <span className="count">{totals.total}</span>
          <span className="label">Total</span>
        </div>
        <div className="summary-card pending">
          <span className="count">{totals.pending}</span>
          <span className="label">Pending</span>
        </div>
        <div className="summary-card processing">
          <span className="count">{totals.processing}</span>
          <span className="label">Processing</span>
        </div>
        <div className="summary-card shipped">
          <span className="count">{totals.shipped}</span>
          <span className="label">Shipped</span>
        </div>
        <div className="summary-card delivered">
          <span className="count">{totals.delivered}</span>
          <span className="label">Delivered</span>
        </div>
      </div>

      <div className="orders-list-card">
        <div className="filters-section">
          <div className="orders-search">
            <i className="fa fa-search orders-search-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search by order ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="orders-status-dropdown">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>All Statuses</option>
              <option>Pending</option>
              <option>Processing</option>
              <option>Shipped</option>
              <option>Delivered</option>
            </select>
          </div>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>ORDER ID</th>
                <th>CUSTOMER</th>
                <th>DATE</th>
                <th>STATUS</th>
                <th>TOTAL</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-id">{order.orderId}</td>
                    <td className="customer-info">
                      <div className="name">{order?.customer?.name || "N/A"}</div>
                      <div className="email">
                        {order?.customer?.email || "N/A"}
                      </div>
                    </td>
                    <td className="date">{formatDateTime(order.date || order.createdAt)}</td>
                    <td className="status">
                      <span className={`status-pill ${statusClass(order.orderStatus)}`}>
                        <span className="dot" /> {order.orderStatus || "Pending"}
                      </span>
                    </td>
                    <td className="total-amount">{formatMoney(order.total)}</td>
                    <td className="actions">
                      <button
                        onClick={() => handleViewOrder(order)}
                        className="btn-small btn-view icon-action-btn"
                        title="View Order Details"
                        aria-label="View Order Details"
                      >
                        <i className="fa fa-eye" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: "#94a3b8",
                    }}
                  >
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && selectedOrder && (
        <OrderDetailsModal order={selectedOrder} onClose={closeModal} />
      )}
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState({
    orderStatus: order?.orderStatus || "Pending",
    paymentStatus: order?.paymentStatus || "Pending",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const handleStatusChange = (field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      setSaveMessage("");
      const payload = {
        orderStatus: editedOrder.orderStatus,
        paymentStatus: editedOrder.paymentStatus,
      };
      await axios.put(`/api/orders/${order._id}`, payload);
      setSaveMessage("Order updated successfully!");
      
      // Update the order object with new values
      order.orderStatus = editedOrder.orderStatus;
      order.paymentStatus = editedOrder.paymentStatus;
      
      setTimeout(() => {
        setSaveMessage("");
        setEditMode(false);
      }, 1500);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error updating order:", error);
      setSaveMessage(error.response?.data?.message || "Error updating order. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const orderStatus = String(editedOrder?.orderStatus || "Pending");
  const paymentStatus = String(editedOrder?.paymentStatus || "Pending");

  const address = order?.shippingAddress || {};
  const formattedAddress = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className="order-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="header-info">
            <h2>
              Order <span className="order-number">#{order.orderId}</span>
            </h2>
            <p className="modal-date">{formatDateTime(order.date || order.createdAt)}</p>
          </div>
          <div className="order-header-actions">
            {editMode && (
              <>
                <button
                  className="order-btn-save"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  aria-label="Save changes"
                >
                  <i className="fa fa-check" aria-hidden="true" /> Save
                </button>
                <button
                  className="order-btn-cancel"
                  onClick={() => {
                    setEditMode(false);
                    setEditedOrder({
                      orderStatus: order?.orderStatus || "Pending",
                      paymentStatus: order?.paymentStatus || "Pending",
                    });
                  }}
                  aria-label="Cancel editing"
                >
                  <i className="fa fa-times" aria-hidden="true" /> Cancel
                </button>
              </>
            )}
            {!editMode && (
              <button
                className="order-btn-edit"
                onClick={() => setEditMode(true)}
                aria-label="Edit order status"
              >
                <i className="fa fa-edit" aria-hidden="true" /> Edit
              </button>
            )}
            {!editMode && (
              <button
                className="order-close-btn"
                onClick={onClose}
                aria-label="Close order details"
              >
                <i className="fa fa-times" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
        {saveMessage && (
          <div className={`save-message ${saveMessage.includes("Error") ? "error" : "success"}`}>
            {saveMessage}
          </div>
        )}

        <div className="modal-body">
          <div className="status-total-row">
            <div className="status-block">
              <div className="icon-container order-status-icon">
                <i className="fa fa-cube" aria-hidden="true" />
              </div>
              <div className="block-details">
                <span className="block-label">Order Status</span>
                {editMode ? (
                  <select
                    value={editedOrder.orderStatus}
                    onChange={(e) => handleStatusChange("orderStatus", e.target.value)}
                    className="status-dropdown"
                  >
                    <option>Pending</option>
                    <option>Processing</option>
                    <option>Shipped</option>
                    <option>Delivered</option>
                  </select>
                ) : (
                  <span className={`status-pill ${statusClass(orderStatus)}`}>
                    <span className="dot" /> {orderStatus}
                  </span>
                )}
              </div>
            </div>
            <div className="total-block">
              <span className="block-label">Total Amount</span>
              <span className="amount">{formatMoney(order.total)}</span>
            </div>
          </div>

          <div className="info-grid">
            <div className="info-card">
              <div className="card-header">
                <i className="fa fa-user-o" aria-hidden="true" /> <span>Customer</span>
              </div>
              <div className="card-content">
                <div className="name">{order?.customer?.name || "N/A"}</div>
                <div className="phone">{order?.customer?.phone || "N/A"}</div>
              </div>
            </div>
            <div className="info-card">
              <div className="card-header">
                <i className="fa fa-truck" aria-hidden="true" />{" "}
                <span>Shipping Address</span>
              </div>
              <div className="card-content">
                <p>{formattedAddress || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="order-items-section">
            <h3>Order Items</h3>
            <div className="items-list">
              {(order.items || []).map((item, index) => {
                const qty = Number(item.qty || 0);
                const price = Number(item.price || 0);
                const title = item.title || item.name || "Product";
                return (
                  <div key={index} className="item-row">
                    <div className="item-left">
                      <div className="icon-container item-icon">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            style={{
                              width: "32px",
                              height: "32px",
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <i className="fa fa-cube" aria-hidden="true" />
                        )}
                      </div>
                      <div className="item-info">
                        <span className="item-name">{title}</span>
                        <span className="item-details">
                          Qty: {qty} {"\u00D7"} {formatMoney(price)}
                        </span>
                      </div>
                    </div>
                    <div className="item-right">
                      <span className="item-total">{formatMoney(qty * price)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="payment-section">
            <div className="payment-row">
              <div className="payment-method">
                <i className="fa fa-credit-card" aria-hidden="true" />
                <div className="details">
                  <span className="label">Payment Method</span>
                  <span className="value">{order.paymentMethod || "N/A"}</span>
                </div>
              </div>
              <div className="payment-status">
                <span className="label">Payment Status</span>
                {editMode ? (
                  <select
                    value={editedOrder.paymentStatus}
                    onChange={(e) => handleStatusChange("paymentStatus", e.target.value)}
                    className="status-dropdown"
                  >
                    <option>Pending</option>
                    <option>Paid</option>
                  </select>
                ) : (
                  <span className={`status-pill ${statusClass(paymentStatus)}`}>
                    <span className="dot" /> {paymentStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
