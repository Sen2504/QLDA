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
  { id: "CLOSED", rawId: null, name_status: "CLOSED" },
];

function TaskCard({ task, index, onOpenTask }) {
  const dueInfo = evaluateDueDate(task.due_date);
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
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided) => (
        <div
          className={`bg-white border rounded-lg shadow p-3 mb-2 text-sm ${accentClass}`}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="font-medium">
            #{task.id} {task.title || task.name || "(no title)"}
          </div>
          <div className="text-[11px] text-gray-600 leading-snug">
            {assignees.length > 0 ? (
              assignees.map((assignee) => (
                <div key={`card-${task.id}-assignee-${assignee.team_id || assignee.user_id || assignee.user_email}`}>
                  {assignee.user_name || assignee.name || assignee.user_email || assignee.email || "Ẩn danh"}
                  {assignee.role_name && (
                    <span className="ml-1 text-gray-400">({assignee.role_name})</span>
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
        if (list.length) {
          setStatuses(list);
        }
      })
      .catch(() => {
        toast.warn("Unable to load task status list, using default");
        setStatuses(FALLBACK_STATUSES);
      });
  }, []);

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

  const handleOpenUserStory = (userStoryId) => {
    if (!userStoryId) return;
    navigate(`/user-stories/${userStoryId}`);
  };

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
    const statusObj = statuses.find((status) => status.id === dstStatusKey);
    const payloadStatusId =
      typeof statusObj?.rawId === "number" ? statusObj.rawId : null;
    const newUSId = Number(dstUS);

    if (!statusObj || payloadStatusId === null) {
      toast.error("Unable to update status due to missing task status configuration");
      return;
    }

    const previousTasks = tasks.map((task) => ({ ...task }));

    setTasks((prev) =>
      prev.map((t) =>
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
    } catch (e) {
      setTasks(previousTasks);
      toast.error("Update task failed");
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
                  onClick={() => handleOpenUserStory(us.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenUserStory(us.id);
                    }
                  }}
                  className="bg-gray-50 border rounded-xl p-3 h-full cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-secondary)]"
                >
                  <div className="text-sm font-semibold mb-1">
                    #{us.id} {us.title || us.name}
                  </div>
                  <div className="text-xs opacity-70">{us.points ?? 0} pts</div>
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
