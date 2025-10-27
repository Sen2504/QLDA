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
import PermissionGuard from "../components/PermissionGuard";
import { usePermission } from "../store/PermissionContext";
import withPermissions from "../components/withPermissions";

function UserStoryDetail() {
  const { userStoryId } = useParams();
  const navigate = useNavigate();
  
  // Check permissions
  const canEditStory = usePermission("UserStory", "Edit");
  const canCreateTask = usePermission("Task", "Create");
  
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

  const baseUrl =
    import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

  return files.map((name, idx) => ({
    id: `${story.id}-${idx}-${name}`,
    name,
    url: `${baseUrl}/uploads/user_story/${story.id}/${encodeURIComponent(name)}`,
  }));
}, [story]);

  // Load toàn bộ dữ liệu
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
    <>
      {/* Modern Gradient Background */}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Back Button */}
          <button
            className="group mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-200 text-blue-700 font-medium shadow-sm hover:shadow-md hover:bg-white transition-all duration-200 hover:scale-105"
            onClick={() => navigate("/")}
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <p className="text-blue-600 font-medium">Loading story details...</p>
              </div>
            </div>
          )}

          {/* Compact Story Header - Top Section */}
          {story && (
            <>
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100 p-5 mb-6">
                {/* Top Row: Title, Status, Edit Button */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                        {story.name}
                      </h1>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {story.description?.trim() || <span className="italic text-gray-400">(No description)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {statusName && (
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${
                        isDone 
                          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white" 
                          : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200"
                      }`}>
                        {isDone && (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        {statusName}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/user-stories/${story.id}/edit`)}
                      disabled={!canEditStory || isDone}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                        !canEditStory || isDone
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105"
                      }`}
                      title={
                        !canEditStory 
                          ? "No permission" 
                          : isDone 
                          ? "Cannot edit completed story" 
                          : "Edit story"
                      }
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>

                {/* Stats + Info Row - Horizontal Layout */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-4">
                  {/* Stats Cards - Compact */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3 border border-blue-100">
                    <p className="text-[10px] font-bold uppercase text-blue-600 mb-0.5">Due Date</p>
                    <p className="text-sm font-bold text-gray-900">{formatDate(story.expire_date)}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 p-3 border border-indigo-100">
                    <p className="text-[10px] font-bold uppercase text-indigo-600 mb-0.5">Points</p>
                    <p className="text-sm font-bold text-gray-900">{story.total_points ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 p-3 border border-purple-100">
                    <p className="text-[10px] font-bold uppercase text-purple-600 mb-0.5">Sprint</p>
                    <p className="text-sm font-bold text-gray-900 truncate" title={story.sprint_name || "Not assigned"}>
                      {story.sprint_name || "—"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 p-3 border border-pink-100">
                    <p className="text-[10px] font-bold uppercase text-pink-600 mb-0.5">Tasks</p>
                    <p className="text-sm font-bold text-gray-900">{tasks.length}</p>
                  </div>

                  {/* Tags Column */}
                  <div className="col-span-2 sm:col-span-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z" clipRule="evenodd" />
                    </svg>
                    <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                      {story.hashtags?.length ? (
                        story.hashtags.map((h, idx) => (
                          <span
                            key={h.hashtag?.id ?? idx}
                            className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
                          >
                            #{h.hashtag?.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs italic text-gray-400">No tags</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Collapsible Details Section */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-500 hover:text-blue-600 transition-colors">
                    <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    Show more details
                  </summary>

                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Complexity Points */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                        </svg>
                        Complexity Points
                      </h3>
                      {story.complexity_points?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {story.complexity_points.map((cp) => (
                            <span
                              key={cp.id ?? `${cp.name}-${cp.user_story_id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2 py-1 text-xs"
                            >
                              <span className="text-gray-600">{cp.name}</span>
                              <span className="font-bold text-indigo-600">{cp.point}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400">Not configured</p>
                      )}
                    </div>

                    {/* Attachments */}
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                        </svg>
                        Files ({attachments.length})
                      </h3>
                      {attachments.length ? (
                        <ul className="space-y-1">
                          {attachments.map((file) => (
                            <li
                              key={file.id}
                              className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 px-2 py-1.5 text-xs hover:shadow-sm transition-all"
                            >
                              <span className="truncate pr-2 text-gray-700">{file.name}</span>
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 px-2 py-0.5 rounded bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold hover:shadow-md transition-all"
                              >
                                View
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-gray-400">No files</p>
                      )}
                    </div>
                  </div>
                </details>
              </div>

              {/* Tasks Section - Main Content */}
              <TaskTable
                tasks={tasks}
                onCreateClick={() => setShowForm(true)}
                canCreateTask={canCreateTask}
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
                    console.error("Failed to update status:", err);
                  }
                }}
                onTaskClick={(id) => navigate(`/tasks/${id}`)}
                isUserStoryDone={isDone}
              />
            </>
          )}

          {/* Task Form Modal */}
          {showForm && (
            <TaskFormModal
              onClose={() => setShowForm(false)}
              onSubmit={handleCreateTask}
              teamMembers={teamMembers}
              userStoryId={userStoryId}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default withPermissions(UserStoryDetail);
