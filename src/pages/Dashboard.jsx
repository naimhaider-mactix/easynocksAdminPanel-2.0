import { useQuery } from "@tanstack/react-query";
import { getPlatformAnalytics } from "../api/dashboardApi";
import {
  Users,
  FolderKanban,
  ShoppingBag,
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Layers,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/* ── Stat card config ── */
const STATS = (data) => [
  {
    icon: Users,
    label: "Total Users",
    value: data?.totalUserCount ?? null,
    sub: "Registered accounts",
    accent: "#4a9e5c",
    bg: "#eaf7ec",
    border: "#a8d5b0",
    barFrom: "#4a9e5c",
    barTo: "#a8d5b0",
  },
  {
    icon: FolderKanban,
    label: "Total Projects",
    value: data?.totalProjectCount ?? null,
    sub: "Jobs posted on platform",
    accent: "#3b9fd4",
    bg: "#e8f4fd",
    border: "#b8d9f5",
    barFrom: "#3b9fd4",
    barTo: "#9dd4f0",
  },
  {
    icon: ShoppingBag,
    label: "Active Listings",
    value: data?.totalActiveAdsCount ?? null,
    sub: "Live marketplace ads",
    accent: "#8b6fdb",
    bg: "#f0ebff",
    border: "#c8baf0",
    barFrom: "#8b6fdb",
    barTo: "#c8baf0",
  },
  // {
  //   icon: BarChart3,
  //   label: "All-Time Ads",
  //   value: data?.totalAdsCount ?? null,
  //   sub: "Total listings created",
  //   accent: "#f0a500",
  //   bg: "#fff8e6",
  //   border: "#f0d080",
  //   barFrom: "#f0a500",
  //   barTo: "#f8dc80",
  // },
];

export default function Dashboard() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["platform-analytics"],
    queryFn: getPlatformAnalytics,
  });
  console.log("data", data);

  const stats = STATS(data);
  const now = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      <style>{`
        .dash-card { transition: transform 0.2s, box-shadow 0.2s; }
        .dash-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(74,158,92,0.13) !important; }
        .summary-row:hover { background: #f0f9f1 !important; }
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
              <Activity size={18} color="white" />
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
              Dashboard
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#7dbf8a", margin: 0 }}>
            Platform overview &amp; key metrics
          </p>
        </div>

        {/* Live badge + refresh */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 14px",
              borderRadius: 12,
              background: "white",
              border: "1.5px solid #c8eacc",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#4a9e5c",
                display: "inline-block",
                boxShadow: "0 0 0 3px rgba(74,158,92,0.2)",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: 12, color: "#5a7d62", fontWeight: 500 }}>
              Updated {now}
            </span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: "1.5px solid #c8eacc",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4a9e5c",
              cursor: isFetching ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#eaf7ec";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
            }}
            title="Refresh"
          >
            <RefreshCw
              size={15}
              style={{
                animation: isFetching ? "spin 1s linear infinite" : "none",
              }}
            />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(74,158,92,0.2)} 50%{box-shadow:0 0 0 6px rgba(74,158,92,0.08)} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes barGrow { from{width:0} to{width:100%} }
      `}</style>

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
          <AlertCircle size={15} /> Failed to load analytics. Check your
          connection and refresh.
        </div>
      )}

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {isLoading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1.5px solid #c8eacc",
                    padding: 24,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: 3,
                      background: "#eaf7ec",
                      borderRadius: 2,
                      marginBottom: 20,
                    }}
                  />
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#eaf7ec",
                      marginBottom: 16,
                    }}
                    className="animate-pulse"
                  />
                  <div
                    style={{
                      height: 10,
                      borderRadius: 5,
                      background: "#eaf7ec",
                      width: "55%",
                      marginBottom: 12,
                    }}
                    className="animate-pulse"
                  />
                  <div
                    style={{
                      height: 34,
                      borderRadius: 6,
                      background: "#eaf7ec",
                      width: "70%",
                      marginBottom: 10,
                    }}
                    className="animate-pulse"
                  />
                  <div
                    style={{
                      height: 9,
                      borderRadius: 5,
                      background: "#f0f9f1",
                      width: "80%",
                    }}
                    className="animate-pulse"
                  />
                </div>
              ))
          : stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="dash-card"
                  style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1.5px solid #c8eacc",
                    padding: 24,
                    overflow: "hidden",
                    position: "relative",
                    boxShadow: "0 2px 10px rgba(74,158,92,0.05)",
                  }}
                >
                  {/* Top gradient bar */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 4,
                      background: `linear-gradient(90deg,${s.barFrom},${s.barTo})`,
                    }}
                  />

                  {/* Icon */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 11,
                      background: s.bg,
                      border: `1.5px solid ${s.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      marginTop: 8,
                    }}
                  >
                    <Icon size={19} color={s.accent} />
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: "#7dbf8a",
                      marginBottom: 8,
                    }}
                  >
                    {s.label}
                  </div>

                  {/* Value */}
                  <div
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "#1a3d22",
                      lineHeight: 1,
                      marginBottom: 8,
                      fontFamily: "'Georgia','Times New Roman',serif",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.value != null ? s.value.toLocaleString() : "—"}
                  </div>

                  {/* Sub */}
                  <div style={{ fontSize: 12, color: "#a8d5b0" }}>{s.sub}</div>

                  {/* Decorative corner circle */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: -20,
                      right: -20,
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      background: s.bg,
                      opacity: 0.6,
                    }}
                  />
                </div>
              );
            })}
      </div>

      {/* ── Quick links ── */}
      {!isLoading && !isError && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 14,
          }}
        >
          {[
            {
              icon: Users,
              label: "Manage Users",
              sub: "View & control accounts",
              to: "/users",
              accent: "#4a9e5c",
              bg: "#eaf7ec",
              border: "#a8d5b0",
            },
            {
              icon: FolderKanban,
              label: "Manage Projects",
              sub: "Review all jobs",
              to: "/projects",
              accent: "#3b9fd4",
              bg: "#e8f4fd",
              border: "#b8d9f5",
            },
            {
              icon: ShoppingBag,
              label: "Marketplace",
              sub: "Browse & delete ads",
              to: "/marketplace",
              accent: "#8b6fdb",
              bg: "#f0ebff",
              border: "#c8baf0",
            },
            /* spacer to keep 4-col alignment */
            { spacer: true },
          ].map((item, i) => {
            if (item.spacer) return <div key={i} />;
            const { icon: Icon, label, sub, to, accent, bg, border } = item;
            return (
              <a
                key={label}
                href={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "16px 18px",
                  borderRadius: 14,
                  background: "white",
                  border: "1.5px solid #c8eacc",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  boxShadow: "0 2px 8px rgba(74,158,92,0.04)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = border;
                  e.currentTarget.style.boxShadow = `0 6px 20px ${accent}18`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#c8eacc";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(74,158,92,0.04)";
                  e.currentTarget.style.transform = "";
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={17} color={accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: "#1a3d22" }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 11, color: "#7dbf8a", marginTop: 2 }}>
                    {sub}
                  </div>
                </div>
                <ArrowUpRight size={14} color="#a8d5b0" />
              </a>
            );
          })}
        </div>
      )}

      {/* ── Platform summary table ── */}
      {!isLoading && !isError && (
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #c8eacc",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(74,158,92,0.06)",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderBottom: "1.5px solid #eaf7ec",
              background: "#f7fdf8",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "#eaf7ec",
                  border: "1.5px solid #c8eacc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Layers size={15} color="#4a9e5c" />
              </div>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#1a3d22",
                  fontFamily: "'Georgia','Times New Roman',serif",
                }}
              >
                Platform Summary
              </span>
            </div>
            <span style={{ fontSize: 11, color: "#a8d5b0", fontWeight: 500 }}>
              All-time data
            </span>
          </div>

          {/* Summary rows */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f7fdf8" }}>
                  {["Metric", "Count", "Description", "Share"].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        padding: "11px 20px",
                        textAlign:
                          i >= 2 ? (i === 3 ? "right" : "left") : "left",
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
                {[
                  {
                    icon: Users,
                    label: "Total Users",
                    value: data?.totalUserCount,
                    desc: "Registered accounts on the platform",
                    accent: "#4a9e5c",
                    bg: "#eaf7ec",
                  },
                  {
                    icon: FolderKanban,
                    label: "Total Projects",
                    value: data?.totalProjectCount,
                    desc: "Jobs & projects posted by clients",
                    accent: "#3b9fd4",
                    bg: "#e8f4fd",
                  },
                  {
                    icon: ShoppingBag,
                    label: "Active Listings",
                    value: data?.totalActiveAdsCount,
                    desc: "Live ads in the marketplace right now",
                    accent: "#8b6fdb",
                    bg: "#f0ebff",
                  },
                  // {
                  //   icon: BarChart3,
                  //   label: "All-Time Ads",
                  //   value: data?.totalAdsCount,
                  //   desc: "Total ads ever created on platform",
                  //   accent: "#f0a500",
                  //   bg: "#fff8e6",
                  // },
                ].map(
                  (
                    { icon: Icon, label, value, desc, accent, bg },
                    idx,
                    arr,
                  ) => {
                    const pct =
                      value != null
                        ? Math.round(
                            (value /
                              Math.max(
                                data?.totalActiveAdsCount ?? 1,
                                data?.totalUserCount ?? 1,
                                data?.totalProjectCount ?? 1,
                              )) *
                              100,
                          )
                        : 0;
                    const isLast = idx === arr.length - 1;

                    return (
                      <tr
                        key={label}
                        className="summary-row"
                        style={{
                          borderBottom: isLast ? "none" : "1px solid #f0f9f1",
                          transition: "background 0.15s",
                        }}
                      >
                        {/* Metric */}
                        <td style={{ padding: "15px 20px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
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
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={16} color={accent} />
                            </div>
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1a3d22",
                              }}
                            >
                              {label}
                            </span>
                          </div>
                        </td>

                        {/* Count */}
                        <td style={{ padding: "15px 20px" }}>
                          <span
                            style={{
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#1a3d22",
                              fontFamily: "'Georgia','Times New Roman',serif",
                            }}
                          >
                            {value != null ? value.toLocaleString() : "—"}
                          </span>
                        </td>

                        {/* Description */}
                        <td
                          style={{
                            padding: "15px 20px",
                            fontSize: 13,
                            color: "#7dbf8a",
                            maxWidth: 260,
                          }}
                        >
                          {desc}
                        </td>

                        {/* Share bar */}
                        <td
                          style={{
                            padding: "15px 20px",
                            minWidth: 140,
                            textAlign: "right",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              justifyContent: "flex-end",
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: 6,
                                borderRadius: 3,
                                background: "#eaf7ec",
                                overflow: "hidden",
                                maxWidth: 100,
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  borderRadius: 3,
                                  background: `linear-gradient(90deg,${accent},${accent}88)`,
                                  width: `${Math.min(pct, 100)}%`,
                                  transition:
                                    "width 0.8s cubic-bezier(0.16,1,0.3,1)",
                                }}
                              />
                            </div>
                            <span
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: accent,
                                minWidth: 32,
                                textAlign: "right",
                              }}
                            >
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
