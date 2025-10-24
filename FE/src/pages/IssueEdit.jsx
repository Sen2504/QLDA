import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useProject } from "../store/ProjectContext";
import IssueService from "../services/issueService";
import IssueTypeService from "../services/issueTypeService";
import HashtagService from "../services/hashtagService";
import TeamService from "../services/teamService";
import ComponentUpload from "../components/ComponentUpload";

function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function IssueEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState("New");
  const [severity, setSeverity] = useState("Normal");
  const [priority, setPriority] = useState("Normal");

  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState([]);

  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const tagBoxRef = useRef(null);
  const debouncedTagInput = useDebounce(tagInput, 250);

  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState([]);

  const STATUS_OPTIONS = ["New", "In Progress", "Ready for test", "Closed", "Need Info", "Rejected", "Postponed"];
  const SEVERITY_OPTIONS = ["Wishlist", "Minor", "Normal", "Important", "Critical"];
  const PRIORITY_OPTIONS = ["Low", "Normal", "High"];

  // ---- LOAD INITIAL DATA ----
  useEffect(() => {
    if (!id) return;

    IssueTypeService.getAll()
      .then((res) => setTypes(res.data || []))
      .catch(() => setTypes([]));

    IssueService.getById(id)
      .then((res) => {
        const issue = res.data;
        setName(issue.name || "");
        setDescription(issue.description || "");
        setExpireDate(issue.expire_date?.substring(0, 10) || "");
        setTypeId(issue.type_id || "");
        setStatus(issue.status || "New");
        setSeverity(issue.severity || "Normal");
        setPriority(issue.priority || "Normal");

        if (issue.team_id) setSelectedTeamId(issue.team_id);

        if (Array.isArray(issue.hashtag)) {
          setSelectedTags(issue.hashtag);
        } else if (typeof issue.hashtag === "string" && issue.hashtag.trim()) {
          try {
            setSelectedTags(JSON.parse(issue.hashtag));
          } catch {
            const cleaned = issue.hashtag
              .replace(/[\[\]'"#]/g, "")
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean);
            setSelectedTags(cleaned);
          }
        } else setSelectedTags([]);

        let fileArray = [];
        if (Array.isArray(issue.evidence_file)) {
          fileArray = issue.evidence_file;
        } else if (typeof issue.evidence_file === "string" && issue.evidence_file.trim()) {
          try {
            fileArray = JSON.parse(issue.evidence_file);
          } catch {
            fileArray = issue.evidence_file
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
            url: `/uploads/issues/${issue.id}/${f}`,
          }))
        );
      })
      .catch((err) => console.error("Error loading issue:", err));
  }, [id]);

  useEffect(() => {
    if (!currentProject) return;
    TeamService.getByProjectId(currentProject.id)
      .then((res) => setTeamMembers(res.data || []))
      .catch((err) => console.error("Load team error:", err));
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
      if (tagBoxRef.current && !tagBoxRef.current.contains(e.target)) setShowSuggest(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const addTag = (t) => {
    const val = t.trim();
    if (!val) return;
    if (!selectedTags.includes(val)) setSelectedTags((prev) => [...prev, val]);
    setTagInput("");
    setTagSuggestions([]);
  };
  const removeTag = (t) => setSelectedTags((prev) => prev.filter((x) => x !== t));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentProject) return alert("Project not selected yet.");
    if (!name.trim()) return alert("Please enter an issue name.");

    const formData = new FormData();
    formData.append("project_id", currentProject.id);
    formData.append("type_id", typeId);
    formData.append("name", name.trim());
    formData.append("description", description);
    formData.append("expire_date", expireDate);
    formData.append("status", status);
    formData.append("severity", severity);
    formData.append("priority", priority);
    formData.append("hashtag", JSON.stringify(selectedTags));

    if (selectedTeamId.length) {
      formData.append("team_ids", JSON.stringify(selectedTeamId));
    }

    files.forEach((f) => formData.append("files", f));
    const deleted = existingFiles.filter((f) => f._deleted).map((f) => f.filename);
    formData.append("deleted_files", JSON.stringify(deleted));

    try {
      await IssueService.update(id, formData);
      toast.success("Updated successfully!");
      setTimeout(() => navigate("/issues/list"), 1500);
    } catch (err) {
      console.error("Error updating issue:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="rounded-2xl shadow-2xl border border-amber-100 overflow-hidden bg-white backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                  Edit Issue
                </h1>
                <p className="mt-1 text-xs text-slate-600">
                  Update issue details and manage attached files.
                </p>
              </div>
              <div className="text-right bg-gradient-to-br from-orange-100 to-amber-100 px-3 py-2 rounded-xl border border-amber-200 shadow-sm">
                <div className="text-[10px] font-medium text-orange-700">Priority</div>
                <div className="mt-0.5 text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                  {priority}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* LEFT */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-orange-700 mb-1">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white transition"
                    placeholder="Enter issue title..."
                  />
                </div>

                {/* Hashtags */}
                <div ref={tagBoxRef} className="relative">
                  <label className="block text-xs font-semibold text-orange-700 mb-1">
                    Hashtags
                  </label>
                  <div className="w-full min-h-[40px] rounded-lg border border-amber-200 bg-gradient-to-r from-white to-amber-50/30 px-2 py-1.5 flex flex-wrap items-center gap-1.5 shadow-sm">
                    {selectedTags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center bg-gradient-to-r from-orange-500 to-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-sm"
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
                      placeholder="Add a tag..."
                      className="flex-1 border-none outline-none text-slate-700 placeholder-amber-400 bg-transparent text-sm"
                    />
                  </div>
                  {showSuggest && tagSuggestions.length > 0 && (
                    <div className="absolute mt-1 w-full border border-amber-100 rounded-lg bg-white shadow-2xl z-30 max-h-40 overflow-auto">
                      {tagSuggestions.map((h) => (
                        <button
                          key={h.id ?? h.name}
                          type="button"
                          className="block w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 transition"
                          onClick={() => addTag(h.name)}
                        >
                          <span className="font-medium text-orange-600">#{h.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-orange-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white transition"
                    placeholder="Describe the issue..."
                  />
                </div>

                <div>
                  <ComponentUpload
                    files={files}
                    setFiles={setFiles}
                    existingFiles={existingFiles}
                    setExistingFiles={setExistingFiles}
                    label="Manage Attached Files"
                  />
                </div>
              </div>

              {/* RIGHT */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-orange-700 mb-1">
                    Issue Type
                  </label>
                  <select
                    value={typeId}
                    onChange={(e) => setTypeId(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white transition"
                  >
                    <option value="">-- Select Type --</option>
                    {types.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <Dropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
                  <Dropdown label="Severity" options={SEVERITY_OPTIONS} value={severity} onChange={setSeverity} />
                  <Dropdown label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-orange-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-orange-700 mb-1">
                    Handlers
                  </label>
                  <div className="mt-2 border border-amber-200 rounded-lg p-3 max-h-48 overflow-auto bg-gradient-to-r from-orange-50/40 to-amber-50/40">
                    {!teamMembers.length && (
                      <p className="text-sm text-gray-500">
                        There are no members in this project yet.
                      </p>
                    )}
                    {teamMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-sm cursor-pointer select-none mb-1"
                      >
                        <input
                          type="checkbox"
                          value={m.id}
                          checked={selectedTeamId?.includes(m.id)}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (e.target.checked)
                              setSelectedTeamId((prev) => [...(prev || []), val]);
                            else
                              setSelectedTeamId((prev) => (prev || []).filter((id) => id !== val));
                          }}
                          className="accent-orange-600"
                        />
                        <span>
                          {m.user_name} ({m.role_name})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold py-2 rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/issues/list')}
                    className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

/* --- Sub component: Dropdown --- */
const Dropdown = ({ label, options, value, onChange }) => (
  <div>
    <label className="block text-xs font-semibold text-orange-700 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-amber-200 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white transition"
    >
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);
