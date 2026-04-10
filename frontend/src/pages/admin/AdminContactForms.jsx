import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/AdminContactForms.css";

const AdminContactForms = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/contacts/all", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });
      setContacts(response.data || []);
    } catch (err) {
      setError("Failed to fetch contact forms");
      console.error("Failed to fetch contact forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const searchValue = searchTerm.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchValue) ||
      contact.email?.toLowerCase().includes(searchValue) ||
      contact.phone?.toLowerCase().includes(searchValue) ||
      contact.message?.toLowerCase().includes(searchValue)
    );
  });

  if (loading) {
    return (
      <div className="admin-contact-forms">
        <p>Loading contact forms...</p>
      </div>
    );
  }

  return (
    <div className="admin-contact-forms">
      <div className="contact-forms-header">
        <h1>Contact Forms</h1>
        <p className="total-contacts">Total Messages: {filteredContacts.length}</p>
      </div>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name, email, phone, or message..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {error ? <p className="no-contacts">{error}</p> : null}

      {!error && filteredContacts.length === 0 ? (
        <p className="no-contacts">No contact forms found</p>
      ) : null}

      {!error && filteredContacts.length > 0 ? (
        <div className="contact-forms-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Submitted On</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact._id}>
                  <td>{contact.name || "-"}</td>
                  <td>{contact.email || "-"}</td>
                  <td>{contact.phone || "-"}</td>
                  <td className="message-cell">{contact.message || "-"}</td>
                  <td>
                    {contact.createdAt
                      ? new Date(contact.createdAt).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};

export default AdminContactForms;
