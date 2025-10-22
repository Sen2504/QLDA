import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import { useProject } from "../store/ProjectContext";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";

export default function Tasks() {
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [hashtagFilter, setHashtagFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [sortBy, setSortBy] = useState("deadlineAsc");
  
  // useRef để chặn duplicate calls
  const statusesFetchedRef = useRef(false);
  const tasksFetchedProjectIdRef = useRef(null);

  useEffect(() => {
    // Chặn cứng - chỉ fetch statuses 1 lần
    if (statusesFetchedRef.current) return;
    statusesFetchedRef.current = true;
    
    setLoadingStatuses(true);
    TaskStatusService.getAll()
      .then((res) => {
        setStatuses(res.data || []);
      })
      .catch((err) => {
        console.error("Can't loading status of task", err);
        toast.error("Can't loading status task list");
      })
      .finally(() => setLoadingStatuses(false));
  }, []);

  useEffect(() => {
    if (!currentProject?.id) {
      setTasks([]);
      return;
    }
    
    // Chặn cứng - nếu đã fetch project này rồi → skip
    if (tasksFetchedProjectIdRef.current === currentProject.id) {
      return;
    }
    tasksFetchedProjectIdRef.current = currentProject.id;

    setLoading(true);
    TaskService.getByProject(currentProject.id)
      .then((res) => {
        setTasks(res.data || []);
      })
      .catch(async (err) => {
        const status = err?.response?.status;
        if (status === 403) {
          try {
            const mine = await TaskService.getMineByProject(currentProject.id);
            setTasks(mine.data || []);
            return;
          } catch (e2) {
            // fall through
          }
        }
        console.error("Không tải được task", err);
        if (status !== 403) {
          toast.error("Không tải được danh sách task");
        }
      })
      .finally(() => setLoading(false));
  }, [currentProject?.id]);

  const statusMap = useMemo(() => {
    const map = new Map();
    statuses.forEach((status) => {
      map.set(String(status.id), status.name_status || status.name);
    });
    return map;
  }, [statuses]);

  const handleClearFilters = () => {
    setStatusFilter("");
    setHashtagFilter("");
    setAssigneeFilter("");
    setSortBy("deadlineAsc");
  };

  const getAssigneeKey = (assignee) => {
    if (!assignee) return "";
    if (assignee.team_id) return `team-${assignee.team_id}`;
    if (assignee.user_id) return `user-${assignee.user_id}`;
    if (assignee.user_email) return `email-${assignee.user_email}`;
    if (assignee.email) return `email-${assignee.email}`;
    return "";
  };

  const cycleSort = () => {
    setSortBy((prev) => (prev === "deadlineAsc" ? "deadlineDesc" : "deadlineAsc"));
  };

  const handleStatusChange = async (taskId, statusId) => {
    try {
      await TaskService.update(taskId, { status_id: statusId });
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId
            ? {
                ...task,
                status_id: statusId,
                status: statusMap.get(String(statusId)) || task.status,
              }
            : task
        )
      );
      toast.success("Update task status");
    } catch (err) {
      const status = err?.response?.status;
      if (status !== 403) {
        toast.error(err.response?.data?.error || "Can't update task status");
      }
    }
  };

  const enrichedTasks = useMemo(() => {
    return (tasks || []).map((task) => {
      const dueInfo = evaluateDueDate(task.due_date) || {};
      const assigneeList = Array.isArray(task.assignees)
        ? task.assignees
        : task.assignee
        ? [task.assignee]
        : [];
      const rawHashtags = Array.isArray(task.hashtags)
        ? task.hashtags
        : Array.isArray(task.task_hashtags)
        ? task.task_hashtags
        : [];
      const hashtagList = rawHashtags
        .map((tag) => {
          if (!tag) return null;
          if (typeof tag === "string") {
            const cleaned = tag.replace(/^#/, "");
            return { id: cleaned, name: cleaned };
          }
          const id =
            tag.id ?? tag.hashtag_id ?? tag.name ?? tag.title ?? undefined;
          const name = tag.name || tag.title || tag.label || tag.value || "";
          if (!name) return null;
          return { id, name };
        })
        .filter((tag) => tag);

      return {
        ...task,
        dueInfo,
        assigneeList,
        hashtagList,
      };
    });
  }, [tasks]);

  const availableHashtags = useMemo(() => {
    const map = new Map();
    enrichedTasks.forEach((task) => {
      (task.hashtagList || []).forEach((tag) => {
        if (!tag) return;
        const key = tag.id !== undefined && tag.id !== null ? String(tag.id) : tag.name;
        if (!key) return;
        if (!map.has(key)) {
          map.set(key, tag.name);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [enrichedTasks]);

  const availableAssignees = useMemo(() => {
    const map = new Map();
    enrichedTasks.forEach((task) => {
      task.assigneeList.forEach((assignee) => {
        const key = getAssigneeKey(assignee);
        if (!key || map.has(key)) return;
        const label =
          assignee.user_name ||
          assignee.name ||
          assignee.user_email ||
          assignee.email ||
          "Ẩn danh";
        map.set(key, label);
      });
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [enrichedTasks]);

  const sortLabel = useMemo(() => (sortBy === "deadlineDesc" ? "Deadline ↓" : "Deadline ↑"), [sortBy]);

  const filteredTasks = useMemo(() => {
    const compareDeadlineAsc = (a, b) => {
      const aDate = a.dueInfo.dueDate ? a.dueInfo.dueDate.valueOf() : null;
      const bDate = b.dueInfo.dueDate ? b.dueInfo.dueDate.valueOf() : null;
      if (aDate === null && bDate === null) return (a.id || 0) - (b.id || 0);
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return aDate - bDate;
    };

    const compareDeadlineDesc = (a, b) => {
      const aDate = a.dueInfo.dueDate ? a.dueInfo.dueDate.valueOf() : null;
      const bDate = b.dueInfo.dueDate ? b.dueInfo.dueDate.valueOf() : null;
      if (aDate === null && bDate === null) return (b.id || 0) - (a.id || 0);
      if (aDate === null) return 1;
      if (bDate === null) return -1;
      return bDate - aDate;
    };

    let result = enrichedTasks;
    if (statusFilter) {
      result = result.filter((task) => String(task.status_id) === statusFilter);
    }
    if (hashtagFilter) {
      result = result.filter((task) =>
        task.hashtagList.some((tag) => {
          const key = tag.id !== undefined && tag.id !== null ? String(tag.id) : tag.name;
          return key === hashtagFilter;
        })
      );
    }
    if (assigneeFilter) {
      result = result.filter((task) =>
        task.assigneeList.some((assignee) => getAssigneeKey(assignee) === assigneeFilter)
      );
    }

    const sorted = [...result];
    if (sortBy === "deadlineDesc") {
      sorted.sort(compareDeadlineDesc);
    } else {
      sorted.sort(compareDeadlineAsc);
    }

    return sorted;
  }, [enrichedTasks, statusFilter, hashtagFilter, assigneeFilter, sortBy]);

  const hasActiveFilters = Boolean(
    statusFilter || hashtagFilter || assigneeFilter || sortBy !== "deadlineAsc"
  );

  const handleOpenTask = (taskId) => {
    if (!taskId) return;
    navigate(`/tasks/${taskId}`);
  };

  return (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Task list</h1>
          {currentProject && (
            <div className="text-sm text-gray-600">
              Project: <span className="font-medium">{currentProject.name}</span>
            </div>
          )}
        </div>

        {!currentProject && (
          <div className="text-gray-600 bg-white rounded-xl border p-6">
            Select a project in the left bar to see the task list.
          </div>
        )}

        {currentProject && (
          <div className="bg-white rounded-2xl shadow p-5">
            <div className="flex flex-wrap items-end gap-3 mb-4">
              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="mt-1 border rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[180px]"
                >
                  <option value="">All statuses</option>
                  {statuses.map((status) => (
                    <option key={status.id} value={String(status.id)}>
                      {status.name_status || status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Hashtag
                </label>
                <select
                  value={hashtagFilter}
                  onChange={(e) => setHashtagFilter(e.target.value)}
                  className="mt-1 border rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[180px]"
                  disabled={availableHashtags.length === 0}
                >
                  <option value="">All hashtags</option>
                  {availableHashtags.map((tag) => (
                    <option key={tag.id} value={String(tag.id)}>
                      #{tag.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Assignee
                </label>
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="mt-1 border rounded-lg px-3 py-2 text-sm text-gray-700 min-w-[200px]"
                  disabled={availableAssignees.length === 0}
                >
                  <option value="">All assignees</option>
                  {availableAssignees.map((assignee) => (
                    <option key={assignee.value} value={assignee.value}>
                      {assignee.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleClearFilters}
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
              <div className="text-gray-500">Loading task list...</div>
            ) : tasks.length === 0 ? (
              <div className="text-gray-500">This project does not have any tasks yet.</div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={cycleSort}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-semibold uppercase text-gray-600 shadow-sm hover:border-emerald-200 hover:text-emerald-600"
                    title="Cycle through sorting by priority and deadline"
                  >
                    Sort
                    <span className="text-sm">{sortLabel}</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Task</th>
                      <th className="px-4 py-2">User Story</th>
                      <th className="px-4 py-2">Assignee</th>
                      <th className="px-4 py-2">Hashtags</th>
                      <th className="px-4 py-2">Deadline</th>
                      <th className="px-4 py-2">Prioritize </th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-6 text-center text-sm text-gray-500"
                        >
                          No tasks match the current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task) => {
                        const selectValue =
                          task.status_id !== undefined && task.status_id !== null
                            ? String(task.status_id)
                            : "";
                        const rowClass = [
                          "border-t",
                          "hover:bg-gray-50",
                          task.dueInfo.rowClass,
                        ]
                          .filter(Boolean)
                          .join(" ");
                        return (
                          <tr key={task.id} className={rowClass}>
                            <td className="px-4 py-2 font-medium text-gray-900">
                              <button
                                type="button"
                                onClick={() => handleOpenTask(task.id)}
                                className="text-left text-gray-900 hover:text-emerald-600"
                              >
                                #{task.id} {task.name}
                              </button>
                            </td>
                            <td className="px-4 py-2">
                              {task.user_story?.name || task.user_story?.title || "—"}
                            </td>
                            <td className="px-4 py-2">
                              {task.assigneeList.length > 0 ? (
                                <div className="space-y-1">
                                  {task.assigneeList.map((assignee, idx) => (
                                    <div
                                      key={`task-${task.id}-assignee-${getAssigneeKey(assignee) || idx}`}
                                      className="text-xs text-gray-700"
                                    >
                                      {assignee.user_name || assignee.name || assignee.user_email || assignee.email || "Ẩn danh"}
                                      {assignee.role_name && (
                                        <span className="ml-1 text-gray-400">
                                          ({assignee.role_name})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Not assigned</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {task.hashtagList.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {task.hashtagList.map((tag) => (
                                    <span
                                      key={`task-${task.id}-hashtag-${tag.id || tag.name}`}
                                      className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
                                    >
                                      #{tag.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2">{task.dueInfo.dueDisplay}</td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${task.dueInfo.badgeClass}`}
                                >
                                  {task.dueInfo.label}
                                </span>
                                {task.dueInfo.diffDays !== null && (
                                  <span className="text-xs text-gray-500">
                                    {describeDiffDays(task.dueInfo.diffDays)}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              <select
                                value={selectValue}
                                onChange={(e) => {
                                  const parsed = Number(e.target.value);
                                  if (Number.isNaN(parsed)) return;
                                  handleStatusChange(task.id, parsed);
                                }}
                                disabled={
                                  loadingStatuses ||
                                  (task.status || "").toUpperCase() === "DONE"
                                }
                                className={`border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)] ${
                                  (task.status || "").toUpperCase() === "DONE"
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : ""
                                }`}
                              >
                                <option value="" disabled>
                                  {loadingStatuses ? "Loading..." : "Choose status"}
                                </option>
                                {statuses.map((status) => (
                                  <option key={status.id} value={status.id}>
                                    {status.name_status || status.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
