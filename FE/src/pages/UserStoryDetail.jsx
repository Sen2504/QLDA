import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import api from "../services/api";
import TaskService from "../services/taskService";
import TeamService from "../services/teamService";
import WorkflowStatusService from "../services/workflowStatusService";
import TaskTable from "../components/TaskTable";
import TaskFormModal from "../components/TaskFormModal";
import MainLayout from "../layouts/MainLayout";
import PermissionGuard from "../components/PermissionGuard";
import { usePermission } from "../store/PermissionContext";
import withPermissions from "../components/withPermissions";

function UserStoryDetail() {
  const { userStoryId } = useParams();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);

  const formatDate = (value) => {
    if (!value) return "—";
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "—";
  };

  // 🔍 Tìm tên trạng thái hiện tại
  const statusName = useMemo(() => {
    if (!story?.status_id) return "";
    const found = statuses.find((s) => s.id === story.status_id);
    return found?.name ?? "";
  }, [story, statuses]);

    // ✅ Kiểm tra nếu status là Done → khóa nút Edit
  const isDone = useMemo(() => {
    const name = statusName?.toLowerCase?.() || "";
    return name === "done" || name === "completed";
  }, [statusName]);

  // 📎 Xử lý file đính kèm
  const attachments = useMemo(() => {
    if (!story) return [];
    const raw = story.evidence_file;
    let files = [];

    if (Array.isArray(raw)) {
      files = raw;
    } else if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          files = parsed;
        }
      } catch {
        files = raw
          .replace(/\[|\]|'/g, "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
      }
    }

    return files.map((name, idx) => ({
      id: `${story.id}-${idx}-${name}`,
      name,
      url: `/uploads/user_story/${story.id}/${name}`,
    }));
  }, [story]);

  // 📦 Load toàn bộ dữ liệu
  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      try {
        const results = await Promise.allSettled([
          WorkflowStatusService.getAll(),
          api.get(`/user_stories/${userStoryId}`),
          TaskService.getByUserStory(userStoryId),
        ]);

        if (!mounted) return;

        // statuses
        if (results[0].status === "fulfilled") {
          setStatuses(results[0].value || []);
        } else {
          setStatuses([]);
        }

        // user story detail
        let storyData = null;
        if (results[1].status === "fulfilled") {
          storyData = results[1].value?.data;
          setStory(storyData);
        } else {
          setStory(null);
        }

        // tasks under story (may be 403 if lacking Task.View)
        if (results[2].status === "fulfilled") {
          setTasks(results[2].value?.data || []);
        } else {
          setTasks([]);
        }

        // load team members separately if we have project_id
        if (storyData?.project_id) {
          try {
            const teamRes = await TeamService.getTeamSummary(storyData.project_id);
            if (!mounted) return;
            setTeamMembers(teamRes.data?.members ?? []);
          } catch (e2) {
            // ignore, interceptor will toast if needed
            setTeamMembers([]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAll();
    return () => { mounted = false; };
  }, [userStoryId]);

  // 🧩 Tạo task mới
  const handleCreateTask = async (formData) => {
    const result = await TaskService.create(formData);
    if (result.data) {
      setTasks((prev) => [...prev, result.data]);
    }
    return result;
  };

  return (
    <MainLayout>
      <div className="p-6">
        <button
          className="px-3 py-2 rounded-lg border"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        {loading && (
          <div className="text-gray-500">Loading data...</div>
        )}

        {story && (
          <div className="bg-white rounded-2xl shadow p-6 mb-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{story.name}</h1>
                <p className="text-gray-700 mt-1 whitespace-pre-line">
                  {story.description?.trim() || "(No description yet)"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {statusName && (
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
                    {statusName}
                  </span>
                )}

                {/* ✅ Disable nút Edit nếu user story đã Done */}
                <PermissionGuard resource="UserStory" action="Edit">
                  <button
                    type="button"
                    onClick={() => navigate(`/user-stories/${story.id}/edit`)}
                    disabled={isDone}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      isDone
                        ? "border-gray-200 text-gray-400 cursor-not-allowed bg-gray-100"
                        : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    }`}
                  >
                    ✏️ Edit Story
                  </button>
                </PermissionGuard>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Due date</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{formatDate(story.expire_date)}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-wide text-emerald-600">Total points</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{story.total_points ?? 0}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Sprint</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{story.sprint_id ? `#${story.sprint_id}` : "Not assigned yet"}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">Number of tasks</p>
                <p className="mt-1 text-base font-semibold text-gray-900">{tasks.length}</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-2">Hashtags</h3>
              <div className="flex flex-wrap gap-2">
                {story.hashtags?.length ? (
                  story.hashtags.map((h, idx) => (
                    <span
                      key={h.hashtag?.id ?? `${h.hashtag?.name}-${idx}`}
                      className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700"
                    >
                      #{h.hashtag?.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm italic text-gray-400">No hashtag yet</span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-2">Complexity points</h3>
              {story.complexity_points?.length ? (
                <div className="flex flex-wrap gap-2">
                  {story.complexity_points.map((cp) => (
                    <span
                      key={cp.id ?? `${cp.name}-${cp.user_story_id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700"
                    >
                      <span className="font-medium text-gray-700">{cp.name}</span>
                      <span className="font-semibold">{cp.point}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Complex points have not been configured.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 mb-2">Attached documents</h3>
              {attachments.length ? (
                <ul className="space-y-2">
                  {attachments.map((file) => (
                    <li
                      key={file.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2"
                    >
                      <span className="truncate pr-4 text-gray-700">📎 {file.name}</span>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                      >
                        Detail
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">There are no attachments.</p>
              )}
            </div>
          </div>
        )}

        <TaskTable
          tasks={tasks}
          onCreateClick={() => setShowForm(true)}
          onStatusChange={async (taskId, newStatusId) => {
            try {
              await api.put(`/tasks/${taskId}`, { status_id: Number(newStatusId) });
              setTasks((prev) =>
                prev.map((task) =>
                  task.id === taskId
                    ? { ...task, status_id: Number(newStatusId) }
                    : task
                )
              );
              toast.success("Status update successful!");
            } catch (err) {
              // Lỗi đã được xử lý bởi api.js interceptor
              console.error("Failed to update status:", err);
            }
          }}
          onTaskClick={(id) => navigate(`/tasks/${id}`)}
          isUserStoryDone={isDone}
        />

        {showForm && (
          <TaskFormModal
            onClose={() => setShowForm(false)}
            onSubmit={handleCreateTask}
            teamMembers={teamMembers}
            userStoryId={userStoryId}
          />
        )}
      </div>
    </MainLayout>
  );
}

export default withPermissions(UserStoryDetail);
