import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import PermissionGuard from "../components/PermissionGuard";
import withPermissions from "../components/withPermissions";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";

function UserStoryList() {
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [stories, setStories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [availableHashtags, setAvailableHashtags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState({});
  const [filterType, setFilterType] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  
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
        const rawStories = resStories?.data || [];
        const decoratedStories = rawStories.map((story) => ({
          ...story,
          dueInfo: evaluateDueDate(story?.expire_date) || {},
        }));

        const hashtagMap = new Map();
        decoratedStories.forEach((story) => {
          (story.hashtags || []).forEach((wrapper) => {
            const tag = wrapper?.hashtag;
            if (!tag?.id) return;
            if (!hashtagMap.has(tag.id)) {
              hashtagMap.set(tag.id, tag);
            }
          });
        });

        setStories(decoratedStories);
        setStatuses(resStatuses || []);
        setAvailableHashtags(Array.from(hashtagMap.values()));
      })
      .catch((err) => {
        console.error("Lỗi khi tải User Stories:", err);
      })
      .finally(() => setLoading(false));
  }, [currentProject]);

  // ---- CẬP NHẬT TRẠNG THÁI ----
  const handleStatusChange = async (storyId, newStatusId) => {
    try {
      const fd = new FormData();
      // Backend expects "Status_id" (multipart/form-data)
      fd.append("Status_id", String(newStatusId));
      const response = await UserStoryService.update(storyId, fd);
      toast.success(response?.data?.message || "Update status successfully!");
      // Update both selection and stories list for consistency
      setSelectedStatus((prev) => ({ ...prev, [storyId]: newStatusId }));
      setStories((prev) => prev.map((s) => (s.id === storyId ? { ...s, status_id: newStatusId } : s)));
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
      toast.error(err?.response?.data?.error || "Failed to update status");
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const filteredStories = useMemo(() => {
    let data = [...stories];

    if (filterType && filterValue) {
      if (filterType === "status") {
        data = data.filter((story) => String(story.status_id) === filterValue);
      } else if (filterType === "hashtag") {
        data = data.filter((story) =>
          story.hashtags?.some((wrapper) => String(wrapper?.hashtag?.id) === filterValue)
        );
      }
    }

    if (sortConfig.key) {
      const { key, direction } = sortConfig;
      data.sort((a, b) => {
        let valA;
        let valB;

        if (key === "expire_date") {
          valA = a?.expire_date ? new Date(a.expire_date).getTime() : null;
          valB = b?.expire_date ? new Date(b.expire_date).getTime() : null;
          if (Number.isNaN(valA)) valA = null;
          if (Number.isNaN(valB)) valB = null;
        } else {
          valA = a?.[key];
          valB = b?.[key];
        }

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return direction === "asc" ? 1 : -1;
        if (valB === null || valB === undefined) return direction === "asc" ? -1 : 1;

        if (valA < valB) return direction === "asc" ? -1 : 1;
        if (valA > valB) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [stories, filterType, filterValue, sortConfig]);

  const toggleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortIcon = ({ field }) => (
    <span
      className="ml-1 cursor-pointer select-none text-xs"
      onClick={() => toggleSort(field)}
      title="Toggle sort"
    >
      {sortConfig.key === field ? (sortConfig.direction === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );

  const hasActiveFilters = Boolean(filterType || filterValue || sortConfig.key);

  const handleResetFilters = () => {
    setFilterType("");
    setFilterValue("");
    setSortConfig({ key: null, direction: "asc" });
  };

  // ---- UI ----
  return (
    <>
      <div className="mt-6 bg-white rounded-2xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            User Story List
          </h2>
          <PermissionGuard resource="UserStory" action="Create">
            <button
              onClick={() => navigate("/user-stories/new")}
              className="px-4 py-2 rounded-2xl bg-[var(--color-accent,#16a34a)] text-white hover:opacity-90"
            >
              + Create User Story
            </button>
          </PermissionGuard>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Filter by
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setFilterValue("");
              }}
              className="mt-1 border rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[160px]"
            >
              <option value="">All</option>
              <option value="status">Status</option>
              <option value="hashtag">Hashtag</option>
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Value
            </label>
            <select
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={!filterType}
              className={`mt-1 border rounded-lg px-3 py-2 text-sm min-w-[200px] ${
                filterType ? "text-gray-700" : "text-gray-400 bg-gray-100 cursor-not-allowed"
              }`}
            >
              <option value="">All</option>
              {filterType === "status" &&
                statuses.map((status) => (
                  <option key={status.id} value={String(status.id)}>
                    {status.name}
                  </option>
                ))}
              {filterType === "hashtag" &&
                availableHashtags.map((tag) => (
                  <option key={tag.id} value={String(tag.id)}>
                    #{tag.name}
                  </option>
                ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className={`ml-auto px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              hasActiveFilters
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Reset
          </button>
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
                  <th className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span>Due Date</span>
                      <SortIcon field="expire_date" />
                    </div>
                  </th>
                  <th className="px-4 py-2">
                    <div className="flex items-center gap-1">
                      <span>Total Points</span>
                      <SortIcon field="total_points" />
                    </div>
                  </th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStories.map((s) => {
                  const currentStatus = statuses.find((st) => st.id === (selectedStatus[s.id] ?? s.status_id));
                  const isDone = (currentStatus?.name || "").trim().toLowerCase() === "done";
                  const dueLabel = s.dueInfo?.label;
                  const diffDays = s.dueInfo?.diffDays;
                  return (
                    <tr
                      key={s.id}
                      className={`border-t hover:bg-gray-50 transition ${isDone ? "bg-emerald-50" : ""}`}
                    >
                      {/* Tên user story */}
                      <td
                        className="px-4 py-2 cursor-pointer text-emerald-700 font-medium hover:underline break-words whitespace-normal max-w-[240px]"
                        onClick={() => navigate(`/user-stories/${s.id}`)}
                      >
                        {s.name || "(No name)"}
                      </td>

                      {/* Hashtag */}
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
                          <span className="text-gray-400 text-xs italic">
                            No hashtags
                          </span>
                        )}
                      </td>

                      {/* Ngày hết hạn */}
                      <td className="px-4 py-2 align-top">
                        <div className="flex flex-col items-start">
                          <div className="text-xs font-medium text-gray-700 mb-1">
                            {formatDate(s.expire_date)}
                          </div>
                          {dueLabel && (
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <span className="font-semibold">
                                {dueLabel}
                              </span>
                              {diffDays !== null && diffDays !== undefined && (
                                <span>{describeDiffDays(diffDays)}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tổng điểm */}
                      <td className="px-4 py-2 font-semibold text-gray-800">
                        {s.total_points ?? 0} pts
                      </td>

                      {/* Trạng thái */}
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
                            isDone ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
                          }`}
                        >
                          {statuses.map((st) => (
                            <option
                              key={st.id}
                              value={st.id}
                              disabled={!isDone && (st.name || "").trim().toLowerCase() === "done"}
                            >
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Action */}
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
                            title={isDone ? "This User Story is Done." : "Edit User Story"}
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
              <p className="text-gray-500 text-sm mt-2">
                No user stories found.
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default withPermissions(UserStoryList);