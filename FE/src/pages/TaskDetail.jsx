import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { 
  ArrowLeft, 
  ExternalLink, 
  Edit3, 
  Save, 
  X, 
  FileText, 
  Calendar, 
  Activity, 
  Hash, 
  Users, 
  MessageCircle, 
  Loader2,
  Send
} from "lucide-react";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";
import TaskCommentService from "../services/taskCommentService";
import UserService from "../services/userService";
import HashtagService from "../services/hashtagService";
import api from "../services/api";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import PermissionGuard from "../components/PermissionGuard";
import { usePermission } from "../store/PermissionContext";
import withPermissions from "../components/withPermissions";
import GradientCard from "../components/task/GradientCard";
import SectionHeader from "../components/task/SectionHeader";
import CommentItem from "../components/task/CommentItem";
import HashtagBadge from "../components/task/HashtagBadge";
import AssigneeItem from "../components/task/AssigneeItem";

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const canEdit = usePermission("Task", "Edit");
  const canComment = usePermission("Task", "Comment");

  const [task, setTask] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", status_id: "", due_date: "" });
  const [statuses, setStatuses] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  
  // Hashtag states
  const [hashtags, setHashtags] = useState([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtagSuggestions, setHashtagSuggestions] = useState([]);
  const [editingHashtags, setEditingHashtags] = useState(false);
  
  // Assignees states
  const [editingAssignees, setEditingAssignees] = useState(false);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState([]);

  // ✅ Kiểm tra nếu task đã Done thì khóa hành động
  const isDone = useMemo(() => {
    const statusName = task?.status?.toLowerCase?.() || "";
    return statusName === "done" || statusName === "completed";
  }, [task?.status]);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      setLoading(true);
      try {
        const [taskRes, statusRes, profileRes] = await Promise.allSettled([
          TaskService.getById(taskId),
          TaskStatusService.getAll(),
          UserService.getProfile().catch(() => ({ data: null })),
        ]);

        if (!mounted) return;

        if (taskRes.status === "fulfilled") {
          const taskData = taskRes.value?.data;
          setTask(taskData || null);
          setComments(taskData?.comments || []);
          setHashtags(taskData?.hashtags || []);
          setSelectedAssignees(taskData?.assignees?.map(a => a.team_id) || []);
          setForm({
            name: taskData?.name || "",
            description: taskData?.description || "",
            status_id: taskData?.status_id ? String(taskData.status_id) : "",
            due_date: taskData?.due_date ? dayjs(taskData.due_date).format("YYYY-MM-DD") : "",
          });
          setForbidden(false);
        } else {
          setTask(null);
          setComments([]);
          const status = taskRes?.reason?.response?.status;
          if (status === 403) setForbidden(true);
          else if (status === 404) setForbidden(false);
          else toast.error("Failed to load task information");
        }

        const statusesData = statusRes.status === "fulfilled" ? statusRes.value?.data : [];
        setStatuses(statusesData || []);

        const profileData = profileRes.status === "fulfilled" ? profileRes.value?.data : null;
        setCurrentUser(profileData || null);
        
      } catch (error) {
        console.error("Failed to load task detail", error);
        toast.error(error.response?.data?.error || "Failed to load task information");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  const dueInfo = useMemo(() => evaluateDueDate(task?.due_date), [task?.due_date]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const resetForm = (nextTask) => {
    const data = nextTask || task;
    if (!data) return;
    setForm({
      name: data.name || "",
      description: data.description || "",
      status_id: data.status_id ? String(data.status_id) : "",
      due_date: data.due_date ? dayjs(data.due_date).format("YYYY-MM-DD") : "",
    });
    setHashtags(data?.hashtags || []);
    setSelectedAssignees(data?.assignees?.map(a => a.team_id) || []);
  };

  const handleEnterEditMode = async () => {
    setEditMode(true);
    // Set lại selectedAssignees từ task hiện tại
    setSelectedAssignees(task?.assignees?.map(a => a.team_id) || []);
    // Load danh sách team members từ project
    if (task?.project_id) {
      try {
        const response = await api.get(`/teams/${task.project_id}`);
        const members = response.data || [];
        setAvailableMembers(members);
      } catch (error) {
        console.error("Failed to load team members:", error);
        toast.error("Cannot load team members.");
      }
    } else {
      toast.warn("Cannot determine project to load team members");
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setEditMode(false);
    setHashtagInput("");
    setHashtagSuggestions([]);
    setAvailableMembers([]);
  };

  const handleSave = async () => {
  if (!form.name.trim() || !form.description.trim()) {
    toast.warn("Please enter the full name and description of the task");
    return;
  }

  if (selectedAssignees.length === 0) {
    toast.warn("Please select at least 1 assignee");
    return;
  }

  setSaving(true);
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
    };
    
    // Luôn gửi due_date (null nếu rỗng)
    payload.due_date = form.due_date && form.due_date.trim() ? form.due_date.trim() : null;
    
    if (form.status_id && form.status_id !== "") {
      payload.status_id = Number(form.status_id);
    }

    // Thêm team_ids và hashtag_ids
    payload.team_ids = selectedAssignees;
    payload.hashtag_ids = hashtags.map(h => h.id);

    const updateResult = await TaskService.update(taskId, payload);
    
    // Kiểm tra nếu có lỗi thì dừng lại (lỗi đã được hiển thị bởi api.js interceptor)
    if (updateResult?.error) {
      return;
    }

    // 🔁 Sau khi update, load lại dữ liệu từ server
    const refreshed = await TaskService.getById(taskId);
    const data = refreshed.data;

    setTask(data);
    setComments(data?.comments || []);
    setHashtags(data?.hashtags || []);
    resetForm(data);
    setEditMode(false);
    setAvailableMembers([]);
    setHashtagInput("");
    setHashtagSuggestions([]);
    toast.success("Task updated successfully");
  } catch (error) {
    // Lỗi đã được xử lý bởi api.js interceptor
    console.error("Failed to update task:", error);
  } finally {
    setSaving(false);
  }
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
      toast.warn("Hashtag has been added");
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
            toast.success("Created new hashtag successfully!");
          }
        } catch (error) {
          console.error("Failed to create hashtag:", error);
          toast.error("Cannot create new hashtag");
        }
      }
    }
  };

  const handleToggleAssignee = (teamId) => {
    setSelectedAssignees(prev => {
      if (prev.includes(teamId)) {
        return prev.filter(id => id !== teamId);
      } else {
        return [...prev, teamId];
      }
    });
  };

  const handleSubmitComment = async () => {
    if (isDone) return;
    if (!commentInput.trim()) {
      toast.warn("Please enter comment content");
      return;
    }

    setCommentSubmitting(true);
    try {
      const { data } = await TaskCommentService.create(taskId, {
        content: commentInput.trim(),
      });
      setComments((prev) => [...prev, data]);
      setCommentInput("");
      toast.success("Comment added");
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error(error.response?.data?.error || "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (isDone) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    setCommentSubmitting(true);
    try {
      await TaskCommentService.delete(taskId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      console.error("Failed to delete comment:", error);
      toast.error(error.response?.data?.error || "Failed to delete comment");
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!task && !loading && !forbidden) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-3">
        <button 
          onClick={() => navigate(-1)} 
          className="group px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center gap-2 mb-3"
          type="button"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-sm">Task not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-3">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="group px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center gap-2"
            type="button"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm">Back</span>
          </button>
          {task?.user_story?.id && (
            <button
              onClick={() => navigate(`/user-stories/${task.user_story.id}`)}
              className="group px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              type="button"
            >
              <span className="text-sm">Open user story</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-5 text-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-gray-600 text-sm">Loading task information...</p>
            </div>
          </div>
        )}

        {/* Forbidden State */}
        {forbidden && !loading && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg shadow-lg border border-red-200 p-4">
            <div className="flex items-start gap-2">
              <X className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <div className="text-red-600 font-bold text-base mb-1">Access denied</div>
                <div className="text-gray-700 text-sm">You do not have permission to view this task.</div>
              </div>
            </div>
          </div>
        )}

        {/* Task Content */}
        {task && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-emerald-200 p-4">
            {/* Task Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3 pb-3 border-b border-emerald-100">
              <div className="flex-1 min-w-0">
                {editMode ? (
                  <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full border-2 border-emerald-300 focus:border-emerald-500 rounded-lg px-3 py-2 text-lg font-bold bg-white/50 backdrop-blur-sm transition-all duration-300"
                    placeholder="Task name..."
                  />
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-sm">
                        #{task.id}
                      </span>
                      <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                        {task.name}
                      </h1>
                    </div>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {task.user_story && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-white text-xs font-semibold shadow-sm">
                      <FileText className="w-3 h-3" />
                      User Story #{task.user_story.id}
                    </span>
                  )}
                  {task.status && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-500 to-slate-600 px-2.5 py-0.5 text-white text-xs font-semibold shadow-sm">
                      <Activity className="w-3 h-3" />
                      {task.status}
                    </span>
                  )}
                  {dueInfo?.dueDate && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                        dueInfo.badgeClass.includes('red') 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                          : dueInfo.badgeClass.includes('yellow')
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {dueInfo.label} • {dueInfo.dueDisplay}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={!canEdit || saving || isDone}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-sm"
                      type="button"
                      title={
                        !canEdit 
                          ? "You don't have permission to edit tasks" 
                          : isDone 
                          ? "Cannot edit completed task" 
                          : "Save changes"
                      }
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 font-medium transition-all duration-300 text-sm"
                      type="button"
                      disabled={isDone}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleEnterEditMode}
                    disabled={!canEdit || isDone}
                    className={`px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-sm ${
                      !canEdit || isDone ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    type="button"
                    title={
                      !canEdit 
                        ? "You don't have permission to edit tasks" 
                        : isDone 
                        ? "Cannot edit completed task" 
                        : "Edit task"
                    }
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Main Content Grid - Compact Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* LEFT COLUMN - 1/3 */}
              <div className="space-y-3">
                {/* Description */}
                <GradientCard gradient="from-emerald-50 to-teal-50" borderColor="border-emerald-200">
                  <SectionHeader icon={FileText} title="Description" />
                  {editMode ? (
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={3}
                      className="w-full border border-emerald-300 focus:border-emerald-500 rounded-lg p-2 text-xs bg-white/50 backdrop-blur-sm focus:outline-none transition-all duration-300"
                      placeholder="Describe the task..."
                    />
                  ) : (
                    <p className="text-gray-700 text-xs whitespace-pre-line leading-relaxed">
                      {task.description?.trim() || "(No description yet)"}
                    </p>
                  )}
                </GradientCard>

                {/* Due Date & Status Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Due Date */}
                  <GradientCard gradient="from-blue-50 to-cyan-50" borderColor="border-blue-200">
                    <SectionHeader icon={Calendar} title="Due Date" gradient="from-blue-600 to-cyan-600" />
                    {editMode ? (
                      <input
                        type="date"
                        value={form.due_date}
                        onChange={(e) => handleChange("due_date", e.target.value)}
                        className="w-full border border-blue-300 focus:border-blue-500 rounded px-2 py-1 text-xs bg-white/50 backdrop-blur-sm transition-all duration-300"
                      />
                    ) : (
                      <div>
                        <div className="text-gray-800 font-semibold text-xs">
                          {dueInfo?.dueDisplay || "Not set"}
                        </div>
                        {dueInfo?.diffDays !== null && (
                          <div className="text-[10px] text-gray-600 mt-0.5">
                            {describeDiffDays(dueInfo.diffDays)}
                          </div>
                        )}
                      </div>
                    )}
                  </GradientCard>

                  {/* Status */}
                  <GradientCard gradient="from-emerald-50 to-teal-50" borderColor="border-emerald-200">
                    <SectionHeader icon={Activity} title="Status" />
                    {editMode ? (
                      <select
                        value={form.status_id}
                        onChange={(e) => handleChange("status_id", e.target.value)}
                        className="w-full border border-emerald-300 focus:border-emerald-500 rounded px-2 py-1 text-xs bg-white/50 backdrop-blur-sm transition-all duration-300"
                      >
                        <option value="">Choose</option>
                        {statuses.map((status) => (
                          <option key={status.id} value={status.id}>
                            {status.name_status || status.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-gray-800 font-semibold text-xs">
                        {task.status || "—"}
                      </div>
                    )}
                  </GradientCard>
                </div>

                {/* Hashtags */}
                <GradientCard gradient="from-emerald-50 via-teal-50 to-cyan-50" borderColor="border-emerald-200">
                  <SectionHeader icon={Hash} title="Hashtags" />
                  
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {hashtags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-2.5 py-1 text-xs text-white font-semibold shadow-sm"
                          >
                            #{tag.name}
                            <button
                              onClick={() => handleRemoveHashtag(tag.id)}
                              className="hover:bg-white/20 rounded-full p-0.5 transition-colors duration-200"
                              type="button"
                            >
                              <X className="w-3 h-3" />
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
                          placeholder="Search or create... (Enter)"
                          className="w-full border border-blue-300 focus:border-purple-500 rounded-lg px-3 py-2 text-sm bg-white/80 backdrop-blur-sm transition-all duration-300"
                        />
                        {hashtagSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                            {hashtagSuggestions.map((tag) => (
                              <button
                                key={tag.id}
                                onClick={() => handleAddHashtag(tag)}
                                className="w-full text-left px-3 py-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-sm font-medium transition-colors duration-200"
                                type="button"
                              >
                                #{tag.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {hashtagInput.trim() && hashtagSuggestions.length === 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg">
                            <div className="px-3 py-2 text-xs">
                              <span className="text-gray-600">Press Enter to create:</span>
                              <span className="ml-1 font-bold text-blue-600">
                                #{hashtagInput.trim()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {hashtags.length > 0 ? (
                        hashtags.map((tag) => (
                          <HashtagBadge key={tag.id} tag={tag} />
                        ))
                      ) : (
                        <div className="text-xs text-gray-500 italic">No hashtags</div>
                      )}
                    </div>
                  )}
                </GradientCard>

                {/* Assignees */}
                <GradientCard gradient="from-emerald-50 via-teal-50 to-cyan-50" borderColor="border-emerald-200">
                  <SectionHeader icon={Users} title="Assignees" />

                  {editMode ? (
                    <div className="border border-emerald-300 rounded p-2 max-h-40 overflow-y-auto space-y-1.5 bg-white/80 backdrop-blur-sm custom-scrollbar">
                      {availableMembers.length === 0 ? (
                        <div className="text-xs text-gray-500 italic text-center py-3">
                          Loading members...
                        </div>
                      ) : (
                        availableMembers.map((member) => {
                          const userName = member.user?.name || member.user?.email || member.user_email || "Anonymous";
                          const roleName = member.projrole?.name || member.role_name || "";
                          
                          return (
                            <label
                              key={member.id}
                              className="flex items-center gap-2 p-1.5 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 rounded cursor-pointer transition-all duration-200 border border-transparent hover:border-emerald-200"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAssignees.includes(member.id)}
                                onChange={() => handleToggleAssignee(member.id)}
                                className="w-3.5 h-3.5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-900 truncate">
                                  {userName}
                                </div>
                                {roleName && (
                                  <div className="text-[10px] text-emerald-700 font-medium truncate">
                                    {roleName}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                      {selectedAssignees.length > 0 && (
                        <div className="text-[10px] font-semibold text-emerald-600 mt-1 px-1 text-center">
                          ✓ Selected {selectedAssignees.length}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {task.assignees?.length ? (
                        <ul className="space-y-1.5">
                          {task.assignees.map((assignee) => (
                            <li key={`assignee-${assignee.team_id || assignee.user_id || assignee.user_email}`}>
                              <AssigneeItem assignee={assignee} />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-xs text-gray-500 italic text-center py-2">Not assigned yet</div>
                      )}
                    </>
                  )}
                </GradientCard>
              </div>

              {/* RIGHT COLUMN - 2/3 Comments */}
              <div className="lg:col-span-2">
                <GradientCard gradient="from-emerald-50 via-teal-50 to-green-50" borderColor="border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader 
                      icon={MessageCircle} 
                      title="Comments" 
                      badge={comments.length > 0 && (
                        <span className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                          {comments.length}
                        </span>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {/* Comments List */}
                    <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 custom-scrollbar">
                      {comments.length === 0 && (
                        <div className="text-center py-8 rounded-lg bg-white/50 backdrop-blur-sm">
                          <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                          <div className="text-xs text-gray-500 font-medium">No comments yet. Be the first!</div>
                        </div>
                      )}
                      
                      {comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          currentUser={currentUser}
                          isDone={isDone}
                          onDelete={handleDeleteComment}
                          isDeleting={commentSubmitting}
                        />
                      ))}
                    </div>

                    {/* Add Comment Form */}
                    <div className={`border-t border-emerald-200 pt-3 ${isDone || !canComment ? "opacity-50" : ""}`}>
                      <div className="space-y-2">
                        <textarea
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          rows={2}
                          placeholder={
                            !canComment 
                              ? "You don't have permission to comment" 
                              : isDone 
                              ? "Task completed — cannot add comments." 
                              : "Write a comment..."
                          }
                          className="w-full border border-emerald-300 focus:border-emerald-500 rounded-lg p-2 text-xs bg-white/80 backdrop-blur-sm focus:outline-none transition-all duration-300 resize-none"
                          disabled={isDone || !canComment}
                        />
                        <div className="flex justify-end">
                          <button
                            onClick={handleSubmitComment}
                            disabled={commentSubmitting || isDone || !canComment || !commentInput.trim()}
                            className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5"
                            type="button"
                            title={
                              !canComment 
                                ? "You don't have permission to comment" 
                                : isDone 
                                ? "Cannot comment on completed task" 
                                : "Post comment"
                            }
                          >
                            {commentSubmitting ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Posting...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-3.5 h-3.5" />
                                <span>Post Comment</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </GradientCard>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withPermissions(TaskDetail);
