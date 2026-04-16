import React from "react";
import { Navbar, Footer } from "../components";
import "../styles/AboutPage.css";

const AboutPage = () => {
  return (
    <>
      <Navbar />

      <section className="about-container">
        <h1 className="about-title">About Us</h1>
        <div className="divider"></div>

        <p className="about-text">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Nostrum
          facere doloremque veritatis odit similique sequi. Odit amet fuga nam
          quam quasi facilis sed doloremque saepe sint perspiciatis explicabo
          totam vero quas provident ipsam, veritatis nostrum velit quos
          recusandae est mollitia esse fugit dolore laudantium. Ex vel explicabo
          earum unde eligendi autem praesentium.
        </p>

        <h2 className="products-heading">Our Products</h2>

        <div className="products-grid">
          <div className="product-card">
            <img
              src="https://images.pexels.com/photos/298863/pexels-photo-298863.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Men's Clothing"
            />
            <h5>Men's Clothing</h5>
          </div>

          <div className="product-card">
            <img
              src="https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Women's Clothing"
            />
            <h5>Women's Clothing</h5>
          </div>

          <div className="product-card">
            <img
              src="https://images.pexels.com/photos/1927259/pexels-photo-1927259.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Jewelery"
            />
            <h5>Jewelery</h5>
          </div>

          <div className="product-card">
            <img
              src="https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600"
              alt="Electronics"
            />
            <h5>Electronics</h5>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default AboutPage;
