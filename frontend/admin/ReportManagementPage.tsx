
import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { getAuthToken } from '../services/auth';

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:4000";

const ReportManagementPage: React.FC = () => {
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [resolutionAction, setResolutionAction] = useState<'warning' | 'none' | 'resolved'>('warning');
  const [notifyParties, setNotifyParties] = useState(true);
  const [internalNotes, setInternalNotes] = useState("");

  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportsData = async () => {
    try {
      const token = getAuthToken();
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const [reportsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/reports`, { headers }),
        fetch(`${API_BASE_URL}/admin/stats`, { headers })
      ]);

      const reportsData = await reportsRes.json();
      const statsData = await statsRes.json();

      setReports((reportsData.reports || []).map((r: any) => ({
        id: r._id,
        category: r.type,
        title: `Report on ${r.reportedUserId?.fullName || 'User'}`,
        time: new Date(r.createdAt).toLocaleString(),
        content: `"${r.text}"`,
        reporter: { name: r.reporterUserId?.fullName || "Reporter", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reporterUserId?._id || 'reporter'}` },
        reported: { name: r.reportedUserId?.fullName || "Reported", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.reportedUserId?._id || 'reported'}` },
        status: r.status
      })));

      setStats([
        { label: 'Total Reports', value: reportsData.reports?.length?.toString() || '0', sub: 'All time', icon: 'folder', color: 'bg-blue-600', border: 'border-blue-600' },
        { label: 'Action Required', value: statsData.pendingReports?.toString() || '0', sub: 'Open complaints', icon: 'priority_high', color: 'bg-red-500', border: 'border-red-500', alert: true },
        { label: 'Investigating', value: '0', sub: 'In progress', icon: 'search', color: 'bg-orange-400', border: 'border-gray-100' },
        { label: 'Resolved This Month', value: '0', sub: '+0% vs last mo.', icon: 'check_circle', color: 'bg-green-500', border: 'border-gray-100', success: true },
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

  const handleOpenResolveModal = (id: string) => {
    setSelectedReportId(id);
    setIsResolveModalOpen(true);
  };

  const submitResolution = async () => {
    if (!selectedReportId) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/reports/${selectedReportId}/resolve`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: resolutionAction === 'warning' ? 'investigating' : resolutionAction === 'none' ? 'dismissed' : 'resolved' })
      });
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
          <div key={i} className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${stat.border} relative overflow-hidden`}>
            <div className="flex justify-between items-start">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-500 tracking-wider uppercase">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-[#120e1b]">{stat.value}</span>
                  {stat.success && (
                    <span className="px-2 py-0.5 bg-green-50 text-[10px] font-semibold text-green-600 rounded-md border border-green-200">
                      {stat.sub}
                    </span>
                  )}
                </div>
                {!stat.success && (
                  <div className="flex items-center gap-1.5 mt-1">
                    {stat.alert && <span className="px-2 py-0.5 bg-red-50 text-[10px] font-bold text-red-500 rounded-md">Open complaints</span>}
                    {!stat.alert && <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.sub}</span>}
                  </div>
                )}
              </div>
              <div className={`size-10 rounded-xl ${stat.color} bg-opacity-10 flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color.replace('bg-', 'text-')}`}>{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
          <input 
            type="text" 
            placeholder="Search by name, ID, or issue..." 
            className="w-full h-11 pl-10 pr-4 bg-gray-50 border-none rounded-xl text-sm focus:ring-1 focus:ring-red-500" 
          />
        </div>
        <button className="h-11 px-6 rounded-xl border border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
          Filter
        </button>
        <button className="h-11 px-6 rounded-xl border border-gray-100 flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
          <span className="material-symbols-outlined">sort</span>
          Sort
        </button>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-8 space-y-6 flex-1">
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <span className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-semibold uppercase tracking-wider rounded-md">
                    {report.category}
                  </span>
                  <h3 className="text-lg font-semibold text-[#120e1b] mt-2 block">{report.title}</h3>
                  <p className="text-[10px] font-medium text-gray-500 uppercase">Report ID: {report.id}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-500 mt-1">{report.time}</span>
              </div>

              <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed italic">
                  {report.content}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex-1 p-3 rounded-2xl border border-gray-50 bg-gray-50/20 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                    {report.reporter.avatar.length === 2 ? report.reporter.avatar : <img src={report.reporter.avatar} className="rounded-full" />}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reporter (Client)</p>
                    <p className="text-sm font-semibold text-[#120e1b]">{report.reporter.name}</p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="material-symbols-outlined text-gray-300">arrow_forward</span>
                </div>

                <div className="flex-1 p-3 rounded-2xl border border-gray-50 bg-gray-50/20 flex items-center gap-3">
                  <img src={report.reported.avatar} className="size-10 rounded-full bg-gray-100" />
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Reported (Worker)</p>
                    <p className="text-sm font-semibold text-[#120e1b]">{report.reported.name}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between gap-4">
              <span className={`px-3 py-1 rounded text-xs font-bold ${
                report.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                report.status === 'resolved' ? 'bg-green-100 text-green-600' :
                'bg-gray-200 text-gray-600'
              }`}>
                {report.status.toUpperCase()}
              </span>
              <div className="flex gap-4">
                <button className="h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
                  <span className="material-symbols-outlined text-xl">mail</span>
                  Contact User
                </button>
                <button 
                  onClick={() => handleOpenResolveModal(report.id)}
                  className="h-12 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-xl">check_circle</span>
                  Update Status
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resolve Report Modal */}
      <Modal 
        isOpen={isResolveModalOpen} 
        onClose={() => setIsResolveModalOpen(false)} 
        title={`Resolve Report #${selectedReportId}`}
      >
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-gray-500">Select an action and document the final decision.</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-3">
              <h4 className="text-sm font-bold text-[#120e1b] uppercase tracking-tight">Resolution Action Summary</h4>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setResolutionAction('warning')}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    resolutionAction === 'warning' ? 'border-primary bg-primary/5 ring-4 ring-primary/20' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className={`text-sm font-bold ${resolutionAction === 'warning' ? 'text-[#120e1b]' : 'text-gray-600'}`}>Warning Issued</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">Official warning to user</span>
                  {resolutionAction === 'warning' && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[20px] fill-current">check_circle</span>
                  )}
                </button>
                <button 
                  onClick={() => setResolutionAction('none')}
                  className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left ${
                    resolutionAction === 'none' ? 'border-primary bg-primary/5 ring-4 ring-primary/20' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <span className={`text-sm font-bold ${resolutionAction === 'none' ? 'text-[#120e1b]' : 'text-gray-600'}`}>No Action Taken</span>
                  <span className="text-[10px] font-bold text-gray-400 mt-0.5">Dismiss report as invalid</span>
                  {resolutionAction === 'none' && (
                    <span className="absolute top-3 right-3 material-symbols-outlined text-primary text-[20px] fill-current">check_circle</span>
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-[#120e1b] uppercase tracking-tight">Internal Notes</label>
              <textarea 
                value={internalNotes}
                onChange={e => setInternalNotes(e.target.value)}
                placeholder="Document the reason for this decision and any evidence reviewed..."
                className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-sm resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-[#120e1b]">Notify both parties</span>
                <span className="text-[10px] font-bold text-gray-400">Send automated resolution update email</span>
              </div>
              <button 
                onClick={() => setNotifyParties(!notifyParties)}
                className={`w-12 h-6 rounded-full relative transition-colors ${notifyParties ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full transition-all ${notifyParties ? 'left-7' : 'left-1'}`} />
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
              <span className="material-symbols-outlined text-[20px]">verified</span>
              Confirm Resolution
            </button>
          </div>
        </div>
      </Modal>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-6">
        <p className="text-xs font-medium text-gray-500 tracking-wider">
          Showing <span className="text-[#120e1b] font-semibold">1-{reports.length}</span> of <span className="text-[#120e1b] font-semibold">{reports.length}</span> reports
        </p>
        <div className="flex items-center gap-1">
          <button className="h-9 px-4 rounded-lg text-xs font-bold text-gray-400 hover:text-red-500 disabled:opacity-50">Previous</button>
          <button className="size-9 rounded-lg bg-primary text-white text-xs font-bold">1</button>
          <button className="size-9 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">2</button>
          <span className="px-2 text-gray-300">...</span>
          <button className="h-9 px-4 rounded-lg text-xs font-bold text-gray-500 hover:text-red-500">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ReportManagementPage;
