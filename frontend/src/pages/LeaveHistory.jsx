import { useState, useEffect } from "react";
import { Filter, Calendar } from "lucide-react";
import api from "../api/client";
import LeaveTable from "../components/leave/LeaveTable";
import { TableSkeleton } from "../components/common/Skeleton";
import PageTransition from "../components/common/PageTransition";
import { useToast } from "../context/ToastContext";

export default function LeaveHistory() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchHistory(p = 1, stat = status) {
    setLoading(true);
    try {
      const res = await api.get("/employee/leave/history", {
        params: {
          page: p,
          page_size: 10,
          status: stat || undefined,
        },
      });
      setLeaves(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error("Failed to load leave history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory(page, status);
  }, [page, status]);

  const handleCancelLeave = async (uuid) => {
    try {
      await api.post(`/employee/leave/${uuid}/cancel`);
      toast.success("Leave request cancelled.");
      fetchHistory(page, status);
    } catch (err) {
      toast.error(err.response?.data?.detail?.error || "Failed to cancel leave.");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl glass border border-surface-800">
          <div>
            <h2 className="text-xl font-bold text-surface-100">Leave History</h2>
            <p className="text-xs text-surface-400">Total {total} leave applications submitted</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Filter className="w-3.5 h-3.5 text-surface-400 absolute left-3 top-3" />
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-xs text-surface-100 focus:outline-none focus:border-primary-500"
              >
                <option value="" className="bg-slate-900 text-slate-100 py-1.5">All Statuses</option>
                <option value="PENDING" className="bg-slate-900 text-slate-100 py-1.5">PENDING</option>
                <option value="APPROVED" className="bg-slate-900 text-slate-100 py-1.5">APPROVED</option>
                <option value="REJECTED" className="bg-slate-900 text-slate-100 py-1.5">REJECTED</option>
                <option value="CANCELLED" className="bg-slate-900 text-slate-100 py-1.5">CANCELLED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table & Pagination */}
        {loading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="space-y-4">
            <LeaveTable leaves={leaves} onCancel={handleCancelLeave} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 text-xs text-surface-400">
                <span>
                  Page {page} of {totalPages} ({total} total items)
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 disabled:opacity-40 text-surface-200 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 disabled:opacity-40 text-surface-200 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
