import React, { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import InfiniteScroll from "react-infinite-scroll-component";
import * as publicProductService from "../service/publicProductService";
import ProductCard from "./ProductCard";
import "../styles/Products.css";

const PAGE_SIZE = 12;

const HomepageProductFeed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  const fetchFirstPage = async () => {
    try {
      setLoading(true);
      pageRef.current = 1;
      const res = await publicProductService.getAllProducts(1, PAGE_SIZE);
      const nextProducts = Array.isArray(res?.products) ? res.products : [];
      setProducts(nextProducts);
      setHasMore((res?.page || 1) < (res?.pages || 1));
      pageRef.current = 2;
    } catch (err) {
      console.error("Error fetching homepage products:", err);
      setProducts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchMore = async () => {
    try {
      const currentPage = pageRef.current;
      const res = await publicProductService.getAllProducts(currentPage, PAGE_SIZE);
      const nextProducts = Array.isArray(res?.products) ? res.products : [];
      setProducts((prev) => [...prev, ...nextProducts]);
      setHasMore((res?.page || currentPage) < (res?.pages || 1));
      pageRef.current = currentPage + 1;
    } catch (err) {
      console.error("Error fetching more homepage products:", err);
      setHasMore(false);
    }
  };

  useEffect(() => {
    fetchFirstPage();
  }, []);

  const Loading = () => (
    <div className="products-grid">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={420} />
      ))}
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <section className="category-showcase">
        <div className="showcase-container">
          <Loading />
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="category-showcase">
      <div className="showcase-container">
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
      </div>
    </section>
  );
};

export default HomepageProductFeed;
