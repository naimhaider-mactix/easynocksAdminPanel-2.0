import { useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAssignedUsers,
  getJobProposals,
  acceptOrDenyProposal,
  confirmBooking,
  createJobProposal,
  unassignUserFromJob,
} from "../api/jobsApi";
import { getUserProfileById, getAllUsers } from "../api/userApi";
import {
  ChevronRight,
  X,
  Search,
  MapPin,
  Banknote,
  CreditCard,
  Calendar,
  Users,
  ClipboardList,
  UserPlus,
  Eye,
  UserMinus,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  FolderKanban,
  Clock,
  CircleDot,
  Layers,
  CheckCircle2,
  Phone,
  Star,
  Briefcase,
  Navigation,
  ArrowLeft,
  Send,
  Timer,
} from "lucide-react";

/* ══════════ UTILITIES ══════════ */
function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km) {
  if (km == null || isNaN(km)) return null;
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function initials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const AVATAR_GRADS = [
  ["#4a9e5c", "#1a3d22"],
  ["#3b9fd4", "#1a4d6e"],
  ["#8b6fdb", "#3d2a7a"],
  ["#f0a500", "#7a5200"],
  ["#e05263", "#7a1a2a"],
];

function avatarGrad(name) {
  const idx = (name?.charCodeAt(0) ?? 0) % AVATAR_GRADS.length;
  return AVATAR_GRADS[idx];
}

function Avatar({ name, photo, size = "md" }) {
  const dim = size === "lg" ? 72 : size === "sm" ? 30 : 38;
  const fontSize = size === "lg" ? 22 : size === "sm" ? 11 : 13;
  const [g1, g2] = avatarGrad(name);

  if (photo) {
    return (
      <img
        src={`data:image/jpeg;base64,${photo}`}
        alt={name}
        style={{
          width: dim,
          height: dim,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #c8eacc",
          flexShrink: 0,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg,${g1},${g2})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize,
        fontWeight: 700,
        border: "2px solid #c8eacc",
      }}
    >
      {initials(name)}
    </div>
  );
}

/* ══════════ STATUS / BADGE MAPS ══════════ */
const STATUS_COLORS = {
  OPEN: { bg: "#eaf7ec", text: "#1a6b35", dot: "#4a9e5c", label: "Open" },
  ASSIGNED: {
    bg: "#f0ebff",
    text: "#5b3fa8",
    dot: "#8b6fdb",
    label: "Assigned",
  },
  ONGOING: { bg: "#fff8e6", text: "#8a5a00", dot: "#f0a500", label: "Ongoing" },
  COMPLETED: {
    bg: "#e8f4fd",
    text: "#1a6fa8",
    dot: "#3b9fd4",
    label: "Completed",
  },
  CANCELLED: {
    bg: "#fff0f0",
    text: "#9b2335",
    dot: "#e05263",
    label: "Cancelled",
  },
  SUBMITTED: {
    bg: "#fff8e6",
    text: "#8a5a00",
    dot: "#f0a500",
    label: "Submitted",
  },
  ACCEPTED: {
    bg: "#eaf7ec",
    text: "#1a6b35",
    dot: "#4a9e5c",
    label: "Accepted",
  },
  DENIED: { bg: "#fff0f0", text: "#9b2335", dot: "#e05263", label: "Denied" },
  CONFIRMED: {
    bg: "#e8f4fd",
    text: "#1a6fa8",
    dot: "#3b9fd4",
    label: "Confirmed",
  },
  ACTIVE: { bg: "#eaf7ec", text: "#1a6b35", dot: "#4a9e5c", label: "Active" },
  INACTIVE: {
    bg: "#fff0f0",
    text: "#9b2335",
    dot: "#e05263",
    label: "Inactive",
  },
  BLOCKED: { bg: "#fff0f0", text: "#9b2335", dot: "#e05263", label: "Blocked" },
};

const STATUS_ICONS = {
  OPEN: CircleDot,
  ASSIGNED: Layers,
  ONGOING: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
  SUBMITTED: Clock,
  ACCEPTED: CheckCircle2,
  DENIED: XCircle,
  CONFIRMED: CheckCircle2,
  ACTIVE: CheckCircle2,
  INACTIVE: XCircle,
  BLOCKED: XCircle,
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] ?? {
    bg: "#f4f4f4",
    text: "#666",
    dot: "#aaa",
    label: status,
  };
  const Icon = STATUS_ICONS[status] ?? CircleDot;
  return (
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
        background: s.bg,
        color: s.text,
      }}
    >
      <Icon size={11} />
      {s.label ?? status}
    </span>
  );
}

