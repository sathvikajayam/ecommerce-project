
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

const SearchBar = () => {
  const { keyword: urlKeyword } = useParams();
  const [keyword, setKeyword] = useState(urlKeyword || "");
  const navigate = useNavigate();

  // Keep input in sync whenever the URL keyword changes (e.g. browser back/forward)
  useEffect(() => {
    setKeyword(urlKeyword || "");
  }, [urlKeyword]);

  const submitHandler = (e) => {
    e.preventDefault();

    if (keyword.trim()) {
      navigate(`/search/${keyword}`);
    } else {
      navigate("/");
    }
  };

  return (
    <form onSubmit={submitHandler} className="search-form">
      <input
        type="search"
        placeholder="Search..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="search-input"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck="false"
        inputMode="search"
      />
      <i className="fa-solid fa-magnifying-glass search-icon" onClick={submitHandler} style={{ cursor: "pointer" }}></i>
    </form>
  );
};

export default SearchBar;

