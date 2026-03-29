import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ShoppingBag,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import logo from "../assets/image.png";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/projects", icon: FolderKanban, label: "Projects" },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace" },
];

export default function Sidebar({ open, closeSidebar, onCollapse }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleCollapse = (val) => {
    setCollapsed(val);
    onCollapse?.(val);
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-[1000]
          lg:static lg:flex-shrink-0
          transition-all duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[72px]" : "lg:w-64"}
          w-64
        `}
        style={{
          height: "100vh",
          minHeight: "100vh",
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "visible" /* allow toggle button to escape */,
          background: "#eaf7ec",
          borderRight: "1.5px solid #c8eacc",
          position: "relative",
        }}
      >
        {/* Subtle dot texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(74,158,92,0.06) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            borderRadius: "inherit",
          }}
        />

        {/* ── Logo ── */}
        <div
          className={`relative z-10 flex items-center gap-3 px-4 pt-6 pb-5 flex-shrink-0
            ${collapsed ? "justify-center" : ""}`}
          style={{ borderBottom: "1.5px solid #c8eacc" }}
        >
          <div
            className="flex-shrink-0 overflow-hidden rounded-xl"
            style={{ width: 36, height: 36, background: "#eaf7ec" }}
          >
            <img
              src={logo}
              alt="EasyNocks"
              className="w-full h-full object-contain"
            />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div
                className="font-bold text-[16px] leading-tight whitespace-nowrap"
                style={{
                  fontFamily: "'Georgia','Times New Roman',serif",
                  color: "#1a3d22",
                  letterSpacing: "0.05em",
                }}
              >
                EASY <span style={{ color: "#4a9e5c" }}>NOCKS</span>
              </div>
              <div
                className="text-[10px] uppercase tracking-widest whitespace-nowrap"
                style={{ color: "#7dbf8a" }}
              >
                Admin Panel
              </div>
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav
          className="relative z-10 flex flex-col gap-0.5 flex-1 min-h-0 px-2.5 pt-3 overflow-y-auto"
          style={{ overflowX: "visible" }}
        >
          {!collapsed && (
            <p
              className="text-[10px] font-bold uppercase px-3 pt-1 pb-2 flex-shrink-0"
              style={{ color: "#7dbf8a", letterSpacing: "0.14em" }}
            >
              Main Menu
            </p>
          )}
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                 transition-all duration-200 group flex-shrink-0
                 ${collapsed ? "justify-center" : ""}
                 ${
                   isActive
                     ? "text-[#1a3d22] font-semibold"
                     : "hover:bg-[#d4f0da]"
                 }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      background: "#c8eacc",
                      boxShadow: "inset 0 0 0 1.5px #a8d5b0",
                      color: "#1a3d22",
                    }
                  : { color: "#5a7d62" }
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <span
                      className="absolute left-0 top-[22%] h-[56%] w-[3px] rounded-r-full"
                      style={{ background: "#4a9e5c" }}
                    />
                  )}
                  <Icon
                    size={17}
                    className="flex-shrink-0 transition-colors"
                    style={{ color: isActive ? "#4a9e5c" : "#7dbf8a" }}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Logout ── */}
        <div
          className="relative z-10 px-2.5 pb-5 pt-2 flex-shrink-0"
          style={{ borderTop: "1.5px solid #c8eacc" }}
        >
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/");
            }}
            title={collapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium
                       transition-all duration-200 group
                       ${collapsed ? "justify-center" : ""}`}
            style={{ color: "#7dbf8a" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fde8e8";
              e.currentTarget.style.color = "#c0392b";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#7dbf8a";
            }}
          >
            <LogOut size={17} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* ── Collapse toggle — OUTSIDE the sidebar overflow:hidden clip ── */}
        <button
          onClick={() => handleCollapse(!collapsed)}
          className="hidden lg:flex absolute items-center justify-center
                     w-6 h-6 rounded-full shadow-md
                     transition-colors duration-200"
          style={{
            top: 72,
            right: -12,
            zIndex: 2000 /* above everything */,
            background: "#4a9e5c",
            border: "2px solid #eaf7ec",
            color: "white",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1a3d22")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#4a9e5c")}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  );
}
