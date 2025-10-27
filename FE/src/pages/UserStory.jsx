import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import HashtagService from "../services/hashtagService";
import WorkflowStatusService from "../services/workflowStatusService";
import ComponentUpload from "../components/ComponentUpload";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const isDone = useMemo(() => {
    const cur = statuses.find((s) => s.id === statusId);
    return (cur?.name || "").trim().toLowerCase() === "done";
  }, [statuses, statusId]);

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
    
    if (isSubmitting) return; // Prevent double submission
    
    if (!currentProject) {
      toast.error("Please select a project.");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter the User Story name.");
      return;
    }
    if (!expireDate) {
      toast.error("Please select an expiration date.");
      return;
    }

    setIsSubmitting(true);

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
      
      // Kiểm tra response - chỉ hiển thị success toast
      if (res?.data) {
        toast.success("User Story created successfully!");
        setTimeout(() => navigate("/user-stories"), 1500);
      }
    } catch (err) {
      // API interceptor đã hiển thị toast.error, chỉ cần log và reset state
      console.error("Failed to create user story:", err);
      setIsSubmitting(false);
    }
  };

  // ---- UI (indigo–blue–sky theme)
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-sky-50 to-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="rounded-2xl shadow-2xl border border-sky-100 overflow-hidden bg-white backdrop-blur-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-4">
            {/* MAIN FORM */}
            <main className="lg:col-span-2 p-5 md:p-6 bg-gradient-to-br from-white to-sky-50/30">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                      New User Story
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">
                      Fill the fields below to create a user story.
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">
                    Story title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Allow users to export reports"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent bg-white transition"
                  />
                </div>

                {/* Hashtags */}
                <div ref={tagBoxRef} className="relative">
                  <label className="block text-xs font-semibold text-blue-700 mb-1">
                    Hashtags
                  </label>
                  <div className="w-full min-h-[40px] rounded-lg border border-sky-200 bg-gradient-to-r from-white to-sky-50/30 px-2 py-1.5 flex flex-wrap items-center gap-1.5 shadow-sm">
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-sky-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm"
                      >
                        #{t}
                        <button
                          type="button"
                          className="ml-1 text-white hover:text-red-200 font-bold"
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
                      placeholder="Search or press Enter"
                      className="flex-1 min-w-[120px] border-none outline-none text-slate-700 placeholder-blue-400 bg-transparent text-sm"
                    />
                  </div>

                  {showSuggest && tagSuggestions.length > 0 && (
                    <div className="absolute mt-1 w-full border border-sky-100 rounded-lg bg-white shadow-2xl z-30 max-h-40 overflow-auto">
                      {tagSuggestions.map((h) => (
                        <button
                          key={h.id ?? h.name}
                          type="button"
                          className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-sky-50 transition"
                          onClick={() => addTag(h.name)}
                        >
                          <span className="font-medium text-blue-600">
                            #{h.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-blue-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Short description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-sky-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white transition"
                  />
                </div>

                {/* Attachments */}
                <div>
                  <ComponentUpload
                    files={files}
                    setFiles={setFiles}
                    label="Attachments"
                  />
                </div>
              </form>
            </main>

            {/* SIDEBAR */}
            <aside className="p-5 md:p-6 border-l border-sky-100 lg:sticky lg:top-6 bg-gradient-to-b from-indigo-50/40 to-sky-50/40">
              <div className="space-y-4">
                <div className="rounded-lg border border-sky-200 p-3 bg-white shadow-sm">
                  <div className="text-xs font-semibold text-blue-700 mb-1">
                    Due date
                  </div>
                  <input
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="w-full rounded-lg border border-sky-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition"
                  />
                </div>

                <div className="rounded-lg border border-sky-200 p-3 bg-white shadow-sm">
                  <div className="text-xs font-semibold text-blue-700 mb-1">
                    Status
                  </div>
                  <select
                    className="w-full rounded-lg border border-sky-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 transition"
                    value={statusId ?? ""}
                    onChange={(e) => setStatusId(Number(e.target.value))}
                  >
                    {statuses.map((s) => (
                      <option
                        key={s.id}
                        value={s.id}
                        disabled={
                          !isDone &&
                          (s.name || "").trim().toLowerCase() === "done"
                        }
                      >
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-sky-200 p-3 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-semibold text-blue-700">
                      Complexity
                    </div>
                    <div className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-sky-600 bg-clip-text text-transparent">
                      {totalPoints}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {complexityOptions.map((opt) => (
                      <div
                        key={opt.name}
                        className="flex items-center justify-between p-1.5 rounded-md bg-gradient-to-r from-indigo-50/50 to-sky-50/50"
                      >
                        <div className="text-xs font-medium text-slate-700">
                          {opt.name}
                        </div>
                        <div>
                          {Array.isArray(opt.points) && opt.points.length ? (
                            <select
                              value={complexities[opt.name] ?? 0}
                              onChange={(e) =>
                                setPoint(opt.name, e.target.value)
                              }
                              className="rounded-lg border border-sky-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                            >
                              {opt.points.map((p) => (
                                <option
                                  key={`${opt.name}-${p}`}
                                  value={p}
                                >
                                  {p}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              value={complexities[opt.name] ?? 0}
                              onChange={(e) =>
                                setPoint(opt.name, e.target.value)
                              }
                              className="w-16 rounded-lg border border-sky-200 px-2 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    className={`inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg transition-all duration-200 text-sm ${
                      isSubmitting 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:shadow-xl hover:scale-[1.02]'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </>
                    ) : (
                      'Create Story'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/user-stories")}
                    className="text-sm text-slate-600 hover:text-blue-600 font-medium hover:underline transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
