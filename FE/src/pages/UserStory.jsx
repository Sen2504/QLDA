import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import HashtagService from "../services/hashtagService";
import WorkflowStatusService from "../services/workflowStatusService";
import ComponentUpload from "../components/ComponentUpload";
import PopupMessage from "../components/Popup_message"; // ✅ popup thông báo

// === debounce nhỏ ===
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

  // hashtags
  const [tagInput, setTagInput] = useState("");
  const debouncedTagInput = useDebounce(tagInput, 200);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const tagBoxRef = useRef(null);

  // uploader
  const [files, setFiles] = useState([]);

  // ---- right column
  const [statuses, setStatuses] = useState([{ id: 0, name: "New" }]);
  const [statusId, setStatusId] = useState(null);
  const [complexityOptions, setComplexityOptions] = useState([]);
  const [complexities, setComplexities] = useState({});

  const totalPoints = useMemo(
    () => Object.values(complexities).reduce((a, b) => a + (Number(b) || 0), 0),
    [complexities]
  );

  // ✅ popup state
  const [popup, setPopup] = useState({ message: "", type: "", visible: false });

  const showPopup = (message, type = "success") => {
    setPopup({ message, type, visible: true });
    setTimeout(() => setPopup({ ...popup, visible: false }), 3000);
  };

  // ---- effects
  useEffect(() => {
    WorkflowStatusService.getAll().then((data) => {
      setStatuses(data);
      const def = data.find((s) => s.name?.toLowerCase() === "new") || data[0];
      setStatusId(def?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!currentProject) return;
    UserStoryService.getComplexityOptions(currentProject.id).then((opts) => {
      setComplexityOptions(opts);
      const init = {};
      opts.forEach((o) => (init[o.name] = 0));
      setComplexities(init);
    });
  }, [currentProject]);

  useEffect(() => {
    const q = debouncedTagInput.trim();
    if (!q) return setTagSuggestions([]);
    HashtagService.search(q)
      .then((res) => setTagSuggestions(res.data || []))
      .catch(() => setTagSuggestions([]));
  }, [debouncedTagInput]);

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

  const setPoint = (roleName, point) =>
    setComplexities((prev) => ({ ...prev, [roleName]: Number(point) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProject)
      return showPopup("Please select a project.", "error");
    if (!name.trim())
      return showPopup("Please enter the User Story name.", "error");
    if (!expireDate)
      return showPopup("Please select an expiration date.", "error");

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

    try {
      const res = await UserStoryService.create(formData);

      if (res?.error || res?.message) {
        showPopup(res.error || res.message, "error");
      } else {
        showPopup("User Story created successfully!", "success");
        setTimeout(() => navigate("/user-stories"), 1500);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Failed to create user story.";
      showPopup(msg, "error");
    }
  };

  // ---- UI
  return (
    <MainLayout>
      {popup.visible && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, visible: false })}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 my-8"
      >
        <h1 className="text-3xl font-bold text-emerald-700 mb-8 text-center">
          Create New User Story
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Title, hashtag, description, attachment */}
          <div className="space-y-6">
            <div>
              <label className="text-gray-700 font-medium">Story Title</label>
              <input
                type="text"
                placeholder="Enter story title..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
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
                placeholder="Briefly describe this user story..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Upload file */}
            <ComponentUpload
              files={files}
              setFiles={setFiles}
              label="Attachments"
            />
          </div>

          {/* RIGHT: status + complexity */}
          <div className="space-y-6">
            <div>
              <label className="text-gray-700 font-medium">Due Date</label>
              <input
                type="date"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Status</label>
              <select
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 bg-slate-700 text-white"
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
                          {Array.isArray(opt.points) && opt.points.length ? (
                            <select
                              className="border rounded px-2 py-1"
                              value={complexities[opt.name] ?? 0}
                              onChange={(e) =>
                                setPoint(opt.name, e.target.value)
                              }
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
                              onChange={(e) =>
                                setPoint(opt.name, e.target.value)
                              }
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 pr-3 font-semibold text-gray-700">
                        Total Points
                      </td>
                      <td className="py-2 font-semibold">{totalPoints}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-2 rounded-lg shadow hover:from-emerald-600 hover:to-green-700 transition"
              >
                CREATE
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
