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
    "New": "bg-gray-200 text-gray-800",
    "Ready": "bg-blue-100 text-blue-700",
    "In progress": "bg-yellow-100 text-yellow-700",
    "Ready for test": "bg-purple-100 text-purple-700",
    "Done": "bg-green-100 text-green-700",
  };

  useEffect(() => {
    if (!currentProject) {
      setStories([]);
      return;
    }
    setLoading(true);

    Promise.all([
      UserStoryService.getAll(),
      UserStoryService.getStatuses(),
    ])
      .then(([resStories, resStatuses]) => {
        const filtered = resStories.data.filter(
          (s) => s.project_id === currentProject.id
        );
        setStories(filtered);
        setStatuses(resStatuses);
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
    return date.toLocaleDateString("vi-VN");
  };

  const getStatusName = (id) => {
    const st = statuses.find((s) => s.id === id);
    return st ? st.name : "Unknown";
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto py-10 px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <h2 className="text-3xl font-bold text-emerald-700 mb-4 sm:mb-0">
            User Stories{" "}
            <span className="text-gray-500 font-medium">
              {currentProject ? `(${currentProject.name})` : "(No Project Selected)"}
            </span>
          </h2>

          <Link
            to="/user-stories/new"
            className="inline-block bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold px-5 py-2 rounded-lg shadow hover:from-emerald-600 hover:to-green-700 transition"
          >
            + New User Story
          </Link>
        </div>

        {/* Loading or empty */}
        {loading ? (
          <div className="text-center py-10 text-gray-500 text-lg">
            Đang tải danh sách...
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">Chưa có User Story nào.</p>
            <Link
              to="/user-stories/new"
              className="text-emerald-600 hover:underline font-medium"
            >
              Tạo User Story đầu tiên →
            </Link>
          </div>
        ) : (
          // List of cards
          <div className="grid gap-5 md:grid-cols-2">
            {stories.map((s) => {
              const statusName = getStatusName(s.status_id);
              return (
                <div
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
                >
                  {/* Title */}
                  <div className="flex justify-between items-center mb-2">
                  {/* LEFT: Title */}
                  <h3 className="text-lg font-semibold text-gray-800 truncate pr-4">
                    {s.name}
                  </h3>

                  {/* RIGHT: Status + Points */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-2 py-1 rounded ${statusColors[statusName] || "bg-gray-100 text-gray-600"}`}
                    >
                      {statusName}
                    </span>
                    <span className="font-semibold text-gray-800 text-sm">
                      {s.total_points ?? 0} pts
                    </span>
                  </div>
                </div>

                  {/* Hashtags */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    {s.hashtags?.length ? (
                      s.hashtags.map((h) => (
                        <span
                          key={h.hashtag.id}
                          className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded"
                        >
                          #{h.hashtag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">
                        No hashtags
                      </span>
                    )}
                  </div>

                  {/* Dates and points */}
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-3">
                    <span>Ngày tạo: {formatDate(s.expire_date)}</span>
                  </div>

                  {/* Status changer */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Cập nhật trạng thái
                    </label>
                    <select
                      value={s.status_id || ""}
                      onChange={(e) =>
                        handleStatusChange(s.id, Number(e.target.value))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-400"
                    >
                      {statuses.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end items-center pt-2 border-t border-gray-100">
                    <Link
                      to={`/user-stories/${s.id}/edit`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ✏️ Edit
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
