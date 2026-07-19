import { useState, useEffect } from "react";
import { Search, Filter, Mail, UserCheck } from "lucide-react";
import api from "../api/client";
import { TableSkeleton } from "../components/common/Skeleton";
import PageTransition from "../components/common/PageTransition";
import { useToast } from "../context/ToastContext";

export default function AdminEmployees() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function fetchEmployees(p = page) {
    setLoading(true);
    try {
      const res = await api.get("/admin/employees", {
        params: {
          page: p,
          page_size: 10,
          department: department || undefined,
          search: search || undefined,
        },
      });
      setEmployees(res.data.items || []);
      setTotalPages(res.data.total_pages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      toast.error("Failed to load employee directory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmployees(page);
  }, [page, department]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees(1);
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header & Search Bar */}
        <div className="p-6 rounded-2xl glass border border-surface-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-surface-100">Employee Directory</h2>
              <p className="text-xs text-surface-400">Total {total} company employees</p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-surface-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, EMP ID, or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-xs text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-surface-700/60 text-xs text-surface-100 focus:outline-none focus:border-primary-500"
            >
              <option value="">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Sales">Sales</option>
            </select>
          </form>
        </div>

        {/* Directory Table */}
        {loading ? (
          <TableSkeleton rows={6} />
        ) : (
          <div className="space-y-4">
            <div className="w-full overflow-x-auto rounded-2xl glass border border-surface-800">
              <table className="w-full text-left text-xs text-surface-300">
                <thead className="bg-surface-900/80 text-surface-400 uppercase tracking-wider font-semibold border-b border-surface-800">
                  <tr>
                    <th className="p-4">Employee</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Designation</th>
                    <th className="p-4">Manager</th>
                    <th className="p-4">Attendance</th>
                    <th className="p-4">Leave Used</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="p-4 font-semibold text-surface-100">
                        <div>{emp.name}</div>
                        <div className="text-[10px] text-surface-400 font-mono">{emp.emp_id} &bull; {emp.email}</div>
                      </td>
                      <td className="p-4">{emp.department}</td>
                      <td className="p-4">{emp.designation}</td>
                      <td className="p-4 text-surface-300">{emp.manager || "N/A"}</td>
                      <td className="p-4 font-bold text-success-400">{emp.attendance_pct}%</td>
                      <td className="p-4 text-surface-300">
                        {emp.casual_leave_used + emp.sick_leave_used + emp.earned_leave_used} / {emp.annual_leave} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-2 text-xs text-surface-400">
                <span>
                  Page {page} of {totalPages} ({total} employees)
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
