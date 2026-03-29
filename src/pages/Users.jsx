import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllUsers, deactivateUser, activateUser } from "../api/userApi";
import { registerUser, verifyRegisterOtp, getAllSkills } from "../api/auth";
import { getCoordinates, searchLocations } from "../api/location";
import { useToast, ConfirmModal } from "../components/Toast";

import {
  Search,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  X,
  User,
  Phone,
  MapPin,
  Briefcase,
  Shield,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users as UsersIcon,
  Activity,
  UserCheck,
  UserX,
  Filter,
} from "lucide-react";

const PAGE_SIZE = 10;
const ANIM_DURATION = 300;

const ROLE_COLORS = {
  AGENCY: { bg: "#e8f4fd", text: "#1a6fa8", dot: "#3b9fd4" },
  CLIENT: { bg: "#eaf7ec", text: "#1a6b35", dot: "#4a9e5c" },
  WORKER: { bg: "#f0ebff", text: "#5b3fa8", dot: "#8b6fdb" },
  ADMIN: { bg: "#fff8e6", text: "#8a5a00", dot: "#f0a500" },
};

const STATUS_COLORS = {
  ACTIVE: { bg: "#eaf7ec", text: "#1a6b35", dot: "#4a9e5c", label: "Active" },
  INACTIVE: {
    bg: "#fff0f0",
    text: "#9b2335",
    dot: "#e05263",
    label: "Inactive",
  },
  BLOCKED: { bg: "#fff0f0", text: "#9b2335", dot: "#e05263", label: "Blocked" },
};

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_GRADIENTS = [
  ["#4a9e5c", "#1a3d22"],
  ["#3b9fd4", "#1a4d6e"],
  ["#8b6fdb", "#3d2a7a"],
  ["#f0a500", "#7a5200"],
  ["#e05263", "#7a1a2a"],
];

