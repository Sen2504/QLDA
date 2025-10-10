import { useEffect, useState } from "react";
import TaskStatusService from "../services/taskStatusService";

export default function TaskFormModal({ onClose, onSubmit, teamMembers, userStoryId }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status_id: "",
    team_ids: [], // mảng id của team members được chọn
    due_date: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    TaskStatusService.getAll()
      .then((res) => {
        if (!mounted) return;
        const data = res.data || [];
        setStatuses(data);

        if (data.length) {
          // nếu chưa có status_id thì set mặc định là cái đầu tiên
          setForm((f) => ({ ...f, status_id: f.status_id || String(data[0].id) }));
        }
      })
      .catch((e) => console.error("Load task statuses error:", e))
      .finally(() => mounted && setLoadingStatuses(false));

    return () => {
      mounted = false;
    };
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleTeam = (teamId) => {
    setForm((prev) => {
      const exists = prev.team_ids.includes(teamId);
      return {
        ...prev,
        team_ids: exists ? prev.team_ids.filter((id) => id !== teamId) : [...prev.team_ids, teamId],
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.status_id || !form.team_ids.length) {
      alert("Vui lòng nhập tên, mô tả, chọn trạng thái và ít nhất 1 người thực hiện.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim(),
        user_story_id: Number(userStoryId),
        status_id: Number(form.status_id),
        team_ids: form.team_ids.map(Number),
        due_date: form.due_date ? form.due_date : null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-[520px] max-w-[92vw] p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tạo task mới</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Tên task */}
        <label className="block text-sm mb-1">Tên task</label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className="border rounded-lg w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Nhập tên task..."
        />

        {/* Mô tả */}
        <label className="block text-sm mb-1">Mô tả</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          className="border rounded-lg w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="Mô tả chi tiết..."
        />

        {/* Hạn chót */}
        <label className="block text-sm mb-1">Ngày hết hạn</label>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={handleChange}
          className="border rounded-lg w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        {/* Dropdown */}
        <div className="grid grid-cols-2 gap-3">
          {/* Trạng thái */}
          <div>
            <label className="block text-sm mb-1">Trạng thái</label>
            <select
              name="status_id"
              value={form.status_id}
              onChange={handleChange}
              className="border rounded-lg w-full p-2"
              disabled={loadingStatuses}
            >
              {loadingStatuses && <option>Đang tải...</option>}
              {!loadingStatuses && statuses.length === 0 && <option value="">Chưa có dữ liệu</option>}
              {!loadingStatuses &&
                statuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name_status || st.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Người thực hiện (nhiều người) */}
          <div>
            <label className="block text-sm mb-1">Người thực hiện</label>
            <div className="border rounded-lg p-2 max-h-40 overflow-auto space-y-1">
              {(!teamMembers || !teamMembers.length) && (
                <div className="text-xs text-gray-500">Chưa có thành viên.</div>
              )}
              {teamMembers.map((m) => {
                const id = m.team_id || m.id; // phòng trường hợp API trả khác
                const checked = form.team_ids.includes(id);
                return (
                  <label key={id} className="flex items-center gap-2 text-sm cursor-pointer select-none">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={checked}
                      onChange={() => toggleTeam(id)}
                    />
                    <span>{m.user_email || m.email} ({m.role_name || m.role})</span>
                  </label>
                );
              })}
            </div>
            {form.team_ids.length > 0 && (
              <div className="text-xs text-emerald-600 mt-1">Đã chọn {form.team_ids.length} thành viên</div>
            )}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-800"
            type="button"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loadingStatuses}
            className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
            type="button"
          >
            {submitting ? "Đang tạo..." : "Tạo task"}
          </button>
        </div>
      </div>
    </div>
  );
}
