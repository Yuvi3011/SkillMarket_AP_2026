import React from "react";

function ServiceDetails({ service }) {

  // Demo service data
  const selectedService = service || {
    title: "Website Development",
    seller: "Rahul Sharma",
    category: "Development",
    price: 1500,
    description:
      "I will create a professional, responsive and modern website using HTML, CSS, JavaScript and React.",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800",
    experience: "3 Years",
    rating: 4.8
  };

  return (
    <div style={{
      background: "#f8f9fc",
      minHeight: "100vh",
      padding: "40px 6%"
    }}>

      <div style={{
        maxWidth: "1100px",
        margin: "auto",
        background: "white",
        padding: "30px",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.06)"
      }}>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "35px"
        }}>

          {/* Service Image */}
          <div>
            <img
              src={selectedService.image}
              alt={selectedService.title}
              style={{
                width: "100%",
                height: "350px",
                objectFit: "cover",
                borderRadius: "12px"
              }}
            />
          </div>

          {/* Service Information */}
          <div>

            <span style={{
              background: "#eee8ff",
              color: "#7546f5",
              padding: "8px 14px",
              borderRadius: "20px",
              fontSize: "13px"
            }}>
              {selectedService.category}
            </span>

            <h1 style={{ marginTop: "20px" }}>
              {selectedService.title}
            </h1>

            <h2 style={{
              color: "#7546f5",
              fontSize: "30px",
              marginTop: "15px"
            }}>
              ₹{selectedService.price}
            </h2>

            <p style={{
              color: "#666",
              lineHeight: "1.8",
              marginTop: "20px"
            }}>
              {selectedService.description}
            </p>

            <hr style={{
              margin: "25px 0",
              border: "1px solid #eee"
            }} />

            {/* Seller Information */}
            <h3>Seller Information</h3>

            <p style={{ marginTop: "15px" }}>
              <strong>Name:</strong> {selectedService.seller}
            </p>

            <p>
              <strong>Experience:</strong> {selectedService.experience}
            </p>

            <p>
              <strong>Rating:</strong> ⭐ {selectedService.rating}/5
            </p>

            <button
              onClick={() => alert("Seller contact feature coming soon!")}
              style={{
                background: "#7546f5",
                color: "white",
                border: "none",
                padding: "14px 25px",
                borderRadius: "8px",
                marginTop: "25px",
                cursor: "pointer",
                fontSize: "16px"
              }}
            >
              Contact Seller
            </button>

          </div>
        </div>

      </div>
    </div>
  );
}

export default ServiceDetails;