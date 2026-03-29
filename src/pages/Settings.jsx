import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  /* ================= PLATFORM SETTINGS ================= */
  const [platform, setPlatform] = useState({
    commission: 10,
    minBid: 500,
    maxBid: 500000,
  });

  /* ================= LANGUAGE ================= */
  const [language, setLanguage] = useState("English");

  /* ================= POLICY ================= */
  const [policy, setPolicy] = useState(
    "Update platform policies and privacy rules here."
  );

  /* ================= ADMIN PROFILE ================= */
  const [admin, setAdmin] = useState({
    name: "Admin User",
    email: "admin@easynocks.com",
  });

  /* ================= ACTIONS ================= */

  const savePlatform = () => {
    alert("✅ Platform settings saved");
    console.log(platform);
  };

  const saveLanguage = () => {
    alert(`🌐 Language set to ${language}`);
  };

  const updatePolicy = () => {
    alert("📜 Policy updated");
    console.log(policy);
  };

  const saveProfile = () => {
    alert("👤 Profile updated");
    console.log(admin);
  };

  /* ================= LOGOUT ================= */

  const logout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout from admin panel?"
    );

    if (!confirmLogout) return;

    // Clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Redirect to Dashboard ("/")
    navigate("/", { replace: true });
  };

  return (
    <div className="settings-page">
      {/* ================= Platform Settings ================= */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2>Platform Settings</h2>

        <div className="form">
          <label>Platform Commission (%)</label>
          <input
            type="number"
            value={platform.commission}
            onChange={(e) =>
              setPlatform({ ...platform, commission: e.target.value })
            }
          />

          <label>Minimum Bid Amount</label>
          <input
            type="number"
            value={platform.minBid}
            onChange={(e) =>
              setPlatform({ ...platform, minBid: e.target.value })
            }
          />

          <label>Maximum Bid Amount</label>
          <input
            type="number"
            value={platform.maxBid}
            onChange={(e) =>
              setPlatform({ ...platform, maxBid: e.target.value })
            }
          />

          <button className="btn-primary" onClick={savePlatform}>
            Save Platform Settings
          </button>
        </div>
      </section>

      {/* ================= Language ================= */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2>Language Management</h2>

        <div className="form">
          <label>Default Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option>English</option>
            <option>Hindi</option>
            <option>French</option>
          </select>

          <button className="btn-primary" onClick={saveLanguage}>
            Save Language Settings
          </button>
        </div>
      </section>

      {/* ================= Policy ================= */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2>Privacy & Policy Content</h2>

        <div className="form">
          <label>Terms / Privacy Policy</label>
          <textarea
            rows="5"
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
          />

          <button className="btn-primary" onClick={updatePolicy}>
            Update Policy
          </button>
        </div>
      </section>

      {/* ================= Admin Profile ================= */}
      <section className="card" style={{ marginBottom: 24 }}>
        <h2>Admin Profile</h2>

        <div className="form">
          <label>Admin Name</label>
          <input
            type="text"
            value={admin.name}
            onChange={(e) =>
              setAdmin({ ...admin, name: e.target.value })
            }
          />

          <label>Email</label>
          <input
            type="email"
            value={admin.email}
            onChange={(e) =>
              setAdmin({ ...admin, email: e.target.value })
            }
          />

          <button className="btn-primary" onClick={saveProfile}>
            Save Profile
          </button>
        </div>
      </section>

      {/* ================= Logout ================= */}
      <section className="card">
        <h2>Logout</h2>

        <button className="btn danger" onClick={logout}>
          Logout from Admin Panel
        </button>
      </section>
    </div>
  );
}