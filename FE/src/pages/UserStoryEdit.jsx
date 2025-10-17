import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import HashtagService from "../services/hashtagService";
import WorkflowStatusService from "../services/workflowStatusService";
import ComponentUpload from "../components/ComponentUpload";

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
  const { id } = useParams();
  const navigate = useNavigate();

  // ----- state cơ bản -----
  const [name, setName] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [description, setDescription] = useState("");

  // hashtags
  const [tagInput, setTagInput] = useState("");
  const debouncedTagInput = useDebounce(tagInput, 200);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const tagBoxRef = useRef(null);

  // files
  const [files, setFiles] = useState([]); // file mới upload
  const [existingFiles, setExistingFiles] = useState([]); // file cũ

  // statuses + complexities
  const [statuses, setStatuses] = useState([]);
  const [statusId, setStatusId] = useState(null);
  const [complexityOptions, setComplexityOptions] = useState([]);
  const [complexities, setComplexities] = useState({});

  const totalPoints = useMemo(
    () => Object.values(complexities).reduce((a, b) => a + (Number(b) || 0), 0),
    [complexities]
  );

  // Lock selecting Done manually unless already Done
  const isDone = useMemo(() => {
    const cur = statuses.find((s) => s.id === statusId);
    return (cur?.name || "").trim().toLowerCase() === "done";
  }, [statuses, statusId]);

  // ----- Load dữ liệu ban đầu -----
  useEffect(() => {
    if (!id) return;

    WorkflowStatusService.getAll().then((data) => setStatuses(data));

    Promise.all([
      UserStoryService.getComplexityOptions(currentProject?.id),
      UserStoryService.getById(id),
    ]).then(([opts, res]) => {
      setComplexityOptions(opts);
      const us = res.data;

      setName(us.name);
      setDescription(us.description || "");
      setExpireDate(us.expire_date?.substring(0, 10) || "");
      setStatusId(us.status_id);

      // hashtags
      if (us.hashtags) {
        setSelectedTags(us.hashtags.map((h) => h.hashtag.name));
      }

      // file cũ

      let fileArray = [];
      if (Array.isArray(us.evidence_file)) {
        // backend trả list thật
        fileArray = us.evidence_file;
      } else if (typeof us.evidence_file === "string" && us.evidence_file.trim()) {
        // backend trả string như "['a.jpg','b.png']" -> convert thành list
        try {
          fileArray = JSON.parse(us.evidence_file);
        } catch {
          // fallback: nếu JSON.parse fail (vì là list Python-style)
          fileArray = us.evidence_file
            .replace(/[\[\]']/g, "")
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
        }
      }

      setExistingFiles(
        fileArray.map((f, idx) => ({
          id: idx,
          filename: f,
          url: `/uploads/user_story/${us.id}/${f}`,
        }))
      );


      // điểm phức tạp
      const init = {};
      opts.forEach((o) => (init[o.name] = 0));
      if (us.complexity_points) {
        us.complexity_points.forEach((c) => {
          if (c.name in init) init[c.name] = c.point;
        });
      }
      setComplexities(init);
    });
  }, [id, currentProject]);

  // hashtags gợi ý
  useEffect(() => {
    const q = debouncedTagInput.trim();
    if (!q) return setTagSuggestions([]);
    HashtagService.search(q)
      .then((res) => setTagSuggestions(res.data || []))
      .catch(() => setTagSuggestions([]));
  }, [debouncedTagInput]);

  // click ngoài để đóng gợi ý
  useEffect(() => {
    const onDocClick = (e) => {
      if (!tagBoxRef.current) return;
      if (!tagBoxRef.current.contains(e.target)) setShowSuggest(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // ----- handlers -----
  const addTag = (t) => {
    const val = t.trim();
    if (!val) return;
    if (!selectedTags.includes(val)) setSelectedTags((prev) => [...prev, val]);
    setTagInput("");
    setTagSuggestions([]);
  };
  const removeTag = (t) =>
    setSelectedTags((prev) => prev.filter((x) => x !== t));

  const setPoint = (roleName, point) =>
    setComplexities((prev) => ({ ...prev, [roleName]: Number(point) }));

  const markDeleteExistingFile = (fid) =>
    setExistingFiles((prev) =>
      prev.map((f) => (f.id === fid ? { ...f, _deleted: !f._deleted } : f))
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProject) {
      toast.error("Chưa chọn Project.");
      return;
    }
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên User Story.");
      return;
    }

    const formData = new FormData();
    formData.append("Name_story", name.trim());
    formData.append("Description", description);
    formData.append("Expire_date", expireDate);
    formData.append("Project_id", currentProject.id);
    if (statusId) formData.append("Status_id", statusId);
    formData.append("hashtags", JSON.stringify(selectedTags));

    const compArray = Object.entries(complexities)
      .map(([name, point]) => ({ name, point }));
    formData.append("complexities", JSON.stringify(compArray));

    files.forEach((f) => formData.append("files", f));
    const deleted = existingFiles.filter((f) => f._deleted).map((f) => f.filename);
    formData.append("deleted_files", JSON.stringify(deleted));

    try {
      await UserStoryService.update(id, formData);
      toast.success("User Story updated successfully!");
      setTimeout(() => navigate("/user-stories"), 1500);
    } catch (err) {
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Failed to update user story:", err);
    }
  };

  // ----- UI -----
  return (
    <MainLayout>
      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 my-8"
      >
        <h1 className="text-3xl font-bold text-emerald-700 mb-8 text-center">
          Edit User Story
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            <div>
              <label className="text-gray-700 font-medium">Story Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter story title..."
              />
            </div>

            {/* Hashtags */}
            <div ref={tagBoxRef} className="relative">
              <label className="text-gray-700 font-medium">Hashtags</label>
              <div className="mt-2 border border-gray-300 rounded-lg shadow-sm px-3 py-2 flex flex-wrap gap-2 bg-white">
                {selectedTags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-sm font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      className="ml-1 text-emerald-600 hover:text-red-500"
                      onClick={() => removeTag(t)}
                    >
                      ✕
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
                  placeholder="Add a tag..."
                  className="flex-1 border-none outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
              {showSuggest && tagSuggestions.length > 0 && (
                <div className="absolute mt-1 w-full border border-gray-200 rounded-lg bg-white shadow-lg z-20 max-h-40 overflow-auto">
                  {tagSuggestions.map((h) => (
                    <button
                      key={h.id ?? h.name}
                      type="button"
                      className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-emerald-50"
                      onClick={() => addTag(h.name)}
                    >
                      #{h.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-gray-700 font-medium">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                placeholder="Briefly describe this user story..."
              />
            </div>

            {/* File upload component */}
            <div>
              <ComponentUpload
                files={files}
                setFiles={setFiles}
                existingFiles={existingFiles}
                setExistingFiles={setExistingFiles}
                label="Upload or manage files"
              />
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Due date */}
            <div>
              <label className="text-gray-700 font-medium">Due Date</label>
              <input
                type="date"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="text-gray-700 font-medium">Status</label>
              <select
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 bg-slate-700 text-white"
                value={statusId ?? ""}
                onChange={(e) => setStatusId(Number(e.target.value))}
              >
                {statuses.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    disabled={!isDone && ((s.name || "").trim().toLowerCase() === "done")}
                  >
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Complexity */}
            <div className="border rounded-lg shadow-sm">
              <div className="px-4 py-2 bg-gray-50 border-b font-medium text-gray-700">
                Complexity Points
              </div>
              <div className="p-3">
                <table className="w-full">
                  <tbody>
                    {complexityOptions.map((opt) => (
                      <tr key={opt.name} className="border-b last:border-b-0">
                        <td className="py-2 pr-3 text-gray-700">{opt.name}</td>
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
                      <td className="py-2 pr-3 font-semibold text-gray-700">
                        Total
                      </td>
                      <td className="py-2 font-semibold">{totalPoints}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-2 rounded-lg shadow hover:from-emerald-600 hover:to-green-700 transition"
              >
                SAVE CHANGES
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
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