/* ══════════ SHARED PRIMITIVES ══════════ */
function ErrorBanner({ msg }) {
  return (
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
      <AlertCircle size={15} /> {msg}
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
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
        <Icon size={26} color="#a8d5b0" />
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#1a3d22" }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "#7dbf8a", maxWidth: 260 }}>
        {subtitle}
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 4, cols = 4 }) {
  return (
    <div
      style={{
        borderRadius: 12,
        border: "1.5px solid #c8eacc",
        overflow: "hidden",
      }}
    >
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {Array(rows)
            .fill(0)
            .map((_, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: i < rows - 1 ? "1px solid #f0f9f1" : "none",
                }}
              >
                {Array(cols)
                  .fill(0)
                  .map((_, j) => (
                    <td key={j} style={{ padding: "15px 18px" }}>
                      <div
                        style={{
                          height: 12,
                          borderRadius: 6,
                          background: "#eaf7ec",
                          width: `${50 + ((j * 13) % 40)}%`,
                        }}
                        className="animate-pulse"
                      />
                    </td>
                  ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

/* ══════════ DRAWER WRAPPER ══════════ */
function Drawer({ onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(26,61,34,0.35)",
          backdropFilter: "blur(3px)",
          animation: "fadeIn 0.25s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100vh",
          zIndex: 300,
          width: "100%",
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          background: "white",
          borderLeft: "1.5px solid #c8eacc",
          boxShadow: "-16px 0 60px rgba(26,61,34,0.15)",
          animation: "slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {children}
      </div>
    </>
  );
}

function DrawerHeader({ title, subtitle, icon: Icon, onClose }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 24px",
        borderBottom: "1.5px solid #c8eacc",
        flexShrink: 0,
        background: "#f7fdf8",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(74,158,92,0.3)",
            flexShrink: 0,
          }}
        >
          <Icon size={18} color="white" />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#1a3d22",
              fontFamily: "'Georgia','Times New Roman',serif",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: "#7dbf8a", marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onClose}
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
        <X size={15} />
      </button>
    </div>
  );
}

/* ══════════ USER PROFILE DRAWER ══════════ */
function UserProfileDrawer({ userId, onClose }) {
  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => getUserProfileById(userId),
    enabled: !!userId,
  });

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader
        title="User Profile"
        subtitle="Full profile details"
        icon={Eye}
        onClose={onClose}
      />
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: 260,
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "3px solid #c8eacc",
                borderTopColor: "#4a9e5c",
              }}
              className="animate-spin"
            />
            <div style={{ fontSize: 13, color: "#7dbf8a" }}>
              Loading profile…
            </div>
          </div>
        )}
        {isError && (
          <div style={{ margin: 20 }}>
            <ErrorBanner msg="Failed to load user profile." />
          </div>
        )}
        {profile && (
          <>
            {/* Hero */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "28px 24px 20px",
                background: "linear-gradient(180deg,#eaf7ec,white)",
                borderBottom: "1.5px solid #c8eacc",
                gap: 10,
              }}
            >
              <Avatar
                name={profile.fullName}
                photo={profile.profilePhoto}
                size="lg"
              />
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: "#1a3d22",
                    fontFamily: "'Georgia','Times New Roman',serif",
                  }}
                >
                  {profile.fullName}
                </div>
                <div style={{ fontSize: 13, color: "#7dbf8a", marginTop: 4 }}>
                  {profile.email}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  justifyContent: "center",
                  marginTop: 4,
                }}
              >
                <StatusBadge status={profile.role} />
                {profile.isPhoneVerified && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#eaf7ec",
                      color: "#1a6b35",
                    }}
                  >
                    <CheckCircle2 size={11} /> Verified
                  </span>
                )}
                {profile.ratingAvg > 0 && (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "4px 10px",
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      background: "#fff8e6",
                      color: "#8a5a00",
                    }}
                  >
                    <Star size={11} /> {profile.ratingAvg.toFixed(1)} (
                    {profile.ratingCount})
                  </span>
                )}
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {profile.about && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "#f7fdf8",
                    border: "1.5px solid #c8eacc",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#7dbf8a",
                      marginBottom: 6,
                    }}
                  >
                    About
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#1a3d22", lineHeight: 1.6 }}
                  >
                    {profile.about}
                  </div>
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {[
                  { icon: Phone, label: "Mobile", val: profile.mobileNumber },
                  {
                    icon: Briefcase,
                    label: "Experience",
                    val: profile.experienceYears
                      ? `${profile.experienceYears} yrs`
                      : null,
                  },
                  { icon: Users, label: "Workers", val: profile.workerCount },
                ]
                  .filter((r) => r.val)
                  .map(({ icon: Icon, label, val }) => (
                    <div
                      key={label}
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: "#f7fdf8",
                        border: "1.5px solid #c8eacc",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 10,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "#7dbf8a",
                          marginBottom: 5,
                        }}
                      >
                        <Icon size={11} /> {label}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#1a3d22",
                        }}
                      >
                        {val}
                      </div>
                    </div>
                  ))}
              </div>
              {(profile.fullAddress || profile.city) && (
                <div
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: "#f7fdf8",
                    border: "1.5px solid #c8eacc",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 10,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: "#7dbf8a",
                      marginBottom: 6,
                    }}
                  >
                    <MapPin size={11} /> Address
                  </div>
                  <div
                    style={{ fontSize: 13, color: "#1a3d22", lineHeight: 1.5 }}
                  >
                    {[
                      profile.fullAddress,
                      profile.city,
                      profile.state,
                      profile.country,
                      profile.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

/* ══════════ TAB 1 — ASSIGNED USERS ══════════ */
function AssignedUsersTab({ jobId }) {
  const [viewUserId, setViewUserId] = useState(null);

  const {
    data: list = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["assigned-users", jobId],
    queryFn: () => getAssignedUsers(jobId),
    enabled: !!jobId,
  });

  const unassignMutation = useMutation({
    mutationFn: ({ providerId }) => unassignUserFromJob({ jobId, providerId }),
    onSuccess: () => refetch(),
    onError: () => alert("Failed to unassign user. Please try again."),
  });

  if (isLoading) return <TableSkeleton rows={4} cols={3} />;
  if (isError) return <ErrorBanner msg="Failed to load assigned users." />;
  if (list.length === 0)
    return (
      <EmptyState
        icon={Users}
        title="No assigned users"
        subtitle="No users are currently assigned to this project."
      />
    );

  const COLS = ["User", "Assigned At", "Actions"];

  return (
    <>
      {viewUserId && (
        <UserProfileDrawer
          userId={viewUserId}
          onClose={() => setViewUserId(null)}
        />
      )}
      <div
        style={{
          background: "white",
          borderRadius: 14,
          border: "1.5px solid #c8eacc",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", minWidth: 500, borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: "#f7fdf8" }}>
                {COLS.map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 18px",
                      textAlign: i === 2 ? "center" : "left",
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
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((item, idx) => (
                <tr
                  key={item.id}
                  className="pjd-row"
                  style={{
                    borderBottom:
                      idx < list.length - 1 ? "1px solid #f0f9f1" : "none",
                    transition: "background 0.15s",
                  }}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Avatar name={item.assignedUserName} size="sm" />
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#1a3d22",
                          }}
                        >
                          {item.assignedUserName || "—"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#a8d5b0",
                            marginTop: 2,
                          }}
                        >
                          ID: {item.assignedToId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      color: "#7dbf8a",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.assignedAt
                      ? new Date(item.assignedAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() => setViewUserId(item.assignedToId)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "#eaf7ec",
                          color: "#1a3d22",
                          border: "1px solid #a8d5b0",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "#d4f0da";
                          e.currentTarget.style.borderColor = "#4a9e5c";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#eaf7ec";
                          e.currentTarget.style.borderColor = "#a8d5b0";
                        }}
                      >
                        <Eye size={11} /> View
                      </button>
                      <button
                        disabled={unassignMutation.isLoading}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Unassign ${item.assignedUserName} from this project?`,
                            )
                          )
                            unassignMutation.mutate({
                              providerId: item.assignedToId,
                            });
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 600,
                          background: "#fff5f5",
                          color: "#c0392b",
                          border: "1px solid #f5c0c7",
                          cursor: unassignMutation.isLoading
                            ? "not-allowed"
                            : "pointer",
                          opacity: unassignMutation.isLoading ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!unassignMutation.isLoading) {
                            e.currentTarget.style.background = "#fde0e4";
                            e.currentTarget.style.borderColor = "#e05263";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "#fff5f5";
                          e.currentTarget.style.borderColor = "#f5c0c7";
                        }}
                      >
                        {unassignMutation.isLoading ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <UserMinus size={11} />
                        )}
                        Unassign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ══════════ TAB 2 — PROPOSALS ══════════ */
function ProposalsTab({ jobId }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const {
    data: proposals = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["job-proposals", jobId],
    queryFn: () => getJobProposals(jobId),
  });

  const acceptMutation = useMutation({
    mutationFn: async (proposalId) => {
      await acceptOrDenyProposal({ jobProposalId: proposalId, accept: true });
      await confirmBooking(proposalId);
    },
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => {
      queryClient.invalidateQueries(["job-proposals", jobId]);
      queryClient.invalidateQueries(["assigned-users", jobId]);
    },
  });

  const denyMutation = useMutation({
    mutationFn: (proposalId) =>
      acceptOrDenyProposal({ jobProposalId: proposalId, accept: false }),
    onMutate: (id) => setBusyId(id),
    onSettled: () => setBusyId(null),
    onSuccess: () => queryClient.invalidateQueries(["job-proposals", jobId]),
  });

  if (isLoading) return <TableSkeleton rows={4} cols={5} />;
  if (isError) return <ErrorBanner msg="Failed to load proposals." />;
  if (proposals.length === 0)
    return (
      <EmptyState
        icon={ClipboardList}
        title="No proposals yet"
        subtitle="No proposals have been submitted for this project."
      />
    );

  const COLS = [
    "Expert",
    "Proposal",
    "Amount",
    "Submitted",
    "Status",
    "Actions",
  ];

  return (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        border: "1.5px solid #c8eacc",
        overflow: "hidden",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{ width: "100%", minWidth: 720, borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#f7fdf8" }}>
              {COLS.map((h, i) => (
                <th
                  key={h}
                  style={{
                    padding: "12px 18px",
                    textAlign: i === COLS.length - 1 ? "center" : "left",
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
              ))}
            </tr>
          </thead>
          <tbody>
            {proposals.map((p, idx) => {
              console.log(p.status);

              const busy = busyId === p.id;
              const isSettled = [
                "ACCEPTED",
                "DENIED",
                "CONFIRMED",
                "REJECTED",
              ].includes(p.status);
              return (
                <tr
                  key={p.id}
                  className="pjd-row"
                  style={{
                    borderBottom:
                      idx < proposals.length - 1 ? "1px solid #f0f9f1" : "none",
                    opacity: busy ? 0.6 : 1,
                    transition: "all 0.15s",
                  }}
                >
                  <td style={{ padding: "14px 18px" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <Avatar name={p.expertName} size="sm" />
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#1a3d22",
                          }}
                        >
                          {p.expertName || "Anonymous"}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#a8d5b0",
                            marginTop: 2,
                          }}
                        >
                          ID: {p.expertId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", maxWidth: 200 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#5a7d62",
                        lineHeight: 1.5,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {p.proposalText}
                    </div>
                  </td>
                  <td style={{ padding: "14px 18px", whiteSpace: "nowrap" }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#1a3d22",
                      }}
                    >
                      ₹{p.proposedAmount?.toLocaleString("en-IN")}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 18px",
                      fontSize: 12,
                      color: "#a8d5b0",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.createdDate}
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    <StatusBadge status={p.status} />
                  </td>
                  <td style={{ padding: "14px 18px" }}>
                    {isSettled ? (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#a8d5b0",
                          fontStyle: "italic",
                          textAlign: "center",
                        }}
                      >
                        Settled
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Accept proposal from ${p.expertName || "this expert"}? This will also confirm the booking.`,
                              )
                            )
                              acceptMutation.mutate(p.id);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#eaf7ec",
                            color: "#1a6b35",
                            border: "1px solid #a8d5b0",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (!busy) {
                              e.currentTarget.style.background = "#d4f0da";
                              e.currentTarget.style.borderColor = "#4a9e5c";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#eaf7ec";
                            e.currentTarget.style.borderColor = "#a8d5b0";
                          }}
                        >
                          {busy && acceptMutation.isLoading ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <CheckCircle size={11} />
                          )}
                          Accept
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (
                              window.confirm(
                                `Deny proposal from ${p.expertName || "this expert"}?`,
                              )
                            )
                              denyMutation.mutate(p.id);
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 12px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            background: "#fff5f5",
                            color: "#c0392b",
                            border: "1px solid #f5c0c7",
                            cursor: busy ? "not-allowed" : "pointer",
                            opacity: busy ? 0.5 : 1,
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (!busy) {
                              e.currentTarget.style.background = "#fde0e4";
                              e.currentTarget.style.borderColor = "#e05263";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff5f5";
                            e.currentTarget.style.borderColor = "#f5c0c7";
                          }}
                        >
                          {busy && denyMutation.isLoading ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <XCircle size={11} />
                          )}
                          Deny
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ══════════ PLACE BID DRAWER ══════════ */
const TIME_FORMAT_OPTIONS = [
  { value: "MIN", label: "Minutes" },
  { value: "HRS", label: "Hours" },
  { value: "DAY", label: "Days" },
  { value: "MONTH", label: "Months" },
  { value: "YEAR", label: "Years" },
];

