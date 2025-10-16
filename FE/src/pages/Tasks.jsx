import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import MainLayout from "../layouts/MainLayout";
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

  useEffect(() => {
    setLoadingStatuses(true);
    TaskStatusService.getAll()
      .then((res) => setStatuses(res.data || []))
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

    setLoading(true);
    TaskService.getByProject(currentProject.id)
      .then((res) => setTasks(res.data || []))
      .catch((err) => {
        console.error("Can't task", err);
        toast.error("Can't loading task list");
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
      toast.error(err.response?.data?.error || "Can't update task status");
    }
  };

  const enhancedTasks = useMemo(() => {
    return (tasks || [])
      .map((task) => {
        const dueInfo = evaluateDueDate(task.due_date);
        const assigneeList = Array.isArray(task.assignees)
          ? task.assignees
          : task.assignee
          ? [task.assignee]
          : [];
        return {
          ...task,
          dueInfo,
          assigneeList,
        };
      })
      .sort((a, b) => {
        if (a.dueInfo.level !== b.dueInfo.level) {
          return a.dueInfo.level - b.dueInfo.level;
        }
        if (a.dueInfo.dueDate && b.dueInfo.dueDate) {
          return a.dueInfo.dueDate.valueOf() - b.dueInfo.dueDate.valueOf();
        }
        if (a.dueInfo.dueDate) return -1;
        if (b.dueInfo.dueDate) return 1;
        return (a.id || 0) - (b.id || 0);
      });
  }, [tasks]);

  const handleOpenTask = (taskId) => {
    if (!taskId) return;
    navigate(`/tasks/${taskId}`);
  };

  return (
    <MainLayout>
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
            {loading ? (
              <div className="text-gray-500">Loading task list...</div>
            ) : tasks.length === 0 ? (
              <div className="text-gray-500">This project does not have any tasks yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Task</th>
                      <th className="px-4 py-2">User Story</th>
                      <th className="px-4 py-2">Assignee</th>
                      <th className="px-4 py-2">Deadline</th>
                      <th className="px-4 py-2">Prioritize </th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enhancedTasks.map((task) => {
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
                                {task.assigneeList.map((assignee) => (
                                  <div
                                    key={`task-${task.id}-assignee-${assignee.team_id || assignee.user_id || assignee.user_email}`}
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
                            {task.dueInfo.dueDisplay}
                          </td>
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
                                (task.status || "").toUpperCase() === "DONE" // KHÓA NẾU DONE
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
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
