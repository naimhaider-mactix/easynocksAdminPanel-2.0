import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getAdminJobs, deleteJob, cancelJob } from "../api/jobsApi";
import {
  Search,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CreditCard,
  Banknote,
  Eye,
  Trash2,
  XCircle,
  RefreshCw,
  AlertCircle,
  Filter,
  CircleDot,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
} from "lucide-react";

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
};

const STATUS_ICONS = {
  OPEN: CircleDot,
  ASSIGNED: Layers,
  ONGOING: Clock,
  COMPLETED: CheckCircle2,
  CANCELLED: XCircle,
};

const PAYMENT_COLORS = {
  ONLINE: { bg: "#e8f4fd", text: "#1a6fa8", border: "#b8d9f5" },
  CASH: { bg: "#eaf7ec", text: "#1a6b35", border: "#a8d5b0" },
};

export default function Projects() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [cursor, setCursor] = useState({
    lastCreatedAtMs: undefined,
    lastJobId: undefined,
  });
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  const {
    data: apiData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-jobs", cursor],
    queryFn: () => getAdminJobs(cursor),
    keepPreviousData: true,
  });

  const jobs = apiData?.jobs ?? [];
  const hasNext = !!apiData?.nextLastJobId;

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => queryClient.invalidateQueries(["admin-jobs"]),
  });
  const cancelMutation = useMutation({
    mutationFn: cancelJob,
    onSuccess: () => queryClient.invalidateQueries(["admin-jobs"]),
  });

  const goNext = useCallback(() => {
    if (!hasNext) return;
    setHistory((h) => [...h, cursor]);
    setCursor({
      lastCreatedAtMs: apiData.nextLastCreatedAtMs,
      lastJobId: apiData.nextLastJobId,
    });
  }, [cursor, apiData, hasNext]);

  const goPrev = useCallback(() => {
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCursor(prev ?? { lastCreatedAtMs: undefined, lastJobId: undefined });
  }, [history]);

  const filtered = jobs.filter((j) => {
    const matchSearch =
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.locationText?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || j.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: jobs.length,
    open: jobs.filter((j) => j.status === "OPEN").length,
    ongoing: jobs.filter(
      (j) => j.status === "ONGOING" || j.status === "ASSIGNED",
    ).length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
    cancelled: jobs.filter((j) => j.status === "CANCELLED").length,
  };

  const COLS = [
    "Project",
    "Location",
    "Budget",
    "Payment",
    "Status",
    "Date",
    "Actions",
  ];

  return (
    <>
      <style>{`
        .pj-row:hover { background: #f7fdf8 !important; }
        .pj-chip { transition: all 0.15s; cursor: pointer; }
        .pj-chip:hover { transform: scale(1.03); }
        .pj-input:focus { border-color: #4a9e5c !important; box-shadow: 0 0 0 3px rgba(74,158,92,0.15) !important; outline: none; }
        .pj-title-link:hover { color: #1a3d22 !important; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #a8d5b0; }
      `}</style>

      {/* ── Page header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
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
              <FolderKanban size={18} color="white" />
            </div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#1a3d22",
                margin: 0,
                fontFamily: "'Georgia','Times New Roman',serif",
              }}
            >
              Projects
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#7dbf8a", margin: 0 }}>
            Monitor and manage all platform jobs &amp; projects
          </p>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          {
            icon: FolderKanban,
            label: "Total",
            value: stats.total,
            bg: "#eaf7ec",
            dot: "#4a9e5c",
          },
          {
            icon: CircleDot,
            label: "Open",
            value: stats.open,
            bg: "#eaf7ec",
            dot: "#4a9e5c",
          },
          {
            icon: Clock,
            label: "In Progress",
            value: stats.ongoing,
            bg: "#fff8e6",
            dot: "#f0a500",
          },
          {
            icon: CheckCircle2,
            label: "Completed",
            value: stats.completed,
            bg: "#e8f4fd",
            dot: "#3b9fd4",
          },
          {
            icon: XCircle,
            label: "Cancelled",
            value: stats.cancelled,
            bg: "#fff0f0",
            dot: "#e05263",
          },
        ].map(({ icon: Icon, label, value, bg, dot }) => (
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
              flex: "1 1 120px",
              minWidth: 120,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={16} color={dot} />
            </div>
            <div>
              <div
                style={{
                  fontSize: 21,
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
            placeholder="Search title or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pj-input"
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
              boxSizing: "border-box",
              transition: "all 0.15s",
            }}
          />
        </div>

        {/* Status chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Filter size={13} color="#a8d5b0" />
          {["ALL", "OPEN", "ASSIGNED", "ONGOING", "COMPLETED", "CANCELLED"].map(
            (s) => {
              const active = filterStatus === s;
              const c =
                s === "ALL"
                  ? { bg: "#eaf7ec", text: "#1a3d22", dot: "#4a9e5c" }
                  : STATUS_COLORS[s];
              return (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="pj-chip"
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
                  {s === "ALL" ? "All" : (c?.label ?? s)}
                </button>
              );
            },
          )}
        </div>

        <span
          style={{
            marginLeft: "auto",
            fontSize: 12,
            color: "#a8d5b0",
            fontWeight: 500,
          }}
        >
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
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
          <AlertCircle size={15} /> Failed to load projects. Please try again.
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
            style={{ width: "100%", minWidth: 820, borderCollapse: "collapse" }}
          >
            <thead>
              <tr style={{ background: "#f7fdf8" }}>
                {COLS.map((h, i) => (
                  <th
                    key={h}
                    style={{
                      padding: "13px 18px",
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
              {isLoading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => (
                    <tr key={i}>
                      {[36, 20, 18, 14, 14, 14, 18].map((w, j) => (
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
              ) : filtered.length > 0 ? (
                filtered.map((job, idx) => {
                  const status =
                    STATUS_COLORS[job.status] ?? STATUS_COLORS.OPEN;
                  const StatusIcon = STATUS_ICONS[job.status] ?? CircleDot;
                  const payment =
                    PAYMENT_COLORS[job.paymentMode] ?? PAYMENT_COLORS.CASH;
                  const PayIcon =
                    job.paymentMode === "ONLINE" ? CreditCard : Banknote;
                  const isLast = idx === filtered.length - 1;
                  const canCancel =
                    job.status !== "CANCELLED" && job.status !== "COMPLETED";
                  const isCancelling =
                    cancelMutation.isLoading &&
                    cancelMutation.variables === job.id;
                  const isDeleting =
                    deleteMutation.isLoading &&
                    deleteMutation.variables === job.id;

                  return (
                    <tr
                      key={job.id}
                      className="pj-row"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid #f0f9f1",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Project title */}
                      <td style={{ padding: "14px 18px", maxWidth: 260 }}>
                        <div
                          className="pj-title-link"
                          onClick={() =>
                            navigate(`/projects/${job.id}`, { state: { job } })
                          }
                          style={{
                            cursor: "pointer",
                            color: "#1a3d22",
                            transition: "color 0.15s",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 600,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {job.title || "—"}
                          </div>
                          {job.description && (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#a8d5b0",
                                marginTop: 3,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {job.description.slice(0, 50)}
                              {job.description.length > 50 ? "…" : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "14px 18px", maxWidth: 180 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: "#5a7d62",
                          }}
                        >
                          <MapPin
                            size={12}
                            color="#a8d5b0"
                            style={{ flexShrink: 0 }}
                          />
                          <span
                            style={{
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {job.locationText || "—"}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td
                        style={{ padding: "14px 18px", whiteSpace: "nowrap" }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#1a3d22",
                          }}
                        >
                          ₹{job.budgetMin?.toLocaleString()}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#a8d5b0",
                            marginTop: 2,
                          }}
                        >
                          – ₹{job.budgetMax?.toLocaleString()}
                        </div>
                      </td>

                      {/* Payment mode */}
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
                            background: payment.bg,
                            color: payment.text,
                            border: `1px solid ${payment.border}`,
                          }}
                        >
                          <PayIcon size={11} />
                          {job.paymentMode}
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
                          <StatusIcon size={11} />
                          {status.label}
                        </span>
                      </td>

                      {/* Date */}
                      <td
                        style={{
                          padding: "14px 18px",
                          fontSize: 12,
                          color: "#a8d5b0",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {job.createdDate || "—"}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                          }}
                        >
                          {/* View */}
                          <button
                            onClick={() =>
                              navigate(`/projects/${job.id}`, {
                                state: { job },
                              })
                            }
                            title="View project"
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
                              whiteSpace: "nowrap",
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

                          {/* Cancel */}
                          {/* {canCancel && (
                            <button
                              disabled={
                                isCancelling || cancelMutation.isLoading
                              }
                              onClick={() => {
                                if (window.confirm(`Cancel "${job.title}"?`))
                                  cancelMutation.mutate(job.id);
                              }}
                              title="Cancel project"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                background: "#fff8e6",
                                color: "#8a5a00",
                                border: "1px solid #f0d080",
                                cursor: isCancelling
                                  ? "not-allowed"
                                  : "pointer",
                                opacity: isCancelling ? 0.5 : 1,
                                transition: "all 0.15s",
                                whiteSpace: "nowrap",
                              }}
                              onMouseEnter={(e) => {
                                if (!isCancelling) {
                                  e.currentTarget.style.background = "#fef3cc";
                                  e.currentTarget.style.borderColor = "#f0a500";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "#fff8e6";
                                e.currentTarget.style.borderColor = "#f0d080";
                              }}
                            >
                              {isCancelling ? (
                                <RefreshCw size={11} className="animate-spin" />
                              ) : (
                                <XCircle size={11} />
                              )}
                              Cancel
                            </button>
                          )} */}

                          {/* Delete */}
                          <button
                            disabled={isDeleting || deleteMutation.isLoading}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Permanently delete "${job.title}"?`,
                                )
                              )
                                deleteMutation.mutate(job.id);
                            }}
                            title="Delete project"
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
                              cursor: isDeleting ? "not-allowed" : "pointer",
                              opacity: isDeleting ? 0.5 : 1,
                              transition: "all 0.15s",
                              whiteSpace: "nowrap",
                            }}
                            onMouseEnter={(e) => {
                              if (!isDeleting) {
                                e.currentTarget.style.background = "#fde0e4";
                                e.currentTarget.style.borderColor = "#e05263";
                              }
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff5f5";
                              e.currentTarget.style.borderColor = "#f5c0c7";
                            }}
                          >
                            {isDeleting ? (
                              <RefreshCw size={11} className="animate-spin" />
                            ) : (
                              <Trash2 size={11} />
                            )}
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
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
                        <FolderKanban size={26} color="#a8d5b0" />
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#1a3d22",
                        }}
                      >
                        No projects found
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

        {/* Pagination */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 20px",
            borderTop: "1.5px solid #eaf7ec",
            background: "#f7fdf8",
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
      </div>
    </>
  );
}
