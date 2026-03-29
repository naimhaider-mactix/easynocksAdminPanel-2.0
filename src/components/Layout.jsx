import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (sidebarOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#f4faf5" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
          style={{ animation: "fadeIn 0.2s ease" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/*
        Key fix: position:relative + overflow:visible on this wrapper
        so the collapse toggle button (position:absolute, right:-12px)
        is NOT clipped by overflow:hidden on the flex parent.
      */}
      <div
        className="relative flex-shrink-0 hidden lg:block"
        style={{
          width: sidebarCollapsed ? 72 : 256,
          transition: "width 0.3s ease",
          overflow: "visible" /* lets the toggle button poke out */,
          zIndex: 1001,
        }}
      >
        <Sidebar
          open={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Mobile sidebar (no wrapper needed — it's fixed-positioned) */}
      <div className="lg:hidden">
        <Sidebar
          open={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          onCollapse={setSidebarCollapsed}
        />
      </div>

      {/* Main scrollable area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <Header toggleSidebar={() => setSidebarOpen(true)} />
        <div className="flex-1 p-5 lg:p-7 flex flex-col gap-5 min-w-0 w-full max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
