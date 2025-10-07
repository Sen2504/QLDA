// file: pages/Home.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import TaskService from "../services/taskService";
import TaskStatusService from "../services/taskStatusService";

import ScrumBoardColumn from "../components/ScrumBoardColumn";
import DraggableTask from "../components/DraggableTask";
import DraggableUserStory from "../components/DraggableUserStory";
import DndColumn from "../components/DndColumn";

// Chuẩn hóa tên status để so sánh
const normalizeStatus = (value) => (value || "").trim().toLowerCase();

// Bản đồ status khớp UI dropdown: New / Ready / In progress / Done
const STATUS_VALUE_MAP = {
  new: "New",
  ready: "Ready",
  in_progress: "In progress",
  done: "Done",
};

export default function Home() {
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [userStories, setUserStories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [issues, setIssues] = useState([]);
  const [statusLookup, setStatusLookup] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const pid = currentProject.id;

    const load = async () => {
      setLoading(true);
      const jobs = [
        // --- User Stories ---
        (async () => {
          try {
            const [byProjectRes, allRes] = await Promise.allSettled([
              UserStoryService.getByProject(pid),
              UserStoryService.getAll(),
            ]);
            const extract = (raw) => {
              if (!raw) return [];
              const data = raw.data ?? raw;
              if (Array.isArray(data)) return data;
              if (Array.isArray(data.user_stories)) return data.user_stories;
              return [];
            };
            let picked = [];
            if (byProjectRes.status === "fulfilled")
              picked = extract(byProjectRes.value);
            if (!picked.length && allRes.status === "fulfilled") {
              const allList = extract(allRes.value);
              picked = allList.filter(
                (u) => String(u.project_id) === String(pid)
              );
            }
            if (!cancelled) setUserStories(picked);
          } catch {
            !cancelled && setUserStories([]);
          }
        })(),

        // --- Tasks ---
        (async () => {
          try {
            const res = await TaskService.getByProject(pid);
            const data = Array.isArray(res.data) ? res.data : [];
            !cancelled && setTasks(data);
          } catch {
            !cancelled && setTasks([]);
          }
        })(),

        // --- Task Statuses ---
        (async () => {
          try {
            const res = await TaskStatusService.getAll();
            const list = Array.isArray(res.data) ? res.data : [];
            const map = list.reduce((acc, item) => {
              if (!item || typeof item !== "object") return acc;
              const key = normalizeStatus(item.name_status);
              if (!key) return acc;
              acc[key] = item.id;
              return acc;
            }, {});
            !cancelled && setStatusLookup(map);
          } catch {
            !cancelled && setStatusLookup({});
          }
        })(),
      ];
      await Promise.allSettled(jobs);
      if (!cancelled) {
        setSprints([]);
        setIssues([]);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [currentProject]);

  // Ánh xạ statusId theo STATUS_VALUE_MAP
  const statusIdByKey = useMemo(() => {
    return Object.entries(STATUS_VALUE_MAP).reduce((acc, [key, label]) => {
      const id = statusLookup[normalizeStatus(label)];
      if (id) acc[key] = id;
      return acc;
    }, {});
  }, [statusLookup]);

  // Nhóm task theo trạng thái
  const taskGroups = useMemo(() => {
    const g = { new: [], ready: [], in_progress: [], done: [] };
    tasks.forEach((t) => {
      // match theo status_id nếu có
      const matchedKey = Object.entries(statusIdByKey).find(([, id]) =>
        String(t.status_id ?? "") === String(id)
      )?.[0];

      if (matchedKey && g[matchedKey]) {
        g[matchedKey].push(t);
        return;
      }

      // fallback theo tên
      const name = normalizeStatus(t.status);
      if (name.includes("in progress")) g.in_progress.push(t);
      else if (name.includes("ready")) g.ready.push(t);
      else if (name.includes("done")) g.done.push(t);
      else g.new.push(t);
    });
    return g;
  }, [tasks, statusIdByKey]);

  // Sprint đang active
  const activeSprint = useMemo(
    () => sprints.find((s) => s.status === "active") || null,
    [sprints]
  );

  // Khi drag & drop task sang cột khác
  const handleTaskDrop = async (taskId, targetKey) => {
    const targetStatusName = STATUS_VALUE_MAP[targetKey];
    const statusId = statusLookup[normalizeStatus(targetStatusName)];
    if (!statusId) {
      console.warn("Missing status id for", targetStatusName);
      return;
    }

    const prevTasks = tasks.map((t) => ({ ...t }));
    const updatedTasks = tasks.map((t) =>
      String(t.id) === String(taskId)
        ? { ...t, status: targetStatusName, status_id: statusId }
        : t
    );
    setTasks(updatedTasks);
    try {
      await TaskService.update?.(taskId, {
        status_id: statusId,
      });
    } catch (err) {
      console.error("Failed to update task status", err);
      setTasks(prevTasks);
    }
  };

  // Metrics đơn giản
  const metrics = useMemo(() => {
    const total = tasks.length || 1;
    const done = taskGroups.done.length;
    return [
      {
        label: "Tasks Done",
        value: `${done}/${total}`,
        pct: Math.round((done / total) * 100),
      },
      {
        label: "User Stories",
        value: userStories.length,
        pct: 100,
      },
      {
        label: "Issues",
        value: issues.length,
        pct: 100,
      },
      {
        label: "Active Sprint",
        value: activeSprint ? activeSprint.name : "None",
        pct: activeSprint ? 100 : 0,
      },
    ];
  }, [tasks, taskGroups.done.length, userStories.length, issues.length, activeSprint]);

  if (!currentProject) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[70vh] text-gray-500 text-lg">
          Chọn một project để bắt đầu.
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6 space-y-8 bg-gradient-to-b from-emerald-50 to-white min-h-screen">
        {/* Header */}
        <div className="flex flex-wrap gap-4 justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-emerald-700 tracking-tight">
              {currentProject.name}
            </h1>
            <p className="text-gray-600 max-w-xl mt-1">
              {currentProject.description || "Không có mô tả."}
            </p>
          </div>
          <span
            className={`px-4 py-1.5 h-fit rounded-full text-sm font-medium border
              ${
                currentProject.status === "archived"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                  : "bg-emerald-100 text-emerald-700 border-emerald-300"
              }`}
          >
            {currentProject.status}
          </span>
        </div>

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 flex flex-col justify-between"
            >
              <span className="text-sm font-medium text-emerald-600">
                {m.label}
              </span>
              <div className="mt-2 flex items-end justify-between">
                <span className="text-2xl font-semibold text-emerald-800">
                  {m.value}
                </span>
                {m.pct <= 100 && (
                  <div className="w-20 h-2 rounded bg-emerald-100 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(m.pct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Scrum Board */}
        <div>
          <h2 className="text-xl font-semibold text-emerald-800 mb-3 flex items-center gap-2">
            <span className="h-2 w-2 bg-emerald-500 rounded-full" />
            Scrum Board
          </h2>
          {loading ? (
            <div className="text-gray-500 animate-pulse">Đang tải...</div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-5 md:grid-cols-3">
              {/* Product Backlog */}
              <ScrumBoardColumn
                title="Product Backlog"
                accent="emerald"
                items={userStories}
                emptyText="Chưa có User Story."
                renderItem={(us) => (
                  <DraggableUserStory
                    key={us.id}
                    userStory={us}
                    onClick={() => navigate(`/user-stories/${us.id}`)}
                  />
                )}
              />

              {/* Task Columns */}
              <DndColumn
                title="New"
                accent="emerald"
                statusKey="new"
                items={taskGroups.new}
                onDropTask={handleTaskDrop}
                renderItem={(t) => <DraggableTask key={t.id} task={t} />}
              />
              <DndColumn
                title="Ready"
                accent="amber"
                statusKey="ready"
                items={taskGroups.ready}
                onDropTask={handleTaskDrop}
                renderItem={(t) => <DraggableTask key={t.id} task={t} />}
              />
              <DndColumn
                title="In progress"
                accent="violet"
                statusKey="in_progress"
                items={taskGroups.in_progress}
                onDropTask={handleTaskDrop}
                renderItem={(t) => <DraggableTask key={t.id} task={t} />}
              />
              <DndColumn
                title="Done"
                accent="emerald"
                statusKey="done"
                items={taskGroups.done}
                onDropTask={handleTaskDrop}
                renderItem={(t) => (
                  <div className="opacity-80 hover:opacity-100 transition">
                    <DraggableTask key={t.id} task={t} />
                  </div>
                )}
              />
            </div>
          )}
        </div>

        {/* Issues & Sprints */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-5 border border-emerald-100">
            <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Issues
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {issues.length ? (
                issues.map((i) => (
                  <div
                    key={i.id}
                    className="border rounded-lg p-3 hover:border-emerald-300 bg-emerald-50/30"
                  >
                    <p className="font-medium text-gray-800 truncate">
                      {i.title}
                    </p>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1">
                      {i.description || "—"}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Không có issue.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-emerald-100 flex flex-col">
            <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Sprints
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[300px] pr-1">
              {sprints.length ? (
                sprints.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-lg border p-3 text-sm ${
                      s.status === "active"
                        ? "border-emerald-400 bg-emerald-50"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <p className="font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {s.start_date} → {s.end_date}
                    </p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {s.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">Chưa có sprint.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
