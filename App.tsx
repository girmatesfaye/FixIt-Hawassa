import React, { useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyPage from "./pages/VerifyPage";
import DashboardPage from "./pages/DashboardPage";
import ServiceRequestPage from "./pages/ServiceRequestPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import WorkerProfilePage from "./pages/WorkerProfilePage";
import MessagesPage from "./pages/MessagesPage";
import MyRequestsPage from "./pages/MyRequestsPage";
import WorkerHubPage from "./pages/WorkerHubPage";
import EditWorkerProfilePage from "./pages/EditWorkerProfilePage";
import AdminLayout from "./admin/AdminLayout";
import UserManagementPage from "./admin/UserManagementPage";
import ReportManagementPage from "./admin/ReportManagementPage";
import AnalyticsPage from "./admin/AnalyticsPage";
import CategoryManagementPage from "./admin/CategoryManagementPage";

type UserRole = "client" | "worker" | "admin";

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  const handleLogin = (role: UserRole = "client") => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUserRole(null);
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyPage onVerify={handleLogin} />} />

        {/* Client & Worker Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated && userRole === "client" ? (
              <DashboardPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/request-service"
          element={
            isAuthenticated && userRole === "client" ? (
              <ServiceRequestPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/search-results"
          element={
            isAuthenticated && userRole === "client" ? (
              <SearchResultsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/messages"
          element={
            isAuthenticated && userRole === "client" ? (
              <MessagesPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/my-requests"
          element={
            isAuthenticated && userRole === "client" ? (
              <MyRequestsPage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/worker-hub"
          element={
            isAuthenticated && userRole === "worker" ? (
              <WorkerHubPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/worker/edit-profile"
          element={
            isAuthenticated && userRole === "worker" ? (
              <EditWorkerProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/worker/:id" element={<WorkerProfilePage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === "admin" ? (
              <AdminLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route index element={<Navigate to="users" />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="reports" element={<ReportManagementPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="settings"
            element={<div className="p-8">Settings (Coming Soon)</div>}
          />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App;
