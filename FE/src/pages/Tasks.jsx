import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";

export default function Tasks() {
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
        console.error("Không tải được trạng thái task", err);
        toast.error("Không tải được danh sách trạng thái task");
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
        console.error("Không tải được task", err);
        toast.error("Không tải được danh sách task");
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
      toast.success("Đã cập nhật trạng thái task");
    } catch (err) {
      toast.error(err.response?.data?.error || "Không thể cập nhật trạng thái task");
    }
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold text-gray-900">Task Center</h1>
          {currentProject && (
            <div className="text-sm text-gray-600">
              Project: <span className="font-medium">{currentProject.name}</span>
            </div>
          )}
        </div>

        {!currentProject && (
          <div className="text-gray-600 bg-white rounded-xl border p-6">
            Hãy chọn một project ở thanh bên trái để xem danh sách task.
          </div>
        )}

        {currentProject && (
          <div className="bg-white rounded-2xl shadow p-5">
            {loading ? (
              <div className="text-gray-500">Đang tải danh sách task...</div>
            ) : tasks.length === 0 ? (
              <div className="text-gray-500">Project này chưa có task nào.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-700">
                  <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-2">Task</th>
                      <th className="px-4 py-2">User Story</th>
                      <th className="px-4 py-2">Assignee</th>
                      <th className="px-4 py-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => {
                      const selectValue =
                        task.status_id !== undefined && task.status_id !== null
                          ? String(task.status_id)
                          : "";
                      return (
                        <tr key={task.id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2 font-medium text-gray-900">
                            #{task.id} {task.name}
                          </td>
                          <td className="px-4 py-2">
                            {task.user_story?.name || task.user_story?.title || "—"}
                          </td>
                          <td className="px-4 py-2">
                            {task.assignee?.user_email || "Chưa phân công"}
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={selectValue}
                              onChange={(e) => {
                                const parsed = Number(e.target.value);
                                if (Number.isNaN(parsed)) return;
                                handleStatusChange(task.id, parsed);
                              }}
                              disabled={loadingStatuses}
                              className="border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)]"
                            >
                              <option value="" disabled>
                                {loadingStatuses ? "Đang tải..." : "Chọn trạng thái"}
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
