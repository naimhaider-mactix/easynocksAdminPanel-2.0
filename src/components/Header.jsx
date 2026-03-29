import { useLocation } from "react-router-dom";
import { Menu, ChevronRight, Bell } from "lucide-react";

const ROUTE_META = {
  "/dashboard": { label: "Dashboard", desc: "Platform overview & metrics" },
  "/users": { label: "Users", desc: "Manage registered platform users" },
  "/projects": { label: "Projects", desc: "View and manage all projects" },
  "/marketplace": { label: "Marketplace", desc: "Manage ads & listings" },
};

export default function Header({ toggleSidebar }) {
  const { pathname } = useLocation();
  const meta = ROUTE_META[pathname] ?? { label: "Admin", desc: "" };

  return (
    <header
      className="sticky top-0 z-[80] flex items-center gap-4 px-5 py-3"
      style={{
        background: "rgba(234,247,236,0.97)",
        backdropFilter: "blur(8px)",
        borderBottom: "1.5px solid #c8eacc",
        boxShadow: "0 1px 8px rgba(74,158,92,0.07)",
      }}
    >
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        aria-label="Open menu"
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center
                   transition-colors flex-shrink-0"
        style={{
          border: "1.5px solid #a8d5b0",
          background: "#d4f0da",
          color: "#1a3d22",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "#c8eacc")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "#d4f0da")}
      >
        <Menu size={18} />
      </button>

      {/* Breadcrumb */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <span
          className="hidden sm:inline text-[13px] font-medium"
          style={{
            fontFamily: "'Georgia','Times New Roman',serif",
            color: "#7dbf8a",
            letterSpacing: "0.04em",
          }}
        >
          EasyNocks
        </span>
        <ChevronRight
          size={14}
          className="hidden sm:inline flex-shrink-0"
          style={{ color: "#a8d5b0" }}
        />
        <span
          className="text-[13px] font-semibold"
          style={{ color: "#1a3d22" }}
        >
          {meta.label}
        </span>
        {meta.desc && (
          <>
            <span
              className="hidden md:inline mx-1"
              style={{ color: "#a8d5b0" }}
            >
              ·
            </span>
            <span
              className="hidden md:inline text-[12px]"
              style={{ color: "#7dbf8a" }}
            >
              {meta.desc}
            </span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Notification bell */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors"
          style={{
            border: "1.5px solid #a8d5b0",
            background: "#d4f0da",
            color: "#4a9e5c",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#c8eacc";
            e.currentTarget.style.color = "#1a3d22";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#d4f0da";
            e.currentTarget.style.color = "#4a9e5c";
          }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "#4a9e5c" }}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: "#a8d5b0" }} />

        {/* Admin avatar */}
        <div className="flex items-center gap-2.5 cursor-pointer group">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center
                        text-white font-bold text-[13px] shadow-sm transition-all"
            style={{
              background: "linear-gradient(135deg, #4a9e5c, #1a3d22)",
              outline: "2px solid #c8eacc",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.outline = "2px solid #4a9e5c")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.outline = "2px solid #c8eacc")
            }
            title="Admin"
          >
            A
          </div>
          <div className="hidden sm:block">
            <div
              className="text-[13px] font-semibold leading-tight"
              style={{ color: "#1a3d22" }}
            >
              Admin
            </div>
            <div
              className="text-[11px] leading-tight"
              style={{ color: "#7dbf8a" }}
            >
              Super Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
