import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import { initLocation } from "./utils/locationStore";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Projects from "./pages/Projects";
import Marketplace from "./pages/Marketplace";
import ProjectDetail from "./pages/ProjectDetail";

export default function App() {
  initLocation();
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:jobId" element={<ProjectDetail />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
