import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "../styles/Footer.css";

const Footer = () => {
  const [navbarLogoUrl, setNavbarLogoUrl] = useState("");

  useEffect(() => {
    const loadNavbarLogo = async () => {
      try {
        const { data } = await axios.get("/api/settings/navbar");
        setNavbarLogoUrl(data?.navbarLogoUrl || "");
      } catch (error) {
        // ignore
      }
    };
    loadNavbarLogo();
  }, []);

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__col site-footer__brand">
            <h3 className="site-footer__title">Ecommerce</h3>
            <div className="site-footer__accent" />
            <p className="site-footer__desc">
              Your trusted partner for premium shopping solutions.
            </p>

            <div className="site-footer__social" aria-label="Social links">
              <a
                className="site-footer__socialBtn"
                href="https://www.facebook.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
              >
                <i className="fa fa-facebook" aria-hidden="true" />
              </a>
              <a
                className="site-footer__socialBtn"
                href="https://www.instagram.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
              >
                <i className="fa fa-instagram" aria-hidden="true" />
              </a>
            </div>
          </div>

          <nav className="site-footer__col" aria-label="Quick actions">
            <h4 className="site-footer__heading">Quick Actions</h4>
            <div className="site-footer__accent" />
            <ul className="site-footer__links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/brands">Brands</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/privacy-policy">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions">Terms &amp; Conditions</Link></li>
              <li><Link to="/shipping-policy">Shipping Policy</Link></li>
            </ul>
          </nav>

          <div className="site-footer__col">
            <h4 className="site-footer__heading">Office Address</h4>
            <div className="site-footer__accent" />
            <address className="site-footer__address">
              Bengaluru, Karnataka, India
            </address>
          </div>

          <div className="site-footer__col">
            <h4 className="site-footer__heading">Connect</h4>
            <div className="site-footer__accent" />
            <div className="site-footer__connect">
              <div className="site-footer__connectRow">
                <i className="fa fa-phone" aria-hidden="true" />
                <span>+91 9000000000</span>
              </div>
              <div className="site-footer__connectRow">
                <i className="fa fa-envelope" aria-hidden="true" />
                <span>support@ecommerce.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <div className="site-footer__bottomLinks">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span className="site-footer__dot" aria-hidden="true">•</span>
            <Link to="/terms-conditions">Terms &amp; Conditions</Link>
          </div>
          <div className="site-footer__copy">
            &copy; 2026 {navbarLogoUrl && <img src={navbarLogoUrl} alt="Logo" className="site-footer__logo-img" />}
          </div>
          <div className="site-footer__bottomRight">
            <span className="site-footer__dev">
              Designed &amp; Developed by{" "}
              <span className="site-footer__devBrand">IT Alliance</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
