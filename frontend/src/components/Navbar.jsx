import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "../styles/Navbar.css";
import SearchBar from "./SearchBar";

const Navbar = () => {
  const navigate = useNavigate();
  const cart = useSelector((state) => state.handleCart);
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ✅ Check if user is logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse user data:", error);
      }
    }

    // Close profile when clicking outside
    const handleClickOutside = () => {
      setIsProfileOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ✅ total quantity (supports both array or object-shaped cart)
  const totalItems = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + (item.qty || 0), 0)
    : (cart.items?.reduce((sum, item) => sum + (item.qty || 0), 0) || 0);

  // ✅ Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    setUser(null);
    setIsProfileOpen(false);
    alert("Logged out successfully!");
    navigate("/");
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <NavLink to="/" className="navbar-logo">
            Ecommerce
          </NavLink>

          {/* Links */}
          <ul className="navbar-links">
            <li>
              <NavLink to="/" className="nav-link">Home</NavLink>
            </li>
            <li>
              <NavLink to="/product" className="nav-link">Products</NavLink>
            </li>
            <li>
              <NavLink to="/categories" className="nav-link">Categories</NavLink>
            </li>
            <li>
              <NavLink to="/brands" className="nav-link">Brands</NavLink>
            </li>
            <li>
              <NavLink to="/about" className="nav-link">About</NavLink>
            </li>
            <li>
              <NavLink to="/contact" className="nav-link">Contact</NavLink>
            </li>
          </ul>

          {/* 🔍 SEARCH BAR BEFORE LOGIN */}
          <SearchBar />

          {/* Hamburger Menu Button (Mobile) */}
          <button
            className="hamburger-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

        {/* Buttons */}
        <div className="navbar-buttons">
          {user ? (
            // ✅ PROFILE DROPDOWN (when logged in)
            <div className="profile-dropdown-wrapper">
              <button
                className="profile-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen(!isProfileOpen);
                }}
              >
                <i className="fa-solid fa-user-circle"></i>
                <span>{user.name?.split(" ")[0]}</span>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    <i className="fa-solid fa-user-circle profile-icon"></i>
                    <div className="profile-info">
                      <p className="profile-name">{user.name}</p>
                      <p className="profile-email">{user.email}</p>
                    </div>
                  </div>

                  <div className="profile-divider"></div>

                  <button
                    className="profile-menu-item"
                    onClick={() => {
                      navigate("/profile");
                      setIsProfileOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-user"></i>
                    View Profile
                  </button>

                  <button
                    className="profile-menu-item"
                    onClick={() => {
                      navigate("/order-history");
                      setIsProfileOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-history"></i>
                    Order History
                  </button>

                  <button
                    className="profile-menu-item"
                    onClick={() => {
                      navigate("/");
                      setIsProfileOpen(false);
                    }}
                  >
                    <i className="fa-solid fa-gear"></i>
                    Settings
                  </button>

                  <div className="profile-divider"></div>

                  <button
                    className="profile-menu-item logout"
                    onClick={handleLogout}
                  >
                    <i className="fa-solid fa-sign-out-alt"></i>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            // ✅ LOGIN & REGISTER (when not logged in)
            <>
              <NavLink to="/login" className="nav-btn">
                <i className="fa-solid fa-right-to-bracket"></i>
                <span>Login</span>
              </NavLink>

              <NavLink to="/register" className="nav-btn">
                <i className="fa-solid fa-user-plus"></i>
                <span>Register</span>
              </NavLink>
            </>
          )}

          {/* CART (always visible) */}
          <NavLink to="/cart" className="nav-btn">
            <i className="fa-solid fa-cart-shopping"></i>
            <span>Cart ({totalItems})</span>
          </NavLink>
        </div>
      </div>
      </nav>

      {/* Mobile Menu Backdrop & Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop Overlay */}
          <div 
            className="mobile-menu-backdrop"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
          
          {/* Side Drawer Menu */}
          <div className="mobile-menu">
            {/* Close Button */}
            <button
              className="mobile-menu-close"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <i className="fa-solid fa-times"></i>
            </button>

            <ul className="mobile-menu-list">
              <li>
                <NavLink 
                  to="/" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa-solid fa-home"></i>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/product" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa-solid fa-box"></i>
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/categories" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa-solid fa-list"></i>
                  Categories
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/brands" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa-solid fa-tag"></i>
                  Brands
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/about" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa-solid fa-info-circle"></i>
                  About
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/contact" 
                  className="mobile-menu-link"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <i className="fa-solid fa-envelope"></i>
                  Contact
                </NavLink>
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
