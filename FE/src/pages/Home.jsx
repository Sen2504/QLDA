import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { 
  PlusCircle, 
  Calendar, 
  CheckCircle2, 
  ClipboardList, 
  TrendingUp,
  Layers,
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";

import { useProject } from "../store/ProjectContext";
import SprintService from "../services/sprintService";
import UserStoryService from "../services/userStoryService";
import TaskService from "../services/taskService";
import { evaluateDueDate } from "../utils/dueDate";
import { usePermission, usePermissions } from "../store/PermissionContext";
import withPermissions from "../components/withPermissions";

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
          className={`group bg-white rounded-lg shadow-sm hover:shadow-md p-3 mb-2 border border-gray-200 hover:border-emerald-300 flex items-center justify-between transition-all duration-200 ${
            snapshot.isDragging ? "opacity-80 shadow-lg rotate-2" : "cursor-pointer"
          }`}
        >
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="mt-0.5 p-1 rounded bg-gradient-to-br from-emerald-100 to-teal-100 group-hover:from-emerald-200 group-hover:to-teal-200 transition-colors">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-gray-800 group-hover:text-emerald-600 transition-colors truncate">
                #{us.id} {us.title || us.name || "(no title)"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {us.total_points ?? 0} pts
              </div>
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-md font-medium border border-gray-200 whitespace-nowrap">
            {us.status_label || "Backlog"}
          </span>
        </div>
      )}
    </Draggable>
  );
}

