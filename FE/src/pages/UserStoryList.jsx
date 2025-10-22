import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import PermissionGuard from "../components/PermissionGuard";
import withPermissions from "../components/withPermissions";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import { TableSkeleton } from "../components/LoadingSkeleton";

function UserStoryList() {
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [stories, setStories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [availableHashtags, setAvailableHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState({});
  
  // useRef để chặn duplicate API calls
  const fetchedProjectIdRef = useRef(null);

  // ---- LOAD USER STORIES ----
  useEffect(() => {
    if (!currentProject) return;
    
    // Chặn cứng - nếu đã fetch project này rồi → skip
    if (fetchedProjectIdRef.current === currentProject.id) {
      return;
    }
    
    fetchedProjectIdRef.current = currentProject.id;
    setLoading(true);
    
    Promise.all([
      UserStoryService.getByProject(currentProject.id),
      UserStoryService.getStatuses(),
    ])
      .then(([resStories, resStatuses]) => {
        const decorated = (resStories.data || []).map((s) => ({
          ...s,
          dueInfo: evaluateDueDate(s.expire_date),
        }));
        setStories(decorated);
        setStatuses(resStatuses || []);
      })
      .catch((err) => {
        console.error("Lỗi khi tải User Stories:", err);
      })
      .finally(() => setLoading(false));

    UserStoryService.getByProject(currentProject.id)
      .then((res) => {
        const hashtagsSet = new Map();
        (res.data || []).forEach((s) => {
          (s.hashtags || []).forEach((h) => {
            const tag = h.hashtag;
            if (tag && tag.id) hashtagsSet.set(tag.id, tag);
          });
        });
        setAvailableHashtags(Array.from(hashtagsSet.values()));
      })
      .catch((err) => console.error("Error loading hashtags:", err));
  }, [currentProject]);

  const handleStatusChange = async (storyId, newStatusId) => {
    try {
      const fd = new FormData();
      fd.append("Status_id", String(newStatusId));
      const res = await UserStoryService.update(storyId, fd);
      toast.success(res?.data?.message || "Update status successfully!");
      setSelectedStatus((prev) => ({ ...prev, [storyId]: newStatusId }));
      setStories((prev) =>
        prev.map((s) => (s.id === storyId ? { ...s, status_id: newStatusId } : s))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error(err?.response?.data?.error || "Failed to update status");
    }
  };

  const filteredStories = useMemo(() => {
    let data = [...stories];
    if (filterType && filterValue) {
      if (filterType === "status") {
        data = data.filter((s) => String(s.status_id) === filterValue);
      } else if (filterType === "hashtag") {
        data = data.filter((s) => s.hashtags?.some((h) => String(h.hashtag.id) === filterValue));
      }
    }
    if (sortConfig.key) {
      data.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [stories, filterType, filterValue, sortConfig]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "-");

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ field }) => (
    <span className="ml-1 cursor-pointer select-none" onClick={() => toggleSort(field)}>
      {sortConfig.key === field ? (sortConfig.direction === "asc" ? "\u25B2" : "\u25BC") : "\u21C5"}
    </span>
  );

  return (
    <>
      <div className="mt-6 bg-white rounded-2xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">User Story List</h2>
          <PermissionGuard resource="UserStory" action="Create">
            <button
              onClick={() => navigate("/user-stories/new")}
              className="px-4 py-2 rounded-2xl bg-[var(--color-accent,#16a34a)] text-white hover:opacity-90"
            >
              + Create User Story
            </button>
          </PermissionGuard>
        </div>

        {/* ==== FILTER SECTION ==== */}
        <div className="flex gap-4 mb-4">
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

          <select
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className={`border px-3 py-2 rounded-lg text-sm transition-colors ${
              !filterType ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700"
            }`}
            disabled={!filterType}
          >
            <option value="">Select value</option>
            {filterType === "status" &&
              statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
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
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2">User Story Name</th>
                  <th className="px-4 py-2">Hashtag</th>
                  <th className="px-4 py-2">Due Date <SortIcon field="expire_date" /></th>
                  <th className="px-4 py-2">Total Points <SortIcon field="total_points" /></th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStories.map((s) => {
                  const currentStatus = statuses.find(
                    (st) => st.id === (selectedStatus[s.id] ?? s.status_id)
                  );
                  const isDone =
                    (currentStatus?.name || "").trim().toLowerCase() === "done";

                  return (
                    <tr
                      key={s.id}
                      className={`border-t hover:bg-gray-50 transition ${
                        isDone ? "bg-emerald-50" : ""
                      }`} // ✅ thêm nền xanh lá nhạt
                    >
                      <td
                        className="px-4 py-2 cursor-pointer text-emerald-700 font-medium hover:underline break-words whitespace-normal max-w-[240px]"
                        onClick={() => navigate(`/user-stories/${s.id}`)}
                      >
                        {s.name || "(No name)"}
                      </td>

                      <td className="px-4 py-2">
                        {s.hashtags?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {s.hashtags.map((h) => (
                              <span
                                key={h.hashtag.id}
                                className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded"
                              >
                                #{h.hashtag.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">No hashtags</span>
                        )}
                      </td>

                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col items-start">
                          <div className="text-xs font-medium text-gray-700 mb-1">
                            {formatDate(s.expire_date)}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${
                                s.dueInfo.label.toLowerCase().includes("overdue")
                                  ? "text-red-600"
                                  : s.dueInfo.label.toLowerCase().includes("priority")
                                  ? "text-amber-600"
                                  : s.dueInfo.label.toLowerCase().includes("upcoming")
                                  ? "text-sky-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {s.dueInfo.label}
                            </span>
                            {s.dueInfo.diffDays !== null && (
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {describeDiffDays(s.dueInfo.diffDays)}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-2 font-semibold text-gray-800">
                        {s.total_points ?? 0} pts
                      </td>

                      <td className="px-4 py-2">
                        <select
                          value={
                            selectedStatus[s.id] !== undefined
                              ? selectedStatus[s.id]
                              : s.status_id || ""
                          }
                          onChange={(e) =>
                            handleStatusChange(s.id, Number(e.target.value))
                          }
                          disabled={isDone}
                          className={`border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)] ${
                            isDone
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {statuses.map((st) => (
                            <option
                              key={st.id}
                              value={st.id}
                              disabled={!isDone && st.name.trim().toLowerCase() === "done"}
                            >
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-4 py-2 text-center">
                        <PermissionGuard resource="UserStory" action="Edit">
                          <button
                            onClick={() => navigate(`/user-stories/${s.id}/edit`)}
                            disabled={isDone}
                            className={`px-3 py-1 text-xs rounded-lg transition ${
                              isDone
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                            }`}
                          >
                            Edit
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStories.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">No user stories found.</p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default withPermissions(UserStoryList);
