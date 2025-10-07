import { useState, useEffect } from "react";
import TaskStatusService from "../services/taskStatusService";

export default function TaskTable({ tasks, onCreateClick, onStatusChange }) {
  const [statuses, setStatuses] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState({});

  useEffect(() => {
    TaskStatusService.getAll()
      .then((res) => {
        // Dữ liệu trả về từ BE có dạng [{ id, name_status }, ...]
        setStatuses(res.data || []);
      })
      .catch((err) => {
        console.error("Lỗi khi load trạng thái:", err);
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

  return (
    <div className="mt-6 bg-white rounded-2xl shadow p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Danh sách Task</h2>
        <button
          onClick={onCreateClick}
          className="px-4 py-2 rounded-2xl bg-[var(--color-accent,#16a34a)] text-white hover:opacity-90"
        >
          + Tạo task
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs uppercase bg-gray-100 text-gray-600">
            <tr>
              <th className="px-4 py-2">Tên task</th>
              <th className="px-4 py-2">Trạng thái</th>
              <th className="px-4 py-2">Người thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{t.name}</td>

                {/* Dropdown trạng thái lấy từ BE */}
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
                    className="border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)]"
                  >
                    <option value="">Chọn trạng thái</option>
                    {statuses.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name_status}
                      </option>
                    ))}
                  </select>
                </td>

                <td className="px-4 py-2">
                  {t.assignee?.user_email || "Chưa phân công"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length === 0 && (
        <p className="text-gray-500 text-sm mt-2">Chưa có task nào.</p>
      )}
    </div>
  );
}
