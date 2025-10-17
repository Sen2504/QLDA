import { useState, useEffect, useMemo } from "react";
import TaskStatusService from "../services/taskStatusService";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";

export default function TaskTable({ tasks, onCreateClick, onStatusChange, onTaskClick, isUserStoryDone }) {
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});

  useEffect(() => {
    TaskStatusService.getAll()
      .then((res) => {
        setStatuses(res.data || []);
      })
      .catch((err) => {
        console.error("Error while loading state:", err);
      });
  }, []);

  const handleChange = (taskId, rawValue) => {
    const parsed = Number(rawValue);
    const nextStatusId = Number.isNaN(parsed) ? null : parsed;
    setSelectedStatus((prev) => ({ ...prev, [taskId]: nextStatusId }));
    if (onStatusChange && nextStatusId !== null) {
      onStatusChange(taskId, nextStatusId);
    }
  };

  const decoratedTasks = useMemo(
    () =>
      (tasks || []).map((task) => {
        const assignees = Array.isArray(task.assignees)
          ? task.assignees
          : task.assignee
          ? [task.assignee]
          : [];
        return {
          ...task,
          assignees,
          dueInfo: evaluateDueDate(task.due_date),
          // ✅ Thêm cờ check status done
          isDone:
            task.status?.toLowerCase?.() === "done" ||
            task.status?.toLowerCase?.() === "completed",
        };
      }),
    [tasks]
  );

  return (
    <div className="mt-6 bg-white rounded-2xl shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Task list</h2>

        {/* ✅ Disable nút Create Task nếu UserStory đã Done */}
        <button
          onClick={!isUserStoryDone ? onCreateClick : undefined}
          disabled={isUserStoryDone}
          className={`px-4 py-2 rounded-2xl text-white transition ${
            isUserStoryDone
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-[var(--color-accent,#16a34a)] hover:opacity-90"
          }`}
        >
          + Create task
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs uppercase bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Deadline</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Implementer</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {decoratedTasks.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => onTaskClick?.(t.id)}
                    className="text-left text-gray-800 hover:text-emerald-600"
                  >
                    {t.name}
                  </button>
                </td>

                <td className="px-4 py-2">{t.dueInfo.dueDisplay}</td>

                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${t.dueInfo.badgeClass}`}
                    >
                      {t.dueInfo.label}
                    </span>
                    {t.dueInfo.diffDays !== null && (
                      <span className="text-xs text-gray-500">
                        {describeDiffDays(t.dueInfo.diffDays)}
                      </span>
                    )}
                  </div>
                </td>

                <td className="px-4 py-2">
                  {t.assignees && t.assignees.length > 0 ? (
                    <div className="space-y-1">
                      {t.assignees.map((assignee) => (
                        <div
                          key={`assignee-${t.id}-${assignee.team_id}`}
                          className="text-xs text-gray-700"
                        >
                          {assignee.user_name ||
                            assignee.name ||
                            assignee.user_email ||
                            assignee.email ||
                            "Ẩn danh"}
                          {assignee.role_name && (
                            <span className="ml-1 text-gray-400">
                              ({assignee.role_name})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Not assigned yet</span>
                  )}
                </td>

                {/* ✅ Disable dropdown nếu task đã Done */}
                <td className="px-4 py-2">
                  <select
                    value={
                      selectedStatus[t.id] !== undefined
                        ? String(selectedStatus[t.id])
                        : t.status_id !== undefined && t.status_id !== null
                        ? String(t.status_id)
                        : ""
                    }
                    onChange={(e) => handleChange(t.id, e.target.value)}
                    disabled={t.isDone}
                    className={`border rounded-lg px-2 py-1 focus:outline-none focus:ring ${
                      t.isDone
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "focus:ring-[var(--color-accent,#16a34a)]"
                    }`}
                  >
                    <option value="">Choose status</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_status}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <p className="text-gray-500 text-sm mt-2">No task yet.</p>
      )}
    </div>
  );
}
