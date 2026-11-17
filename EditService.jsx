
import React, { useState, useEffect } from "react";

function EditService({ service, onUpdate, onCancel }) {

  const defaultService = {
    id: 1,
    title: "Website Development",
    category: "Development",
    price: 1500,
    description: "I will create a professional website.",
    image: ""
  };

  const [formData, setFormData] = useState(
    service || defaultService
  );

  useEffect(() => {
    if (service) {
      setFormData(service);
    }
  }, [service]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.category ||
      !formData.price ||
      !formData.description.trim()
    ) {
      alert("Please fill all required fields!");
      return;
    }

    if (Number(formData.price) <= 0) {
      alert("Price must be greater than zero!");
      return;
    }

    const updatedService = {
      ...formData,
      price: Number(formData.price)
    };

    if (onUpdate) {
      onUpdate(updatedService);
    } else {
      console.log("Updated Service:", updatedService);
      alert("Service updated successfully!");
    }
  };

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

        <h1>Edit Your Service</h1>

        <p style={{
          color: "#777",
          marginBottom: "30px"
        }}>
          Update your service information.
        </p>

        <form onSubmit={handleSubmit}>

          <label>Service Title *</label>

          <input
            type="text"
            name="title"
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
            min="1"
            value={formData.price}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Description *</label>

          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="5"
            style={{
              ...inputStyle,
              resize: "vertical"
            }}
          />

          <label>Image URL</label>

          <input
            type="url"
            name="image"
            value={formData.image || ""}
            onChange={handleChange}
            placeholder="Paste image URL"
            style={inputStyle}
          />

          <button
            type="submit"
            style={{
              background: "#7546f5",
              color: "white",
              padding: "13px 25px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Update Service
          </button>

          <button
            type="button"
            onClick={() => onCancel ? onCancel() : alert("Cancel clicked")}
            style={{
              background: "#eee",
              color: "#333",
              padding: "13px 25px",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginLeft: "12px"
            }}
          >
            Cancel
          </button>

        </form>

      </div>
    </div>
  );
}

export default EditService;
