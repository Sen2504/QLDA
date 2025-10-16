import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";
import { toast } from "react-toastify";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";

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
  const isDone = (task.status || "").toUpperCase() === "DONE"; // ✅ kiểm tra trạng thái DONE

  const accentClass = {
    overdue: "border-l-4 border-red-500",
    soon: "border-l-4 border-amber-500",
    later: "border-l-4 border-sky-500",
    none: "border-l-4 border-gray-200",
  }[dueInfo.key] || "border-l-4 border-gray-200";

  const assignees = Array.isArray(task.assignees)
    ? task.assignees
    : task.assignee
    ? [task.assignee]
    : [];

  return (
    <Draggable
      draggableId={`task-${task.id}`}
      index={index}
      isDragDisabled={isDone} // ✅ khóa drag nếu task DONE
    >
      {(provided) => (
        <div
          className={`bg-white border rounded-lg shadow p-3 mb-2 text-sm transition-all ${
            accentClass
          } ${isDone ? "opacity-70 cursor-not-allowed" : "cursor-grab"}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...(!isDone ? provided.dragHandleProps : {})} // ❌ loại drag handle khi DONE
        >
          <div className="font-medium flex justify-between items-center">
            <span>
              #{task.id} {task.title || task.name || "(no title)"}
            </span>
            {isDone && (
              <span className="text-[10px] text-emerald-600 font-semibold ml-2">
                ✓
              </span>
            )}
          </div>

          <div className="text-[11px] text-gray-600 leading-snug">
            {assignees.length > 0 ? (
              assignees.map((assignee) => (
                <div
                  key={`card-${task.id}-assignee-${assignee.team_id || assignee.user_id || assignee.user_email}`}
                >
                  {assignee.user_name ||
                    assignee.name ||
                    assignee.user_email ||
                    assignee.email ||
                    "Ẩn danh"}
                  {assignee.role_name && (
                    <span className="ml-1 text-gray-400">
                      ({assignee.role_name})
                    </span>
                  )}
                </div>
              ))
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>

          {dueInfo.dueDate && (
            <div className="mt-2 flex items-center gap-2 text-[11px]">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${dueInfo.badgeClass}`}
              >
                {dueInfo.label}
              </span>
              <span className="text-gray-500">
                {describeDiffDays(dueInfo.diffDays)} • {dueInfo.dueDisplay}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => onOpenTask?.(task.id)}
            className="mt-3 inline-flex items-center text-[11px] text-emerald-600 hover:text-emerald-700"
          >
            ↗ Detail
          </button>
        </div>
      )}
    </Draggable>
  );
}

export default function SprintBoard() {
  const { projectId, sprintId } = useParams();
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [userStories, setUserStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);

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
      .catch(() => toast.error("Unable to load Sprint Taskboard"));
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
      await TaskService.update(taskId, {
        status_id: payloadStatusId,
        user_story_id: newUSId,
      });
    } catch {
      toast.error("Update task failed");
      setTasks(prev);
    }
  };

  if (!currentProject) {
    return (
      <MainLayout>
        <div className="p-6">Select a project to continue.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">
            Sprint Taskboard — {currentProject.name} (Sprint #{sprintId})
          </h1>
          <button
            className="px-3 py-2 rounded-lg border"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>

        {/* --- HEADER: SPRINT PROGRESS --- */}
        <div className="bg-slate-800 text-white rounded-xl shadow mb-5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold tracking-wide uppercase text-gray-300">
                  Sprint Progress
                </span>
                <span className="text-sm font-semibold">
                  {sprintSummary.percent}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${sprintSummary.percent}%` }}
                ></div>
              </div>
            </div>

            <div className="flex flex-wrap gap-5 text-sm mt-3 sm:mt-0">
              <div className="flex flex-col items-center">
                <span className="text-gray-300 text-xs">User Stories</span>
                <span className="font-semibold text-lg">
                  {sprintSummary.totalStories}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-300 text-xs">Total Points</span>
                <span className="font-semibold text-lg">
                  {sprintSummary.totalPoints}
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-gray-300 text-xs">Tasks</span>
                <span className="font-semibold text-lg">
                  {sprintSummary.doneTasks}/{sprintSummary.totalTasks}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- GRID BOARD --- */}
        <div className="grid grid-cols-6 gap-2 mb-2">
          <div className="text-xs font-semibold px-2 py-2">USER STORY</div>
          {statuses.map((status) => (
            <div
              key={status.id}
              className="text-xs font-semibold px-2 py-2 text-center"
            >
              {status.name_status}
            </div>
          ))}
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          {userStories.map((us) => (
            <div key={us.id} className="grid grid-cols-6 gap-2 mb-4">
              <div className="px-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/user-stories/${us.id}`)}
                  className="bg-gray-50 border rounded-xl p-3 h-full cursor-pointer hover:bg-gray-100"
                >
                  <div className="text-sm font-semibold mb-1">
                    #{us.id} {us.title || us.name}
                  </div>
                  <div className="text-xs opacity-70">
                    {us.total_points ?? 0} pts
                  </div>
                  {storyStats[us.id]?.total > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {storyStats[us.id].done}/{storyStats[us.id].total} tasks done (
                      {storyStats[us.id].percent}%)
                    </div>
                  )}
                </div>
              </div>

              {statuses.map((status) => {
                const statusKey = status.id;
                const droppableId = `${statusKey}::${us.id}`;
                const items = grid[us.id]?.[statusKey] || [];
                return (
                  <Droppable
                    droppableId={droppableId}
                    key={droppableId}
                    isDropDisabled={false}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="bg-gray-50 border rounded-xl p-2 min-h-[120px]"
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
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          ))}
        </DragDropContext>

        {userStories.length === 0 && (
          <div className="text-sm opacity-70 mt-6">
            This Sprint does not have a User Story yet.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
