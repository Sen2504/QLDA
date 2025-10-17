import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import MainLayout from "../layouts/MainLayout";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";
import TaskCommentService from "../services/taskCommentService";
import UserService from "../services/userService";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";

export default function TaskDetail() {
  const { taskId } = useParams();
  const navigate = useNavigate();

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
  };

  const handleSave = async () => {
  if (!form.name.trim() || !form.description.trim()) {
    toast.warn("Please enter the full name and description of the task");
    return;
  }

  setSaving(true);
  try {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      due_date: form.due_date || null,
    };
    if (form.status_id) {
      payload.status_id = Number(form.status_id);
    }

    await TaskService.update(taskId, payload);

    // 🔁 Sau khi update, load lại dữ liệu từ server
    const refreshed = await TaskService.getById(taskId);
    const data = refreshed.data;

    setTask(data);
    setComments(data?.comments || []);
    resetForm(data);
    setEditMode(false);
    toast.success("Task updated successfully");
  } catch (error) {
    toast.error(error.response?.data?.error || "Unable to update task");
  } finally {
    setSaving(false);
  }
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
      const status = error?.response?.status;
      if (status !== 403) {
        toast.error(error.response?.data?.error || "Không thể thêm bình luận");
      }
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
      const status = error?.response?.status;
      if (status !== 403) {
        toast.error(error.response?.data?.error || "Không thể xóa bình luận");
      }
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!task && !loading && !forbidden) {
    return (
      <MainLayout>
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
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
                    <button
                      onClick={handleSave}
                      disabled={saving || isDone}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      type="button"
                    >
                      {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                    <button
                      onClick={() => {
                        resetForm();
                        setEditMode(false);
                      }}
                      className="px-4 py-2 rounded-lg border"
                      type="button"
                      disabled={isDone}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    disabled={isDone}
                    className={`px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 ${
                      isDone ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                    type="button"
                  >
                    ✏️ Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Describe</h2>
                  {editMode ? (
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={6}
                      className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  ) : (
                    <p className="text-gray-700 whitespace-pre-line">
                      {task.description?.trim() || "(No description yet)"}
                    </p>
                  )}
                </section>

                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Expiration date</h2>
                  {editMode ? (
                    <input
                      type="date"
                      value={form.due_date}
                      onChange={(e) => handleChange("due_date", e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    />
                  ) : (
                    <div className="text-gray-800 font-medium">
                      {dueInfo?.dueDisplay || "Chưa thiết lập"}
                    </div>
                  )}
                  {dueInfo?.diffDays !== null && !editMode && (
                    <div className="text-xs text-gray-500 mt-1">
                      {describeDiffDays(dueInfo.diffDays)}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Status</h2>
                  {editMode ? (
                    <select
                      value={form.status_id}
                      onChange={(e) => handleChange("status_id", e.target.value)}
                      className="border rounded-lg px-3 py-2"
                    >
                      <option value="">Choose status</option>
                      {statuses.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name_status || status.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-gray-800 font-medium">
                      {task.status || "—"}
                    </div>
                  )}
                </section>
              </div>

              <div className="space-y-4">
                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Implement</h2>
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
                </section>

                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-3">Comment</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-72 overflow-y-auto space-y-3">
                      {comments.length === 0 && (
                        <div className="text-sm text-gray-500 text-center">There are no comments yet.</div>
                      )}
                      {comments.map((comment) => {
                        const created = comment.created_at ? dayjs(comment.created_at) : null;
                        const isOwner = currentUser && comment.user?.id === currentUser.id;
                        return (
                          <div
                            key={comment.id}
                            className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm"
                          >
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span className="font-medium text-gray-700">
                                {comment.author_name || comment.user?.name || "Ẩn danh"}
                              </span>
                              {created?.isValid() && (
                                <span>{created.format("HH:mm DD/MM/YYYY")}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-line">
                              {comment.content}
                            </p>
                            {isOwner && !isDone && (
                              <div className="text-right mt-2">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={commentSubmitting}
                                  className="text-xs text-red-500 hover:text-red-600"
                                  type="button"
                                >
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      className={`border border-emerald-100 rounded-xl p-3 ${
                        isDone ? "bg-gray-100 opacity-70" : "bg-emerald-50"
                      }`}
                    >
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        rows={3}
                        placeholder={
                          isDone
                            ? "Task đã hoàn thành — không thể thêm bình luận."
                            : "Share updates or discuss..."
                        }
                        className="w-full border border-emerald-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isDone}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={commentSubmitting || isDone}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          type="button"
                        >
                          {commentSubmitting ? "Sending..." : "Post a comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
