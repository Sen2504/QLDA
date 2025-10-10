import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import IssueService from "../services/issueService";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";

export default function IssueList() {
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
    IssueService.update(issueId, { status: newStatus })
      .then(() => console.log("Cập nhật trạng thái thành công"))
      .catch((err) => console.error("Lỗi khi cập nhật trạng thái:", err));
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
          <h2 className="text-lg font-semibold text-gray-800">Danh sách Issue</h2>
          <button
            onClick={() => navigate("/issues/")}
            className="px-4 py-2 rounded-2xl bg-[var(--color-accent,#16a34a)] text-white hover:opacity-90"
          >
            + Tạo issue
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2">Tên Issue</th>
                  <th className="px-4 py-2">Hạn chót</th>
                  <th className="px-4 py-2">Ưu tiên</th>
                  <th className="px-4 py-2">Người xử lý</th>
                  <th className="px-4 py-2">Trạng thái</th>
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

                    {/* Người xử lý */}
                    <td className="px-4 py-2">
                      {issue.assignee ? (
                        <span className="text-xs text-gray-700">
                          {issue.assignee.user_email || "Ẩn danh"}{" "}
                          {issue.assignee.role_name && (
                            <span className="text-gray-400">
                              ({issue.assignee.role_name})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Chưa phân công</span>
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
                        <button
                            onClick={() => navigate(`/issues/${issue.id}/edit`)}
                            className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                        >
                            Chỉnh sửa
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {issues.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">Chưa có issue nào.</p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
