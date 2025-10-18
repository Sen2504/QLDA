import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import IssueService from "../services/issueService";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import PermissionGuard from "../components/PermissionGuard";
import withPermissions from "../components/withPermissions";

function IssueList() {
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState({});

  const STATUS_OPTIONS = [
    "New",
    "In Progress",
    "Ready for test",
    "Closed",
    "Need Info",
    "Rejected",
    "Postponed",
  ];

  // ---- LOAD ISSUE LIST ----
    useEffect(() => {
        if (!currentProject) return;
        setLoading(true);
        IssueService.getByProject(currentProject.id)
            .then((res) => setIssues(res.data || []))
            .catch((err) => console.error("Lỗi khi load issue:", err))
            .finally(() => setLoading(false));
    }, [currentProject]);


  // ---- HANDLE CHANGE STATUS ----
const handleStatusChange = (issueId, value) => {
  const newStatus = value;
  setSelectedStatus((prev) => ({ ...prev, [issueId]: newStatus }));

  const formData = new FormData();
  formData.append("status", newStatus);

  IssueService.update(issueId, formData)
    .then(() => {
      console.log("Cập nhật trạng thái thành công");
      // cập nhật lại state để phản ánh thay đổi
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId ? { ...i, status: newStatus } : i
        )
      );
    })
    .catch((err) => console.error(" Lỗi khi cập nhật trạng thái:", err));
};


  // ---- DECORATE DATA ----
  const decoratedIssues = useMemo(
    () =>
      (issues || []).map((issue) => {
        const dueInfo = evaluateDueDate(issue.expire_date);
        return { ...issue, dueInfo };
      }),
    [issues]
  );

  // ---- UI ----
  return (
    <MainLayout>
      <div className="mt-6 bg-white rounded-2xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Issue list</h2>
          <PermissionGuard resource="Issue" action="Create">
            <button
              onClick={() => navigate("/issues/")}
              className="px-4 py-2 rounded-2xl bg-[var(--color-accent,#16a34a)] text-white hover:opacity-90"
            >
              + Create issue
            </button>
          </PermissionGuard>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading data...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Deadline</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Handler</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {decoratedIssues.map((issue) => (
                  <tr key={issue.id} className="border-t hover:bg-gray-50">
                    {/* Tên issue */}
                    <td className="px-4 py-2 cursor-pointer text-emerald-700 font-medium hover:underline"
                        onClick={() => navigate(`/issues/${issue.id}`)}>
                      {issue.name}
                    </td>

                    {/* Hạn chót */}
                    <td className="px-4 py-2">{issue.dueInfo.dueDisplay}</td>

                    {/* Ưu tiên */}
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${issue.dueInfo.badgeClass}`}
                        >
                          {issue.dueInfo.label}
                        </span>
                        {issue.dueInfo.diffDays !== null && (
                          <span className="text-xs text-gray-500">
                            {describeDiffDays(issue.dueInfo.diffDays)}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Người thực hiện */}
                    <td className="px-4 py-2">
                      {issue.handlers && issue.handlers.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {issue.handlers.map((h, idx) => (
                            <span key={idx} className="text-xs text-gray-700">
                              {h.user_email}
                              {h.role_name && (
                                <span className="text-gray-400"> ({h.role_name})</span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Not assigned</span>
                      )}
                    </td>


                    {/* Trạng thái */}
                    <td className="px-4 py-2">
                      <select
                        value={
                          selectedStatus[issue.id] !== undefined
                            ? selectedStatus[issue.id]
                            : issue.status || "New"
                        }
                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                        className="border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)]"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-2 text-center">
                        <PermissionGuard resource="Issue" action="Edit">
                          <button
                              onClick={() => navigate(`/issues/${issue.id}/edit`)}
                              className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                          >
                              Edit
                          </button>
                        </PermissionGuard>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {issues.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">No issue yet.</p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default withPermissions(IssueList);
