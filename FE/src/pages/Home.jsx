import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  PlusCircle,
  Calendar,
  ClipboardList,
  Layers,
  Clock,
  TrendingUp,
  Loader2,
} from "lucide-react";

import { useProject } from "../store/ProjectContext";
import SprintService from "../services/sprintService";
import UserStoryService from "../services/userStoryService";
import TaskService from "../services/taskService";
import { usePermission, usePermissions } from "../store/PermissionContext";
import withPermissions from "../components/withPermissions";
import MyTaskCalendar from "../components/MyTaskCalendar";

function SmallUSCard({ us, index, onOpen }) {
  return (
    <Draggable draggableId={`us-${us.id}`} index={index}>
      {(provided, snapshot) => {
        const style = {
          ...provided.draggableProps.style,
          ...(snapshot.isDragging
            ? {
                zIndex: 9999,
                boxShadow:
                  "0 10px 20px rgba(16,185,129,0.25), 0 5px 10px rgba(0,0,0,0.1)",
              }
            : {}),
        };

        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => !snapshot.isDragging && onOpen?.(us.id)}
            style={style}
            className={`group bg-white rounded-lg px-2.5 py-2 mb-1.5 border flex items-center justify-between select-none transition-all duration-200 ${
              snapshot.isDragging
                ? "border-emerald-400 opacity-90 cursor-grabbing"
                : "shadow-sm border-gray-200 hover:border-emerald-400 hover:shadow-md cursor-grab"
            }`}
          >
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <div
                className={`p-1 rounded-md ${
                  snapshot.isDragging
                    ? "bg-emerald-200"
                    : "bg-emerald-100 group-hover:bg-emerald-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs truncate text-gray-800 group-hover:text-emerald-600">
                  #{us.id} {us.title || us.name}
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-500" />
                  {us.total_points ?? 0} pts
                </div>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium whitespace-nowrap">
              {us.status_label || "Backlog"}
            </span>
          </div>
        );
      }}
    </Draggable>
  );
}

function Home() {
  const { currentProject } = useProject();
  const navigate = useNavigate();

  const canCreateSprint = usePermission("Sprint", "Create");
  const canCreateUserStory = usePermission("UserStory", "Create");
  const { loading: permissionsLoading } = usePermissions();

  const fetchedProjectIdRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("board");
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

  // LOAD DATA
  useEffect(() => {
    if (!projectId) {
      fetchedProjectIdRef.current = null;
      return;
    }
    if (permissionsLoading) return;
    if (fetchedProjectIdRef.current === projectId) return;
    fetchedProjectIdRef.current = projectId;

    setLoading(true);
    Promise.allSettled([
      SprintService.getByProject(projectId),
      UserStoryService.getByProject(projectId),
      TaskService.getMyTasks(),
    ])
      .then(([sRes, usRes, myTaskRes]) => {
        setSprints(sRes.value?.data || []);
        setUserStories(usRes.value?.data || []);
        const allMyTasks = myTaskRes.value?.data || [];
        setMyTasks(allMyTasks.filter((t) => t.project_id === projectId));
      })
      .finally(() => setLoading(false));
  }, [projectId, permissionsLoading]);

  // HANDLERS
  const handleOpenUserStory = (id) => navigate(`/user-stories/${id}`);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.warn("Tên sprint không được trống");
      return;
    }
    
    try {
      const payload = {
        project_id: projectId,
        name: form.name.trim(),
        deadline: form.deadline,
      };
      const res = await SprintService.create(payload);
      
      if (res?.data) {
        setSprints((prev) => [...prev, res.data]);
        toast.success("Tạo sprint thành công");
        setShowAddModal(false);
        setForm({
          name: "",
          deadline: dayjs().add(14, "day").format("YYYY-MM-DD"),
        });
      }
    } catch (err) {
      // API interceptor đã hiển thị toast.error
      console.error("Failed to create sprint:", err);
    }
  };

  const onDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const usId = Number(draggableId.replace("us-", ""));
    const prev = [...userStories];

    const applyLocalChange = (newSprintId) =>
      setUserStories((prev) =>
        prev.map((u) => (u.id === usId ? { ...u, sprint_id: newSprintId } : u))
      );

    try {
      if (destination.droppableId === "backlog") {
        applyLocalChange(null);
        await SprintService.removeUserStory(usId);
      } else {
        const sprintId = Number(destination.droppableId.replace("sprint-", ""));
        applyLocalChange(sprintId);
        await SprintService.addUserStory(sprintId, usId);
      }
    } catch (err) {
      setUserStories(prev);
      // Chỉ hiển thị toast nếu không phải lỗi 403 (API interceptor đã xử lý)
      const status = err?.response?.status;
      if (status !== 403) {
        toast.error("Update sprint for User Story failed");
      }
    }
  };

  // UI ------------------------
  if (!currentProject)
    return (
      <div className="h-screen flex items-center justify-center text-gray-600">
        No project selected.
      </div>
    );

  if (loading || permissionsLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-600">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2" />
        Loading...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-emerald-200 shadow-sm px-4 py-2 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-emerald-600" />
          <div>
            <h1 className="text-lg font-bold text-emerald-700">Scrum Board</h1>
            <p className="text-xs text-gray-500">{currentProject.name}</p>
          </div>
        </div>
        {canCreateSprint && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:from-emerald-600 hover:to-teal-600 shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4 inline mr-1" />
            New Sprint
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab("board")}
          className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            activeTab === "board"
              ? "bg-emerald-500 text-white shadow"
              : "bg-white text-gray-700 border border-gray-200 hover:border-emerald-300"
          }`}
        >
          Scrum Board
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
            activeTab === "tasks"
              ? "bg-blue-500 text-white shadow"
              : "bg-white text-gray-700 border border-gray-200 hover:border-blue-300"
          }`}
        >
          My Tasks
        </button>
      </div>

      {activeTab === "board" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* BACKLOG */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3">
              <div className="flex items-center justify-between mb-2 border-b border-emerald-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-semibold text-sm text-emerald-700">
                    Product Backlog
                  </h3>
                  <span className="text-xs bg-emerald-500 text-white px-2 rounded-full font-bold">
                    {backlog.length}
                  </span>
                </div>
                {canCreateUserStory && (
                  <button
                    onClick={() => navigate("/user-stories/new")}
                    className="px-2 py-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold hover:from-emerald-600 hover:to-teal-600"
                  >
                    <PlusCircle className="w-3.5 h-3.5 inline mr-1" />
                    New User Story
                  </button>
                )}
              </div>
              <Droppable droppableId="backlog">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[150px] rounded-lg p-2 ${
                      snapshot.isDraggingOver
                        ? "bg-emerald-50 border border-dashed border-emerald-300"
                        : "bg-gray-50"
                    }`}
                  >
                    {backlog.length === 0 && !snapshot.isDraggingOver ? (
                      <p className="text-center text-xs text-gray-500 py-6">
                        Empty backlog
                      </p>
                    ) : (
                      backlog.map((us, i) => (
                        <SmallUSCard
                          us={us}
                          index={i}
                          key={us.id}
                          onOpen={handleOpenUserStory}
                        />
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* SPRINTS */}
            <div className="space-y-2.5">
              {sprints.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 text-center">
                  <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No sprints yet</p>
                </div>
              ) : (
                sprints.map((s) => {
                  const usList = usBySprint[s.id] || [];
                  const totalPts = usList.reduce(
                    (sum, u) => sum + (Number(u.total_points) || 0),
                    0
                  );
                  return (
                    <div
                      key={s.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm"
                    >
                      <div className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-between rounded-t-xl">
                        <div className="text-sm font-semibold text-white truncate">
                          {s.name}
                        </div>
                        <div className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-medium">
                          {totalPts} pts
                        </div>
                      </div>

                      <Droppable droppableId={`sprint-${s.id}`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`min-h-[60px] p-2 ${
                              snapshot.isDraggingOver
                                ? "bg-emerald-50 border border-dashed border-emerald-300"
                                : "bg-gray-50"
                            }`}
                          >
                            {usList.length === 0 && !snapshot.isDraggingOver ? (
                              <p className="text-center text-xs text-gray-500 py-4">
                                Drag stories here
                              </p>
                            ) : (
                              usList.map((us, i) => (
                                <SmallUSCard
                                  us={us}
                                  index={i}
                                  key={us.id}
                                  onOpen={handleOpenUserStory}
                                />
                              ))
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      <div className="px-3 py-1.5 text-right">
                        <Link
                          to={`/projects/${projectId}/sprints/${s.id}/taskboard`}
                          className="text-xs text-emerald-600 font-medium hover:underline"
                        >
                          Open Taskboard →
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </DragDropContext>
      ) : (
        <MyTaskCalendar tasks={myTasks} />
      )}

      {/* Modal Create Sprint */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Create New Sprint</h3>
                  <p className="text-sm text-emerald-50">Add a sprint to your project</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <form onSubmit={handleCreateSprint} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sprint Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sprint 1, Q4 Sprint..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deadline
                </label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withPermissions(Home);
