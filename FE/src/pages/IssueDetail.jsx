import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import IssueService from "../services/issueService";
import IssueTypeService from "../services/issueTypeService";
import IssueCommentService from "../services/issueCommentService";
import UserService from "../services/userService";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [types, setTypes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==================== FETCH DATA ====================
  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        const [issueRes, typeRes, profileRes] = await Promise.all([
          IssueService.getById(id),
          IssueTypeService.getAll(),
          UserService.getProfile().catch(() => ({ data: null })),
        ]);

        if (!mounted) return;

        const issueData = issueRes?.data;
        setIssue(issueData || null);
        setTypes(typeRes?.data || []);
        setCurrentUser(profileRes?.data || null);
        setComments(issueData?.comments || []);
        
      } catch (err) {
        console.error("Error loading issue detail:", err);
        toast.error(err.response?.data?.error || "Unable to load issue");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchData();
    return () => {
      mounted = false;
    };
  }, [id]);

  const dueInfo = useMemo(() => evaluateDueDate(issue?.expire_date), [issue?.expire_date]);

  // ==================== COMMENT HANDLERS ====================
  const handleSubmitComment = async () => {
    if (!commentInput.trim()) {
      toast.warn("Please enter comment content");
      return;
    }

    setCommentSubmitting(true);
    try {
      const { data } = await IssueCommentService.create(id, {
        content: commentInput.trim(),
      });
      setComments((prev) => [...prev, data]);
      setCommentInput("");
      toast.success("Comment added");
    } catch (err) {
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Failed to add comment:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment??")) return;
    setCommentSubmitting(true);
    try {
      await IssueCommentService.delete(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success("Comment deleted");
    } catch (err) {
      // Lỗi đã được xử lý bởi api.js interceptor
      console.error("Failed to delete comment:", err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // ==================== RENDER ====================
  if (!issue && !loading) {
    return (
      <>
        <div className="p-6 text-center text-gray-500">Issue not found.</div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="px-3 py-2 border rounded-lg">
            ← Back
          </button>

          {/* Nút chuyển sang trang IssueEdit */}
          {issue && (
            <button
              onClick={() => navigate(`/issues/${issue.id}/edit`)}
              className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              ✏️ Edit
            </button>
          )}
        </div>

        {loading && (
          <div className="bg-white rounded-2xl shadow p-6 text-gray-500">Loading issue...</div>
        )}

        {issue && (
          <div className="bg-white rounded-2xl shadow p-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  #{issue.id} {issue.name}
                </h1>
                <div className="mt-3 text-sm flex flex-wrap gap-2">
                  {issue.type && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full px-3 py-1">
                      {issue.type.name}
                    </span>
                  )}
                  {dueInfo?.dueDate && (
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${dueInfo.badgeClass}`}
                    >
                      {dueInfo.label} • {dueInfo.dueDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                {/* Description */}
                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Description</h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {issue.description || "(Chưa có mô tả)"}
                  </p>
                </section>

                {/* Due Date */}
                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Expire date</h2>
                  <div className="text-gray-800 font-medium">
                    {dueInfo?.dueDisplay || "Chưa thiết lập"}
                  </div>
                  {dueInfo?.diffDays !== null && (
                    <div className="text-xs text-gray-500 mt-1">
                      {describeDiffDays(dueInfo.diffDays)}
                    </div>
                  )}
                </section>

                {/* Evidence Files */}
                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-2">Attached file</h2>
                  {issue.evidence_file?.length ? (
                    <ul className="space-y-2">
                      {issue.evidence_file.map((f) => {
                        const fileUrl = `${import.meta.env.VITE_API_URL}/uploads/issues/${issue.id}/${f}`;
                        return (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <span>📎</span>
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:underline break-all"
                            >
                              {f}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">There are no attached files</div>
                  )}
                </section>
              </div>

              {/* RIGHT COLUMN - COMMENTS */}
              <div className="space-y-4">
                <section>
                  <h2 className="text-sm font-semibold uppercase text-gray-700 mb-3">Comment</h2>
                  <div className="space-y-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-72 overflow-y-auto space-y-3">
                      {comments.length === 0 && (
                        <div className="text-sm text-gray-500 text-center">
                          There are no comments yet.
                        </div>
                      )}
                      {comments.map((comment) => {
                        const created = comment.created_at ? dayjs(comment.created_at) : null;
                        const isOwner = currentUser && comment.user?.id === currentUser.id;
                        return (
                          <div key={comment.id} className="bg-white border rounded-lg p-3 shadow-sm">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span className="font-medium text-gray-700">
                                {comment.author_name || comment.user?.name || "Ẩn danh"}
                              </span>
                              {created?.isValid() && (
                                <span>{created.format("HH:mm DD/MM/YYYY")}</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-line">
                              {comment.content}
                            </p>
                            {isOwner && (
                              <div className="text-right mt-2">
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  disabled={commentSubmitting}
                                  className="text-xs text-red-500 hover:text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="border border-emerald-100 rounded-xl p-3 bg-emerald-50">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        rows={3}
                        placeholder="Content..."
                        className="w-full border border-emerald-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={commentSubmitting}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {commentSubmitting ? "Sending..." : "Post a comment"}
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
