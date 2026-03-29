import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdminAds, deleteAd } from "../api/adApi";
import { useToast, ConfirmModal } from "../components/Toast";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Package,
  Tag,
  RefreshCw,
  AlertCircle,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

const STATUS_COLORS = {
  ACTIVE: { bg: "#eaf7ec", text: "#1a6b35", dot: "#4a9e5c", label: "Active" },
  SOLD: { bg: "#e8f4fd", text: "#1a6fa8", dot: "#3b9fd4", label: "Sold" },
  EXPIRED: { bg: "#f4f4f4", text: "#666", dot: "#aaa", label: "Expired" },
  DELETED: { bg: "#fff0f0", text: "#9b2335", dot: "#e05263", label: "Deleted" },
};

const STATUS_ICONS = {
  ACTIVE: CheckCircle2,
  SOLD: TrendingUp,
  EXPIRED: Clock,
  DELETED: XCircle,
};

export default function Marketplace() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [cursor, setCursor] = useState({
    lastCreatedAtMs: undefined,
    lastAdId: undefined,
  });
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    adId: null,
    title: "",
  });

  const {
    data: apiData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-ads", cursor],
    queryFn: () => getAdminAds(cursor),
    keepPreviousData: true,
  });

  const ads = apiData?.ads ?? [];
  const hasNext = !!apiData?.nextLastAdId;

  const deleteMutation = useMutation({
    mutationFn: deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-ads"]);
      toast("Ad deleted successfully.", "success");
    },
    onError: () => toast("Failed to delete ad. Please try again.", "error"),
  });

  const goNext = useCallback(() => {
    if (!hasNext) return;
    setHistory((h) => [...h, cursor]);
    setCursor({
      lastCreatedAtMs: apiData.nextLastCreatedAtMs,
      lastAdId: apiData.nextLastAdId,
    });
  }, [cursor, apiData, hasNext]);

  const goPrev = useCallback(() => {
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setCursor(prev ?? { lastCreatedAtMs: undefined, lastAdId: undefined });
  }, [history]);

  const filtered = ads.filter((ad) => {
    const matchSearch =
      !search ||
      ad.title?.toLowerCase().includes(search.toLowerCase()) ||
      String(ad.clientId).includes(search);
    const matchStatus = filterStatus === "ALL" || ad.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Stats
  const stats = {
    total: ads.length,
    active: ads.filter((a) => a.status === "ACTIVE").length,
    sold: ads.filter((a) => a.status === "SOLD").length,
    expired: ads.filter((a) => a.status === "EXPIRED" || a.status === "DELETED")
      .length,
  };

  const COLS = [
    "Listing",
    "Seller ID",
    "Category",
    "Price",
    "Stock",
    "Status",
    "Date",
    "Action",
  ];

  return (
    <>
      <style>{`
        .mp-row:hover { background: #f7fdf8 !important; }
        .mp-chip { transition: all 0.15s; cursor: pointer; }
        .mp-chip:hover { transform: scale(1.03); }
        .mp-input:focus { border-color: #4a9e5c !important; box-shadow: 0 0 0 3px rgba(74,158,92,0.15) !important; outline: none; }
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
              <ShoppingBag size={18} color="white" />
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
              Marketplace
            </h1>
          </div>
          <p style={{ fontSize: 13, color: "#7dbf8a", margin: 0 }}>
            Monitor and manage all ads &amp; listings across the platform
          </p>
        </div>
      </div>

      {/* ── Stat pills ── */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {[
          {
            icon: ShoppingBag,
            label: "Total Ads",
            value: stats.total,
            bg: "#eaf7ec",
            dot: "#4a9e5c",
          },
          {
            icon: CheckCircle2,
            label: "Active",
            value: stats.active,
            bg: "#e8f8f0",
            dot: "#4a9e5c",
          },
          {
            icon: TrendingUp,
            label: "Sold",
            value: stats.sold,
            bg: "#e8f4fd",
            dot: "#3b9fd4",
          },
          {
            icon: Clock,
            label: "Expired / Del",
            value: stats.expired,
            bg: "#f4f4f4",
            dot: "#aaa",
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
              flex: "1 1 140px",
              minWidth: 140,
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
            placeholder="Search title or seller ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mp-input"
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

        {/* Status filter chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Filter size={13} color="#a8d5b0" />
          {["ALL", "ACTIVE", "SOLD", "EXPIRED", "DELETED"].map((s) => {
            const active = filterStatus === s;
            const c =
              s === "ALL"
                ? { bg: "#eaf7ec", text: "#1a3d22", dot: "#4a9e5c" }
                : STATUS_COLORS[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="mp-chip"
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
                {s === "ALL" ? "All Status" : s}
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
          {filtered.length} listing{filtered.length !== 1 ? "s" : ""}
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
          <AlertCircle size={15} /> Failed to load ads. Please try again.
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
            style={{ width: "100%", minWidth: 780, borderCollapse: "collapse" }}
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
                      {[38, 18, 16, 14, 16, 14, 16, 12].map((w, j) => (
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
                filtered.map((ad, idx) => {
                  const status =
                    STATUS_COLORS[ad.status] ?? STATUS_COLORS.EXPIRED;
                  const StatusIcon = STATUS_ICONS[ad.status] ?? Clock;
                  const isBusy =
                    deleteMutation.isLoading &&
                    deleteMutation.variables === ad.id;
                  const isLast = idx === filtered.length - 1;

                  return (
                    <tr
                      key={ad.id}
                      className="mp-row"
                      style={{
                        borderBottom: isLast ? "none" : "1px solid #f0f9f1",
                        transition: "background 0.15s",
                      }}
                    >
                      {/* Listing title */}
                      <td style={{ padding: "14px 18px", maxWidth: 240 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#1a3d22",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {ad.title || "—"}
                        </div>
                        {ad.description && (
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
                            {ad.description.slice(0, 52)}
                            {ad.description.length > 52 ? "…" : ""}
                          </div>
                        )}
                      </td>

                      {/* Seller ID */}
                      <td style={{ padding: "14px 18px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 13,
                            color: "#5a7d62",
                          }}
                        >
                          <Tag size={12} color="#a8d5b0" />
                          {ad.clientId}
                        </div>
                      </td>

                      {/* Category */}
                      <td
                        style={{
                          padding: "14px 18px",
                          fontSize: 13,
                          color: "#7dbf8a",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ad.categoryId ?? "—"}
                      </td>

                      {/* Price */}
                      <td
                        style={{ padding: "14px 18px", whiteSpace: "nowrap" }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#1a3d22",
                          }}
                        >
                          {ad.price != null
                            ? `₹${Number(ad.price).toLocaleString()}`
                            : "—"}
                        </span>
                      </td>

                      {/* Stock */}
                      <td style={{ padding: "14px 18px" }}>
                        {ad.availableQuantity != null ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              fontSize: 13,
                              color: "#5a7d62",
                            }}
                          >
                            <Package size={12} color="#a8d5b0" />
                            {`${ad.availableQuantity} ${ad.measurementUnit ?? ""}`.trim()}
                          </div>
                        ) : (
                          "—"
                        )}
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
                        {ad.createdDate ?? "—"}
                      </td>

                      {/* Action */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        <button
                          disabled={isBusy || deleteMutation.isLoading}
                          onClick={() =>
                            setConfirmModal({
                              open: true,
                              adId: ad.id,
                              title: ad.title,
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
                            cursor:
                              isBusy || deleteMutation.isLoading
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              isBusy || deleteMutation.isLoading ? 0.5 : 1,
                            transition: "all 0.15s",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            if (!deleteMutation.isLoading) {
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
                            <Trash2 size={11} />
                          )}
                          {isBusy ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
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
                        <ShoppingBag size={26} color="#a8d5b0" />
                      </div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#1a3d22",
                        }}
                      >
                        No listings found
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

      {/* Confirm delete modal */}
      <ConfirmModal
        open={confirmModal.open}
        title="Delete Listing"
        message={`Are you sure you want to permanently delete "${confirmModal.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmClass="bg-red-600 hover:bg-red-700"
        onConfirm={() => {
          deleteMutation.mutate(confirmModal.adId);
          setConfirmModal({ open: false, adId: null, title: "" });
        }}
        onCancel={() => setConfirmModal({ open: false, adId: null, title: "" })}
      />
    </>
  );
}
