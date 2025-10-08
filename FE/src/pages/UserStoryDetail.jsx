import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import TaskService from "../services/taskService";
import TeamService from "../services/teamService";
import TaskTable from "../components/TaskTable";
import TaskFormModal from "../components/TaskFormModal";
import MainLayout from "../layouts/MainLayout";

export default function UserStoryDetail() {
  const { userStoryId } = useParams();
  const [story, setStory] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchAll() {
      try {
        // 1) Lấy user story
        const s = await api.get(`/user_stories/${userStoryId}`);
        if (!mounted) return;
        setStory(s.data);

        // 2) Lấy task của user story
        const ts = await TaskService.getByUserStory(userStoryId);
        if (!mounted) return;
        setTasks(ts.data);

        // 3) Lấy team của project (để đổ dropdown phân công)
        if (s.data?.project_id) {
          const t = await TeamService.getTeamSummary(s.data.project_id);
          if (!mounted) return;
          setTeamMembers(t.data?.members ?? []);
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

  const handleCreateTask = async (formData) => {
    const { data } = await TaskService.create(formData);
    setTasks((prev) => [...prev, data]);
    setShowForm(false);
  };

  return (
    <MainLayout>
      <div className="p-6">
        {loading && (
          <div className="text-gray-500">Đang tải dữ liệu...</div>
        )}

        {story && (
          <div className="bg-white rounded-2xl shadow p-5 mb-4">
            <h1 className="text-xl font-bold text-gray-900">{story.name}</h1>
            {story.description && (
              <p className="text-gray-700 mt-1">{story.description}</p>
            )}
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
                    ? {
                        ...task,
                        status_id: Number(newStatusId),
                      }
                    : task
                )
              );
              toast.success("Cập nhật trạng thái thành công!");
            } catch (err) {
              toast.error(
                err.response?.data?.error || "Lỗi khi cập nhật trạng thái"
              );
            }
          }}
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
