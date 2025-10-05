import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import MainLayout from "../layouts/MainLayout";

export default function UserStoryList() {
  const { currentProject } = useProject();
  const [stories, setStories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);

  const statusColors = {
    "New": "bg-gray-200 text-gray-700",
    "Ready": "bg-blue-200 text-blue-800",
    "In progress": "bg-yellow-200 text-yellow-800",
    "Ready for test": "bg-purple-200 text-purple-800",
    "Done": "bg-green-200 text-green-800",
  };

  useEffect(() => {
    if (!currentProject) {
      setStories([]);
      return;
    }
    setLoading(true);

    // lấy stories + workflow_status song song
    Promise.all([
      UserStoryService.getAll(),
      UserStoryService.getStatuses(), // gọi đúng API /workflow_statuses/
    ])
      .then(([resStories, resStatuses]) => {
        const filtered = resStories.data.filter(
          (s) => s.project_id === currentProject.id
        );
        setStories(filtered);
        setStatuses(resStatuses); // gán danh sách status vào state
      })
      .catch((err) => console.error("Error loading user stories", err))
      .finally(() => setLoading(false));
  }, [currentProject]);

  const handleStatusChange = async (storyId, newStatusId) => {
    try {
      await UserStoryService.update(storyId, { Status_id: newStatusId });
      setStories((prev) =>
        prev.map((s) =>
          s.id === storyId ? { ...s, status_id: newStatusId } : s
        )
      );
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("vi-VN"); // dd/mm/yyyy
  };

  const getStatusName = (id) => {
    const st = statuses.find((s) => s.id === id);
    return st ? st.name : "Unknown";
  };

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-700">
            User stories của project:{" "}
            {currentProject ? currentProject.name : "Chưa chọn"}
          </h2>
          <Link
            to="/user-stories/new"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            + New User Story
          </Link>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : stories.length === 0 ? (
          <p className="text-gray-600">Chưa có User Story nào.</p>
        ) : (
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-200 px-3 py-2 text-left">Tên User Story</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Ngày hết hạn</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Trạng thái</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Hashtags</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Points</th>
                <th className="border border-gray-200 px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => {
                const statusName = getStatusName(s.status_id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2">{s.name}</td>
                    <td className="border border-gray-200 px-3 py-2">
                      {formatDate(s.expire_date)}
                    </td>
                    <td className="border border-gray-200 px-3 py-2">
                    <select
                      value={s.status_id || ""}
                      onChange={(e) =>
                        handleStatusChange(s.id, Number(e.target.value))
                      }
                      className={`px-2 py-1 rounded ${statusColors[getStatusName(s.status_id)] || ""}`}
                    >
                      {statuses.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </td>
                    <td className="border border-gray-200 px-3 py-2">
                      {s.hashtags?.map((h) => (
                        <span
                          key={h.hashtag.id}
                          className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs mr-1"
                        >
                          #{h.hashtag.name}
                        </span>
                      ))}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 font-semibold">
                      {s.total_points}
                    </td>
                    <td className="border border-gray-200 px-3 py-2 text-center">
                      <Link
                        to={`/user-stories/${s.id}/edit`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Chỉnh sửa"
                      >
                        ✏️
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
