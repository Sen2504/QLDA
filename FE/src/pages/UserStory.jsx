import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import HashtagService from "../services/hashtagService";
import WorkflowStatusService from "../services/workflowStatusService";

// util nhỏ: debounce
function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function UserStory() {
  const { currentProject } = useProject();
  const navigate = useNavigate();

  // ---- left column
  const [name, setName] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [description, setDescription] = useState("");

  // hashtags + gợi ý
  const [tagInput, setTagInput] = useState("");
  const debouncedTagInput = useDebounce(tagInput, 200);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const tagBoxRef = useRef(null);

  // uploader
  const [files, setFiles] = useState([]);
  const inputFileRef = useRef(null);
  const onDropZone = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  };

  // ---- right column
  const [statuses, setStatuses] = useState([{ id: 0, name: "New" }]);
  const [statusId, setStatusId] = useState(null);

  const [complexityOptions, setComplexityOptions] = useState([]);
  // state điểm chọn: { UX: 3, FE: 5, ... }
  const [complexities, setComplexities] = useState({});

  // tổng điểm (nếu muốn)
  const totalPoints = useMemo(
    () => Object.values(complexities).reduce((a, b) => a + (Number(b) || 0), 0),
    [complexities]
  );

  // ---- effects: load dropdown & options
  useEffect(() => {
    WorkflowStatusService.getAll().then((data) => {
      setStatuses(data);
      const def = data.find((s) => s.name?.toLowerCase() === "new") || data[0];
      setStatusId(def?.id ?? null);
    });

    UserStoryService.getComplexityOptions().then((opts) => {
      setComplexityOptions(opts);
      const init = {};
      opts.forEach((o) => (init[o.name] = 0));
      setComplexities(init);
    });
  }, []);


  // gợi ý hashtag
  useEffect(() => {
    const q = debouncedTagInput.trim();
    if (!q) {
      setTagSuggestions([]);
      return;
    }
    HashtagService.search(q)
      .then((res) => setTagSuggestions(res.data || []))
      .catch(() => setTagSuggestions([]));
  }, [debouncedTagInput]);

  // click ngoài để đóng suggestion
  useEffect(() => {
    const onDocClick = (e) => {
      if (!tagBoxRef.current) return;
      if (!tagBoxRef.current.contains(e.target)) setShowSuggest(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ---- handlers
  const addTag = (t) => {
    const val = (t || "").trim();
    if (!val) return;
    if (!selectedTags.some((x) => x.toLowerCase() === val.toLowerCase())) {
      setSelectedTags((prev) => [...prev, val]);
    }
    setTagInput("");
    setTagSuggestions([]);
  };
  const removeTag = (name) =>
    setSelectedTags((prev) => prev.filter((t) => t !== name));

  const handleFileInput = (e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) setFiles((prev) => [...prev, ...chosen]);
  };
  const removeFile = (idx) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const setPoint = (roleName, point) =>
    setComplexities((prev) => ({ ...prev, [roleName]: Number(point) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProject) {
      alert("Chưa chọn Project.");
      return;
    }
    if (!name.trim()) {
      alert("Vui lòng nhập tên User Story.");
      return;
    }
    if (!expireDate) {
      alert("Vui lòng chọn ngày hết hạn.");
      return;
    }

    // build payload
    const formData = new FormData();
    formData.append("Name_story", name.trim());
    formData.append("Description", description);
    formData.append("Expire_date", expireDate);
    formData.append("Project_id", currentProject.id);
    if (statusId) formData.append("Status_id", statusId);

    // hashtags (mảng string)
    formData.append("hashtags", JSON.stringify(selectedTags));

    // complexities (mảng object {name, point} — đúng BE của bạn)
    const compArray = Object.entries(complexities)
      .filter(([, p]) => p !== null && p !== undefined) // có thể = 0
      .map(([name, point]) => ({ name, point }));
    formData.append("complexities", JSON.stringify(compArray));

    files.forEach((f) => formData.append("files", f));

    await UserStoryService.create(formData);
    navigate("/user-stories");
  };

  // ---- UI
  return (
    <MainLayout>
      <form onSubmit={handleSubmit} className="p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-6">New user story</h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: 2/3 width */}
          <div className="xl:col-span-2 space-y-5">
            {/* Subject + Due date */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Subject"
                className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="date"
                className="w-44 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                title="Ngày hết hạn"
              />
            </div>

            {/* Hashtags with suggestions */}
            <div ref={tagBoxRef}>
              <div className="border rounded px-3 py-2 bg-white">
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded"
                    >
                      #{t}
                      <button
                        type="button"
                        className="text-green-700/70 hover:text-green-900"
                        onClick={() => removeTag(t)}
                        aria-label={`Remove ${t}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setShowSuggest(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Enter tag"
                    className="min-w-[160px] flex-1 outline-none"
                  />
                </div>
              </div>

              {showSuggest && tagSuggestions.length > 0 && (
                <div className="mt-1 max-h-56 overflow-auto border rounded bg-white shadow z-10">
                  {tagSuggestions.map((h) => (
                    <button
                      type="button"
                      key={h.id ?? h.name}
                      className="w-full text-left px-3 py-2 hover:bg-green-50"
                      onClick={() => addTag(h.name)}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <textarea
                placeholder="Please add descriptive text to help others better understand this user story"
                rows={8}
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Attachments — drag & drop */}
            <div className="border rounded">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                <span className="font-medium text-gray-700">
                  {files.length} Attachments
                </span>
                <button
                  type="button"
                  className="rounded bg-teal-400 hover:bg-teal-500 text-white px-2 py-1"
                  onClick={() => inputFileRef.current?.click()}
                  title="Add"
                >
                  +
                </button>
                <input
                  ref={inputFileRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              <div
                className="p-6 text-center text-gray-500 border-dashed border-2 border-gray-300 rounded-b cursor-pointer"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDrop={onDropZone}
                onClick={() => inputFileRef.current?.click()}
              >
                Drop attachments here!
              </div>

              {files.length > 0 && (
                <ul className="divide-y">
                  {files.map((f, i) => (
                    <li
                      key={`${f.name}-${i}`}
                      className="flex items-center justify-between px-4 py-2 text-sm"
                    >
                      <span className="truncate">{f.name}</span>
                      <button
                        type="button"
                        className="text-red-600 hover:underline"
                        onClick={() => removeFile(i)}
                      >
                        remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* RIGHT: 1/3 width */}
          <div className="space-y-5">
            {/* Status dropdown */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2 bg-slate-700 text-white"
                value={statusId ?? ""}
                onChange={(e) => setStatusId(Number(e.target.value))}
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Complexity points */}
            <div className="border rounded">
              <div className="px-4 py-2 bg-gray-50 border-b font-medium text-gray-700">
                Points
              </div>
              <div className="p-3">
                <table className="w-full">
                  <tbody>
                    {complexityOptions.map((opt) => (
                      <tr key={opt.name} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 text-gray-700">{opt.name}</td>
                        <td className="py-2">
                          {Array.isArray(opt.points) && opt.points.length ? (
                            <select
                              className="border rounded px-2 py-1"
                              value={complexities[opt.name] ?? 0}
                              onChange={(e) => setPoint(opt.name, e.target.value)}
                            >
                              {opt.points.map((p) => (
                                <option key={`${opt.name}-${p}`} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              className="border rounded px-2 py-1 w-24"
                              value={complexities[opt.name] ?? 0}
                              onChange={(e) => setPoint(opt.name, e.target.value)}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-3 font-semibold text-gray-700">
                        total points
                      </td>
                      <td className="py-2 font-semibold">{totalPoints}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-teal-400 hover:bg-teal-500 text-white font-semibold py-2 rounded"
              >
                CREATE
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded border"
                onClick={() => navigate("/user-stories")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </MainLayout>
  );
}
