import { useState } from "react";

export default function Reviews() {
  const [reviews, setReviews] = useState([
    {
      user: "Snehal Pandey",
      rating: 5,
      comment: "Excellent service and smooth experience.",
      date: "20 Jan 2025",
      visible: true,
    },
    {
      user: "Rahul Sharma",
      rating: 2,
      comment: "Project delivery was delayed.",
      date: "18 Jan 2025",
      visible: false,
    },
    {
      user: "Anita Verma",
      rating: 4,
      comment: "Good quality work, recommended.",
      date: "10 Jan 2025",
      visible: true,
    },
  ]);

  const [ratingFilter, setRatingFilter] = useState("");

  const hideReview = (index) => {
    const updated = [...reviews];
    updated[index].visible = false;
    setReviews(updated);
    window.alert("🙈 Review hidden");
  };

  const approveReview = (index) => {
    const updated = [...reviews];
    updated[index].visible = true;
    setReviews(updated);
    window.alert("✅ Review approved");
  };

  const deleteReview = (index) => {
    if (!window.confirm("Delete this review?")) return;
    setReviews(reviews.filter((_, i) => i !== index));
    window.alert("🗑️ Review deleted");
  };

  const filteredReviews = reviews.filter((r) => {
    if (ratingFilter === "low") return r.rating <= 2;
    if (ratingFilter === "high") return r.rating >= 4;
    return true;
  });

  const stars = (count) => "⭐".repeat(count);

  return (
    <div className="reviews-page">
      <h2 className="page-title">Reviews & Ratings</h2>

      <section className="content">
        <div className="panel">
          <div
            className="filters"
            style={{ display: "flex", gap: 12, marginBottom: 16 }}
          >
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
            >
              <option value="">All Ratings</option>
              <option value="low">Low Ratings (1–2 ⭐)</option>
              <option value="high">Good Ratings (4–5 ⭐)</option>
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Rating</th>
                  <th>Comment</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredReviews.map((r, index) => (
                  <tr key={index}>
                    <td>{r.user}</td>
                    <td>{stars(r.rating)}</td>
                    <td>{r.comment}</td>
                    <td>{r.date}</td>
                    <td className="actions">
                      {!r.visible && (
                        <button
                          className="btn"
                          onClick={() => approveReview(index)}
                        >
                          Approve
                        </button>
                      )}

                      {r.visible && (
                        <button
                          className="btn"
                          onClick={() => hideReview(index)}
                        >
                          Hide
                        </button>
                      )}

                      <button
                        className="btn danger"
                        onClick={() => deleteReview(index)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}