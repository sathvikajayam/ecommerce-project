import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/main.css";

const Main = () => {
  const [heroes, setHeroes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);

  const fetchHeroes = useCallback(async () => {
    try {
      const { data } = await axios.get(`${process.env.REACT_APP_API_URL}/api/homepage/hero`);
      const liveHeroes = data.filter((h) => h.status === "Live");
      setHeroes(liveHeroes);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch heroes:", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHeroes();
  }, [fetchHeroes]);

  const nextSlide = useCallback(() => {
    if (heroes.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [heroes.length]);

  const prevSlide = useCallback(() => {
    if (heroes.length <= 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
  }, [heroes.length]);

  useEffect(() => {
    if (heroes.length <= 1) return;

    timerRef.current = setInterval(nextSlide, 5000);
    return () => clearInterval(timerRef.current);
  }, [heroes.length, nextSlide]);

  // Handle snapping after transition to create infinite loop
  useEffect(() => {
    if (heroes.length <= 1) return;

    if (currentIndex === heroes.length + 1) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(1); // Snap to the actual first slide
      }, 700); // 700ms matches CSS transition duration
      return () => clearTimeout(timeout);
    } else if (currentIndex === 0) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(heroes.length); // Snap to the actual last slide
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, heroes.length]);

  if (loading) return <div className="hero-loader"></div>;
  if (heroes.length === 0) return null;

  const extendedHeroes = heroes.length > 1 
    ? [{ ...heroes[heroes.length - 1], _id: "clone-last" }, ...heroes, { ...heroes[0], _id: "clone-first" }]
    : heroes;

  return (
    <section className="hero">
      <div className="hero-carousel">
        <div 
          className="hero-track" 
          style={{ 
            transform: `translateX(-${currentIndex * 100}%)`,
            transition: isTransitioning ? "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)" : "none"
          }}
        >
          {extendedHeroes.map((hero, idx) => (
            <div key={`${hero._id}-${idx}`} className="hero-slide">
              <div className="hero-card">
                <img
                  src={hero.imageUrl}
                  alt={hero.title || "Promotion"}
                  className="hero-image"
                />
                <div className="hero-overlay">
                  <div className="hero-content">
                    <h1>{hero.title || "New Season Arrivals"}</h1>
                    <p>
                      {hero.subtitle ||
                        "Explore our latest collection with exclusive offers and premium quality."}
                    </p>
                    {hero.link ? (
                      hero.link.startsWith("http") ? (
                        <a href={hero.link} className="hero-cta">Shop Now</a>
                      ) : (
                        <Link to={hero.link} className="hero-cta">Shop Now</Link>
                      )
                    ) : (
                      <button className="hero-cta">Shop Now</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {heroes.length > 1 && (
          <>
            <button className="carousel-control prev" onClick={prevSlide} aria-label="Previous slide">
              <i className="fa fa-chevron-left" />
            </button>
            <button className="carousel-control next" onClick={nextSlide} aria-label="Next slide">
              <i className="fa fa-chevron-right" />
            </button>
          </>
        )}
        <div className="hero-bottom-mask"></div>
      </div>
    </section>
  );
};

export default Main;
