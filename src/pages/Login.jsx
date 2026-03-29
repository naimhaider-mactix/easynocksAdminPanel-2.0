import logo from "../assets/image.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../api/auth";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

/* ─── Inline SVG illustration (matches the exam/study scene in the screenshot) ─── */
function StudyIllustration() {
  return (
    <img
      src={logo}
      alt="EasyNocks Platform"
      className="w-full h-full object-contain"
    />
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setError("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const data = await loginAdmin(form);
      localStorage.setItem("token", data.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Invalid credentials. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#c8eacc" }}
    >
      {/* Card */}
      <div
        className="w-full flex rounded-3xl overflow-hidden shadow-2xl"
        style={{ maxWidth: 900, minHeight: 540, background: "white" }}
      >
        {/* ── LEFT panel ── */}
        <div
          className="hidden md:flex flex-col items-center justify-center flex-1 px-10 py-10 gap-6"
          style={{ background: "#eaf7ec" }}
        >
          <StudyIllustration />

          <div className="text-center">
            <h2
              className="font-bold text-[22px] mb-1"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: "#1a3d22",
              }}
            >
              Admin Control Center
            </h2>
            <p
              className="text-[13px] leading-relaxed max-w-[260px] mx-auto"
              style={{ color: "#5a7d62" }}
            >
              Access user management, marketplace listings, project oversight,
              and platform analytics.
            </p>
          </div>

          {/* Dots */}
          <div className="flex items-center gap-2 mt-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#b0d4b8" }}
            />
            <span
              className="w-5 h-2 rounded-full"
              style={{ background: "#4a9e5c" }}
            />
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#b0d4b8" }}
            />
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "#b0d4b8" }}
            />
          </div>
        </div>

        {/* ── RIGHT panel ── */}
        <div
          className="flex flex-col justify-center flex-1 px-10 py-12"
          style={{ maxWidth: 440 }}
        >
          {/* Logo / Brand */}
          <div className="mb-9 text-center md:text-left">
            <span
              className="text-[26px] font-bold tracking-[0.08em]"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                color: "#1a3d22",
                letterSpacing: "0.1em",
              }}
            >
              EASY <span style={{ color: "#4a9e5c" }}>NOCKS</span>
            </span>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-[13px] font-medium bg-red-50 text-red-700 border border-red-200">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Username / Email */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-medium"
                style={{ color: "#444" }}
              >
                Username or email
              </label>
              <input
                type="text"
                name="email"
                placeholder="johnsmith007"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl text-[14px] transition-all outline-none"
                style={{
                  border: "1.5px solid #d4d4d4",
                  color: "#1a1a1a",
                  background: "white",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#4a9e5c")}
                onBlur={(e) => (e.target.style.borderColor = "#d4d4d4")}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[13px] font-medium"
                style={{ color: "#444" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 pr-12 rounded-xl text-[14px] transition-all outline-none"
                  style={{
                    border: "1.5px solid #d4d4d4",
                    color: "#1a1a1a",
                    background: "white",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#4a9e5c")}
                  onBlur={(e) => (e.target.style.borderColor = "#d4d4d4")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#aaa" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white text-[15px] font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: loading ? "#6dbf78" : "#1a3d22",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#2d6a3f";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#1a3d22";
              }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