function PlaceBidDrawer({ user, job, distKm, onClose, onSuccess }) {
  const [form, setForm] = useState({
    proposalText: "",
    proposedAmount: "",
    time: "",
    timeFormat: "DAY",
  });

  const isValid =
    form.proposalText.trim() !== "" &&
    form.proposedAmount !== "" &&
    Number(form.time) > 0;

  const mutation = useMutation({
    mutationFn: () =>
      createJobProposal({
        jobId: job.id,
        userId: user.id,
        proposalText: form.proposalText,
        proposedAmount: parseFloat(form.proposedAmount),
        time: parseInt(form.time, 10),
        timeFormat: form.timeFormat,
      }),
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const distLabel = distKm != null ? fmtDist(distKm) : null;
  const distBg =
    distKm == null
      ? "#f4f4f4"
      : distKm < 10
        ? "#eaf7ec"
        : distKm < 50
          ? "#fff8e6"
          : "#fff0f0";
  const distColor =
    distKm == null
      ? "#666"
      : distKm < 10
        ? "#1a6b35"
        : distKm < 50
          ? "#8a5a00"
          : "#9b2335";

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    border: "1.5px solid #c8eacc",
    background: "#f7fdf8",
    fontSize: 14,
    color: "#1a3d22",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
    boxSizing: "border-box",
  };

  return (
    <Drawer onClose={onClose}>
      <DrawerHeader
        title="Place Bid"
        subtitle={`For ${user.fullName}`}
        icon={Send}
        onClose={onClose}
      />

      {/* Context strip */}
      <div
        style={{
          padding: "14px 20px",
          background: "#f7fdf8",
          borderBottom: "1.5px solid #c8eacc",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            background: "white",
            borderRadius: 12,
            border: "1.5px solid #c8eacc",
          }}
        >
          <Avatar name={user.fullName} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1a3d22",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.fullName}
            </div>
            <div style={{ fontSize: 12, color: "#7dbf8a", marginTop: 2 }}>
              {user.phone || user.email}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <StatusBadge status={user.role} />
              {distLabel && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: distBg,
                    color: distColor,
                  }}
                >
                  <Navigation size={10} /> {distLabel}
                </span>
              )}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            background: "white",
            borderRadius: 12,
            border: "1.5px solid #c8eacc",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#eaf7ec",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FolderKanban size={16} color="#4a9e5c" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a3d22" }}>
              {job.title}
            </div>
            <div style={{ fontSize: 12, color: "#7dbf8a", marginTop: 2 }}>
              ₹{job.budgetMin?.toLocaleString("en-IN")} – ₹
              {job.budgetMax?.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {/* Amount */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#5a7d62",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Proposed Amount <span style={{ color: "#e05263" }}>*</span>
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 13,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 15,
                fontWeight: 700,
                color: "#4a9e5c",
                pointerEvents: "none",
              }}
            >
              ₹
            </span>
            <input
              type="number"
              min={0}
              placeholder={job.budgetMin ?? "0"}
              value={form.proposedAmount}
              onChange={(e) =>
                setForm({ ...form, proposedAmount: e.target.value })
              }
              style={{ ...inputStyle, paddingLeft: 30 }}
              onFocus={(e) => {
                e.target.style.borderColor = "#4a9e5c";
                e.target.style.boxShadow = "0 0 0 3px rgba(74,158,92,0.15)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#c8eacc";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          {job.budgetMin && job.budgetMax && (
            <div style={{ fontSize: 11, color: "#a8d5b0" }}>
              Budget: ₹{job.budgetMin?.toLocaleString("en-IN")} – ₹
              {job.budgetMax?.toLocaleString("en-IN")}
            </div>
          )}
        </div>

        {/* Duration */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <label
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#5a7d62",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Estimated Duration <span style={{ color: "#e05263" }}>*</span>
            </label>
            {form.time && form.timeFormat && (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#4a9e5c",
                  background: "#eaf7ec",
                  padding: "2px 10px",
                  borderRadius: 20,
                  border: "1px solid #a8d5b0",
                }}
              >
                {form.time}{" "}
                {
                  TIME_FORMAT_OPTIONS.find((o) => o.value === form.timeFormat)
                    ?.label
                }
              </span>
            )}
          </div>
          {/* Unit chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TIME_FORMAT_OPTIONS.map((opt) => {
              const active = form.timeFormat === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm({ ...form, timeFormat: opt.value })}
                  style={{
                    flex: "1 1 60px",
                    padding: "8px 6px",
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    border: active
                      ? "2px solid #4a9e5c"
                      : "1.5px solid #c8eacc",
                    background: active ? "#4a9e5c" : "white",
                    color: active ? "white" : "#7dbf8a",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <input
            type="number"
            min={1}
            placeholder={`e.g. 4`}
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = "#4a9e5c";
              e.target.style.boxShadow = "0 0 0 3px rgba(74,158,92,0.15)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#c8eacc";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Proposal text */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#5a7d62",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Proposal Description <span style={{ color: "#e05263" }}>*</span>
          </label>
          <textarea
            rows={5}
            placeholder="Describe why this user is a great fit…"
            value={form.proposalText}
            onChange={(e) => setForm({ ...form, proposalText: e.target.value })}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
            onFocus={(e) => {
              e.target.style.borderColor = "#4a9e5c";
              e.target.style.boxShadow = "0 0 0 3px rgba(74,158,92,0.15)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#c8eacc";
              e.target.style.boxShadow = "none";
            }}
          />
          <div style={{ fontSize: 11, color: "#a8d5b0", textAlign: "right" }}>
            {form.proposalText.length} chars
          </div>
        </div>

        {mutation.isError && (
          <ErrorBanner msg="Failed to submit proposal. Please try again." />
        )}
        {mutation.isSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 16px",
              borderRadius: 12,
              background: "#eaf7ec",
              border: "1.5px solid #a8d5b0",
              color: "#1a6b35",
              fontSize: 13,
            }}
          >
            <CheckCircle2 size={15} /> Proposal submitted successfully!
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          gap: 10,
          padding: "16px 24px",
          borderTop: "1.5px solid #c8eacc",
          background: "#f7fdf8",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
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
          onMouseEnter={(e) => (e.currentTarget.style.background = "#eaf7ec")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
        >
          Cancel
        </button>
        <button
          disabled={mutation.isLoading || !isValid}
          onClick={() => mutation.mutate()}
          style={{
            flex: 1,
            padding: "12px 0",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
            color: "white",
            cursor: mutation.isLoading || !isValid ? "not-allowed" : "pointer",
            opacity: mutation.isLoading || !isValid ? 0.6 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(74,158,92,0.3)",
            transition: "opacity 0.15s",
          }}
        >
          {mutation.isLoading ? (
            <>
              <RefreshCw size={14} className="animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Send size={14} /> Submit Bid
            </>
          )}
        </button>
      </div>
    </Drawer>
  );
}

