import React, { useEffect, useMemo, useState } from "react";
import { getAuthToken } from "../services/auth";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

type AnalyticsStat = {
  label: string;
  value: string;
  trend: string;
  icon: string;
  color: string;
  border: string;
};

type RequestTrendPoint = {
  day: string;
  value: number;
};

type GrowthPoint = {
  month: string;
  clients: number;
  workers: number;
};

type ActivityItem = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  actor: string;
};

type AdminStatsResponse = {
  totalUsers?: number;
  totalWorkers?: number;
  totalRequests?: number;
  pendingReports?: number;
  requestTrend?: RequestTrendPoint[];
  userGrowth?: GrowthPoint[];
  recentActivity?: ActivityItem[];
};

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<AnalyticsStat[]>([
    {
      label: "Total Users",
      value: "0",
      trend: "Live",
      icon: "group",
      color: "bg-blue-600",
      border: "border-blue-600",
    },
    {
      label: "Total Workers",
      value: "0",
      trend: "Live",
      icon: "construction",
      color: "bg-red-500",
      border: "border-red-500",
    },
    {
      label: "Total Service Requests",
      value: "0",
      trend: "Live",
      icon: "check_box",
      color: "bg-amber-500",
      border: "border-gray-100",
    },
    {
      label: "Pending Complaints",
      value: "0",
      trend: "Live",
      icon: "report_problem",
      color: "bg-orange-500",
      border: "border-gray-100",
    },
  ]);
  const [requestTrend, setRequestTrend] = useState<RequestTrendPoint[]>([]);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          throw new Error("LOAD_FAILED");
        }

        const data = (await res.json()) as AdminStatsResponse;

        setStats([
          {
            label: "Total Users",
            value: String(data.totalUsers ?? 0),
            trend: "Live",
            icon: "group",
            color: "bg-blue-600",
            border: "border-blue-600",
          },
          {
            label: "Total Workers",
            value: String(data.totalWorkers ?? 0),
            trend: "Live",
            icon: "construction",
            color: "bg-red-500",
            border: "border-red-500",
          },
          {
            label: "Total Service Requests",
            value: String(data.totalRequests ?? 0),
            trend: "Live",
            icon: "check_box",
            color: "bg-amber-500",
            border: "border-gray-100",
          },
          {
            label: "Pending Complaints",
            value: String(data.pendingReports ?? 0),
            trend: "Live",
            icon: "report_problem",
            color: "bg-orange-500",
            border: "border-gray-100",
          },
        ]);

        setRequestTrend(
          Array.isArray(data.requestTrend) ? data.requestTrend : [],
        );
        setUserGrowth(Array.isArray(data.userGrowth) ? data.userGrowth : []);
        setRecentActivity(
          Array.isArray(data.recentActivity) ? data.recentActivity : [],
        );
      } catch (error) {
        console.error("Failed to fetch analytics stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const requestTrendMax = useMemo(
    () => Math.max(1, ...requestTrend.map((item) => item.value)),
    [requestTrend],
  );

  const userGrowthMax = useMemo(() => {
    const values = userGrowth.flatMap((item) => [item.clients, item.workers]);
    return Math.max(1, ...values);
  }, [userGrowth]);

  if (loading) {
    return <div className="p-8">Loading analytics...</div>;
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#120e1b]">Analytics Overview</h1>
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
            <span className="material-symbols-outlined text-[18px]">
              calendar_today
            </span>
            Last 7 Days
            <span className="material-symbols-outlined text-[18px]">
              expand_more
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${stat.border} relative overflow-hidden group hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div
                  className={`size-10 rounded-lg ${stat.color} bg-opacity-10 flex items-center justify-center mb-3`}
                >
                  <span
                    className={`material-symbols-outlined ${stat.color.replace("bg-", "text-")} text-xl`}
                  >
                    {stat.icon}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#120e1b]">
                    {stat.value}
                  </span>
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px] font-bold">
                      trending_up
                    </span>
                    {stat.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-[#120e1b]">
                Service Requests Trend
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Real request volume from the database
              </p>
            </div>
          </div>

          <div className="relative h-60 flex items-end justify-between px-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="w-full border-t border-black"></div>
              ))}
            </div>

            {requestTrend.length ? (
              requestTrend.map((item) => (
                <div
                  key={item.day}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <div className="relative flex flex-col items-center w-8 sm:w-10 h-44 group">
                    <div
                      className="w-full bg-primary rounded-t transition-all group-hover:bg-primary-dark"
                      style={{
                        height: `${Math.max(10, (item.value / requestTrendMax) * 100)}%`,
                      }}
                    ></div>
                    <div className="absolute -top-8 bg-[#120e1b] text-white text-xs font-medium px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.value}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {item.day.slice(5)}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                No request activity yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-semibold text-[#120e1b]">
                User Growth
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                New registrations from clients and workers
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-red-500"></div>
                <span className="text-xs font-medium text-gray-600">
                  Workers
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2 rounded-full bg-primary"></div>
                <span className="text-xs font-medium text-gray-600">
                  Clients
                </span>
              </div>
            </div>
          </div>

          <div className="relative h-60 flex items-end justify-between px-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="w-full border-t border-black"></div>
              ))}
            </div>

            {userGrowth.length ? (
              userGrowth.map((item) => (
                <div
                  key={item.month}
                  className="flex flex-col items-center gap-3 w-full"
                >
                  <div className="flex items-end gap-1.5 h-44 group">
                    <div
                      style={{
                        height: `${Math.max(12, (item.clients / userGrowthMax) * 100)}%`,
                      }}
                      className="w-3 sm:w-4 bg-primary rounded-t transition-all hover:brightness-110"
                    ></div>
                    <div
                      style={{
                        height: `${Math.max(12, (item.workers / userGrowthMax) * 100)}%`,
                      }}
                      className="w-3 sm:w-4 bg-red-500 rounded-t transition-all hover:brightness-110"
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-gray-500">
                    {item.month}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
                No user growth data yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#120e1b]">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Client and worker actions pulled from live records
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {recentActivity.length ? (
            recentActivity.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/10">
                    {item.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#120e1b]">
                  {item.title}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
                <p className="text-xs text-gray-500">Actor: {item.actor}</p>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">
              No recent activity available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
