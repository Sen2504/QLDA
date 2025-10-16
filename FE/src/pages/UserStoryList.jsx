import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import { useProject } from "../store/ProjectContext";
import UserStoryService from "../services/userStoryService";

export default function UserStoryList() {
  const navigate = useNavigate();
  const { currentProject } = useProject();

  const [stories, setStories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState({});

  // ---- LOAD USER STORIES ----
  useEffect(() => {
    if (!currentProject) return;
    setLoading(true);
    Promise.all([
      UserStoryService.getByProject(currentProject.id),
      UserStoryService.getStatuses(),
    ])
      .then(([resStories, resStatuses]) => {
        setStories(resStories.data || []);
        setStatuses(resStatuses || []);
      })
      .catch((err) => console.error("Lỗi khi tải User Stories:", err))
      .finally(() => setLoading(false));
  }, [currentProject]);

  // ---- CẬP NHẬT TRẠNG THÁI ----
  const handleStatusChange = async (storyId, newStatusId) => {
    try {
      await UserStoryService.update(storyId, { status_id: newStatusId });
      setSelectedStatus((prev) => ({ ...prev, [storyId]: newStatusId }));
    } catch (err) {
      console.error("Lỗi khi cập nhật trạng thái:", err);
    }
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("vi-VN");
  };

  const getStatusName = (id) => {
    const st = statuses.find((s) => s.id === id);
    return st ? st.name : "Unknown";
  };

  // ---- UI ----
  return (
    <MainLayout>
      <div className="mt-6 bg-white rounded-2xl shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Danh sách User Story
          </h2>
          <button
            onClick={() => navigate("/user-stories/new")}
            className="px-4 py-2 rounded-2xl bg-[var(--color-accent,#16a34a)] text-white hover:opacity-90"
          >
            + Tạo User Story
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="text-xs uppercase bg-gray-100 text-gray-600">
                <tr>
                  <th className="px-4 py-2">Tên User Story</th>
                  <th className="px-4 py-2">Hashtag</th>
                  <th className="px-4 py-2">Ngày hết hạn</th>
                  <th className="px-4 py-2">Tổng điểm</th>
                  <th className="px-4 py-2">Trạng thái</th>
                  <th className="px-4 py-2 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {stories.map((s) => (
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    {/* Tên user story */}
                    <td
                      className="px-4 py-2 cursor-pointer text-emerald-700 font-medium hover:underline"
                      onClick={() => navigate(`/user-stories/${s.id}`)}
                    >
                      {s.name || "(Không có tên)"}
                    </td>

                    {/* Hashtag */}
                    <td className="px-4 py-2">
                      {s.hashtags?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {s.hashtags.map((h) => (
                            <span
                              key={h.hashtag.id}
                              className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded"
                            >
                              #{h.hashtag.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Không có
                        </span>
                      )}
                    </td>

                    {/* Ngày hết hạn */}
                    <td className="px-4 py-2">{formatDate(s.expire_date)}</td>

                    {/* Tổng điểm */}
                    <td className="px-4 py-2 font-semibold text-gray-800">
                      {s.total_points ?? 0} pts
                    </td>

                    {/* Trạng thái */}
                    <td className="px-4 py-2">
                      <select
                        value={
                          selectedStatus[s.id] !== undefined
                            ? selectedStatus[s.id]
                            : s.status_id || ""
                        }
                        onChange={(e) =>
                          handleStatusChange(s.id, Number(e.target.value))
                        }
                        className="border rounded-lg px-2 py-1 focus:outline-none focus:ring focus:ring-[var(--color-accent,#16a34a)]"
                      >
                        {statuses.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => navigate(`/user-stories/${s.id}/edit`)}
                        className="px-3 py-1 text-xs bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg"
                      >
                        Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {stories.length === 0 && (
              <p className="text-gray-500 text-sm mt-2">
                Chưa có User Story nào.
              </p>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
