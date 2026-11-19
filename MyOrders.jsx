import { useState } from "react";
import "./MyOrders.css";

function MyOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviews, setReviews] = useState([]);

  // Sample orders
  const orders = [
    {
      id: "SK101",
      title: "PPT Design",
      seller: "Aman",
      price: 150,
      status: "Completed",
      date: "10 Nov 2026",
    },
    {
      id: "SK102",
      title: "React Bug Fix",
      seller: "Rahul",
      price: 300,
      status: "In Progress",
      date: "12 Nov 2026",
    },
    {
      id: "SK103",
      title: "30-sec Reel Editing",
      seller: "Priya",
      price: 200,
      status: "Pending",
      date: "13 Nov 2026",
    },
  ];

  // Submit review
  const handleSubmitReview = () => {
    if (!reviewText.trim()) {
      alert("Please write a review first!");
      return;
    }

    if (!selectedOrder) {
      return;
    }

    const alreadyReviewed = reviews.some(
      (review) => review.orderId === selectedOrder.id
    );

    if (alreadyReviewed) {
      alert("You have already reviewed this order!");
      return;
    }

    const newReview = {
      orderId: selectedOrder.id,
      rating: rating,
      comment: reviewText.trim(),
    };

    setReviews((prevReviews) => [...prevReviews, newReview]);

    setReviewText("");
    setRating(5);

    alert("Review submitted successfully!");
  };

  // Calculate tracking progress
  const getCompletedSteps = (status) => {
    if (status === "Completed") return 4;
    if (status === "In Progress") return 3;
    if (status === "Pending") return 1;

    return 0;
  };

  // Check whether selected order is already reviewed
  const alreadyReviewed = selectedOrder
    ? reviews.find((review) => review.orderId === selectedOrder.id)
    : null;

  return (
    <main className="orders-page">

      {/* Page Header */}
      <div className="orders-header">
        <div>
          <h1>My Orders</h1>
          <p>Manage your purchases and track your orders.</p>
        </div>
      </div>

      {/* Order Statistics */}
      <div className="orders-stats">

        <div className="stat-card">
          <h2>{orders.length}</h2>
          <p>Total Orders</p>
        </div>

        <div className="stat-card">
          <h2>
            {orders.filter(
              (order) => order.status === "In Progress"
            ).length}
          </h2>
          <p>Active Orders</p>
        </div>

        <div className="stat-card">
          <h2>
            {orders.filter(
              (order) => order.status === "Completed"
            ).length}
          </h2>
          <p>Completed Orders</p>
        </div>

      </div>

      {/* Orders List */}
      <section className="orders-list">
        <h2>Recent Orders</h2>

        {orders.map((order) => (
          <div className="order-card" key={order.id}>

            <div className="order-info">
              <h3>{order.title}</h3>
              <p>Order ID: {order.id}</p>
              <p>Seller: {order.seller}</p>
              <p>Date: {order.date}</p>
            </div>

            <div className="order-right">
              <h3>₹{order.price}</h3>

              <span
                className={`order-status ${order.status
                  .toLowerCase()
                  .replace(" ", "-")}`}
              >
                {order.status}
              </span>

              <button
                className="view-details-btn"
                onClick={() => {
                  setSelectedOrder(order);
                  setRating(5);
                  setReviewText("");
                }}
              >
                View Details
              </button>
            </div>

          </div>
        ))}
      </section>

      {/* Order Details */}
      {selectedOrder && (
        <div className="order-details">

          <h2>Order Details</h2>

          <p>
            <strong>Order ID:</strong> {selectedOrder.id}
          </p>

          <p>
            <strong>Service:</strong> {selectedOrder.title}
          </p>

          <p>
            <strong>Seller:</strong> {selectedOrder.seller}
          </p>

          <p>
            <strong>Price:</strong> ₹{selectedOrder.price}
          </p>

          <p>
            <strong>Order Date:</strong> {selectedOrder.date}
          </p>

          <p>
            <strong>Status:</strong> {selectedOrder.status}
          </p>

          {/* Order Tracking */}
          <div className="tracking-section">
            <h3>Order Tracking</h3>

            {[
              "Order Placed",
              "Order Accepted",
              "Work in Progress",
              "Completed",
            ].map((step, index) => (
              <div
                className={`tracking-step ${
                  index < getCompletedSteps(selectedOrder.status)
                    ? "active"
                    : ""
                }`}
                key={step}
              >
                <span className="tracking-dot"></span>
                <p>{step}</p>
              </div>
            ))}

          </div>

          {/* Review Section */}
          {selectedOrder.status === "Completed" && (
            <div className="review-section">

              <h3>Rate Your Experience</h3>

              {alreadyReviewed ? (
                <div className="submitted-review">
                  <h4>Your Review</h4>

                  <p>
                    <strong>Rating:</strong>{" "}
                    {"⭐".repeat(alreadyReviewed.rating)}
                  </p>

                  <p>
                    <strong>Comment:</strong>{" "}
                    {alreadyReviewed.comment}
                  </p>

                  <p>You have already submitted a review for this order.</p>
                </div>
              ) : (
                <>
                  <label htmlFor="rating">Give Rating:</label>

                  <select
                    id="rating"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ - Excellent</option>
                    <option value={4}>⭐⭐⭐⭐ - Very Good</option>
                    <option value={3}>⭐⭐⭐ - Good</option>
                    <option value={2}>⭐⭐ - Average</option>
                    <option value={1}>⭐ - Poor</option>
                  </select>

                  <label htmlFor="review">Write Your Review:</label>

                  <textarea
                    id="review"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience..."
                    rows={4}
                  />

                  <button onClick={handleSubmitReview}>
                    Submit Review
                  </button>
                </>
              )}

            </div>
          )}

          {/* Close Details */}
          <button
            onClick={() => {
              setSelectedOrder(null);
              setReviewText("");
              setRating(5);
            }}
          >
            Close Details
          </button>

        </div>
      )}

    </main>
  );
}

export default MyOrders;
