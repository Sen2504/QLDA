import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
  const [filterType, setFilterType] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [availableHashtags, setAvailableHashtags] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

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
      .then((res) => {
        const data = (res.data || []).map((i) => ({
          ...i,
          dueInfo: evaluateDueDate(i.expire_date),
        }));
        setIssues(data);

        // collect hashtag list
        const hashtagSet = new Map();
        data.forEach((i) => {
          (i.hashtags || []).forEach((h) => {
            if (h && h.id) hashtagSet.set(h.id, h);
          });
        });
        setAvailableHashtags(Array.from(hashtagSet.values()));
      })
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
      .then((res) => {
        toast.success(res?.data?.message || "Status updated successfully!");
        setIssues((prev) =>
          prev.map((i) =>
            i.id === issueId ? { ...i, status: newStatus } : i
          )
        );
      })
      .catch((err) => console.error("Lỗi khi cập nhật trạng thái:", err));
  };

  // ---- SORT HELPER ----
  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ field }) => (
    <span
      className="ml-1 cursor-pointer select-none"
      onClick={() => toggleSort(field)}
    >
      {sortConfig.key === field
        ? sortConfig.direction === "asc"
          ? "▲"
          : "▼"
        : "⇅"}
    </span>
  );

  // ---- FILTER + SORT ----
  const filteredIssues = useMemo(() => {
    let data = [...issues];

    // Filter
    if (filterType && filterValue) {
      if (filterType === "status") {
        data = data.filter(
          (i) => (i.status || "").toLowerCase() === filterValue.toLowerCase()
        );
      } else if (filterType === "hashtag") {
        data = data.filter((i) =>
          i.hashtags?.some((h) => String(h.id) === String(filterValue))
        );
      }
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        const { key, direction } = sortConfig;
        let result = 0;

        if (key === "expire_date") {
          const aDate = new Date(a.expire_date || 0);
          const bDate = new Date(b.expire_date || 0);
          result = aDate - bDate;
        } else if (["severity", "priority"].includes(key)) {
          const aVal = (a[key] || "").toLowerCase();
          const bVal = (b[key] || "").toLowerCase();
          result = aVal.localeCompare(bVal);
        }

        return direction === "asc" ? result : -result;
      });
    }

    return data;
  }, [issues, filterType, filterValue, sortConfig]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");

  // ---- UI ----
  return (
    <>
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

        {/* FILTER BAR */}
        <div className="flex gap-4 mb-4">
          {/* Ô Filter by */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setFilterValue("");
            }}
            className="border px-3 py-2 rounded-lg text-sm"
          >
            <option value="">Filter by...</option>
            <option value="status">Status</option>
            <option value="hashtag">Hashtag</option>
          </select>

          {/* Ô Select value */}
          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            disabled={!filterType}
            className={`border px-3 py-2 rounded-lg text-sm transition-colors ${
              !filterType
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700"
            }`}
          >
            <option value="">Select value</option>

            {filterType === "status" &&
              STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}

            {filterType === "hashtag" &&
              availableHashtags.map((h) => (
                <option key={h.id} value={h.id}>
                  #{h.name}
                </option>
              ))}
          </select>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading data...</p>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full w-full text-sm text-left text-gray-700 border-collapse">
              <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2 w-[20%]">Name</th>
                  <th className="px-4 py-2 w-[10%]">Hashtag</th>
                  <th className="px-4 py-2 w-[10%]">
                    Deadline <SortIcon field="expire_date" />
                  </th>
                  <th className="px-4 py-2 w-[10%]">
                    Severity <SortIcon field="severity" />
                  </th>
                  <th className="px-4 py-2 w-[10%]">
                    Priority <SortIcon field="priority" />
                  </th>
                  <th className="px-4 py-2 w-[20%]">Handler</th>
                  <th className="px-4 py-2 w-[10%]">Status</th>
                  <th className="px-4 py-2 text-center w-[5%]"></th>
                </tr>
              </thead>

              <tbody>
                {filteredIssues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="border-t hover:bg-gray-50 align-top transition-colors"
                  >
                    {/* NAME */}
                    <td
                      className="px-4 py-2 cursor-pointer text-emerald-700 font-medium hover:underline whitespace-normal break-words max-w-[220px]"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      title={issue.name}
                    >
                      {issue.name}
                    </td>

                    {/* HASHTAGS */}
                    <td className="px-4 py-2">
                      {issue.hashtags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {issue.hashtags.map((h) => (
                            <span
                              key={h.id}
                              className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full"
                            >
                              #{h.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          No hashtags
                        </span>
                      )}
                    </td>

                    {/* DEADLINE */}
                    <td className="px-4 py-2 align-top">
                      <div className="flex flex-col items-start">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          {formatDate(issue.expire_date)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-semibold ${
                              issue.dueInfo.label
                                .toLowerCase()
                                .includes("overdue")
                                ? "text-red-600"
                                : issue.dueInfo.label
                                    .toLowerCase()
                                    .includes("priority")
                                ? "text-amber-600"
                                : issue.dueInfo.label
                                    .toLowerCase()
                                    .includes("upcoming")
                                ? "text-sky-600"
                                : "text-gray-600"
                            }`}
                          >
                            {issue.dueInfo.label}
                          </span>
                          {issue.dueInfo.diffDays !== null && (
                            <span className="text-xs text-gray-500 whitespace-nowrap">
                              {describeDiffDays(issue.dueInfo.diffDays)}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SEVERITY */}
                    <td className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {issue.severity}
                      </span>
                    </td>

                    {/* PRIORITY */}
                    <td className="px-4 py-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {issue.priority}
                      </span>
                    </td>

                    {/* HANDLER */}
                    <td className="px-4 py-2">
                      {issue.handlers && issue.handlers.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {issue.handlers.map((h, idx) => (
                            <span key={idx} className="text-xs text-gray-700">
                              {h.user_name}
                              {h.role_name && (
                                <span className="text-gray-400">
                                  {" "}
                                  ({h.role_name})
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          Not assigned
                        </span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <select
                        value={
                          selectedStatus[issue.id] !== undefined
                            ? selectedStatus[issue.id]
                            : issue.status || "New"
                        }
                        onChange={(e) =>
                          handleStatusChange(issue.id, e.target.value)
                        }
                        className="border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)]"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* EDIT */}
                    <td className="px-4 py-2 text-center whitespace-nowrap">
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
          </div>
        )}
      </div>
    </>
  );
}

export default withPermissions(IssueList);
