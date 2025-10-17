import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import IssueService from "../services/issueService";
import IssueTypeService from "../services/issueTypeService";
import HashtagService from "../services/hashtagService";
import TeamService from "../services/teamService";
import ComponentUpload from "../components/ComponentUpload";
import PopupMessage from "../components/Popup_message";

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

  // basic fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState("New");
  const [severity, setSeverity] = useState("Normal");
  const [priority, setPriority] = useState("Normal");

  // Người thực hiện
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState([]);

  // hashtags
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const tagBoxRef = useRef(null);
  const debouncedTagInput = useDebounce(tagInput, 250);

  // files
  const [files, setFiles] = useState([]); // file mới
  const [existingFiles, setExistingFiles] = useState([]); // file cũ

  // popup
  const [popup, setPopup] = useState({ show: false, message: "", type: "success" });

  const STATUS_OPTIONS = ["New", "In Progress", "Ready for test", "Closed", "Need Info", "Rejected", "Postponed"];
  const SEVERITY_OPTIONS = ["Wishlist", "Minor", "Normal", "Important", "Critical"];
  const PRIORITY_OPTIONS = ["Low", "Normal", "High"];

  // ---- LOAD INITIAL DATA ----
  useEffect(() => {
    if (!id) return;

    // Load loại issue
    IssueTypeService.getAll()
      .then((res) => setTypes(res.data || []))
      .catch(() => setTypes([]));

    // Load chi tiết issue
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

        // team xử lý (nếu BE có trả về)
        if (issue.team_id) setSelectedTeamId(issue.team_id);

        // Hashtag
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
        } else {
          setSelectedTags([]);
        }

        // Files
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
      .catch(() => {
        setPopup({
          show: true,
          message: "Unable to load issue data!",
          type: "error",
        });
      });
  }, [id]);

  // ---- LOAD TEAM MEMBERS ----
  useEffect(() => {
    if (!currentProject) return;
    TeamService.getByProjectId(currentProject.id)
      .then((res) => setTeamMembers(res.data || []))
      .catch((err) => console.error("Load team error:", err));
  }, [currentProject]);

  // ---- hashtag gợi ý ----
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

  // ---- submit ----
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


    // file mới
    files.forEach((f) => formData.append("files", f));

    // file bị xóa
    const deleted = existingFiles.filter((f) => f._deleted).map((f) => f.filename);
    formData.append("deleted_files", JSON.stringify(deleted));

    try {
      await IssueService.update(id, formData);
      setPopup({ show: true, message: "Updated successfully!", type: "success" });
      setTimeout(() => {
        setPopup({ ...popup, show: false });
        navigate("/issues/list");
      }, 1500);
    } catch {
      setPopup({ show: true, message: "An error occurred while updating!", type: "error" });
    }
  };

  // ---- UI ----
  return (
    <MainLayout>
      {popup.show && (
        <PopupMessage
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup({ ...popup, show: false })}
        />
      )}

      <form
        onSubmit={handleSubmit}
        className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200 my-8"
      >
        <h1 className="text-3xl font-bold text-emerald-700 mb-8 text-center">
          Edit Issue
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="text-gray-700 font-medium">Issue Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter issue title..."
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
                placeholder="Describe the issue..."
              />
            </div>

            {/* Upload files */}
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
            {/* Type */}
            <div>
              <label className="text-gray-700 font-medium">Issue Type</label>
              <select
                value={typeId}
                onChange={(e) => setTypeId(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Select Type --</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdowns */}
            <div className="grid grid-cols-3 gap-3">
              <Dropdown label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
              <Dropdown label="Severity" options={SEVERITY_OPTIONS} value={severity} onChange={setSeverity} />
              <Dropdown label="Priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
            </div>

            {/* Due Date */}
            <div>
              <label className="text-gray-700 font-medium">Due Date</label>
              <input
                type="date"
                value={expireDate}
                onChange={(e) => setExpireDate(e.target.value)}
                className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Người thực hiện */}
            <div>
              <label className="text-gray-700 font-medium">Handlers</label>
              <div className="mt-2 border rounded-lg p-3 max-h-48 overflow-auto bg-gray-50">
                {!teamMembers.length && (
                  <p className="text-sm text-gray-500">There are no members in this project yet.</p>
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
                        if (e.target.checked) {
                          setSelectedTeamId((prev) => [...(prev || []), val]);
                        } else {
                          setSelectedTeamId((prev) => (prev || []).filter((id) => id !== val));
                        }
                      }}
                      className="accent-emerald-600"
                    />
                    <span>
                      {m.user_email} ({m.role_name})
                    </span>
                  </label>
                ))}
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
                onClick={() => navigate("/issues/list")}
                className="px-6 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
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

/* --- Sub component: Dropdown --- */
const Dropdown = ({ label, options, value, onChange }) => (
  <div>
    <label className="text-gray-700 font-medium">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-3 py-2 focus:ring-2 focus:ring-emerald-500"
    >
      {options.map((opt) => (
        <option key={opt}>{opt}</option>
      ))}
    </select>
  </div>
);
