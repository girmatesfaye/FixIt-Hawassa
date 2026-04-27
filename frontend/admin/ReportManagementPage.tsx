import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../components/Modal";
import { getAuthToken } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

type ReportStatus = "pending" | "investigating" | "resolved" | "dismissed";

type ReportItem = {
  id: string;
  category: string;
  title: string;
  time: string;
  content: string;
  createdAtMs: number;
  reporter: {
    name: string;
    avatar: string;
    phone: string;
  };
  reported: {
    name: string;
    avatar: string;
    phone: string;
  };
  status: ReportStatus;
  adminFeedback: string;
  isDangerous: boolean;
};

const ReportManagementPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedContactReportId, setSelectedContactReportId] = useState<
    string | null
  >(null);
  const [resolutionAction, setResolutionAction] = useState<
    "warning" | "none" | "resolved" | "suspend_worker"
  >("warning");
  const [notifyParties, setNotifyParties] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");
  const [isDangerous, setIsDangerous] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ReportStatus>("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [page, setPage] = useState(1);

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const PAGE_SIZE = 6;

  const fetchReportsData = async () => {
    try {
      const token = getAuthToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [reportsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/reports`, { headers }),
        fetch(`${API_BASE_URL}/admin/stats`, { headers }),
      ]);

      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();
      const reportList = Array.isArray(reportsData.reports)
        ? reportsData.reports
        : [];

      const statusCounts = reportList.reduce(
        (acc: Record<string, number>, report: any) => {
          const status = String(report.status ?? "pending").toLowerCase();
          acc[status] = (acc[status] ?? 0) + 1;
          return acc;
        },
        {},
      );

      setReports(
        reportList.map((r: any) => ({
          id: r._id,
          category: r.type,
          title: `Report on ${r.reportedUserId?.fullName || "User"}`,
          time: new Date(r.createdAt).toLocaleString(),
          createdAtMs: new Date(r.createdAt).getTime(),
          content: `"${r.text}"`,
          reporter: {
            name: r.reporterUserId?.fullName || "Reporter",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reporterUserId?._id || "reporter"}`,
            phone:
              typeof r.reporterUserId?.phone === "string"
                ? r.reporterUserId.phone
                : "",
          },
          reported: {
            name: r.reportedUserId?.fullName || "Reported",
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reportedUserId?._id || "reported"}`,
            phone:
              typeof r.reportedUserId?.phone === "string"
                ? r.reportedUserId.phone
                : "",
          },
          status: String(r.status ?? "pending") as ReportStatus,
          adminFeedback: r.adminFeedback || "",
          isDangerous: Boolean(r.isDangerous),
        })),
      );

      setStats([
        {
          label: "Total Reports",
          value: reportList.length.toString(),
          sub: "All time",
          icon: "folder",
          color: "bg-blue-600",
          border: "border-blue-600",
        },
        {
          label: "Action Required",
          value: (statusCounts.pending || 0).toString(),
          sub: "Open complaints",
          icon: "priority_high",
          color: "bg-red-500",
          border: "border-red-500",
          alert: true,
        },
        {
          label: "Investigating",
          value: (statusCounts.investigating || 0).toString(),
          sub: "In progress",
          icon: "search",
          color: "bg-orange-400",
          border: "border-gray-100",
        },
        {
          label: "Resolved",
          value: (statusCounts.resolved || 0).toString(),
          sub: "Closed cases",
          icon: "check_circle",
          color: "bg-green-500",
          border: "border-gray-100",
          success: true,
        },
      ]);
    } catch (error) {
      console.error("Error fetching reports", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  useEffect(() => {
    const focusReportId = (location.state as { focusReportId?: string } | null)
      ?.focusReportId;

    if (!focusReportId || !reports.length) {
      return;
    }

    const target = reports.find((report) => report.id === focusReportId);
    if (target) {
      setSelectedReportId(target.id);
      setInternalNotes(target.adminFeedback || "");
      setResolutionAction(target.isDangerous ? "suspend_worker" : "warning");
      setIsDangerous(Boolean(target.isDangerous));
      setIsResolveModalOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate, reports]);

  const filteredReports = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matched = reports.filter((report) => {
      const passesStatus =
        statusFilter === "all" || report.status === statusFilter;
      if (!passesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        report.id.toLowerCase().includes(query) ||
        report.category.toLowerCase().includes(query) ||
        report.content.toLowerCase().includes(query) ||
        report.reporter.name.toLowerCase().includes(query) ||
        report.reported.name.toLowerCase().includes(query)
      );
    });

    return [...matched].sort((left, right) =>
      sortOrder === "latest"
        ? right.createdAtMs - left.createdAtMs
        : left.createdAtMs - right.createdAtMs,
    );
  }, [reports, searchQuery, sortOrder, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredReports.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredReports.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredReports]);

  const showingFrom = filteredReports.length
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0;
  const showingTo = Math.min(currentPage * PAGE_SIZE, filteredReports.length);

  const selectedContactReport =
    reports.find((report) => report.id === selectedContactReportId) ?? null;

  const openContactModal = (id: string) => {
    setSelectedContactReportId(id);
    setIsContactModalOpen(true);
  };

  const handleOpenResolveModal = (id: string) => {
    setSelectedReportId(id);
    const selected = reports.find((report) => report.id === id);
    setInternalNotes(selected?.adminFeedback || "");
    setIsDangerous(Boolean(selected?.isDangerous));
    setResolutionAction(
      Boolean(selected?.isDangerous) ? "suspend_worker" : "warning",
    );
    setIsResolveModalOpen(true);
  };

  const submitResolution = async () => {
    if (!selectedReportId) return;
    try {
      const token = getAuthToken();
      const res = await fetch(
        `${API_BASE_URL}/admin/reports/${selectedReportId}/resolve`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status:
              resolutionAction === "suspend_worker"
                ? "resolved"
                : resolutionAction === "warning"
                  ? "investigating"
                  : resolutionAction === "none"
                    ? "dismissed"
                    : "resolved",
            resolutionAction,
            feedback: internalNotes,
            isDangerous,
            suspendWorker: resolutionAction === "suspend_worker" || isDangerous,
            notifyParties,
          }),
        },
      );
      if (res.ok) {
        setIsResolveModalOpen(false);
        fetchReportsData();
      }
    } catch (error) {
      console.error("Error resolving report", error);
    }
  };

  if (loading) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#120e1b]">Report Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${stat.border} relative overflow-hidden`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">
                  {stat.label}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#120e1b]">
                    {stat.value}
                  </span>
                  {stat.success && (
                    <span className="px-2 py-0.5 bg-green-50 text-[10px] font-semibold text-green-600 rounded-md border border-green-200">
                      {stat.sub}
                    </span>
                  )}
                </div>
                {!stat.success && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {stat.alert && (
                      <span className="px-2 py-0.5 bg-red-50 text-[10px] font-bold text-red-500 rounded-md">
                        Open complaints
                      </span>
                    )}
                    {!stat.alert && (
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        {stat.sub}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div
                className={`size-10 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}
              >
                <span
                  className={`material-symbols-outlined ${stat.color.replace("bg-", "text-")}`}
                >
                  {stat.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            search
          </span>
          <input
            type="text"
            placeholder="Search by name, ID, or issue..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setPage(1);
            }}
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-red-500"
          />
        </div>
        <label className="h-11 px-3 rounded-xl border border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-600 bg-white">
          <span className="material-symbols-outlined text-[18px]">
            filter_list
          </span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as "all" | ReportStatus);
              setPage(1);
            }}
            className="bg-transparent outline-none text-sm font-bold text-gray-600"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </label>
        <label className="h-11 px-3 rounded-xl border border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-600 bg-white">
          <span className="material-symbols-outlined text-[18px]">sort</span>
          <select
            value={sortOrder}
            onChange={(event) => {
              setSortOrder(event.target.value as "latest" | "oldest");
              setPage(1);
            }}
            className="bg-transparent outline-none text-sm font-bold text-gray-600"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {paginatedReports.map((report) => (
          <div
            key={report.id}
            className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
          >
            <div className="p-8 space-y-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-semibold uppercase tracking-wider rounded-md">
                    {report.category}
                  </span>
                  <h3 className="text-lg font-semibold text-[#120e1b] mt-2 block">
                    {report.title}
                  </h3>
                  <p className="text-[10px] font-medium text-gray-500 uppercase">
                    Report ID: {report.id}
                  </p>
                </div>
                <span className="text-[10px] font-medium text-gray-500 mt-1">
                  {report.time}
                </span>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  {report.content}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-1 p-3 rounded-2xl border border-gray-50 bg-gray-50/20 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {report.reporter.avatar.length === 2 ? (
                      report.reporter.avatar
                    ) : (
                      <img
                        src={report.reporter.avatar}
                        className="rounded-full"
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Reporter (Client)
                    </p>
                    <p className="text-sm font-semibold text-[#120e1b]">
                      {report.reporter.name}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="material-symbols-outlined text-gray-300">
                    arrow_forward
                  </span>
                </div>

                <div className="flex-1 p-3 rounded-2xl border border-gray-50 bg-gray-50/20 flex items-center gap-3">
                  <img
                    src={report.reported.avatar}
                    className="size-10 rounded-full bg-gray-100"
                  />
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                      Reported (Worker)
                    </p>
                    <p className="text-sm font-semibold text-[#120e1b]">
                      {report.reported.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between gap-4">
              <span
                className={`px-3 py-1 rounded text-xs font-bold ${
                  report.status === "pending"
                    ? "bg-orange-100 text-orange-600"
                    : report.status === "resolved"
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-600"
                }`}
              >
                {report.status.toUpperCase()}
              </span>
              <div className="flex gap-4">
                <button
                  onClick={() => openContactModal(report.id)}
                  className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all"
                >
                  <span className="material-symbols-outlined text-xl">
                    mail
                  </span>
                  Contact User
                </button>
                <button
                  onClick={() => handleOpenResolveModal(report.id)}
                  className="h-12 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-xl">
                    check_circle
                  </span>
                  Update Status
                </button>
              </div>
            </div>
          </div>
        ))}
        {!paginatedReports.length ? (
          <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <p className="text-base font-semibold text-[#120e1b]">
              No reports found
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting search, filter, or sort options.
            </p>
          </div>
        ) : null}
      </div>

      {/* Resolve Report Modal */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title={`Resolve Report #${selectedReportId}`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-500">
              Select an action and document the final decision.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-[#120e1b] uppercase tracking-tight">
                Resolution Action Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setResolutionAction("warning")}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    resolutionAction === "warning"
                      ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${resolutionAction === "warning" ? "text-[#120e1b]" : "text-gray-600"}`}
                  >
                    Warning Issued
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                    Official warning to user
                  </span>
                  {resolutionAction === "warning" && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[20px] fill-current">
                      check_circle
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setResolutionAction("none")}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    resolutionAction === "none"
                      ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${resolutionAction === "none" ? "text-[#120e1b]" : "text-gray-600"}`}
                  >
                    No Action Taken
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                    Dismiss report as invalid
                  </span>
                  {resolutionAction === "none" && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[20px] fill-current">
                      check_circle
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setResolutionAction("resolved")}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    resolutionAction === "resolved"
                      ? "border-primary bg-primary/5 ring-4 ring-primary/20"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${resolutionAction === "resolved" ? "text-[#120e1b]" : "text-gray-600"}`}
                  >
                    Mark as Resolved
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                    Issue handled and closed
                  </span>
                  {resolutionAction === "resolved" && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[20px] fill-current">
                      check_circle
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    setResolutionAction("suspend_worker");
                    setIsDangerous(true);
                  }}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    resolutionAction === "suspend_worker"
                      ? "border-red-400 bg-red-50 ring-4 ring-red-100"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span
                    className={`text-sm font-bold ${resolutionAction === "suspend_worker" ? "text-red-700" : "text-gray-600"}`}
                  >
                    Suspend Worker
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">
                    Dangerous case, remove worker access
                  </span>
                  {resolutionAction === "suspend_worker" && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-red-600 text-[20px] fill-current">
                      gavel
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#120e1b]">
                  Mark as dangerous report
                </span>
                <span className="text-[10px] font-bold text-gray-500">
                  Dangerous reports can auto-suspend the reported worker.
                </span>
              </div>
              <button
                onClick={() => setIsDangerous(!isDangerous)}
                className={`w-12 h-6 rounded-full relative transition-colors ${isDangerous ? "bg-red-600" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-1 size-4 bg-white rounded-full transition-all ${isDangerous ? "left-7" : "left-1"}`}
                />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#120e1b] uppercase tracking-tight">
                Internal Notes
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Document the reason for this decision and any evidence reviewed..."
                className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#120e1b]">
                  Notify both parties
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  Make visible to their dashboards
                </span>
              </div>
              <button
                onClick={() => setNotifyParties(!notifyParties)}
                className={`w-12 h-6 rounded-full relative transition-colors ${notifyParties ? "bg-primary" : "bg-gray-300"}`}
              >
                <div
                  className={`absolute top-1 size-4 bg-white rounded-full transition-all ${notifyParties ? "left-7" : "left-1"}`}
                />
              </button>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setIsResolveModalOpen(false)}
              className="flex-1 h-12 rounded-xl border border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={submitResolution}
              className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[20px]">
                verified
              </span>
              Confirm Resolution
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title={`Contact Users #${selectedContactReportId ?? ""}`}
      >
        {selectedContactReport ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reporter (Client)
              </p>
              <p className="text-sm font-bold text-[#120e1b] mt-1">
                {selectedContactReport.reporter.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedContactReport.reporter.phone || "Phone unavailable"}
              </p>
              <a
                href={
                  selectedContactReport.reporter.phone
                    ? `tel:${selectedContactReport.reporter.phone}`
                    : undefined
                }
                className={`mt-3 inline-flex h-10 px-4 items-center rounded-lg text-xs font-bold uppercase tracking-widest ${selectedContactReport.reporter.phone ? "bg-primary text-white" : "bg-gray-100 text-gray-400 pointer-events-none"}`}
              >
                Call Reporter
              </a>
            </div>

            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Reported (Worker)
              </p>
              <p className="text-sm font-bold text-[#120e1b] mt-1">
                {selectedContactReport.reported.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {selectedContactReport.reported.phone || "Phone unavailable"}
              </p>
              <a
                href={
                  selectedContactReport.reported.phone
                    ? `tel:${selectedContactReport.reported.phone}`
                    : undefined
                }
                className={`mt-3 inline-flex h-10 px-4 items-center rounded-lg text-xs font-bold uppercase tracking-widest ${selectedContactReport.reported.phone ? "bg-primary text-white" : "bg-gray-100 text-gray-400 pointer-events-none"}`}
              >
                Call Worker
              </a>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <p className="text-xs font-medium text-gray-500 tracking-wider">
          Showing{" "}
          <span className="text-[#120e1b] font-semibold">
            {showingFrom}-{showingTo}
          </span>{" "}
          of{" "}
          <span className="text-[#120e1b] font-semibold">
            {filteredReports.length}
          </span>{" "}
          reports
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={currentPage <= 1}
            className="h-9 px-4 rounded-lg text-xs font-bold text-gray-400 hover:text-red-500 disabled:opacity-50"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .slice(
              Math.max(0, currentPage - 2),
              Math.max(0, currentPage - 2) + 3,
            )
            .map((pageNumber) => (
              <button
                key={pageNumber}
                onClick={() => setPage(pageNumber)}
                className={`size-9 rounded-lg text-xs font-bold transition-colors ${pageNumber === currentPage ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"}`}
              >
                {pageNumber}
              </button>
            ))}
          <button
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
            disabled={currentPage >= totalPages}
            className="h-9 px-4 rounded-lg text-xs font-bold text-gray-500 hover:text-red-500 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportManagementPage;
