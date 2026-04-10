import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components";
import "./styles/Profile.css";

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  // ✅ Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("Please login first!");
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setFormData({
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        address: userData.address || "",
      });
    } catch (error) {
      console.error("Failed to parse user data:", error);
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ✅ Handle save profile
  const handleSaveProfile = () => {
    // Update localStorage
    const updatedUser = { ...user, ...formData };
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  // ✅ Handle logout
  const handleLogout = () => {
      if (window.confirm("Are you sure you want to logout?")) {
        localStorage.removeItem("user");
        localStorage.removeItem("userId");
        alert("Logged out successfully!");
        navigate("/");
      }
    };

  // ✅ Handle change password
  const handleChangePassword = () => {
    alert("Password change feature coming soon!");
  };

  if (!user) {
    return <div className="profile-page"><Navbar /></div>;
  }

  return (
    <>
      <Navbar />
      <div className="profile-page">
        <div className="profile-container">
          {/* Profile Header */}
          <div className="profile-header-section">
            <div className="profile-avatar">
              <i className="fa-solid fa-user-circle"></i>
            </div>
            <div className="profile-header-info">
              <h1>{user.name}</h1>
              <p className="profile-email-display">{user.email}</p>
              <div className="profile-header-actions">
                <button
                  className="btn-primary"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
                <button className="btn-secondary" onClick={handleChangePassword}>
                  Change Password
                </button>
                <button className="btn-danger" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="profile-content">
            {isEditing ? (
              // ✅ EDIT MODE
              <div className="profile-form">
                <h2>Edit Profile</h2>

                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter your address"
                    rows="4"
                  />
                </div>

                <div className="form-actions">
                  <button className="btn-success" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // ✅ VIEW MODE
              <div className="profile-view">
                <div className="profile-section">
                  <h2>Personal Information</h2>
                  <div className="profile-field">
                    <label>Full Name</label>
                    <p>{user.name || "Not provided"}</p>
                  </div>

                  <div className="profile-field">
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>

                  <div className="profile-field">
                    <label>Phone</label>
                    <p>{user.phone || "Not provided"}</p>
                  </div>

                  <div className="profile-field">
                    <label>Address</label>
                    <p>{user.address || "Not provided"}</p>
                  </div>
                </div>

                <div className="profile-section">
                  <h2>Account Information</h2>
                  <div className="profile-field">
                    <label>Member Since</label>
                    <p>
                      {new Date(user.createdAt || Date.now()).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>

                  <div className="profile-field">
                    <label>Account Status</label>
                    <p className="status-active">Active</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Profile;
