import React, { useState, useEffect } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/Products.css";
import * as publicProductService from "../service/publicProductService";
import ProductCard from "./ProductCard";
import InfiniteScroll from "react-infinite-scroll-component";

const Products = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchInitialProducts = async () => {
    try {
      setLoading(true);
      const res = await publicProductService.getAllProducts(1, 8);
      setData(res.products);
      setPage(2);
      if (res.products.length >= res.total) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialProducts();
  }, []);

  const fetchMoreData = async () => {
    try {
      const res = await publicProductService.getAllProducts(page, 8);
      setData([...data, ...res.products]);
      setPage(page + 1);
      
      if (data.length + res.products.length >= res.total) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching more products:", err);
    }
  };

  const Loading = () => (
    <div className="products-grid">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={420} />
      ))}
    </div>
  );

  return (
    <section className="products">
      <div className="showcase-container">
        
        {loading ? (
          <Loading />
        ) : (
          <InfiniteScroll
            dataLength={data.length}
            next={fetchMoreData}
            hasMore={hasMore}
            loader={<Loading />}
            endMessage={
              <p style={{ textAlign: "center", marginTop: "20px", color: "#666" }}>
                <b>Yay! You have seen it all</b>
              </p>
            }
          >
            <div className="products-grid">
              {data.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </InfiniteScroll>
        )}
      </div>
    </section>
  );
};

export default Products;
