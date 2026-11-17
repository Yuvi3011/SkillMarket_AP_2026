
import React, { useState } from "react";

function MyServices({ services: initialServices, onEdit, onDelete }) {

  const [services, setServices] = useState(
    initialServices || [
      {
        id: 1,
        title: "Website Development",
        category: "Development",
        price: 1500,
        description: "I create responsive and modern websites.",
        image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500"
      },
      {
        id: 2,
        title: "Logo Designing",
        category: "Design",
        price: 500,
        description: "Professional logo designing services.",
        image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500"
      }
    ]
  );

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this service?"
    );

    if (!confirmDelete) return;

    if (onDelete) {
      onDelete(id);
    } else {
      setServices((prev) =>
        prev.filter((service) => service.id !== id)
      );
    }
  };

  return (
    <div style={{
      background: "#f8f9fc",
      minHeight: "100vh",
      padding: "40px 6%"
    }}>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "30px"
      }}>

        <div>
          <h1>My Services</h1>
          <p style={{ color: "#777" }}>
            Manage all the services you have listed.
          </p>
        </div>

        <button
          onClick={() => window.location.href = "/create-service"}
          style={{
            background: "#7546f5",
            color: "white",
            border: "none",
            padding: "13px 22px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          + Add New Service
        </button>

      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "25px"
      }}>

        {services.map((service) => (

          <div
            key={service.id}
            style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 15px rgba(0,0,0,0.06)"
            }}
          >

            <img
              src={service.image || "https://placehold.co/500x300?text=Service"}
              alt={service.title}
              style={{
                width: "100%",
                height: "180px",
                objectFit: "cover"
              }}
            />

            <div style={{ padding: "20px" }}>

              <span style={{
                color: "#7546f5",
                background: "#eee8ff",
                padding: "6px 12px",
                borderRadius: "20px",
                fontSize: "12px"
              }}>
                {service.category}
              </span>

              <h3 style={{ marginTop: "15px" }}>
                {service.title}
              </h3>

              <p style={{ color: "#777", margin: "12px 0" }}>
                {service.description}
              </p>

              <h3 style={{ color: "#7546f5" }}>
                ₹{service.price}
              </h3>

              <div style={{
                display: "flex",
                gap: "10px",
                marginTop: "20px"
              }}>

                <button
                  onClick={() => {
                    if (onEdit) {
                      onEdit(service);
                    } else {
                      alert("Edit feature will be connected soon!");
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#7546f5",
                    color: "white",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer"
                  }}
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(service.id)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer"
                  }}
                >
                  Delete
                </button>

              </div>

            </div>
          </div>

        ))}

      </div>

      {services.length === 0 && (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "white",
          borderRadius: "12px"
        }}>
          <h2>No Services Found</h2>
          <p>You haven't created any services yet.</p>
        </div>
      )}

    </div>
  );
}

export default MyServices;