/* ══════════ TAB 3 — ASSIGN USER ══════════ */
const USER_PAGE_SIZE = 8;

function AssignUserTab({ job }) {
  const queryClient = useQueryClient();
  const [cursor, setCursor] = useState({
    lastId: undefined,
    lastCreatedAtMs: undefined,
  });
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [bidTarget, setBidTarget] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["all-users-assign", cursor],
    queryFn: () =>
      getAllUsers({
        pageNo: 0,
        pageSize: USER_PAGE_SIZE,
        ...cursor,
        location: false,
      }),
    keepPreviousData: true,
  });

  const users = data?.data ?? [];
  const hasNext = users.length === USER_PAGE_SIZE;

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

  const filtered = users.filter(
    (u) =>
      !search ||
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search),
  );

  const getDistKm = (user) => {
    if (!user.latitude || !user.longitude || !job.lat || !job.lng) return null;
    return haversineKm(
      parseFloat(job.lat),
      parseFloat(job.lng),
      parseFloat(user.latitude),
      parseFloat(user.longitude),
    );
  };

  return (
    <>
      {bidTarget && (
        <PlaceBidDrawer
          user={bidTarget}
          job={job}
          distKm={getDistKm(bidTarget)}
          onClose={() => setBidTarget(null)}
          onSuccess={() =>
            queryClient.invalidateQueries(["job-proposals", job.id])
          }
        />
      )}

      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 320 }}>
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
            placeholder="Search by name or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              paddingLeft: 36,
              paddingRight: 14,
              paddingTop: 9,
              paddingBottom: 9,
              borderRadius: 12,
              border: "1.5px solid #c8eacc",
              background: "#f7fdf8",
              fontSize: 13,
              color: "#1a3d22",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#4a9e5c";
              e.target.style.boxShadow = "0 0 0 3px rgba(74,158,92,0.15)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#c8eacc";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "#a8d5b0",
            fontWeight: 500,
          }}
        >
          {filtered.length} users
        </span>
      </div>

      {isError && (
        <div style={{ marginBottom: 14 }}>
          <ErrorBanner msg="Failed to load users." />
        </div>
      )}

      {/* ── Elegant Table ── */}
      <div
        style={{
          background: "white",
          borderRadius: 14,
          border: "1.5px solid #c8eacc",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: "#f7fdf8" }}>
                {["User", "Phone", "Role", "Status", "Distance", "Action"].map(
                  (h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "12px 18px",
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
                      {[36, 22, 16, 14, 16, 14].map((w, j) => (
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
                              width: `${w + ((j * 4) % 12)}%`,
                            }}
                            className="animate-pulse"
                          />
                        </td>
                      ))}
                    </tr>
                  ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{ padding: "50px 20px", textAlign: "center" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: "#eaf7ec",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Users size={22} color="#a8d5b0" />
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "#1a3d22",
                        }}
                      >
                        No users found
                      </div>
                      <div style={{ fontSize: 12, color: "#7dbf8a" }}>
                        Try adjusting your search.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((user, idx) => {
                  const distKm = getDistKm(user);
                  const distLabel = distKm != null ? fmtDist(distKm) : null;
                  const distBg =
                    distKm == null
                      ? "#f4f4f4"
                      : distKm < 10
                        ? "#eaf7ec"
                        : distKm < 50
                          ? "#fff8e6"
                          : "#fff0f0";
                  const distColor =
                    distKm == null
                      ? "#aaa"
                      : distKm < 10
                        ? "#1a6b35"
                        : distKm < 50
                          ? "#8a5a00"
                          : "#9b2335";
                  const distBorder =
                    distKm == null
                      ? "#e0e0e0"
                      : distKm < 10
                        ? "#a8d5b0"
                        : distKm < 50
                          ? "#f0d080"
                          : "#f5c0c7";
                  const distProx =
                    distKm == null
                      ? "—"
                      : distKm < 10
                        ? "Nearby"
                        : distKm < 50
                          ? "Moderate"
                          : "Far";
                  const isActive = user.status === "ACTIVE";
                  const isLast = idx === filtered.length - 1;

                  return (
                    <tr
                      key={user.id}
                      className="pjd-row"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid #f0f9f1",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* User */}
                      <td style={{ padding: "13px 18px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <Avatar name={user.fullName} size="sm" />
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
                                fontSize: 11,
                                color: "#a8d5b0",
                                marginTop: 2,
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
                          padding: "13px 18px",
                          fontSize: 13,
                          color: "#5a7d62",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.phone || "—"}
                      </td>
                      {/* Role */}
                      <td style={{ padding: "13px 18px" }}>
                        <StatusBadge status={user.role} />
                      </td>
                      {/* Status */}
                      <td style={{ padding: "13px 18px" }}>
                        <StatusBadge status={user.status} />
                      </td>
                      {/* Distance */}
                      <td style={{ padding: "13px 18px" }}>
                        {distLabel ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              fontWeight: 600,
                              background: distBg,
                              color: distColor,
                              border: `1px solid ${distBorder}`,
                            }}
                          >
                            <Navigation size={10} />
                            {distLabel}
                            <span style={{ opacity: 0.6, fontSize: 10 }}>
                              · {distProx}
                            </span>
                          </span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#c8eacc" }}>
                            —
                          </span>
                        )}
                      </td>
                      {/* Action */}
                      <td style={{ padding: "13px 18px", textAlign: "center" }}>
                        <button
                          disabled={!isActive}
                          onClick={() => setBidTarget(user)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "6px 14px",
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 600,
                            border: "none",
                            background: isActive
                              ? "linear-gradient(135deg,#4a9e5c,#1a3d22)"
                              : "#f4faf5",
                            color: isActive ? "white" : "#a8d5b0",
                            cursor: isActive ? "pointer" : "not-allowed",
                            boxShadow: isActive
                              ? "0 2px 8px rgba(74,158,92,0.25)"
                              : "none",
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (isActive)
                              e.currentTarget.style.boxShadow =
                                "0 4px 14px rgba(74,158,92,0.4)";
                          }}
                          onMouseLeave={(e) => {
                            if (isActive)
                              e.currentTarget.style.boxShadow =
                                "0 2px 8px rgba(74,158,92,0.25)";
                          }}
                        >
                          <Briefcase size={11} /> Place Bid
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(hasNext || history.length > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1.5px solid #eaf7ec",
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
              <ChevronLeft size={13} /> Prev
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
      )}
    </>
  );
}

