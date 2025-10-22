import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import TaskStatusService from "../services/taskStatusService";
import HashtagService from "../services/hashtagService";

export default function TaskFormModal({ onClose, onSubmit, teamMembers, userStoryId }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status_id: "",
    team_ids: [],
    due_date: "",
  });

  const [statuses, setStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Hashtag states
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);

  // ===== Load status =====
  useEffect(() => {
    let mounted = true;
    TaskStatusService.getAll()
      .then((res) => {
        if (!mounted) return;
        const data = res.data || [];
        setStatuses(data);
        if (data.length) {
          setForm((f) => ({
            ...f,
            status_id: f.status_id || String(data[0].id),
          }));
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
        team_ids: exists
          ? prev.team_ids.filter((id) => id !== teamId)
          : [...prev.team_ids, teamId],
      };
    });
  };

  // Hashtag handlers
  const handleHashtagSearch = async (query) => {
    if (!query.trim()) {
      setHashtagSuggestions([]);
      return;
    }
    try {
      const { data } = await HashtagService.search(query);
      setHashtagSuggestions(data || []);
    } catch (error) {
      console.error("Failed to search hashtags:", error);
    }
  };

  const handleAddHashtag = (hashtag) => {
    if (hashtags.some(h => h.id === hashtag.id)) {
      toast.warn("Hashtag already added.");
      return;
    }
    setHashtags(prev => [...prev, hashtag]);
    setHashtagInput("");
    setHashtagSuggestions([]);
  };

  const handleRemoveHashtag = (hashtagId) => {
    setHashtags(prev => prev.filter(h => h.id !== hashtagId));
  };

  const handleHashtagKeyDown = async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = hashtagInput.trim();
      
      if (!value) {
        toast.warn("Please enter a hashtag name.");
        return;
      }

      // Kiểm tra xem có trong suggestions không
      const existingInSuggestions = hashtagSuggestions.find(
        h => h.name.toLowerCase() === value.toLowerCase()
      );

      if (existingInSuggestions) {
        // Nếu có trong suggestions thì thêm luôn
        handleAddHashtag(existingInSuggestions);
      } else {
        // Nếu chưa có thì tạo mới
        try {
          const { data } = await HashtagService.create(value);
          if (data) {
            handleAddHashtag(data);
            toast.success("Created successfully!");
          }
        } catch (error) {
          console.error("Failed to create hashtag:", error);
          toast.error("Failed to create hashtag");
        }
      }
    }
  };

  // ===== Submit =====
  const handleSubmit = async () => {
    if (!form.name.trim() || !form.description.trim() || !form.status_id || !form.team_ids.length) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        user_story_id: Number(userStoryId),
        status_id: Number(form.status_id),
        team_ids: form.team_ids.map(Number),
        due_date: form.due_date || null,
        hashtag_ids: hashtags.map(h => h.id),
      };

      const result = await onSubmit(payload);

      // Nếu có lỗi, dừng lại (lỗi đã được hiển thị bởi api.js interceptor)
      if (result?.error) {
        return;
      }

      // Chỉ hiển thị success khi thực sự thành công
      toast.success("Task created successfully!");
      setTimeout(() => onClose(), 1800);
    } catch (err) {
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Failed to create task:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-[520px] max-w-[92vw] p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create new task</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Name */}
          <label className="block text-sm mb-1">Name task</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="border rounded-lg w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter task name..."
          />

          {/* Description */}
          <label className="block text-sm mb-1">Describe</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="border rounded-lg w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Describe this task..."
          />

          {/* Due date */}
          <label className="block text-sm mb-1">Expiration date</label>
          <input
            type="date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
            className="border rounded-lg w-full p-2 mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          {/* Hashtags */}
          <label className="block text-sm mb-1">Hashtags</label>
          <div className="mb-3">
            <div className="flex flex-wrap gap-2 mb-2">
              {hashtags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
                >
                  #{tag.name}
                  <button
                    onClick={() => handleRemoveHashtag(tag.id)}
                    className="hover:text-blue-900"
                    type="button"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => {
                  setHashtagInput(e.target.value);
                  handleHashtagSearch(e.target.value);
                }}
                onKeyDown={handleHashtagKeyDown}
                placeholder="Search or create hashtag..."
                className="border rounded-lg w-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {hashtagSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {hashtagSuggestions.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleAddHashtag(tag)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      type="button"
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              )}
              {hashtagInput.trim() && hashtagSuggestions.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                  <div className="px-3 py-2 text-sm text-gray-500">
                    Nhấn Enter để tạo hashtag mới: <span className="font-semibold text-blue-600">#{hashtagInput.trim()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status + Members */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Status</label>
              <select
                name="status_id"
                value={form.status_id}
                onChange={handleChange}
                className="border rounded-lg w-full p-2"
                disabled={loadingStatuses}
              >
                {loadingStatuses && <option>Loading...</option>}
                {!loadingStatuses && statuses.length === 0 && (
                  <option value="">No status yet</option>
                )}
                {!loadingStatuses &&
                  statuses.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name_status || st.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Implementer</label>
              <div className="border rounded-lg p-2 max-h-40 overflow-auto space-y-1">
                {(!teamMembers || !teamMembers.length) && (
                  <div className="text-xs text-gray-500">No members yet.</div>
                )}
                {teamMembers.map((m) => {
                  const id = m.team_id || m.id;
                  const checked = form.team_ids.includes(id);
                  return (
                    <label
                      key={id}
                      className="flex items-center gap-2 text-sm cursor-pointer select-none"
                    >
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={checked}
                        onChange={() => toggleTeam(id)}
                      />
                      <span>
                        {m.user_email || m.email} ({m.role_name || m.role})
                      </span>
                    </label>
                  );
                })}
              </div>
              {form.team_ids.length > 0 && (
                <div className="text-xs text-emerald-600 mt-1">
                  Selected {form.team_ids.length} member(s)
                </div>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-800"
              type="button"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || loadingStatuses}
              className="px-4 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              type="button"
            >
              {submitting ? "Creating..." : "Create task"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
