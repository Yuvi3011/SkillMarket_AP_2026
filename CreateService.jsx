
import React, { useState } from "react";

function CreateService() {
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    price: "",
    description: "",
    image: ""
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.title ||
      !formData.category ||
      !formData.price ||
      !formData.description
    ) {
      alert("Please fill all required fields!");
      return;
    }

    alert("Service created successfully!");

    console.log("New Service:", formData);

    setFormData({
      title: "",
      category: "",
      price: "",
      description: "",
      image: ""
    });
  };

  return (
    <div style={{
      background: "#f8f9fc",
      minHeight: "100vh",
      padding: "40px 20px"
    }}>

      <div style={{
        maxWidth: "700px",
        margin: "auto",
        background: "white",
        padding: "35px",
        borderRadius: "15px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
      }}>

        <h1 style={{ marginBottom: "10px" }}>
          Create a Service
        </h1>

        <p style={{ color: "#777", marginBottom: "30px" }}>
          Share your skills and start earning through SkillMarket.
        </p>

        <form onSubmit={handleSubmit}>

          <label>Service Title *</label>
          <input
            type="text"
            name="title"
            placeholder="e.g. Website Development"
            value={formData.title}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">Select Category</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Video Editing">Video Editing</option>
            <option value="Content Writing">Content Writing</option>
            <option value="Marketing">Marketing</option>
            <option value="Other">Other</option>
          </select>

          <label>Price (₹) *</label>
          <input
            type="number"
            name="price"
            placeholder="Enter your price"
            min="1"
            value={formData.price}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Service Description *</label>
          <textarea
            name="description"
            placeholder="Describe your service..."
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            style={{
              ...inputStyle,
              resize: "vertical"
            }}
          />

          <label>Service Image URL</label>
          <input
            type="url"
            name="image"
            placeholder="Paste image URL"
            value={formData.image}
            onChange={handleChange}
            style={inputStyle}
          />

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: "#7546f5",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "15px"
            }}
          >
            Create Service
          </button>

        </form>

      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  marginBottom: "20px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box"
};

export default CreateService;
