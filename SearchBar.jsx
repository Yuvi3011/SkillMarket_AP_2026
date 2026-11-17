
import React from "react";

function SearchBar({ search, setSearch }) {
  return (
    <input
      type="text"
      placeholder="Search for services..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{
        width: "100%",
        padding: "14px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontSize: "15px",
        outline: "none",
        boxSizing: "border-box"
      }}
    />
  );
}

export default SearchBar;
