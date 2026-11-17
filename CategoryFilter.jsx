
import React from "react";

function CategoryFilter({ category, setCategory, categories = [] }) {
  return (
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      style={{
        padding: "13px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontSize: "15px",
        background: "white",
        cursor: "pointer"
      }}
    >
      <option value="All">All Categories</option>

      {categories.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

export default CategoryFilter;
