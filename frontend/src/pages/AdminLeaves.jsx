import { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import api from "../api/client";
import LeaveTable from "../components/leave/LeaveTable";
import Modal from "../components/common/Modal";
import { TableSkeleton } from "../components/common/Skeleton";
import PageTransition from "../components/common/PageTransition";
import { useToast } from "../context/ToastContext";

export default function AdminLeaves() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Reject Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [targetUuid, setTargetUuid] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  async function fetchLeaves(p = page) {
    setLoading(true);
    try {
      const res = await api.get("/admin/leaves", {
        params: {
          page: p,
          page_size: 10,
          status: status || undefined,
          department: department || undefined,
          search: search || undefined,
        },
      });
      setLeaves(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error("Failed to load leave requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaves(page);
  }, [page, status, department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeaves(1);
  };

  const handleApprove = async (uuid) => {
    try {
      await api.put(`/admin/leaves/${uuid}/approve`);
      toast.success("Leave request approved successfully!");
      fetchLeaves(page);
    } catch (err) {
      toast.error(err.response?.data?.detail?.error || "Failed to approve leave.");
    }
  };

  const handleOpenRejectModal = (uuid) => {
    setTargetUuid(uuid);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning("Rejection reason is required.");
      return;
    }

    try {
      await api.put(`/admin/leaves/${targetUuid}/reject`, { reason: rejectReason.trim() });
      toast.success("Leave request rejected.");
      setRejectModalOpen(false);
      fetchLeaves(page);
    } catch (err) {
      toast.error(err.response?.data?.detail?.error || "Failed to reject leave.");
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Filter Bar */}
        <div className="p-6 rounded-2xl glass border border-surface-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-surface-100">Leave Approval Management</h2>
              <p className="text-xs text-surface-400">Total {total} company leave requests</p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee name or EMP ID..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="" className="bg-slate-900 text-slate-100">All Statuses</option>
              <option value="PENDING" className="bg-slate-900 text-slate-100">PENDING</option>
              <option value="APPROVED" className="bg-slate-900 text-slate-100">APPROVED</option>
              <option value="REJECTED" className="bg-slate-900 text-slate-100">REJECTED</option>
            </select>

            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/60 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
            >
              <option value="" className="bg-slate-900 text-slate-100">All Departments</option>
              <option value="Engineering" className="bg-slate-900 text-slate-100">Engineering</option>
              <option value="Product" className="bg-slate-900 text-slate-100">Product</option>
              <option value="Design" className="bg-slate-900 text-slate-100">Design</option>
              <option value="Marketing" className="bg-slate-900 text-slate-100">Marketing</option>
              <option value="HR" className="bg-slate-900 text-slate-100">HR</option>
              <option value="Finance" className="bg-slate-900 text-slate-100">Finance</option>
              <option value="Sales" className="bg-slate-900 text-slate-100">Sales</option>
            </select>
          </form>
        </div>

        {/* Table & Pagination */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="space-y-4">
            <LeaveTable
              leaves={leaves}
              isAdmin={true}
              onApprove={handleApprove}
              onReject={handleOpenRejectModal}
            />

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 text-xs text-surface-400">
                <span>
                  Page {page} of {totalPages} ({total} total records)
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

        {/* Reject Modal */}
        <Modal
          isOpen={rejectModalOpen}
          onClose={() => setRejectModalOpen(false)}
          title="Reject Leave Request"
        >
          <div className="space-y-4">
            <p className="text-xs text-surface-400">
              Please provide a clear reason for rejecting this leave application:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., High workload during release week..."
              rows={3}
              className="w-full p-3 rounded-xl bg-surface-900 border border-surface-700/60 text-xs text-surface-100 focus:outline-none focus:border-primary-500 resize-none"
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-surface-800 text-surface-300 hover:bg-surface-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-error-500 text-white hover:bg-error-600 text-xs font-semibold shadow-lg shadow-error-500/20"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </PageTransition>
  );
}
