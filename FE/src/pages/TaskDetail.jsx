import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
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

function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();

  const canEdit = usePermission('Task', 'Edit');
  const canComment = usePermission('Task', 'Comment');

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

        // Task detail can be forbidden for non-assignees when Task.View = false
        if (taskRes.status === "fulfilled") {
          const taskData = taskRes.value?.data;
          setTask(taskData || null);
          setComments(taskData?.comments || []);
          setHashtags(taskData?.hashtags || []);
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
          if (status === 403) {
            setForbidden(true);
          } else if (status === 404) {
            setForbidden(false);
          } else {
            toast.error("Không thể tải thông tin task");
          }
        }

        // Status list
        const statusesData = statusRes.status === "fulfilled" ? statusRes.value?.data : [];
        setStatuses(statusesData || []);

        // Current user
        const profileData = profileRes.status === "fulfilled" ? profileRes.value?.data : null;
        setCurrentUser(profileData || null);
        
      } catch (error) {
        console.error("Failed to load task detail", error);
        toast.error(error.response?.data?.error || "Không thể tải thông tin task");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [taskId]);

  const dueInfo = useMemo(() => evaluateDueDate(task?.due_date), [task?.due_date]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
    if (isDone) return; // ✅ Không cho gửi comment nếu Done
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
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Failed to add comment:", error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (isDone) return; // ✅ Không cho xóa comment nếu Done
    if (!window.confirm("Are you sure you want to delete this comment??")) return;
    setCommentSubmitting(true);
    try {
      await TaskCommentService.delete(taskId, commentId);
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted");
    } catch (error) {
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Failed to delete comment:", error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!task && !loading && !forbidden) {
    return (
      <>
        <div className="p-6">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-lg border mb-4"
            type="button"
          >
            ← Back
          </button>
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-600">
            Tasks not found.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-2 rounded-lg border"
            type="button"
          >
            ← Back
          </button>
          {task?.user_story?.id && (
            <button
              onClick={() => navigate(`/user-stories/${task.user_story.id}`)}
              className="px-3 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              type="button"
            >
              ↗ Open user story
            </button>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow p-6 text-gray-500">
            Đang tải thông tin task...
          </div>
        )}

        {forbidden && !loading && (
          <div className="bg-white rounded-2xl shadow p-6 border border-red-200">
            <div className="text-red-600 font-semibold mb-1">Không có quyền truy cập</div>
            <div className="text-gray-700">Bạn không có quyền xem Task này.</div>
          </div>
        )}

        {task && (
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
              <div>
                {editMode ? (
                  <input
                    value={form.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full border rounded-xl px-3 py-2 text-xl font-semibold"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-gray-900">
                    #{task.id} {task.name}
                  </h1>
                )}
                <div className="mt-3 text-sm flex flex-wrap gap-2">
                  {task.user_story && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-semibold">
                      User Story #{task.user_story.id}
                    </span>
                  )}
                  {task.status && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700 text-xs font-semibold">
                      {task.status}
                    </span>
                  )}
                  {dueInfo?.dueDate && (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${dueInfo.badgeClass}`}
                    >
                      {dueInfo.label} • {dueInfo.dueDisplay}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {editMode ? (
                  <>
                    <PermissionGuard resource="Task" action="Edit">
                      <button
                        onClick={handleSave}
                        disabled={saving || isDone}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        type="button"
                      >
                        {saving ? "Saving..." : "Save changes"}
                      </button>
                    </PermissionGuard>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 rounded-lg border"
                      type="button"
                      disabled={isDone}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <PermissionGuard resource="Task" action="Edit">
                    <button
                      onClick={handleEnterEditMode}
                      disabled={isDone}
                      className={`px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 ${
                        isDone ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                      type="button"
                    >
                      ✏️ Edit
                    </button>
                  </PermissionGuard>
                )}
              </div>
            </div>

            {/* Main Content Section */}
            <div className="space-y-5">
              {/* Description, Due Date, Status - Full Width */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <section className="md:col-span-3">
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Description</h2>
                  {editMode ? (
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={4}
                      className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line bg-gray-50 rounded-xl p-4">
                      {task.description?.trim() || "(No description yet)"}
                    </p>
                  )}
                </section>

                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Due Date</h2>
                  {editMode ? (
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => handleChange("due_date", e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <div className="text-gray-800 font-medium">
                        {dueInfo?.dueDisplay || "Not set yet"}
                      </div>
                      {dueInfo?.diffDays !== null && (
                        <div className="text-xs text-gray-500 mt-1">
                          {describeDiffDays(dueInfo.diffDays)}
                        </div>
                      )}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Status</h2>
                  {editMode ? (
                    <select
                      value={form.status_id}
                      onChange={(e) => handleChange("status_id", e.target.value)}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      <option value="">Choose status</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name_status || status.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="bg-gray-50 rounded-lg px-4 py-3">
                      <div className="text-gray-800 font-medium">
                        {task.status || "—"}
                      </div>
                    </div>
                  )}
                </section>
              </div>

              {/* Two Column Layout: Left 35% | Right 65% */}
              <div className="grid grid-cols-1 lg:grid-cols-[35%_1fr] gap-5">
                {/* LEFT COLUMN - 35% */}
                <div className="space-y-4">
                  {/* Hashtags Section */}
                  <section className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">#</span>
                      Hashtags
                    </h2>
                  
                  {editMode ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
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
                          placeholder="Tìm kiếm hoặc tạo hashtag... (Enter để thêm)"
                          className="w-full border rounded-lg px-3 py-2 text-sm"
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
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {hashtags.length > 0 ? (
                        hashtags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs text-blue-700"
                          >
                            #{tag.name}
                          </span>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">Chưa có hashtag</div>
                      )}
                    </div>
                  )}
                </section>

                  {/* Assignees Section */}
                  <section className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                    <h2 className="text-sm font-semibold uppercase text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-emerald-600">👥</span>
                      Assignees
                    </h2>

                  {editMode ? (
                    <div className="border rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                      {availableMembers.length === 0 ? (
                        <div className="text-sm text-gray-500">Đang tải danh sách thành viên...</div>
                      ) : (
                        availableMembers.map((member) => {
                          const userName = member.user?.name || member.user?.email || member.user_email || "Ẩn danh";
                          const roleName = member.projrole?.name || member.role_name || "";
                          
                          return (
                            <label
                              key={member.id}
                              className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedAssignees.includes(member.id)}
                                onChange={() => handleToggleAssignee(member.id)}
                                className="w-4 h-4"
                              />
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {userName}
                                </div>
                                {roleName && (
                                  <div className="text-xs text-gray-600">
                                    {roleName}
                                  </div>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                      {selectedAssignees.length > 0 && (
                        <div className="text-xs text-emerald-600 mt-1 px-2">
                          Đã chọn {selectedAssignees.length} người
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {task.assignees?.length ? (
                        <ul className="space-y-2">
                          {task.assignees.map((assignee) => (
                            <li
                              key={`assignee-${assignee.team_id || assignee.user_id || assignee.user_email}`}
                              className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 flex flex-col"
                            >
                              <span className="font-medium text-emerald-900">
                                {assignee.user_name || assignee.name || assignee.user_email || assignee.email || "Ẩn danh"}
                              </span>
                              {assignee.role_name && (
                                <span className="text-xs text-emerald-700">
                                  {assignee.role_name}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-500">Not assigned yet</div>
                      )}
                    </>
                  )}
                  </section>
                </div>

                {/* RIGHT COLUMN - 65% */}
                <div>
                  <section className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-emerald-600">💬</span>
                      Comments
                      {comments.length > 0 && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                          {comments.length}
                        </span>
                      )}
                    </h2>
                    
                    <div className="space-y-4">
                      {/* Comments List */}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {comments.length === 0 && (
                          <div className="text-center py-8 text-gray-400">
                            <div className="text-4xl mb-2">💭</div>
                            <div className="text-sm">No comments yet. Be the first to comment!</div>
                          </div>
                        )}
                        
                        {comments.map((comment) => {
                          const created = comment.created_at ? dayjs(comment.created_at) : null;
                          const isOwner = currentUser && comment.user?.id === currentUser.id;
                          return (
                            <div
                              key={comment.id}
                              className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div>
                                  <div className="font-medium text-gray-800 text-sm">
                                    {comment.author_name || comment.user?.name || "Ẩn danh"}
                                  </div>
                                  {created?.isValid() && (
                                    <div className="text-xs text-gray-500">
                                      {created.format("HH:mm DD/MM/YYYY")}
                                    </div>
                                  )}
                                </div>
                                {isOwner && !isDone && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    disabled={commentSubmitting}
                                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                                    type="button"
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 whitespace-pre-line mt-2">
                                {comment.content}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Comment Form */}
                      <div className={`border-t border-gray-200 pt-4 ${isDone ? "opacity-50" : ""}`}>
                        <PermissionGuard resource="Task" action="Comment">
                          <div className="space-y-3">
                            <textarea
                              value={commentInput}
                              onChange={(e) => setCommentInput(e.target.value)}
                              rows={3}
                              placeholder={
                                isDone
                                  ? "Task completed — cannot add comments."
                                  : "Write a comment..."
                              }
                              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                              disabled={isDone || !canComment}
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={handleSubmitComment}
                                disabled={commentSubmitting || isDone || !canComment || !commentInput.trim()}
                                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                type="button"
                              >
                                {commentSubmitting ? (
                                  <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                    Posting...
                                  </span>
                                ) : (
                                  "Post Comment"
                                )}
                              </button>
                            </div>
                          </div>
                        </PermissionGuard>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default withPermissions(TaskDetail);
