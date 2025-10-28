import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";
import SprintService from "../services/sprintService";
import { toast } from "react-toastify";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import PermissionGuard from "../components/PermissionGuard";
import withPermissions from "../components/withPermissions";
import { usePermission } from "../store/PermissionContext";
import ConfirmDialog from "../components/ConfirmDialog";
import { 
  ArrowLeft, 
  Calendar, 
  Target, 
  CheckCircle2, 
  ListTodo,
  Sparkles,
  TrendingUp,
  Clock,
  Users2,
  Trash2
} from "lucide-react";

const FALLBACK_STATUSES = [
  { id: "NEW", rawId: null, name_status: "NEW" },
  { id: "IN_PROGRESS", rawId: null, name_status: "IN PROGRESS" },
  { id: "READY_FOR_TEST", rawId: null, name_status: "READY FOR TEST" },
  { id: "TEST", rawId: null, name_status: "TEST" },
  { id: "NEEDS_INFO", rawId: null, name_status: "NEEDS INFO" },
  { id: "DONE", rawId: null, name_status: "DONE" }, // ✅ đảm bảo có DONE
  { id: "CLOSED", rawId: null, name_status: "CLOSED" },
];

function TaskCard({ task, index, onOpenTask }) {
  const dueInfo = evaluateDueDate(task.due_date);
  const isDone = (task.status || "").toUpperCase() === "DONE";

  const accentGradient = {
    overdue: "from-red-500 to-rose-600",
    soon: "from-amber-500 to-orange-600",
    later: "from-sky-500 to-blue-600",
    none: "from-gray-400 to-gray-500",
  }[dueInfo.key] || "from-gray-400 to-gray-500";

  const assignees = Array.isArray(task.assignees)
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : [];

  return (
    <Draggable
      draggableId={`task-${task.id}`}
      index={index}
      isDragDisabled={isDone}
    >
      {(provided, snapshot) => (
        <div
          className={`group relative bg-white rounded-lg shadow-sm hover:shadow-lg border border-gray-200 
            transition-all duration-200 mb-2 overflow-hidden cursor-pointer
            ${isDone ? "opacity-60" : "hover:border-indigo-300"}
            ${snapshot.isDragging ? "shadow-2xl ring-2 ring-indigo-400 rotate-2" : ""}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(!isDone ? provided.dragHandleProps : {})}
          onClick={(e) => {
            // Chỉ mở detail khi click vào card, không phải khi drag
            if (!snapshot.isDragging && e.target.tagName !== 'BUTTON') {
              onOpenTask?.(task.id);
            }
          }}
        >
          {/* Accent bar */}
          <div className={`h-1 bg-gradient-to-r ${accentGradient}`} />
          
          <div className="p-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-indigo-600 mb-1">
                  #{task.id}
                </div>
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                  {task.title || task.name || "(no title)"}
                </h4>
              </div>
              {isDone && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}
            </div>

            {/* Assignees */}
            <div className="mb-2">
              {assignees.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {assignees.slice(0, 2).map((assignee, idx) => (
                    <div
                      key={`card-${task.id}-assignee-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-50 to-pink-50 
                        rounded-full text-[10px] font-medium text-purple-700"
                    >
                      <Users2 className="w-3 h-3" />
                      <span className="truncate max-w-[80px]">
                        {assignee.user_name || assignee.name || assignee.user_email || assignee.email || "Ẩn danh"}
                      </span>
                    </div>
                  ))}
                  {assignees.length > 2 && (
                    <div className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-full text-[10px] font-medium text-gray-600">
                      +{assignees.length - 2}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[10px] text-gray-400 italic">Unassigned</span>
              )}
            </div>

            {/* Due date */}
            {dueInfo.dueDate && (
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className={`text-[10px] font-semibold ${
                  dueInfo.key === 'overdue' ? 'text-red-600' : 
                  dueInfo.key === 'soon' ? 'text-amber-600' : 'text-gray-600'
                }`}>
                  {describeDiffDays(dueInfo.diffDays)}
                </span>
              </div>
            )}

            {/* Detail hint */}
            <div className="text-[10px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <span>Click to view detail</span>
              <span>→</span>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

function SprintBoard() {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const { currentProject } = useProject();
  const canEditTask = usePermission('Task', 'Edit');
  const canDeleteSprint = usePermission('Sprint', 'Delete');

  const [userStories, setUserStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);
  const [showDeleteSprintConfirm, setShowDeleteSprintConfirm] = useState(false);
  const [pendingDragResult, setPendingDragResult] = useState(null);

  useEffect(() => {
    TaskStatusService.getAll()
      .then((res) => {
        const list = (res.data || []).map((status) => ({
          id: String(status.id),
          rawId: status.id,
          name_status: status.name_status,
        }));
        if (list.length) setStatuses(list);
      })
      .catch(() => {
        toast.warn("Unable to load task status list, using default");
        setStatuses(FALLBACK_STATUSES);
      });
  }, []);

  // ---- BUILD GRID ----
  const grid = useMemo(() => {
    const perUS = {};
    userStories.forEach((u) => {
      perUS[u.id] = {};
      statuses.forEach((status) => {
        perUS[u.id][status.id] = [];
      });
    });
    tasks.forEach((t) => {
      const sid = t.user_story_id;
      const statusMatchById = statuses.find(
        (status) =>
          status.rawId !== null && String(status.rawId) === String(t.status_id)
      );
      const statusMatchByName = statuses.find(
        (status) =>
          status.name_status?.toUpperCase() === (t.status || "").toUpperCase()
      );
      const fallbackKey = statuses[0]?.id;
      const statusKey =
        statusMatchById?.id || statusMatchByName?.id || fallbackKey;
      if (statusKey && perUS[sid]?.[statusKey]) {
        perUS[sid][statusKey].push(t);
      }
    });
    return perUS;
  }, [userStories, tasks, statuses]);

  // ---- LOAD DATA ----
  useEffect(() => {
    if (!currentProject) return;
    Promise.all([
      UserStoryService.getByProject(projectId).then((res) =>
        (res.data || []).filter(
          (u) => Number(u.sprint_id) === Number(sprintId)
        )
      ),
      TaskService.getByProject?.(projectId)?.then((res) => res.data || []),
    ])
      .then(([usList, taskList]) => {
        setUserStories(usList);
        const ids = new Set(usList.map((u) => u.id));
        setTasks(taskList.filter((t) => ids.has(t.user_story_id)));
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (status !== 403) {
          toast.error("Không tải được Sprint Taskboard");
        }
      });
  }, [currentProject, projectId, sprintId]);

  // ---- TÍNH TIẾN ĐỘ ----
  const storyStats = useMemo(() => {
    const stats = {};
    userStories.forEach((us) => {
      const related = tasks.filter((t) => t.user_story_id === us.id);
      const done = related.filter(
        (t) => (t.status || "").toUpperCase() === "DONE"
      );
      const percent =
        related.length > 0
          ? Math.round((done.length / related.length) * 100)
          : 0;
      stats[us.id] = {
        total: related.length,
        done: done.length,
        percent,
        points: Number(us.total_points || 0),
      };
    });
    return stats;
  }, [userStories, tasks]);

  const sprintSummary = useMemo(() => {
    if (!userStories.length)
      return { percent: 0, totalPoints: 0, doneTasks: 0, totalTasks: 0 };

    let totalPoints = 0;
    let weightedDonePoints = 0;
    let totalTasks = 0;
    let doneTasks = 0;

    userStories.forEach((us) => {
      const st = storyStats[us.id];
      if (!st) return;
      totalPoints += st.points;
      weightedDonePoints += (st.percent / 100) * st.points;
      totalTasks += st.total;
      doneTasks += st.done;
    });

    const percent =
      totalPoints > 0
        ? Math.round((weightedDonePoints / totalPoints) * 100)
        : 0;

    return {
      percent,
      totalPoints,
      doneTasks,
      totalTasks,
      totalStories: userStories.length,
    };
  }, [userStories, storyStats]);

  // ---- DRAG DROP ----
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    const [dstStatusKey, dstUS] = destination.droppableId.split("::");
    const [srcStatusKey, srcUS] = source.droppableId.split("::");

    if (
      dstStatusKey === srcStatusKey &&
      dstUS === srcUS &&
      destination.index === source.index
    )
      return;

    const taskId = Number(draggableId.replace("task-", ""));
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // ✅ Nếu task đã DONE thì không cho di chuyển nữa
    if ((task.status || "").toUpperCase() === "DONE") {
      toast.warn("Task đã hoàn thành, không thể thay đổi trạng thái nữa!");
      return;
    }

    const statusObj = statuses.find((status) => status.id === dstStatusKey);
    const payloadStatusId =
      typeof statusObj?.rawId === "number" ? statusObj.rawId : null;
    const newUSId = Number(dstUS);

    if (!statusObj || payloadStatusId === null) {
      toast.error("Unable to update status due to missing task status configuration");
      return;
    }

    // ✅ Kiểm tra nếu kéo sang DONE -> hiện popup xác nhận
    if (statusObj.name_status.toUpperCase() === "DONE") {
      setPendingDragResult({ result, statusObj, payloadStatusId, newUSId, taskId, task });
      setShowDoneConfirm(true);
      return;
    }

    // Xử lý drag thông thường (không phải DONE)
    await performTaskUpdate(taskId, task, payloadStatusId, statusObj, newUSId);
  };

  // ✅ Hàm xử lý update task (tách riêng để tái sử dụng)
  const performTaskUpdate = async (taskId, task, payloadStatusId, statusObj, newUSId) => {
    const prev = [...tasks];
    setTasks((p) =>
      p.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status_id: payloadStatusId,
              status: statusObj.name_status || t.status,
              user_story_id: newUSId,
            }
          : t
      )
    );

    try {
      const res = await TaskService.update(taskId, {
        status_id: payloadStatusId,
        user_story_id: newUSId,
      });
      if (res?.data) {
        const updatedTask = res.data;
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, ...updatedTask } : t))
        );
      }
      toast.success("Task updated successfully!");
    } catch (e) {
      setTasks(prev);
      const status = e?.response?.status;
      if (status !== 403) {
        toast.error("Cập nhật task thất bại");
      }
    }
  };

  // ✅ Xác nhận đánh dấu DONE
  const handleConfirmDone = async () => {
    if (!pendingDragResult) return;
    
    const { taskId, task, payloadStatusId, statusObj, newUSId } = pendingDragResult;
    
    setShowDoneConfirm(false);
    setPendingDragResult(null);
    
    await performTaskUpdate(taskId, task, payloadStatusId, statusObj, newUSId);
  };

  // ✅ Hủy đánh dấu DONE
  const handleCancelDone = () => {
    setShowDoneConfirm(false);
    setPendingDragResult(null);
  };

  // 🗑️ Xóa sprint
  const handleDeleteSprint = async () => {
    try {
      await SprintService.delete(sprintId);
      toast.success("Sprint deleted successfully");
      navigate("/"); // Navigate back to home
    } catch (error) {
      console.error("Failed to delete sprint:", error);
      // API interceptor will show the error toast
    }
  };

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Select a project to continue</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="px-4 py-5 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sprint Taskboard
              </h1>
            </div>
            <p className="text-sm text-gray-600 ml-11">
              {currentProject.name} • Sprint #{sprintId}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {canDeleteSprint && (
              <button
                onClick={() => setShowDeleteSprintConfirm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg 
                  shadow-md hover:shadow-lg hover:from-red-600 hover:to-pink-600 transition-all text-sm font-semibold"
                title="Delete sprint"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Sprint</span>
              </button>
            )}
            <button
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 
                shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-sm font-medium text-gray-700"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Sprint Progress Card */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl mb-5 p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            {/* Progress Bar */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-semibold tracking-wide">SPRINT PROGRESS</span>
                </div>
                <span className="text-2xl font-bold">{sprintSummary.percent}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden backdrop-blur-sm">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-green-400 h-3 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{ width: `${sprintSummary.percent}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 lg:gap-8">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <ListTodo className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/80 font-medium">User Stories</div>
                  <div className="text-xl font-bold">{sprintSummary.totalStories}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/80 font-medium">Total Points</div>
                  <div className="text-xl font-bold">{sprintSummary.totalPoints}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-white/80 font-medium">Tasks Done</div>
                  <div className="text-xl font-bold">
                    {sprintSummary.doneTasks}/{sprintSummary.totalTasks}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Board Header */}
        <div className="grid grid-cols-[280px_repeat(6,1fr)] gap-3 mb-3 px-2">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>User Story</span>
          </div>
          {statuses.map((status) => (
            <div
              key={status.id}
              className="text-xs font-bold text-gray-500 uppercase tracking-wider text-center"
            >
              {status.name_status}
            </div>
          ))}
        </div>

        {/* Taskboard Grid */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-3">
            {userStories.map((us) => (
              <div key={us.id} className="grid grid-cols-[280px_repeat(6,1fr)] gap-3">
                {/* User Story Card */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/user-stories/${us.id}`)}
                  className="group bg-white rounded-xl border border-gray-200 p-4 cursor-pointer 
                    hover:shadow-lg hover:border-indigo-300 transition-all duration-200 h-full"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-indigo-600 mb-1">
                        #{us.id}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                        {us.title || us.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                      <Target className="w-3 h-3 text-amber-600" />
                      <span className="text-xs font-semibold text-amber-700">
                        {us.total_points ?? 0} pts
                      </span>
                    </div>
                  </div>

                  {storyStats[us.id]?.total > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-500 font-medium">Progress</span>
                        <span className="text-[10px] font-bold text-indigo-600">
                          {storyStats[us.id].percent}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${storyStats[us.id].percent}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {storyStats[us.id].done}/{storyStats[us.id].total} tasks
                      </div>
                    </div>
                  )}
                </div>

                {/* Status Columns */}
                {statuses.map((status) => {
                  const statusKey = status.id;
                  const droppableId = `${statusKey}::${us.id}`;
                  const items = grid[us.id]?.[statusKey] || [];
                  const isDoneColumn = status.name_status.toUpperCase() === "DONE";
                  
                  return (
                    <Droppable
                      droppableId={droppableId}
                      key={droppableId}
                      isDropDisabled={false}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`rounded-xl p-2.5 min-h-[140px] transition-all duration-200
                            ${snapshot.isDraggingOver 
                              ? 'bg-gradient-to-br from-indigo-100 to-purple-100 ring-2 ring-indigo-400' 
                              : isDoneColumn
                              ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
                              : 'bg-gray-50/50'
                            }
                            ${items.length === 0 ? 'border-2 border-dashed border-gray-200' : 'border border-gray-200'}
                          `}
                        >
                          {items.map((task, idx) => (
                            <TaskCard
                              task={task}
                              index={idx}
                              key={task.id}
                              onOpenTask={(id) => navigate(`/tasks/${id}`)}
                            />
                          ))}
                          {provided.placeholder}
                          {items.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs text-gray-300 font-medium">Empty</span>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  );
                })}
              </div>
            ))}
          </div>
        </DragDropContext>

        {userStories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
              <ListTodo className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">This Sprint does not have a User Story yet</p>
          </div>
        )}
      </div>

      {/* ✅ Popup xác nhận DONE */}
      {showDoneConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header với gradient */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Mark Task as Done?</h3>
                  <p className="text-sm text-emerald-50">Confirm task completion</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900 mb-1">
                      ⚠️ Warning: This action is permanent
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      Once marked as DONE, this task cannot be moved or modified anymore. 
                      Please ensure the task is truly completed.
                    </p>
                  </div>
                </div>
              </div>

              {pendingDragResult?.task && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-xs font-semibold text-indigo-600 mb-1">
                    Task #{pendingDragResult.task.id}
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {pendingDragResult.task.title || pendingDragResult.task.name || "(no title)"}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDone}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 
                    rounded-xl font-semibold transition-all duration-200 border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDone}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 
                    hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold 
                    transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Sprint Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteSprintConfirm}
        onClose={() => setShowDeleteSprintConfirm(false)}
        onConfirm={handleDeleteSprint}
        title="Delete Sprint"
        message={`Are you sure you want to delete Sprint #${sprintId}?`}
        warningMessage="All user stories in this sprint will be unassigned (moved back to backlog). Tasks will remain but will need to be reassigned to other sprints."
        confirmText="Delete Sprint"
      />
    </div>
  );
}

export default withPermissions(SprintBoard);
