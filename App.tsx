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

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const handleLogin = () => setIsAuthenticated(true);
  const handleLogout = () => setIsAuthenticated(false);

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
            isAuthenticated ? (
              <DashboardPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/request-service"
          element={
            isAuthenticated ? <ServiceRequestPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/search-results"
          element={
            isAuthenticated ? <SearchResultsPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/messages"
          element={
            isAuthenticated ? <MessagesPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/my-requests"
          element={
            isAuthenticated ? <MyRequestsPage /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/worker-hub"
          element={
            isAuthenticated ? (
              <WorkerHubPage onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/worker/edit-profile"
          element={
            isAuthenticated ? (
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
            isAuthenticated ? (
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
