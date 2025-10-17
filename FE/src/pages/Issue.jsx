import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import HashtagService from "../services/hashtagService";
import IssueService from "../services/issueService";
import IssueTypeService from "../services/issueTypeService";
import ComponentUpload from "../components/ComponentUpload";

function useDebounce(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function IssueCreate() {
  const { currentProject } = useProject();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState("");
  const [status, setStatus] = useState("New");
  const [severity, setSeverity] = useState("Normal");
  const [priority, setPriority] = useState("Normal");

  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const debouncedTagInput = useDebounce(tagInput, 250);
  const tagBoxRef = useRef(null);

  const [files, setFiles] = useState([]);

  const STATUS_OPTIONS = ["New", "In Progress", "Ready for test", "Closed", "Need Info", "Rejected", "Postponed"];
  const SEVERITY_OPTIONS = ["Wishlist", "Minor", "Normal", "Important", "Critical"];
  const PRIORITY_OPTIONS = ["Low", "Normal", "High"];

  // Load issue types
  useEffect(() => {
    IssueTypeService.getAll()
      .then((res) => setTypes(res.data || []))
      .catch(() => setTypes([]));
  }, []);

  // Hashtag gợi ý
  useEffect(() => {
    const q = debouncedTagInput.trim();
    if (!q) return setTagSuggestions([]);
    HashtagService.search(q)
      .then((res) => setTagSuggestions(res.data || []))
      .catch(() => setTagSuggestions([]));
  }, [debouncedTagInput]);

  // Đóng popup hashtag khi click ra ngoài
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
    if (!currentProject) return alert("Chưa chọn project.");
    if (!name.trim()) return alert("Vui lòng nhập tên issue.");
    if (!typeId) return alert("Chọn loại issue.");
    if (!expireDate) return alert("Chọn ngày hết hạn.");

    const formData = new FormData();
    formData.append("project_id", currentProject.id);
    formData.append("type_id", typeId);
    formData.append("name", name.trim());
    formData.append("description", description);
    formData.append("hashtag", selectedTags.join(","));
    formData.append("status", status);
    formData.append("severity", severity);
    formData.append("priority", priority);
    formData.append("expire_date", expireDate);

    // hỗ trợ nhiều file
    if (files.length > 0) {
      files.forEach((f) => formData.append("files", f));
    }

    try {
      await IssueService.create(formData);
      toast.success("Create issue success");
      setTimeout(() => {
        navigate("/issues/list");
      }, 1500);
    } catch (err) {
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Error creating issue:", err);
    }
  };

  return (
    <MainLayout>
        <form
          onSubmit={handleSubmit}
          className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8 border border-gray-200"
        >
          <h1 className="text-3xl font-bold text-emerald-700 mb-8 text-center">
            Create New Issue
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* LEFT */}
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="text-gray-700 font-medium">Issue Title</label>
                <input
                  type="text"
                  placeholder="Enter issue title..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Hashtags */}
              <HashtagBox
                tagBoxRef={tagBoxRef}
                selectedTags={selectedTags}
                tagInput={tagInput}
                setTagInput={setTagInput}
                addTag={addTag}
                removeTag={removeTag}
                tagSuggestions={tagSuggestions}
                showSuggest={showSuggest}
                setShowSuggest={setShowSuggest}
              />

              {/* Description */}
              <div>
                <label className="text-gray-700 font-medium">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the issue briefly..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-2 w-full border-gray-300 rounded-lg shadow-sm px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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

              {/* Upload file component */}
              <ComponentUpload files={files} setFiles={setFiles} label="Attached Files" />

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold py-2 rounded-lg shadow hover:from-emerald-600 hover:to-green-700 transition"
                >
                  Create Issue
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

/* ---------------- SUB COMPONENTS ---------------- */

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

const HashtagBox = ({
  tagBoxRef,
  selectedTags,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  tagSuggestions,
  showSuggest,
  setShowSuggest,
}) => (
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
            key={h.id}
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
);
