import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import SprintService from "../services/sprintService";
import UserStoryService from "../services/userStoryService";

function SmallUSCard({ us, index, onOpen }) {
  return (
    <Draggable draggableId={`us-${us.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role="button"
          tabIndex={0}
          onClick={() => onOpen?.(us.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen?.(us.id);
            }
          }}
          className={`bg-white rounded-lg shadow p-3 mb-2 border flex items-center justify-between transition hover:bg-gray-50 ${
            snapshot.isDragging ? "opacity-80" : "cursor-pointer"
          }`}
        >
          <div className="text-sm">
            <div className="font-semibold">
              #{us.id} {us.title || us.name || "(no title)"}
            </div>
            <div className="text-xs opacity-70">{us.points ?? 0} pts</div>
          </div>
          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
            {us.status_label || "Backlog"}
          </span>
        </div>
      )}
    </Draggable>
  );
}

export default function Home() {
  const { currentProject } = useProject();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    deadline: dayjs().add(14, "day").format("YYYY-MM-DD"),
  });

  const projectId = currentProject?.id;

  const backlog = useMemo(
    () => userStories.filter((u) => !u.sprint_id),
    [userStories]
  );

  const usBySprint = useMemo(() => {
    const m = {};
    sprints.forEach((s) => (m[s.id] = []));
    userStories.forEach((u) => {
      if (u.sprint_id && m[u.sprint_id]) m[u.sprint_id].push(u);
    });
    return m;
  }, [userStories, sprints]);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      SprintService.getByProject(projectId),
      UserStoryService.getByProject(projectId),
    ])
      .then(([sRes, usRes]) => {
        setSprints(sRes.data || []);
        setUserStories(usRes.data || []);
      })
      .catch(() => toast.error("Không tải được dữ liệu Sprint / User Stories"))
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleOpenUserStory = (usId) => {
    if (!usId) return;
    navigate(`/user-stories/${usId}`);
  };

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.warn("Tên sprint không được trống");
    try {
      const payload = {
        project_id: projectId,
        name: form.name.trim(),
        deadline: form.deadline,
      };
      const res = await SprintService.create(payload);
      setSprints((prev) => [...prev, res.data]);
      setShowAddModal(false);
      setForm({
        name: "",
        deadline: dayjs().add(14, "day").format("YYYY-MM-DD"),
      });
      toast.success("Tạo sprint thành công");
    } catch (err) {
      toast.error("Tạo sprint thất bại");
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const src = source.droppableId;
    const dst = destination.droppableId;
    if (src === dst && source.index === destination.index) return;

    const usId = Number(draggableId.replace("us-", ""));

    const previousStories = userStories.map((u) => ({ ...u }));

    const applyLocalChange = (newSprintId) => {
      setUserStories((prev) =>
        prev.map((u) =>
          u.id === usId
            ? {
                ...u,
                sprint_id: newSprintId,
              }
            : u
        )
      );
    };

    try {
      if (dst === "backlog") {
        applyLocalChange(null);
        await SprintService.removeUserStory(usId);
      } else if (dst.startsWith("sprint-")) {
        const sprintId = Number(dst.replace("sprint-", ""));
        applyLocalChange(sprintId);
        await SprintService.addUserStory(sprintId, usId);
      }
    } catch (e) {
      setUserStories(previousStories);
      toast.error("Cập nhật sprint cho User Story thất bại");
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
            Scrum — {currentProject.name}
          </h1>
          <button
            className="px-3 py-2 rounded-xl bg-[var(--color-accent)] text-white hover:opacity-90"
            onClick={() => setShowAddModal(true)}
          >
            Add+
          </button>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-12 gap-6">
            {/* Backlog */}
            <div className="col-span-8">
              <div className="bg-gray-50 rounded-2xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold">Backlog</div>
                  <div className="text-sm opacity-70">
                    {backlog.length} user stories
                  </div>
                </div>

                <Droppable droppableId="backlog" isDropDisabled={false}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="min-h-[80px]"
                    >
                      {backlog.map((us, i) => (
                        <SmallUSCard
                          us={us}
                          index={i}
                          key={us.id}
                          onOpen={handleOpenUserStory}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Sprint panel */}
            <div className="col-span-4">
              <div className="space-y-4">
                {sprints.map((s) => {
                  const usList = usBySprint[s.id] || [];
                  const totalPts = usList.reduce(
                    (sum, u) => sum + (Number(u.points) || 0),
                    0
                  );
                  return (
                    <div
                      key={s.id}
                      className="rounded-2xl border bg-white overflow-hidden"
                    >
                      <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
                        <div className="font-semibold">
                          {s.name}{" "}
                          <span className="text-xs ml-2 opacity-70">
                            {dayjs(s.deadline).format("DD MMM YYYY")}
                          </span>
                        </div>
                        <div className="text-xs px-2 py-1 rounded bg-gray-100">
                          {totalPts} pts
                        </div>
                      </div>

                      <div className="p-3">
                        <Droppable
                          droppableId={`sprint-${s.id}`}
                          isDropDisabled={false}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="min-h-[40px]"
                            >
                              {usList.map((us, i) => (
                                <SmallUSCard
                                  us={us}
                                  index={i}
                                  key={us.id}
                                  onOpen={handleOpenUserStory}
                                />
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        <div className="pt-3 flex justify-end">
                          <Link
                            to={`/projects/${projectId}/sprints/${s.id}/taskboard`}
                            className="text-sm px-3 py-1 rounded-lg bg-[var(--color-secondary)] text-white hover:opacity-90"
                          >
                            Sprint Taskboard
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Add Sprint Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-[480px] p-6">
            <div className="text-lg font-semibold mb-4">Create Sprint</div>
            <form onSubmit={handleCreateSprint} className="space-y-4">
              <div>
                <label className="text-sm block mb-1">Name</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Sprint 1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm block mb-1">Deadline</label>
                <input
                  type="date"
                  className="w-full border rounded-lg px-3 py-2"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg border"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-[var(--color-primary)] text-white"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
