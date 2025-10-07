import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";
import { toast } from "react-toastify";

const FALLBACK_STATUSES = [
  { id: "NEW", rawId: null, name_status: "NEW" },
  { id: "IN_PROGRESS", rawId: null, name_status: "IN PROGRESS" },
  { id: "READY_FOR_TEST", rawId: null, name_status: "READY FOR TEST" },
  { id: "CLOSED", rawId: null, name_status: "CLOSED" },
  { id: "NEEDS_INFO", rawId: null, name_status: "NEEDS INFO" },
];

function TaskCard({ task, index }) {
  return (
    <Draggable draggableId={`task-${task.id}`} index={index}>
      {(provided) => (
        <div
          className="bg-white border rounded-lg shadow p-2 mb-2 text-sm"
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <div className="font-medium">
            #{task.id} {task.title || task.name || "(no title)"}
          </div>
          <div className="text-xs opacity-70">
            {task.assignee_name || "Unassigned"}
          </div>
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
        toast.warn("Không tải được danh sách trạng thái task, dùng mặc định");
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
      .catch(() => toast.error("Không tải được Sprint Taskboard"));
  }, [currentProject, projectId, sprintId]);

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
      toast.error("Không thể cập nhật trạng thái do thiếu cấu hình task status");
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
      toast.error("Cập nhật task thất bại");
    }
  };

  if (!currentProject) {
    return (
      <MainLayout>
        <div className="p-6">Chọn một project để tiếp tục.</div>
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
                <div className="bg-gray-50 border rounded-xl p-3 h-full">
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
                          <TaskCard task={task} index={idx} key={task.id} />
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
            Sprint này chưa có User Story.
          </div>
        )}
      </div>
    </MainLayout>
  );
}
