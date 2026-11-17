
import React from "react";

function Pagination({
  currentPage,
  totalPages,
  onPageChange
}) {
  if (totalPages <= 1) return null;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "12px",
      margin: "35px 0"
    }}>

      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={buttonStyle}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index + 1}
          onClick={() => onPageChange(index + 1)}
          style={{
            ...buttonStyle,
            background:
              currentPage === index + 1
                ? "#7546f5"
                : "white",
            color:
              currentPage === index + 1
                ? "white"
                : "#333"
          }}
        >
          {index + 1}
        </button>
      ))}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={buttonStyle}
      >
        Next
      </button>

    </div>
  );
}

const buttonStyle = {
  padding: "10px 15px",
  border: "1px solid #ddd",
  borderRadius: "7px",
  background: "white",
  cursor: "pointer"
};

export default Pagination;
