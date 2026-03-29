import { useState } from "react";

export default function Notifications() {
  const [sendTo, setSendTo] = useState("All Users");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  /* ================= ACTION ================= */

  const sendNotification = () => {
    if (!title.trim() || !message.trim()) {
      alert("⚠️ Please enter both title and message");
      return;
    }

    const confirmSend = confirm(
      `Send notification to "${sendTo}"?\n\nTitle: ${title}`
    );

    if (!confirmSend) return;

    // simulate API call
    alert("📢 Notification sent successfully!");

    // reset form
    setSendTo("All Users");
    setTitle("");
    setMessage("");
  };

  return (
    <div className="notifications-page">
      <section className="card">
        <div className="form">
          <label>Send To</label>
          <select
            value={sendTo}
            onChange={(e) => setSendTo(e.target.value)}
          >
            <option>All Users</option>
            <option>Clients</option>
            <option>Experts</option>
          </select>

          <label>Title</label>
          <input
            type="text"
            placeholder="Notification title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Message</label>
          <textarea
            rows="5"
            placeholder="Write your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            className="btn-primary"
            onClick={sendNotification}
          >
            Send Notification
          </button>
        </div>
      </section>
    </div>
  );
}