function avatarGradient(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = (value + "      ").slice(0, 6).split("");

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (!val) return;
    const next = [...digits];
    next[i] = val[val.length - 1];
    onChange(next.join("").trim());
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = [...digits];
      if (next[i].trim()) {
        next[i] = " ";
        onChange(next.join("").trimEnd());
      } else if (i > 0) {
        next[i - 1] = " ";
        onChange(next.join("").trimEnd());
        inputs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
      {digits.map((d, i) => {
        const filled = d.trim() !== "";
        return (
          <input
            key={i}
            ref={(el) => (inputs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d.trim()}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            style={{
              width: 48,
              height: 56,
              borderRadius: 12,
              border: filled ? "2px solid #4a9e5c" : "1.5px solid #c8eacc",
              background: filled ? "#eaf7ec" : "white",
              color: "#1a3d22",
              fontSize: 22,
              fontWeight: 700,
              textAlign: "center",
              outline: "none",
              boxShadow: filled ? "0 0 0 3px rgba(74,158,92,0.15)" : "none",
              transition: "all 0.15s",
            }}
          />
        );
      })}
    </div>
  );
}

const EMPTY_FORM = {
  fullName: "",
  mobileNumber: "",
  userRole: "AGENCY",
  skillsId: [],
  location: "",
};

// ── Field component for cleaner drawer form ──
function Field({ label, icon: Icon, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#5a7d62",
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {Icon && (
          <Icon
            size={14}
            style={{
              position: "absolute",
              left: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7dbf8a",
              pointerEvents: "none",
            }}
          />
        )}
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  paddingLeft: 38,
  paddingRight: 14,
  paddingTop: 11,
  paddingBottom: 11,
  borderRadius: 12,
  border: "1.5px solid #c8eacc",
  background: "#f7fdf8",
  fontSize: 14,
  color: "#1a3d22",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
  boxSizing: "border-box",
};

export default function Users() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [cursor, setCursor] = useState({
    lastId: undefined,
    lastCreatedAtMs: undefined,
  });
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");

  const [drawerAnim, setDrawerAnim] = useState("closed");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [skillSearch, setSkillSearch] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [showLocationDrop, setShowLocationDrop] = useState(false);
  const [coords, setCoords] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    userId: null,
    action: null,
    name: "",
  });

  const closeTimerRef = useRef(null);

  const openDrawer = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setDrawerAnim("opening");
    requestAnimationFrame(() => setDrawerAnim("open"));
  };

  const closeDrawer = () => {
    if (drawerAnim === "closed" || drawerAnim === "closing") return;
    setDrawerAnim("closing");
    closeTimerRef.current = setTimeout(() => {
      setDrawerAnim("closed");
      setStep(1);
      setOtp("");
      setForm(EMPTY_FORM);
    }, ANIM_DURATION);
  };

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const isMounted = drawerAnim !== "closed";

  const { data: skillsData } = useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
  });
  const skills = skillsData?.data || [];
  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  const handleLocationSearch = async (val) => {
    setForm({ ...form, location: val });
    if (val.length < 3) {
      setShowLocationDrop(false);
      return;
    }
    const results = await searchLocations(val);
    setLocationResults(results);
    setShowLocationDrop(true);
  };

  const registerMutation = useMutation({
    mutationFn: async () => {
      const c = await getCoordinates(form.location);
      setCoords(c);
      return registerUser(form, c);
    },
    onSuccess: (res) => {
      setTransactionId(res.data.transactionId);
      setStep(2);
    },
    onError: () => toast("Registration failed. Please try again.", "error"),
  });

  const verifyMutation = useMutation({
    mutationFn: () =>
      verifyRegisterOtp(
        { mobileNumber: form.mobileNumber, otp, transactionId },
        coords,
      ),
    onSuccess: () => {
      closeDrawer();
      queryClient.invalidateQueries(["admin-users"]);
      toast("User registered successfully!", "success");
    },
    onError: () => toast("Invalid OTP. Please try again.", "error"),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-users", cursor],
    queryFn: () => getAllUsers({ pageNo: 0, pageSize: PAGE_SIZE, ...cursor }),
    keepPreviousData: true,
  });

  const users = data?.data ?? [];
  const hasNext = users.length === PAGE_SIZE;

  const mutOpts = {
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      toast("User status updated.", "success");
    },
    onError: () => toast("Action failed. Please try again.", "error"),
  };
  const deactivateMutation = useMutation({
    mutationFn: deactivateUser,
    ...mutOpts,
  });
  const activateMutation = useMutation({
    mutationFn: activateUser,
    ...mutOpts,
  });

  const busyUserId = deactivateMutation.isLoading
    ? deactivateMutation.variables
    : activateMutation.isLoading
      ? activateMutation.variables
      : null;

  const goNext = useCallback(() => {
    if (!hasNext) return;
    setHistory((h) => [...h, cursor]);
    setCursor({ lastId: data.lastId, lastCreatedAtMs: data.lastCreatedAtMs });
  }, [cursor, data, hasNext]);

  const goPrev = useCallback(() => {
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCursor(prev ?? { lastId: undefined, lastCreatedAtMs: undefined });
  }, [history]);

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search);
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "ACTIVE").length,
    inactive: users.filter((u) => u.status !== "ACTIVE").length,
  };

  const handleConfirm = () => {
    const { userId, action } = confirmModal;
    setConfirmModal({ open: false, userId: null, action: null, name: "" });
    if (action === "deactivate") deactivateMutation.mutate(userId);
    else activateMutation.mutate(userId);
  };

  const backdropStyle =
    drawerAnim === "closing"
      ? { animation: `fadeOut ${ANIM_DURATION}ms ease forwards` }
      : { animation: `fadeIn ${ANIM_DURATION}ms ease forwards` };

  const panelStyle =
    drawerAnim === "closing"
      ? {
          animation: `slideOutRight ${ANIM_DURATION}ms cubic-bezier(0.4,0,1,1) forwards`,
        }
      : {
          animation: `slideInRight ${ANIM_DURATION}ms cubic-bezier(0.16,1,0.3,1) forwards`,
        };

  return (
    <>
      <style>{`
        @keyframes fadeIn       { from { opacity:0; }                              to { opacity:1; } }
        @keyframes fadeOut      { from { opacity:1; }                              to { opacity:0; } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(100%); }  to { opacity:1; transform:translateX(0); } }
        @keyframes slideOutRight{ from { opacity:1; transform:translateX(0); }     to { opacity:0; transform:translateX(100%); } }
        .table-row-hover:hover { background: #f7fdf8 !important; }
        .field-input:focus { border-color: #4a9e5c !important; box-shadow: 0 0 0 3px rgba(74,158,92,0.15) !important; }
        .role-chip { transition: all 0.15s; cursor: pointer; }
        .role-chip:hover { transform: scale(1.03); }
        .skill-row:hover { background: #eaf7ec !important; }
      `}</style>

      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UsersIcon size={18} color="white" />
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1a3d22",
                fontFamily: "'Georgia','Times New Roman',serif",
                margin: 0,
              }}
            >
              Users
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#7dbf8a", margin: 0 }}>
            Manage and monitor all registered platform users
          </p>
        </div>

        <button
          onClick={openDrawer}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 12,
            background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
            color: "white",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(74,158,92,0.35)",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(74,158,92,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(74,158,92,0.35)";
          }}
        >
          <UserPlus size={15} />
          Register User
        </button>
      </div>

      {/* ── Stat pills ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          {
            icon: Activity,
            label: "Total Users",
            value: stats.total,
            bg: "#eaf7ec",
            text: "#1a3d22",
            dot: "#4a9e5c",
          },
          {
            icon: UserCheck,
            label: "Active",
            value: stats.active,
            bg: "#e8f8f0",
            text: "#1a6b35",
            dot: "#4a9e5c",
          },
          {
            icon: UserX,
            label: "Inactive",
            value: stats.inactive,
            bg: "#fff0f0",
            text: "#9b2335",
            dot: "#e05263",
          },
        ].map(({ icon: Icon, label, value, bg, text, dot }) => (
          <div
            key={label}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 20px",
              borderRadius: 14,
              background: "white",
              border: "1.5px solid #c8eacc",
              flex: "1 1 160px",
              minWidth: 150,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={17} color={dot} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "#1a3d22",
                  lineHeight: 1.1,
                }}
              >
                {isLoading ? "—" : value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#7dbf8a",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
          padding: "12px 16px",
          borderRadius: 14,
          background: "white",
          border: "1.5px solid #c8eacc",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 340 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#7dbf8a",
              pointerEvents: "none",
            }}
          />
          <input
            placeholder="Search name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input"
            style={{
              ...inputStyle,
              paddingLeft: 36,
              paddingTop: 9,
              paddingBottom: 9,
              fontSize: 13,
            }}
          />
        </div>

        {/* Role filter chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Filter size={13} color="#a8d5b0" />
          {["ALL", "AGENCY", "USER"].map((role) => {
            const active = filterRole === role;
            const c =
              role === "ALL"
                ? { bg: "#eaf7ec", text: "#1a3d22", dot: "#4a9e5c" }
                : ROLE_COLORS[role];
            return (
              <button
                key={role}
                onClick={() => setFilterRole(role)}
                className="role-chip"
                style={{
                  padding: "5px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  border: active
                    ? `1.5px solid ${c?.dot ?? "#4a9e5c"}`
                    : "1.5px solid #c8eacc",
                  background: active ? (c?.bg ?? "#eaf7ec") : "white",
                  color: active ? (c?.text ?? "#1a3d22") : "#7dbf8a",
                  cursor: "pointer",
                }}
              >
                {role === "ALL" ? "All Roles" : role}
              </button>
            );
          })}
        </div>

        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "#a8d5b0",
            fontWeight: 500,
          }}
        >
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {isError && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderRadius: 12,
            background: "#fff0f0",
            border: "1.5px solid #f5c0c7",
            color: "#9b2335",
            fontSize: 13,
          }}
        >
          <AlertCircle size={15} /> Failed to load users. Please try again.
        </div>
      )}

      {/* ── Elegant Table ── */}
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: "1.5px solid #c8eacc",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(74,158,92,0.06)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", minWidth: 680, borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: "#f7fdf8" }}>
                {["User", "Phone", "Role", "Status", "Joined", "Action"].map(
                  (h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "13px 18px",
                        textAlign: i === 5 ? "center" : "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#7dbf8a",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        borderBottom: "1.5px solid #eaf7ec",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      {[40, 28, 18, 20, 22, 16].map((w, j) => (
                        <td
                          key={j}
                          style={{
                            padding: "15px 18px",
                            borderBottom: "1px solid #f0f9f1",
                          }}
                        >
                          <div
                            style={{
                              height: 12,
                              borderRadius: 6,
                              background: "#eaf7ec",
                              width: `${w + ((j * 3) % 14)}%`,
                            }}
                            className="animate-pulse"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
              ) : filtered.length > 0 ? (
                filtered.map((user, idx) => {
                  const status =
                    STATUS_COLORS[user.status] ?? STATUS_COLORS.INACTIVE;
                  const role = ROLE_COLORS[user.role] ?? {
                    bg: "#f4faf5",
                    text: "#5a7d62",
                    dot: "#7dbf8a",
                  };
                  const [g1, g2] = avatarGradient(user.fullName);
                  const isActive = user.status === "ACTIVE";
                  const isInactive =
                    user.status === "INACTIVE" || user.status === "BLOCKED";
                  const isBusy = busyUserId === user.id;
                  const isLast = idx === filtered.length - 1;

                  return (
                    <tr
                      key={user.id}
                      className="table-row-hover"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid #f0f9f1",
                        opacity: isBusy ? 0.6 : 1,
                        transition: "background 0.15s, opacity 0.2s",
                      }}
                    >
                      {/* User cell */}
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: 10,
                              flexShrink: 0,
                              background: `linear-gradient(135deg,${g1},${g2})`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontSize: 13,
                              fontWeight: 700,
                              opacity: isActive ? 1 : 0.5,
                            }}
                          >
                            {initials(user.fullName)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1a3d22",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {user.fullName || "—"}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#a8d5b0",
                                marginTop: 2,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {user.email || "—"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td
                        style={{
                          padding: "14px 18px",
                          fontSize: 13,
                          color: "#5a7d62",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.phone || "—"}
                      </td>

                      {/* Role */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.04em",
                            background: role.bg,
                            color: role.text,
                            border: `1px solid ${role.dot}40`,
                          }}
                        >
                          <span
                            style={{
                              width: 5,
                              height: 5,
                              borderRadius: "50%",
                              background: role.dot,
                              display: "inline-block",
                            }}
                          />
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: status.bg,
                            color: status.text,
                          }}
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: status.dot,
                              display: "inline-block",
                              boxShadow: isActive
                                ? `0 0 0 2px ${status.dot}30`
                                : "none",
                            }}
                          />
                          {status.label}
                        </span>
                      </td>

                      {/* Joined */}
                      <td
                        style={{
                          padding: "14px 18px",
                          fontSize: 12,
                          color: "#a8d5b0",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.createdDate || "—"}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        {isActive && (
                          <button
                            disabled={isBusy}
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                userId: user.id,
                                action: "deactivate",
                                name: user.fullName,
                              })
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#fff5f5",
                              color: "#c0392b",
                              border: "1px solid #f5c0c7",
                              cursor: isBusy ? "not-allowed" : "pointer",
                              transition: "all 0.15s",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              if (!isBusy) {
                                e.currentTarget.style.background = "#fde0e4";
                                e.currentTarget.style.borderColor = "#e05263";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff5f5";
                              e.currentTarget.style.borderColor = "#f5c0c7";
                            }}
                          >
                            {isBusy ? (
                              <RefreshCw size={11} className="animate-spin" />
                            ) : (
                              <UserX size={11} />
                            )}
                            {isBusy ? "…" : "Deactivate"}
                          </button>
                        )}
                        {isInactive && (
                          <button
                            disabled={isBusy}
                            onClick={() =>
                              setConfirmModal({
                                open: true,
                                userId: user.id,
                                action: "activate",
                                name: user.fullName,
                              })
                            }
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "6px 14px",
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                              background: "#eaf7ec",
                              color: "#1a6b35",
                              border: "1px solid #a8d5b0",
                              cursor: isBusy ? "not-allowed" : "pointer",
                              transition: "all 0.15s",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              if (!isBusy) {
                                e.currentTarget.style.background = "#d4f0da";
                                e.currentTarget.style.borderColor = "#4a9e5c";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#eaf7ec";
                              e.currentTarget.style.borderColor = "#a8d5b0";
                            }}
                          >
                            {isBusy ? (
                              <RefreshCw size={11} className="animate-spin" />
                            ) : (
                              <UserCheck size={11} />
                            )}
                            {isBusy ? "…" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: "60px 20px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 14,
                          background: "#eaf7ec",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <UsersIcon size={26} color="#a8d5b0" />
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#1a3d22",
                        }}
                      >
                        No users found
                      </div>
                      <div style={{ fontSize: 13, color: "#7dbf8a" }}>
                        Try adjusting your search or filters
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderRadius: 14,
          background: "white",
          border: "1.5px solid #c8eacc",
        }}
      >
        <span style={{ fontSize: 12, color: "#a8d5b0", fontWeight: 500 }}>
          Page {history.length + 1}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={goPrev}
            disabled={history.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              border: "1.5px solid #c8eacc",
              background: "white",
              color: "#1a3d22",
              cursor: history.length === 0 ? "not-allowed" : "pointer",
              opacity: history.length === 0 ? 0.4 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (history.length > 0)
                e.currentTarget.style.background = "#eaf7ec";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            <ChevronLeft size={13} /> Previous
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext || isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              border: "1.5px solid #c8eacc",
              background: "white",
              color: "#1a3d22",
              cursor: !hasNext || isLoading ? "not-allowed" : "pointer",
              opacity: !hasNext || isLoading ? 0.4 : 1,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (hasNext && !isLoading)
                e.currentTarget.style.background = "#eaf7ec";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* ══════════ DRAWER ══════════ */}
      {isMounted && (
        <>
          <div
            className="fixed inset-0"
            style={{
              zIndex: 200,
              background: "rgba(26,61,34,0.35)",
              backdropFilter: "blur(3px)",
              ...backdropStyle,
            }}
            onClick={closeDrawer}
          />

          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100vh",
              zIndex: 300,
              width: "100%",
              maxWidth: 520,
              display: "flex",
              flexDirection: "column",
              background: "white",
              boxShadow: "-16px 0 60px rgba(26,61,34,0.15)",
              borderLeft: "1.5px solid #c8eacc",
              ...panelStyle,
            }}
          >
            {/* Drawer header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 28px",
                borderBottom: "1.5px solid #c8eacc",
                flexShrink: 0,
                background: "#f7fdf8",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(74,158,92,0.3)",
                  }}
                >
                  {step === 1 ? (
                    <User size={18} color="white" />
                  ) : (
                    <Shield size={18} color="white" />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 17,
                      fontWeight: 700,
                      color: "#1a3d22",
                      fontFamily: "'Georgia','Times New Roman',serif",
                    }}
                  >
                    {step === 1 ? "Register New User" : "Verify Identity"}
                  </div>
                  <div style={{ fontSize: 12, color: "#7dbf8a", marginTop: 2 }}>
                    {step === 1
                      ? "Fill in the details to create a new user"
                      : `Code sent to ${form.mobileNumber}`}
                  </div>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "1.5px solid #c8eacc",
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7dbf8a",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#eaf7ec";
                  e.currentTarget.style.color = "#1a3d22";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#7dbf8a";
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Step indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 28px",
                borderBottom: "1.5px solid #c8eacc",
                background: "#f7fdf8",
                flexShrink: 0,
              }}
            >
              {[
                { num: 1, label: "User Details" },
                { num: 2, label: "Verification" },
              ].map(({ num, label }, idx) => (
                <div
                  key={num}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: step >= num ? "#4a9e5c" : "#eaf7ec",
                      color: step >= num ? "white" : "#a8d5b0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      transition: "all 0.2s",
                    }}
                  >
                    {step > num ? <CheckCircle2 size={13} /> : num}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: step >= num ? "#1a3d22" : "#a8d5b0",
                    }}
                  >
                    {label}
                  </span>
                  {idx === 0 && (
                    <div
                      style={{
                        width: 40,
                        height: 2,
                        borderRadius: 2,
                        marginLeft: 4,
                        background: step >= 2 ? "#4a9e5c" : "#eaf7ec",
                        transition: "background 0.3s",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Drawer body */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              {step === 1 ? (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                    }}
                  >
                    <Field label="Full Name" icon={User}>
                      <input
                        value={form.fullName}
                        onChange={(e) =>
                          setForm({ ...form, fullName: e.target.value })
                        }
                        placeholder="Rajesh Kumar"
                        className="field-input"
                        style={inputStyle}
                      />
                    </Field>
                    <Field label="Mobile Number" icon={Phone}>
                      <input
                        value={form.mobileNumber}
                        onChange={(e) =>
                          setForm({ ...form, mobileNumber: e.target.value })
                        }
                        placeholder="+91 98765 43210"
                        className="field-input"
                        style={inputStyle}
                      />
                    </Field>
                  </div>

                  {/* Role */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#5a7d62",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      User Role
                    </label>
                    <div style={{ display: "flex", gap: 10 }}>
                      {["AGENCY", "USER"].map((role) => {
                        const sel = form.userRole === role;
                        return (
                          <button
                            key={role}
                            onClick={() => setForm({ ...form, userRole: role })}
                            style={{
                              flex: 1,
                              padding: "11px 0",
                              borderRadius: 12,
                              fontSize: 13,
                              fontWeight: 600,
                              border: sel
                                ? "2px solid #4a9e5c"
                                : "1.5px solid #c8eacc",
                              background: sel ? "#eaf7ec" : "white",
                              color: sel ? "#1a3d22" : "#7dbf8a",
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {role.charAt(0) + role.slice(1).toLowerCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Location */}
                  <div style={{ position: "relative" }}>
                    <Field label="Location" icon={MapPin}>
                      <input
                        value={form.location}
                        onChange={(e) => handleLocationSearch(e.target.value)}
                        placeholder="Search city or area…"
                        className="field-input"
                        style={inputStyle}
                      />
                    </Field>
                    {showLocationDrop && locationResults.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          zIndex: 20,
                          marginTop: 4,
                          background: "white",
                          borderRadius: 12,
                          border: "1.5px solid #c8eacc",
                          boxShadow: "0 8px 24px rgba(74,158,92,0.12)",
                          maxHeight: 180,
                          overflowY: "auto",
                        }}
                      >
                        {locationResults.map((loc, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setForm({ ...form, location: loc.name });
                              setCoords({ lat: loc.lat, lng: loc.lng });
                              setShowLocationDrop(false);
                            }}
                            className="skill-row"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "10px 14px",
                              fontSize: 13,
                              color: "#1a3d22",
                              cursor: "pointer",
                              borderBottom:
                                i < locationResults.length - 1
                                  ? "1px solid #f0f9f1"
                                  : "none",
                            }}
                          >
                            <MapPin size={12} color="#a8d5b0" />
                            {loc.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    <label
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#5a7d62",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      Skills{" "}
                      {form.skillsId.length > 0 && (
                        <span style={{ color: "#4a9e5c", fontWeight: 700 }}>
                          · {form.skillsId.length} selected
                        </span>
                      )}
                    </label>
                    <div style={{ position: "relative" }}>
                      <Briefcase
                        size={14}
                        style={{
                          position: "absolute",
                          left: 13,
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "#7dbf8a",
                          pointerEvents: "none",
                        }}
                      />
                      <input
                        placeholder="Search skills…"
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        className="field-input"
                        style={{
                          ...inputStyle,
                          paddingTop: 9,
                          paddingBottom: 9,
                          fontSize: 13,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        border: "1.5px solid #c8eacc",
                        borderRadius: 12,
                        background: "#f7fdf8",
                        maxHeight: 180,
                        overflowY: "auto",
                        padding: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      {filteredSkills.length === 0 && (
                        <div
                          style={{
                            padding: "16px 0",
                            textAlign: "center",
                            fontSize: 13,
                            color: "#a8d5b0",
                          }}
                        >
                          No skills found
                        </div>
                      )}
                      {filteredSkills.map((s) => {
                        const selected = form.skillsId.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() =>
                              setForm({
                                ...form,
                                skillsId: selected
                                  ? form.skillsId.filter((id) => id !== s.id)
                                  : [...form.skillsId, s.id],
                              })
                            }
                            className="skill-row"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "8px 12px",
                              borderRadius: 8,
                              fontSize: 13,
                              cursor: "pointer",
                              color: selected ? "#1a3d22" : "#5a7d62",
                              fontWeight: selected ? 600 : 400,
                              transition: "background 0.12s",
                              background: selected ? "#eaf7ec" : "transparent",
                            }}
                          >
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 5,
                                flexShrink: 0,
                                border: selected
                                  ? "none"
                                  : "1.5px solid #c8eacc",
                                background: selected ? "#4a9e5c" : "white",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.12s",
                              }}
                            >
                              {selected && (
                                <CheckCircle2 size={10} color="white" />
                              )}
                            </div>
                            {s.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                    paddingTop: 24,
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      background: "linear-gradient(135deg,#eaf7ec,#c8eacc)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 8px 24px rgba(74,158,92,0.2)",
                    }}
                  >
                    <Phone size={34} color="#4a9e5c" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "#1a3d22",
                        fontFamily: "'Georgia','Times New Roman',serif",
                        marginBottom: 8,
                      }}
                    >
                      Enter Verification Code
                    </div>
                    <div style={{ fontSize: 13, color: "#7dbf8a" }}>
                      We sent a 6-digit code to
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: "#1a3d22",
                        marginTop: 4,
                      }}
                    >
                      {form.mobileNumber}
                    </div>
                  </div>
                  <OtpInput value={otp} onChange={setOtp} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                    }}
                  >
                    <div
                      style={{ flex: 1, height: 1, background: "#eaf7ec" }}
                    />
                    <span style={{ fontSize: 11, color: "#a8d5b0" }}>
                      6-digit code
                    </span>
                    <div
                      style={{ flex: 1, height: 1, background: "#eaf7ec" }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: "#7dbf8a" }}>
                    Didn't receive it?{" "}
                    <button
                      onClick={() => registerMutation.mutate()}
                      style={{
                        color: "#4a9e5c",
                        fontWeight: 700,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: 12,
                        textDecoration: "underline",
                      }}
                    >
                      Resend code
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer footer */}
            <div
              style={{
                display: "flex",
                gap: 10,
                padding: "16px 28px",
                borderTop: "1.5px solid #c8eacc",
                background: "#f7fdf8",
                flexShrink: 0,
              }}
            >
              <button
                onClick={step === 1 ? closeDrawer : () => setStep(1)}
                style={{
                  flex: 1,
                  padding: "12px 0",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  border: "1.5px solid #c8eacc",
                  background: "white",
                  color: "#1a3d22",
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#eaf7ec")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "white")
                }
              >
                {step === 1 ? "Cancel" : "← Back"}
              </button>

              {step === 1 ? (
                <button
                  onClick={() => registerMutation.mutate()}
                  disabled={
                    registerMutation.isLoading ||
                    !form.fullName ||
                    !form.mobileNumber
                  }
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
                    color: "white",
                    cursor:
                      registerMutation.isLoading ||
                      !form.fullName ||
                      !form.mobileNumber
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      registerMutation.isLoading ||
                      !form.fullName ||
                      !form.mobileNumber
                        ? 0.6
                        : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(74,158,92,0.3)",
                    transition: "opacity 0.15s",
                  }}
                >
                  {registerMutation.isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Sending
                      OTP…
                    </>
                  ) : (
                    "Send OTP →"
                  )}
                </button>
              ) : (
                <button
                  onClick={() => verifyMutation.mutate()}
                  disabled={
                    verifyMutation.isLoading ||
                    otp.replace(/\s/g, "").length < 6
                  }
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 600,
                    border: "none",
                    background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
                    color: "white",
                    cursor:
                      verifyMutation.isLoading ||
                      otp.replace(/\s/g, "").length < 6
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      verifyMutation.isLoading ||
                      otp.replace(/\s/g, "").length < 6
                        ? 0.6
                        : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 4px 14px rgba(74,158,92,0.3)",
                    transition: "opacity 0.15s",
                  }}
                >
                  {verifyMutation.isLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />{" "}
                      Verifying…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Verify & Create
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={
          confirmModal.action === "deactivate"
            ? "Deactivate User"
            : "Activate User"
        }
        message={
          confirmModal.action === "deactivate"
            ? `Are you sure you want to deactivate "${confirmModal.name}"? They will lose platform access.`
            : `Are you sure you want to activate "${confirmModal.name}"? They will regain platform access.`
        }
        confirmLabel={
          confirmModal.action === "deactivate" ? "Deactivate" : "Activate"
        }
        confirmClass={
          confirmModal.action === "deactivate"
            ? "bg-red-600 hover:bg-red-700"
            : "bg-emerald-600 hover:bg-emerald-700"
        }
        onConfirm={handleConfirm}
        onCancel={() =>
          setConfirmModal({ open: false, userId: null, action: null, name: "" })
        }
      />
    </>
  );
}
