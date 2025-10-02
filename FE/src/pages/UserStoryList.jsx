import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";
import MainLayout from "../layouts/MainLayout";

export default function UserStoryList() {
  const { currentProject } = useProject();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentProject) {
      setStories([]);
      return;
    }
    setLoading(true);
    UserStoryService.getAll()
      .then((res) => {
        const filtered = res.data.filter(
          (s) => s.project_id === currentProject.id
        );
        setStories(filtered);
      })
      .catch((err) => console.error("Error loading user stories", err))
      .finally(() => setLoading(false));
  }, [currentProject]);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-green-700">
            User Stories của Project:{" "}
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
                <th className="border border-gray-200 px-3 py-2 text-left">ID</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Tên</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Hạn</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Trạng thái</th>
                <th className="border border-gray-200 px-3 py-2 text-left">Hashtags</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-3 py-2">{s.id}</td>
                  <td className="border border-gray-200 px-3 py-2">{s.name}</td>
                  <td className="border border-gray-200 px-3 py-2">{s.expire_date}</td>
                  <td className="border border-gray-200 px-3 py-2">{s.status_id}</td>
                  <td className="border border-gray-200 px-3 py-2">
                    {s.hashtags.map((h) => (
                      <span
                        key={h.hashtag.id}
                        className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs mr-1"
                      >
                        #{h.hashtag.name}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </MainLayout>
  );
}