/* ══════════ TAB CONFIG ══════════ */
const TABS = [
  {
    id: "assigned",
    label: "Assigned Users",
    icon: Users,
    desc: "Users currently working on this project",
  },
  {
    id: "proposals",
    label: "Proposals",
    icon: ClipboardList,
    desc: "Submitted bids & proposals",
  },
  {
    id: "assign",
    label: "Assign User",
    icon: UserPlus,
    desc: "Browse users & place a bid",
  },
];

/* ══════════ MAIN PAGE ══════════ */
export default function ProjectDetail() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("assigned");

  const job = location.state?.job;

  if (!job) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          gap: 16,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "#fff0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AlertCircle size={30} color="#e05263" />
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#1a3d22",
            fontFamily: "'Georgia','Times New Roman',serif",
          }}
        >
          Project data not found
        </div>
        <div style={{ fontSize: 13, color: "#7dbf8a" }}>
          Please navigate from the Projects list to load this page.
        </div>
        <button
          onClick={() => navigate("/projects")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            background: "linear-gradient(135deg,#4a9e5c,#1a3d22)",
            color: "white",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(74,158,92,0.3)",
          }}
        >
          <ArrowLeft size={14} /> Back to Projects
        </button>
      </div>
    );
  }

  const statusC = STATUS_COLORS[job.status] ?? STATUS_COLORS.OPEN;

  return (
    <>
      <style>{`
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(100%)} to{opacity:1;transform:translateX(0)} }
        .pjd-row:hover { background: #f7fdf8 !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Breadcrumb */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            color: "#7dbf8a",
          }}
        >
          <button
            onClick={() => navigate("/projects")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#7dbf8a",
              fontWeight: 500,
              padding: 0,
              transition: "color 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1a3d22")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#7dbf8a")}
          >
            Projects
          </button>
          <ChevronRight size={14} color="#c8eacc" />
          <span
            style={{
              color: "#1a3d22",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 300,
            }}
          >
            {job.title}
          </span>
        </nav>

        {/* ── Job info card ── */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #c8eacc",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(74,158,92,0.06)",
          }}
        >
          {/* Top accent bar */}
          <div
            style={{
              height: 4,
              background: "linear-gradient(90deg,#4a9e5c,#1a3d22)",
            }}
          />

          <div
            style={{
              padding: "20px 24px",
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 18,
              flexWrap: "wrap",
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#eaf7ec",
                border: "1.5px solid #c8eacc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FolderKanban size={22} color="#4a9e5c" />
            </div>

            {/* Main info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                <h1
                  style={{
                    fontSize: 21,
                    fontWeight: 700,
                    color: "#1a3d22",
                    fontFamily: "'Georgia','Times New Roman',serif",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {job.title}
                </h1>
                <StatusBadge status={job.status} />
              </div>
              {job.description && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#5a7d62",
                    margin: "0 0 12px",
                    lineHeight: 1.6,
                    maxWidth: 620,
                  }}
                >
                  {job.description}
                </p>
              )}
              {/* Meta chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {job.locationText && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "#f7fdf8",
                      border: "1.5px solid #c8eacc",
                      fontSize: 12,
                      color: "#5a7d62",
                      fontWeight: 500,
                    }}
                  >
                    <MapPin size={12} color="#a8d5b0" /> {job.locationText}
                  </div>
                )}
                {(job.budgetMin || job.budgetMax) && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "#eaf7ec",
                      border: "1.5px solid #a8d5b0",
                      fontSize: 12,
                      color: "#1a6b35",
                      fontWeight: 600,
                    }}
                  >
                    <Banknote size={12} color="#4a9e5c" /> ₹
                    {job.budgetMin?.toLocaleString("en-IN")} – ₹
                    {job.budgetMax?.toLocaleString("en-IN")}
                  </div>
                )}
                {job.paymentMode && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "#e8f4fd",
                      border: "1.5px solid #b8d9f5",
                      fontSize: 12,
                      color: "#1a6fa8",
                      fontWeight: 500,
                    }}
                  >
                    <CreditCard size={12} color="#3b9fd4" /> {job.paymentMode}
                  </div>
                )}
                {job.createdDate && (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "5px 12px",
                      borderRadius: 20,
                      background: "#f4f4f4",
                      border: "1.5px solid #e0e0e0",
                      fontSize: 12,
                      color: "#666",
                      fontWeight: 500,
                    }}
                  >
                    <Calendar size={12} color="#aaa" /> {job.createdDate}
                  </div>
                )}
              </div>
            </div>

            {/* Job ID badge */}
            <div
              style={{
                flexShrink: 0,
                padding: "10px 14px",
                borderRadius: 12,
                background: "#f7fdf8",
                border: "1.5px solid #c8eacc",
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "#a8d5b0",
                  marginBottom: 4,
                }}
              >
                Job ID
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#5a7d62",
                }}
              >
                {job.id}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #c8eacc",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(74,158,92,0.06)",
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: "flex",
              borderBottom: "1.5px solid #c8eacc",
              overflowX: "auto",
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "14px 22px",
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    borderTop: "none",
                    borderLeft: "none",
                    borderRight: "none",
                    borderBottom: active
                      ? "2.5px solid #4a9e5c"
                      : "2.5px solid transparent",
                    marginBottom: -1.5,
                    background: active ? "#f7fdf8" : "white",
                    color: active ? "#1a3d22" : "#7dbf8a",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "#1a3d22";
                      e.currentTarget.style.background = "#f7fdf8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = "#7dbf8a";
                      e.currentTarget.style.background = "white";
                    }
                  }}
                >
                  <t.icon size={15} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab desc */}
          <div
            style={{
              padding: "8px 24px",
              background: "#f7fdf8",
              borderBottom: "1.5px solid #eaf7ec",
            }}
          >
            <div style={{ fontSize: 12, color: "#7dbf8a" }}>
              {TABS.find((t) => t.id === tab)?.desc}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ padding: 24 }}>
            {tab === "assigned" && <AssignedUsersTab jobId={job.id} />}
            {tab === "proposals" && <ProposalsTab jobId={job.id} />}
            {tab === "assign" && <AssignUserTab job={job} />}
          </div>
        </div>
      </div>
    </>
  );
}
