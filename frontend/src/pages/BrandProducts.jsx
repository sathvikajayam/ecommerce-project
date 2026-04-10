import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/Products.css";
import "./styles/BrandProducts.css";
import * as publicBrandService from "../service/publicBrandService";
import ProductCard from "../components/ProductCard";
import InfiniteScroll from "react-infinite-scroll-component";

const PAGE_SIZE = 12;

const BrandProducts = () => {
  const { brand: brandId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brandName, setBrandName] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  useEffect(() => {
    const fetchBrandAndProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        pageRef.current = 1;

        const data = await publicBrandService.getBrandProducts(brandId, 1, PAGE_SIZE);
        const nextProducts = Array.isArray(data?.products) ? data.products : [];

        setBrandName(data?.brand?.name || "Brand");
        setProducts(nextProducts);
        setTotal(data?.total ?? data?.count ?? nextProducts.length);
        setHasMore((data?.page || 1) < (data?.pages || 1));
        pageRef.current = 2;
      } catch (err) {
        console.error("Error fetching brand products:", err);
        setError("Failed to load products");
        setProducts([]);
        setBrandName("Brand");
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    if (brandId) {
      fetchBrandAndProducts();
    }
  }, [brandId]);

  const fetchMore = async () => {
    try {
      const currentPage = pageRef.current;
      const data = await publicBrandService.getBrandProducts(brandId, currentPage, PAGE_SIZE);
      const nextProducts = Array.isArray(data?.products) ? data.products : [];

      setProducts((prev) => [...prev, ...nextProducts]);
      setTotal(data?.total ?? data?.count ?? 0);
      setHasMore((data?.page || currentPage) < (data?.pages || 1));
      pageRef.current = currentPage + 1;
    } catch (err) {
      console.error("Error fetching more brand products:", err);
      setHasMore(false);
    }
  };

  const Loading = () => (
    <div className="products-grid">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={420} />
      ))}
    </div>
  );

  return (
    <>
      <Navbar />
      <section className="products">
        <div className="showcase-container">
          <h2 className="products-title">
            {brandName} Products ({total || products.length})
          </h2>
          <hr />

          {loading ? (
            <Loading />
          ) : error ? (
            <div className="brand-products-state">
              <p>{error}</p>
              <button className="btn-dark" onClick={() => navigate("/brands")}>
                Back to Brands
              </button>
            </div>
          ) : products.length > 0 ? (
            <InfiniteScroll
              dataLength={products.length}
              next={fetchMore}
              hasMore={hasMore}
              loader={<Loading />}
              endMessage={
                <p style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
                  <b>Yay! You have seen it all</b>
                </p>
              }
            >
              <div className="products-grid">
                {products.map((product) => (
                  <ProductCard key={product._id || product.id} product={product} />
                ))}
              </div>
            </InfiniteScroll>
          ) : (
            <div className="brand-products-state">
              <p>No products found from this brand.</p>
              <button className="btn-dark" onClick={() => navigate("/brands")}>
                Back to Brands
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default BrandProducts;
