import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import {
  ArrowLeft,
  Edit3,
  FileText,
  Calendar,
  Paperclip,
  MessageCircle,
  Send,
  Loader2,
  Tag,
  Trash2
} from "lucide-react";
import IssueService from "../services/issueService";
import IssueTypeService from "../services/issueTypeService";
import IssueCommentService from "../services/issueCommentService";
import UserService from "../services/userService";
import { evaluateDueDate, describeDiffDays } from "../utils/dueDate";
import GradientCard from "../components/task/GradientCard";
import SectionHeader from "../components/task/SectionHeader";
import CommentItem from "../components/task/CommentItem";
import { usePermission } from "../store/PermissionContext";
import ConfirmDialog from "../components/ConfirmDialog";

export default function IssueDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Permission checks
  const canEdit = usePermission("Issue", "Edit");
  const canComment = usePermission("Issue", "Comment");
  const canDelete = usePermission("Issue", "Delete");

  const [issue, setIssue] = useState(null);
  const [types, setTypes] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDeleteIssue = async () => {
    try {
      await IssueService.delete(id);
      toast.success("Issue deleted successfully");
      navigate("/issues/list"); // Navigate to issues list
    } catch (error) {
      console.error("Failed to delete issue:", error);
      // API interceptor will show the error toast
    }
  };

  // ==================== RENDER ====================
  if (!issue && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-3">
        <button 
          onClick={() => navigate(-1)} 
          className="group px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center gap-2 mb-3"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="text-sm">Back</span>
        </button>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6 text-center">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p className="text-gray-600 text-sm">Issue not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-3">
      <div className="max-w-[1400px] mx-auto space-y-3">
        {/* Header Navigation */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="group px-3 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all duration-300 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="text-sm">Back</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Edit Button */}
            {issue && canEdit && (
              <button
                onClick={() => navigate(`/issues/${issue.id}/edit`)}
                className="group px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-sm font-semibold"
                title="Edit issue"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}

            {/* Delete Button */}
            {issue && canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="group px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5 text-sm font-semibold"
                title="Delete issue"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-5 text-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              <p className="text-gray-600 text-sm">Loading issue...</p>
            </div>
          </div>
        )}

        {/* Issue Content */}
        {issue && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-emerald-200 p-4">
            {/* Issue Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-3 pb-3 border-b border-emerald-100">
              <div className="flex-1 min-w-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-sm">
                      #{issue.id}
                    </span>
                    <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                      {issue.name}
                    </h1>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {issue.type && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-white text-xs font-semibold shadow-sm">
                      <Tag className="w-3 h-3" />
                      {issue.type.name}
                    </span>
                  )}
                  {dueInfo?.dueDate && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm ${
                        dueInfo.badgeClass.includes('red') 
                          ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' 
                          : dueInfo.badgeClass.includes('yellow')
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      }`}
                    >
                      <Calendar className="w-3 h-3" />
                      {dueInfo.label} • {dueInfo.dueDisplay}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {/* LEFT COLUMN - 1/3 */}
              <div className="space-y-3">
                {/* Description */}
                <GradientCard gradient="from-emerald-50 to-teal-50" borderColor="border-emerald-200">
                  <SectionHeader icon={FileText} title="Description" />
                  <p className="text-gray-700 text-xs whitespace-pre-line leading-relaxed">
                    {issue.description?.trim() || "(No description yet)"}
                  </p>
                </GradientCard>

                {/* Expire Date */}
                <GradientCard gradient="from-blue-50 to-cyan-50" borderColor="border-blue-200">
                  <SectionHeader icon={Calendar} title="Expire Date" gradient="from-blue-600 to-cyan-600" />
                  <div>
                    <div className="text-gray-800 font-semibold text-xs">
                      {dueInfo?.dueDisplay || "Not set"}
                    </div>
                    {dueInfo?.diffDays !== null && (
                      <div className="text-[10px] text-gray-600 mt-0.5">
                        {describeDiffDays(dueInfo.diffDays)}
                      </div>
                    )}
                  </div>
                </GradientCard>

                {/* Evidence Files */}
                <GradientCard gradient="from-amber-50 to-orange-50" borderColor="border-amber-200">
                  <SectionHeader icon={Paperclip} title="Attached Files" gradient="from-amber-600 to-orange-600" />
                  {issue.evidence_file?.length ? (
                    <ul className="space-y-1.5">
                      {issue.evidence_file.map((f) => {
                        const baseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";
                        const fileUrl = `${baseUrl}/uploads/issues/${issue.id}/${encodeURIComponent(f)}`;
                        return (
                          <li key={f} className="flex items-start gap-1.5 text-xs">
                            <Paperclip className="w-3 h-3 text-amber-600 flex-shrink-0 mt-0.5" />
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-700 hover:text-emerald-900 hover:underline break-all flex-1"
                            >
                              {f}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="text-xs text-gray-500 italic">No attached files</div>
                  )}
                </GradientCard>
              </div>

              {/* RIGHT COLUMN - 2/3 Comments */}
              <div className="lg:col-span-2">
                <GradientCard gradient="from-emerald-50 via-teal-50 to-green-50" borderColor="border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <SectionHeader 
                      icon={MessageCircle} 
                      title="Comments" 
                      badge={comments.length > 0 && (
                        <span className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-2 py-0.5 rounded-full font-bold">
                          {comments.length}
                        </span>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    {/* Comments List */}
                    <div className="space-y-2 max-h-[calc(100vh-420px)] overflow-y-auto pr-1 custom-scrollbar">
                      {comments.length === 0 && (
                        <div className="text-center py-8 rounded-lg bg-white/50 backdrop-blur-sm">
                          <MessageCircle className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                          <div className="text-xs text-gray-500 font-medium">No comments yet. Be the first!</div>
                        </div>
                      )}
                      
                      {comments.map((comment) => (
                        <CommentItem
                          key={comment.id}
                          comment={comment}
                          currentUser={currentUser}
                          isDone={false}
                          onDelete={handleDeleteComment}
                          isDeleting={commentSubmitting}
                        />
                      ))}
                    </div>

                    {/* Add Comment Form */}
                    {canComment ? (
                      <div className="border-t border-emerald-200 pt-3">
                        <div className="space-y-2">
                          <textarea
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            rows={2}
                            placeholder="Write a comment..."
                            className="w-full border border-emerald-300 focus:border-emerald-500 rounded-lg p-2 text-xs bg-white/80 backdrop-blur-sm focus:outline-none transition-all duration-300 resize-none"
                          />
                          <div className="flex justify-end">
                            <button
                              onClick={handleSubmitComment}
                              disabled={commentSubmitting || !commentInput.trim()}
                              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1.5"
                              title="Post comment"
                            >
                              {commentSubmitting ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Posting...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Post Comment</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-gray-200 pt-3">
                        <div className="text-center py-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-500">You don't have permission to comment on this issue</p>
                        </div>
                      </div>
                    )}
                  </div>
                </GradientCard>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteIssue}
        title="Delete Issue"
        message={`Are you sure you want to delete issue "${issue?.name}"?`}
        warningMessage="This action cannot be undone. All comments and data associated with this issue will be permanently deleted."
        confirmText="Delete Issue"
      />
    </div>
  );
}
