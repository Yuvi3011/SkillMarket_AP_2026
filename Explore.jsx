
import React, { useState } from "react";

function Explore() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("");

  const services = [
    {
      id: 1,
      title: "Website Development",
      seller: "Rahul Sharma",
      category: "Development",
      price: 1500,
      description: "I will create a responsive and modern website.",
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500"
    },
    {
      id: 2,
      title: "Logo Designing",
      seller: "Aman Verma",
      category: "Design",
      price: 500,
      description: "Professional logo design for your brand.",
      image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500"
    },
    {
      id: 3,
      title: "Video Editing",
      seller: "Priya Singh",
      category: "Video Editing",
      price: 800,
      description: "Creative video editing for social media.",
      image: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=500"
    },
    {
      id: 4,
      title: "React Development",
      seller: "Karan Mehta",
      category: "Development",
      price: 2000,
      description: "I will build your React application.",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500"
    }
  ];

  let filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || service.category === category;

    return matchesSearch && matchesCategory;
  });

  if (sort === "low") {
    filteredServices.sort((a, b) => a.price - b.price);
  }

  if (sort === "high") {
    filteredServices.sort((a, b) => b.price - a.price);
  }

  return (
    <div style={{ padding: "40px 6%", background: "#f8f9fc", minHeight: "100vh" }}>

      <h1>Explore Services</h1>
      <p>Discover talented people and services on SkillMarket.</p>

      <div style={{ display: "flex", gap: "15px", margin: "30px 0", flexWrap: "wrap" }}>

        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "12px", flex: 1, minWidth: "200px" }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ padding: "12px" }}
        >
          <option value="All">All Categories</option>
          <option value="Development">Development</option>
          <option value="Design">Design</option>
          <option value="Video Editing">Video Editing</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ padding: "12px" }}
        >
          <option value="">Sort by Price</option>
          <option value="low">Low to High</option>
          <option value="high">High to Low</option>
        </select>

      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "25px"
      }}>

        {filteredServices.map((service) => (
          <div
            key={service.id}
            style={{
              background: "white",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 3px 12px rgba(0,0,0,0.08)"
            }}
          >

            <img
              src={service.image}
              alt={service.title}
              style={{ width: "100%", height: "180px", objectFit: "cover" }}
            />

            <div style={{ padding: "18px" }}>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <p>Seller: {service.seller}</p>
              <p>Category: {service.category}</p>
              <h3>₹{service.price}</h3>
            </div>

          </div>
        ))}

      </div>

      {filteredServices.length === 0 && (
        <p>No services found.</p>
      )}

    </div>
  );
}

export default Explore;