function Home() {
  const { currentProject } = useProject();
  const navigate = useNavigate();
  
  // Permission checks
  const canCreateSprint = usePermission("Sprint", "Create");
  const canCreateUserStory = usePermission("UserStory", "Create");
  const { loading: permissionsLoading } = usePermissions();
  
  // useRef để chặn duplicate calls
  const fetchedProjectIdRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [sprints, setSprints] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
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

  // -------------------- LOAD DATA --------------------
  useEffect(() => {
    if (!projectId) {
      fetchedProjectIdRef.current = null;
      return;
    }
    
    // Đợi permissions load xong trước khi fetch data
    if (permissionsLoading) return;
    
    // Nếu project mới, reset ref
    if (fetchedProjectIdRef.current !== projectId) {
      fetchedProjectIdRef.current = projectId;
    } else {
      // Đã fetch project này rồi
      return;
    }
    
    setLoading(true);
    
    // Fetch data với error handling riêng cho từng service
    Promise.allSettled([
      SprintService.getByProject(projectId),
      UserStoryService.getByProject(projectId),
      TaskService.getMyTasks(),
    ])
      .then(([sRes, usRes, myTaskRes]) => {
        // Xử lý Sprints
        if (sRes.status === "fulfilled") {
          setSprints(sRes.value?.data || []);
        } else {
          console.error("Failed to load sprints:", sRes.reason);
          setSprints([]);
        }

        // Xử lý User Stories
        if (usRes.status === "fulfilled") {
          setUserStories(usRes.value?.data || []);
        } else {
          console.error("Failed to load user stories:", usRes.reason);
          setUserStories([]);
        }

        // Xử lý My Tasks
        if (myTaskRes.status === "fulfilled") {
          const allMyTasks = myTaskRes.value?.data || [];
          const tasksInProject = allMyTasks.filter(
            (t) => t.project_id === projectId
          );
          setMyTasks(tasksInProject);
        } else {
          console.error("Failed to load my tasks:", myTaskRes.reason);
          setMyTasks([]);
        }

        // Nếu tất cả đều fail thì mới hiện toast error
        if (sRes.status === "rejected" && usRes.status === "rejected" && myTaskRes.status === "rejected") {
          toast.error("Không tải được dữ liệu. Vui lòng kiểm tra quyền truy cập.");
        }
      })
      .finally(() => setLoading(false));
  }, [projectId, permissionsLoading]);

  // -------------------- HANDLERS --------------------
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
    } catch {
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
    const prev = userStories.map((u) => ({ ...u }));

    const applyLocalChange = (newSprintId) => {
      setUserStories((prev) =>
        prev.map((u) =>
          u.id === usId ? { ...u, sprint_id: newSprintId } : u
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
    } catch {
      setUserStories(prev);
      toast.error("Update sprint for User Story failed");
    }
  };

  // -------------------- UI --------------------
  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
            <ClipboardList className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">
            No Project Selected
          </h2>
          <p className="text-gray-600 text-sm">
            Please select a project from the sidebar to continue.
          </p>
        </div>
      </div>
    );
  }

  if (permissionsLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-200 p-8 max-w-md text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-emerald-600 animate-spin" />
          <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">
            Loading...
          </h2>
          <p className="text-gray-600 text-sm">
            {permissionsLoading ? "Loading permissions..." : "Loading project data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                  Scrum Board
                </h1>
                <p className="text-sm text-gray-600 font-medium">{currentProject.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!canCreateSprint}
              className="group px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              title={!canCreateSprint ? "You don't have permission to create sprint" : "Create new sprint"}
            >
              <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
              <span>New Sprint</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* My Tasks - Left Sidebar */}
            <div className="lg:col-span-3">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-200 p-5 sticky top-6">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-100">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent flex-1">
                    My Tasks
                  </h3>
                  <span className="text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                    {myTasks.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 custom-scrollbar">
                  {myTasks.length === 0 ? (
                    <div className="text-center py-8 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                      <Clock className="w-10 h-10 mx-auto mb-2 text-blue-400" />
                      <p className="text-sm text-blue-600 font-medium">
                        No tasks assigned yet
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Tasks will appear here when assigned</p>
                    </div>
                  ) : (
                    myTasks.map((task) => {
                      const dueInfo = task.due_date
                        ? evaluateDueDate(task.due_date)
                        : null;
                      const dueLabel = task.due_date
                        ? dayjs(task.due_date).format("DD/MM/YYYY")
                        : "No due date";

                      return (
                        <Link
                          key={task.id}
                          to={`/tasks/${task.id}`}
                          className="block bg-white rounded-xl p-3 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                        >
                          {/* Task Name + Status */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 line-clamp-2 flex-1 transition-colors">
                              {task.name || task.title}
                            </p>
                            <span className="text-xs font-medium px-2 py-0.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 rounded-md border border-gray-200 whitespace-nowrap">
                              {task.status || "Pending"}
                            </span>
                          </div>

                          {/* Priority + Due Date */}
                          <div className="flex items-center justify-between text-xs">
                            {dueInfo ? (
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                                  dueInfo.badgeClass.includes('red')
                                    ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-200'
                                    : dueInfo.badgeClass.includes('yellow')
                                    ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 border border-orange-200'
                                    : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {dueInfo.badgeClass.includes('red') && <AlertCircle className="w-3 h-3" />}
                                {dueInfo.label}
                              </span>
                            ) : (
                              <span className="text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                No deadline
                              </span>
                            )}
                            <span className="text-gray-600 font-medium">{dueLabel}</span>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Backlog - Middle */}
            <div className="lg:col-span-5">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-emerald-200 p-5">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                      <Layers className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                      Product Backlog
                    </h3>
                    <span className="text-xs bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-2.5 py-1 rounded-full font-bold shadow-sm">
                      {backlog.length}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate("/user-stories/new")}
                    disabled={!canCreateUserStory}
                    className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-sm"
                    title={!canCreateUserStory ? "You don't have permission to create user story" : "Create new user story"}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Create Story</span>
                  </button>
                </div>

                <Droppable droppableId="backlog">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] rounded-xl p-3 transition-colors ${
                        snapshot.isDraggingOver
                          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300'
                          : 'bg-gradient-to-br from-gray-50 to-gray-100/50'
                      }`}
                    >
                      {backlog.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="text-center py-12 rounded-xl bg-white/50 border border-dashed border-gray-300">
                          <Layers className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm text-gray-500 font-medium">No user stories in backlog</p>
                          <p className="text-xs text-gray-400 mt-1">Create one or drag stories here</p>
                        </div>
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
            </div>

            {/* Sprint Panel - Right */}
            <div className="lg:col-span-4">
              <div className="space-y-4">
                {sprints.length === 0 ? (
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="font-bold text-gray-700 mb-2">No Sprints Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Create your first sprint to get started</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      disabled={!canCreateSprint}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center gap-2"
                      title={!canCreateSprint ? "You don't have permission to create sprint" : "Create sprint"}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Create Sprint</span>
                    </button>
                  </div>
                ) : (
                  sprints.map((s) => {
                    const usList = usBySprint[s.id] || [];
                    const totalPts = usList.reduce(
                      (sum, u) => sum + (Number(u.total_points) || 0),
                      0
                    );
                    const isUpcoming = dayjs(s.deadline).isAfter(dayjs());
                    
                    return (
                      <div
                        key={s.id}
                        className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
                      >
                        <div className={`px-4 py-3 bg-gradient-to-r ${
                          isUpcoming 
                            ? 'from-emerald-500 to-teal-500' 
                            : 'from-gray-400 to-gray-500'
                        } flex items-center justify-between`}>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Calendar className="w-4 h-4 text-white flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-white truncate">{s.name}</div>
                              <div className="text-xs text-white/90 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {dayjs(s.deadline).format("DD MMM YYYY")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1">
                            <TrendingUp className="w-3.5 h-3.5 text-white" />
                            <span className="text-xs font-bold text-white">{totalPts} pts</span>
                          </div>
                        </div>

                        <div className="p-3">
                          <Droppable droppableId={`sprint-${s.id}`}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`min-h-[60px] rounded-lg p-2 transition-colors ${
                                  snapshot.isDraggingOver
                                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300'
                                    : 'bg-gray-50/50'
                                }`}
                              >
                                {usList.length === 0 && !snapshot.isDraggingOver ? (
                                  <div className="text-center py-6 rounded-lg bg-white/50 border border-dashed border-gray-200">
                                    <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-xs text-gray-500">Drag stories here</p>
                                  </div>
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

                          <div className="pt-3 flex justify-end">
                            <Link
                              to={`/projects/${projectId}/sprints/${s.id}/taskboard`}
                              className="group px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 text-sm"
                            >
                              <span>Open Taskboard</span>
                              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </DragDropContext>
      </div>

      {/* Modal Create Sprint */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Create New Sprint</h2>
            </div>
            
            <form onSubmit={handleCreateSprint} className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <span>Sprint Name</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-lg px-4 py-2.5 text-sm transition-colors outline-none bg-gray-50 focus:bg-white"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Sprint 1, Phase 2 Development..."
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>Deadline</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className="w-full border-2 border-gray-200 focus:border-emerald-400 rounded-lg px-4 py-2.5 text-sm transition-colors outline-none bg-gray-50 focus:bg-white"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deadline: e.target.value }))
                  }
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  className="px-4 py-2.5 rounded-lg border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-medium text-gray-700 transition-all duration-200"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Sprint</span>
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
