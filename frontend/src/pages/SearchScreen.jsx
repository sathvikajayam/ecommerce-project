import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import axios from "axios";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import "../styles/SearchScreen.css";
import { Navbar } from "../components";
import InfiniteScroll from "react-infinite-scroll-component";
import * as publicCategoryService from "../service/publicCategoryService";
import * as publicBrandService from "../service/publicBrandService";
import ProductCard from "../components/ProductCard";

const SearchScreen = () => {
  const { keyword } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("relevance");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // paginationRef ensures our fetch function stays stable between page loads
  const pageRef = useRef(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoryFromQuery = params.get("category");
    const brandFromQuery = params.get("brand");

    setSelectedCategory(categoryFromQuery || "all");
    setSelectedBrand(brandFromQuery || "all");
  }, [location.search]);

  // Load Filter Options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [cats, brs] = await Promise.all([
          publicCategoryService.getAllCategories(),
          publicBrandService.getAllBrands()
        ]);
        setCategories(cats);
        setBrands(brs);
      } catch (err) {
        console.error("Failed to load filters:", err);
      }
    };
    loadFilters();
  }, []);

  // Fetch products from backend (handles keyword, category, brand, and sorting)
  const fetchProducts = useCallback(async (isInitial = true) => {
    if (isInitial) {
      setLoading(true);
      pageRef.current = 1;
    }
    
    try {
      const params = new URLSearchParams({
        keyword: keyword || "",
        category: selectedCategory,
        brand: selectedBrand,
        sortBy,
        page: String(pageRef.current),
        limit: "8",
      });
      const url = `${import.meta.env.VITE_API_URL}/api/products/search?${params.toString()}`;
      const { data } = await axios.get(url);
      
      const fetchedProducts = data.products || [];
      const totalPages = data.pages || 0;

      if (isInitial) {
        setProducts(fetchedProducts);
        setTotal(data.total || 0);
        setHasMore(data.page < totalPages);
        pageRef.current = 2; // Setup for the NEXT fetch
      } else {
        setProducts(prev => [...prev, ...fetchedProducts]);
        setHasMore(data.page < totalPages);
        pageRef.current = pageRef.current + 1;
      }
    } catch (error) {
           console.error("Search failed:", error);
      if (isInitial) setProducts([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [keyword, selectedCategory, selectedBrand, sortBy]);

  // Initial load when keyword OR filters change
  useEffect(() => {
    fetchProducts(true);
  }, [fetchProducts]); // This is now stable and only re-triggers appropriately

  const InitialLoading = () => (
    <div className="search-products-grid">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} height={420} />
      ))}
    </div>
  );

  const MoreLoading = () => (
    <div className="search-products-grid" style={{ marginTop: '20px' }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} height={350} />
      ))}
    </div>
  );

  const [expandedSections, setExpandedSections] = useState({
    sort: true,
    category: true,
    brand: true,
    price: true
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      <Navbar />
      <div className="search-container">
        <div className="search-header">
          <h1>Search Results</h1>
          {keyword ? (
            <p className="search-query">
              Results for: <span className="highlight">"{keyword}"</span>
            </p>
          ) : (
            <p className="search-query">
              Showing: <span className="highlight">All Products</span>
            </p>
          )}
          {!loading && (
            <p className="result-count">
              Showing <span className="count-badge">{products.length}</span> of <span className="count-badge">{total}</span> product(s)
            </p>
          )}
        </div>

        {loading ? (
          <InitialLoading />
        ) : products.length === 0 ? (
          <div className="no-results">
            <p>ðŸ˜” No products found with selected filters</p>
            <Link to="/product" className="btn-back">
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="search-content">
            <aside className="search-sidebar">
              <div className="sidebar-header">
                <i className="fa-solid fa-sliders"></i>
                <span>Refine Results</span>
              </div>
              
              <div className="sidebar-subheader">
                <i className="fa-solid fa-filter"></i>
                <span>Filters</span>
              </div>

              <div className="filter-section">
                <div className="section-header" onClick={() => toggleSection('sort')}>
                  <h3>Sort By</h3>
                  <i className={`fa-solid fa-chevron-${expandedSections.sort ? 'up' : 'down'}`}></i>
                </div>
                {expandedSections.sort && (
                  <div className="filter-options">
                    <label>
                      <input
                        type="radio"
                        name="sort"
                        value="relevance"
                        checked={sortBy === "relevance"}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      Relevance
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="sort"
                        value="price-low"
                        checked={sortBy === "price-low"}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      Price: Low to High
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="sort"
                        value="price-high"
                        checked={sortBy === "price-high"}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      Price: High to Low
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="sort"
                        value="name"
                        checked={sortBy === "name"}
                        onChange={(e) => setSortBy(e.target.value)}
                      />
                      Name: A to Z
                    </label>
                  </div>
                )}
              </div>

              <div className="filter-section">
                <div className="section-header" onClick={() => toggleSection('category')}>
                  <h3>Category</h3>
                  <i className={`fa-solid fa-chevron-${expandedSections.category ? 'up' : 'down'}`}></i>
                </div>
                {expandedSections.category && (
                  <div className="filter-options">
                    <label>
                      <input
                        type="radio"
                        name="category"
                        value="all"
                        checked={selectedCategory === "all"}
                        onChange={(e) => setSelectedCategory("all")}
                      />
                      All
                    </label>
                    {categories.map((cat) => (
                      <label key={cat._id}>
                        <input
                          type="radio"
                          name="category"
                          value={cat.name}
                          checked={selectedCategory === cat.name}
                          onChange={(e) => setSelectedCategory(cat.name)}
                        />
                        {cat.name}
                        {cat.productCount > 0 && <span className="cat-count">({cat.productCount})</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-section">
                <div className="section-header" onClick={() => toggleSection('brand')}>
                  <h3>Brand</h3>
                  <i className={`fa-solid fa-chevron-${expandedSections.brand ? 'up' : 'down'}`}></i>
                </div>
                {expandedSections.brand && (
                  <div className="filter-options">
                    <label>
                      <input
                        type="radio"
                        name="brand"
                        value="all"
                        checked={selectedBrand === "all"}
                        onChange={(e) => setSelectedBrand("all")}
                      />
                      All
                    </label>
                    {brands.map((br) => (
                      <label key={br._id}>
                        <input
                          type="radio"
                          name="brand"
                          value={br.name}
                          checked={selectedBrand === br.name}
                          onChange={(e) => setSelectedBrand(br.name)}
                        />
                        {br.name}
                        {br.productCount > 0 && <span className="cat-count">({br.productCount})</span>}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="filter-section">
                <div className="section-header" onClick={() => toggleSection('price')}>
                  <h3>Price Range</h3>
                  <i className={`fa-solid fa-chevron-${expandedSections.price ? 'up' : 'down'}`}></i>
                </div>
              </div>
            </aside>

            <main className="search-products">
              <InfiniteScroll
                dataLength={products.length}
                next={() => fetchProducts(false)}
                hasMore={hasMore}
                loader={<MoreLoading />}
                endMessage={
                  <div className="search-end-message">
                    <div className="end-message-content">
                      <div className="end-message-icon">
                        <i className="fa-solid fa-check-circle"></i>
                      </div>
                      <h3>All results are here!</h3>
                      {keyword ? (
                        <p>You've seen all the products matching <span className="highlight">"{keyword}"</span></p>
                      ) : (
                        <p>You've seen all the products</p>
                      )}
                      <button 
                        className="btn-back-to-top"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      >
                        <i className="fa-solid fa-arrow-up"></i>
                        Back to Top
                      </button>
                    </div>
                  </div>
                }
              >
                <div className="search-products-grid">
                  {products.map((product) => (
                    <ProductCard key={product._id || product.id} product={product} />
                  ))}
                </div>
              </InfiniteScroll>
            </main>
          </div>
        )}
      </div>
    </>
  );
};

export default SearchScreen;

