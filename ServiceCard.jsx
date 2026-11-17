
import React from "react";

function ServiceCard({ service, onViewDetails }) {
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: "0 4px 15px rgba(0,0,0,0.07)",
      transition: "0.3s"
    }}>

      <img
        src={service.image || "https://placehold.co/500x300?text=Service"}
        alt={service.title}
        style={{
          width: "100%",
          height: "190px",
          objectFit: "cover"
        }}
      />

      <div style={{ padding: "20px" }}>

        <span style={{
          background: "#eee8ff",
          color: "#7546f5",
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "12px"
        }}>
          {service.category}
        </span>

        <h3 style={{ marginTop: "15px" }}>
          {service.title}
        </h3>

        <p style={{ color: "#777", margin: "10px 0" }}>
          {service.description}
        </p>

        <p style={{ color: "#555" }}>
          Seller: {service.seller}
        </p>

        <h3 style={{ color: "#7546f5", margin: "15px 0" }}>
          ₹{service.price}
        </h3>

        <button
          onClick={() => onViewDetails && onViewDetails(service)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#7546f5",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          View Details
        </button>

      </div>
    </div>
  );
}

export default ServiceCard;
