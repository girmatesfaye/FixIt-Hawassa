import React, { useEffect, useState } from "react";
import Modal from "../components/Modal";
import {
  ClientReportItem,
  fetchMyReports,
} from "../services/clientRequests";

type DashboardReport = {
  id: string;
  workerName: string;
  dateSubmitted: string;
  status: ClientReportItem["status"];
  category: string;
  issue: string;
  clientDescription: string;
  adminResolution: string;
};

const formatReportStatus = (status: ClientReportItem["status"]): string => {
  if (status === "investigating") return "Investigating";
  if (status === "resolved") return "Resolved";
  if (status === "dismissed") return "Dismissed";
  return "Pending";
};

const getReportResolutionText = (
  status: ClientReportItem["status"],
): string => {
  if (status === "resolved") {
    return "This report has been resolved by the admin team.";
  }
  if (status === "investigating") {
    return "The admin team is reviewing this report right now.";
  }
  if (status === "dismissed") {
    return "This report was dismissed after review.";
  }
  return "Your report has been received and is waiting for review.";
};

const toDashboardReport = (report: ClientReportItem): DashboardReport => {
  const workerName = report.reportedUser?.name ?? "Unknown worker";
  const requestCategory = report.request?.category ?? report.type;

  return {
    id: report.id,
    workerName,
    dateSubmitted: new Date(report.createdAt).toLocaleDateString(),
    status: report.status,
    category: report.type,
    issue: requestCategory,
    clientDescription: report.text,
    adminResolution:
      report.adminFeedback?.trim() || getReportResolutionText(report.status),
  };
};

const ClientReportsPage: React.FC = () => {
  console.log("ClientReportsPage mounting...");
  const [myReports, setMyReports] = useState<DashboardReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportDetailModalOpen, setIsReportDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DashboardReport | null>(
    null,
  );

  const refreshReports = () => {
    setIsLoading(true);
    fetchMyReports()
      .then((items) => {
        setMyReports(items.map(toDashboardReport));
      })
      .catch(() => {
        setMyReports([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    refreshReports();
  }, []);

  const openReportDetail = (report: DashboardReport) => {
    setSelectedReport(report);
    setIsReportDetailModalOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-[#120e1b] dark:text-white">
            My Reports
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            View and track issues you've reported
          </p>
        </div>

        {isLoading ? (
          <div className="portal-panel p-10 text-center">
            <p className="text-sm text-gray-500 animate-pulse">Loading reports...</p>
          </div>
        ) : myReports.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {myReports.map((report) => (
              <div
                key={report.id}
                className="portal-panel p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h4 className="text-base font-semibold dark:text-white tracking-tight">
                        {report.category}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Worker: {report.workerName}</span>
                        <span>•</span>
                        <span>{report.dateSubmitted}</span>
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded inline-flex text-xs font-medium ${
                        report.status === "resolved"
                          ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                          : report.status === "investigating"
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                            : report.status === "dismissed"
                              ? "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 animate-pulse"
                      }`}
                    >
                      {formatReportStatus(report.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-5">
                    {report.clientDescription}
                  </p>
                </div>

                <button
                  onClick={() => openReportDetail(report)}
                  className="w-full h-10 bg-gray-50 hover:bg-primary text-gray-700 hover:text-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="portal-panel p-12 text-center">
            <div className="size-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <span className="material-symbols-outlined text-3xl">report_off</span>
            </div>
            <h3 className="text-lg font-semibold dark:text-white">No reports yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any reports. If you encounter an issue with a service, you can report it from your request details.
            </p>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      <Modal
        isOpen={isReportDetailModalOpen}
        onClose={() => setIsReportDetailModalOpen(false)}
        title="Report Details"
      >
        {selectedReport && (
          <div className="flex flex-col gap-5 pt-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {selectedReport.id}
                </span>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-medium ${
                    selectedReport.status === "resolved"
                      ? "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-800/50"
                      : selectedReport.status === "investigating"
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50"
                        : selectedReport.status === "dismissed"
                          ? "bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                  }`}
                >
                  {formatReportStatus(selectedReport.status)}
                </span>
              </div>
              <h4 className="text-lg font-semibold dark:text-white tracking-tight">
                {selectedReport.category}
              </h4>
              <p className="text-sm text-primary font-medium">
                Against {selectedReport.workerName}
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                  My Description
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                  "{selectedReport.clientDescription}"
                </p>
              </div>

              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                <p className="text-xs font-semibold text-primary mb-1.5">
                  Admin Resolution
                </p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
                  {selectedReport.adminResolution}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsReportDetailModalOpen(false)}
              className="w-full h-10 mt-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium shadow-sm transition-all"
            >
              Close Details
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ClientReportsPage;
