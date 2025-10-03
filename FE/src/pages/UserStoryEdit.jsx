import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import HashtagService from "../services/hashtagService";
import WorkflowStatusService from "../services/workflowStatusService";

function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function UserStoryEdit() {
  const { currentProject } = useProject();
  const { id } = useParams(); // lấy id từ URL
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
  const [files, setFiles] = useState([]); // file mới upload
  const [existingFiles, setExistingFiles] = useState([]); // file đã có trong DB
  const inputFileRef = useRef(null);

  // ---- right column
  const [statuses, setStatuses] = useState([]);
  const [statusId, setStatusId] = useState(null);

  const [complexityOptions, setComplexityOptions] = useState([]);
  const [complexities, setComplexities] = useState({});

  const totalPoints = useMemo(
    () => Object.values(complexities).reduce((a, b) => a + (Number(b) || 0), 0),
    [complexities]
  );

  // ---- effects: load dữ liệu ban đầu
  useEffect(() => {
    if (!id) return;

    // load status list
    WorkflowStatusService.getAll().then((data) => {
      setStatuses(data);
    });

    // load cả options + story
    Promise.all([
    UserStoryService.getComplexityOptions(),
    UserStoryService.getById(id),
    ]).then(([opts, res]) => {
    setComplexityOptions(opts);

    const us = res.data;
    setName(us.name);
    setDescription(us.description || "");
    setExpireDate(us.expire_date?.substring(0, 10) || "");
    setStatusId(us.status_id);

    if (us.hashtags) {
        setSelectedTags(us.hashtags.map((h) => h.hashtag.name));
    }

    if (Array.isArray(us.evidence_file)) {
    setExistingFiles(
        us.evidence_file.map((f, idx) => ({
        id: idx,
        filename: f,
        url: `/uploads/user_story/${us.id}/${f}`,
        }))
    );
    } else {
        console.warn("us.evidence_file không phải array:", us.evidence_file);
        setExistingFiles([]);
    }

    // ---- fill complexities
    const init = {};
    opts.forEach((o) => (init[o.name] = 0)); // mặc định 0
    if (us.complexity_points) {
        us.complexity_points.forEach((c) => {
            if (c.name in init) {
                init[c.name] = c.point;
            }
        });
    }
    console.log("Options:", opts.map(o => o.name));
    console.log("User story points:", us.complexity_points);
    console.log("Init:", init);
    setComplexities(init);
    });
  }, [id]);

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
  const markDeleteExistingFile = (fid) =>
    setExistingFiles((prev) =>
      prev.map((f) => (f.id === fid ? { ...f, _deleted: true } : f))
    );

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

    formData.append("hashtags", JSON.stringify(selectedTags));

    const compArray = Object.entries(complexities)
      .filter(([, p]) => p !== null && p !== undefined)
      .map(([name, point]) => ({ name, point }));
    formData.append("complexities", JSON.stringify(compArray));

    files.forEach((f) => formData.append("files", f));

    // xoá file cũ
    const deleted = existingFiles.filter((f) => f._deleted).map((f) => f.filename);
    formData.append("deleted_files", JSON.stringify(deleted));

    await UserStoryService.update(id, formData);
    navigate("/user-stories");
  };

  // ---- UI
  return (
    <MainLayout>
      <form onSubmit={handleSubmit} className="p-6">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Chỉnh sửa user story
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="xl:col-span-2 space-y-5">
            {/* Subject + Due date */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Subject"
                className="flex-1 border rounded px-3 py-2"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="date"
                className="w-44 border rounded px-3 py-2"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
              />
            </div>

            {/* Hashtags */}
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
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onFocus={() => setShowSuggest(true)}
                    placeholder="Enter tag"
                    className="min-w-[160px] flex-1 outline-none"
                  />
                </div>
              </div>
              {showSuggest && tagSuggestions.length > 0 && (
                <div className="mt-1 border rounded bg-white shadow">
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
            <textarea
              rows={8}
              className="w-full border rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* Files */}
            <div className="border rounded">
              <div className="px-4 py-2 bg-gray-50 border-b font-medium text-gray-700">
                Files
              </div>
              <div className="p-3">
                {/* file cũ */}
                {existingFiles.map((f) => (
                  <div
                    key={f.id}
                    className={`flex items-center justify-between py-1 ${
                      f._deleted ? "line-through opacity-50" : ""
                    }`}
                  >
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline"
                    >
                      {f.filename}
                    </a>
                    {!f._deleted && (
                      <button
                        type="button"
                        className="text-red-600 text-sm"
                        onClick={() => markDeleteExistingFile(f.id)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                ))}

                {/* file mới */}
                {files.map((f, i) => (
                  <div key={i} className="flex justify-between py-1 text-sm">
                    {f.name}
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-red-600"
                    >
                      remove
                    </button>
                  </div>
                ))}

                <input
                  ref={inputFileRef}
                  type="file"
                  multiple
                  className="mt-2"
                  onChange={handleFileInput}
                />
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            {/* Status */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                className="w-full border rounded px-3 py-2"
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

            {/* Complexity */}
            <div className="border rounded">
              <div className="px-4 py-2 bg-gray-50 border-b font-medium text-gray-700">
                Points
              </div>
              <div className="p-3">
                <table className="w-full">
                  <tbody>
                    {complexityOptions.map((opt) => (
                      <tr key={opt.name} className="border-b last:border-b-0">
                        <td className="py-2 pr-3">{opt.name}</td>
                        <td className="py-2">
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
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-3 font-semibold">Total</td>
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
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 rounded"
              >
                SAVE
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
