import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import ProductCard from "../components/ProductCard";
import "../styles/Products.css";
import "./styles/CategoryProducts.css";
import InfiniteScroll from "react-infinite-scroll-component";
import * as publicCategoryService from "../service/publicCategoryService";

const PAGE_SIZE = 12;

const CategoryProducts = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(1);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);
        pageRef.current = 1;

        const data = await publicCategoryService.getCategoryProductsById(categoryId, 1, PAGE_SIZE);
        const nextProducts = Array.isArray(data?.products) ? data.products : [];

        setCategoryName(data?.category?.name || "Category");
        setProducts(nextProducts);
        setTotal(data?.total ?? data?.count ?? nextProducts.length);
        setHasMore((data?.page || 1) < (data?.pages || 1));
        pageRef.current = 2;
      } catch (err) {
        console.error("Error fetching category or products:", err);
        setProducts([]);
        setCategoryName("Unknown Category");
        setTotal(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [categoryId]);

  const fetchMore = async () => {
    try {
      const currentPage = pageRef.current;
      const data = await publicCategoryService.getCategoryProductsById(
        categoryId,
        currentPage,
        PAGE_SIZE
      );
      const nextProducts = Array.isArray(data?.products) ? data.products : [];

      setProducts((prev) => [...prev, ...nextProducts]);
      setTotal(data?.total ?? data?.count ?? 0);
      setHasMore((data?.page || currentPage) < (data?.pages || 1));
      pageRef.current = currentPage + 1;
    } catch (err) {
      console.error("Error fetching more category products:", err);
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
            {categoryName || "Category"} Products ({total || products.length})
          </h2>
          <hr />

          {loading ? (
            <Loading />
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
            <div className="category-products-state">
              <p>No products found in this category.</p>
              <button className="btn-dark" onClick={() => navigate("/product")}>
                Back to Products
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default CategoryProducts;
