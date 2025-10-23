import React from 'react';
import dayjs from 'dayjs';
import { Trash2 } from 'lucide-react';

const CommentItem = ({ comment, currentUser, isDone, onDelete, isDeleting }) => {
  const created = comment.created_at ? dayjs(comment.created_at) : null;
  const isOwner = currentUser && comment.user?.id === currentUser.id;

  return (
    <div className="bg-white/60 backdrop-blur-sm border border-emerald-200 rounded-lg p-2.5 hover:shadow-sm transition-all duration-200">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex-shrink-0"></div>
            <span className="font-semibold text-gray-900 text-xs truncate">
              {comment.author_name || comment.user?.name || "Ẩn danh"}
            </span>
          </div>
          {created?.isValid() && (
            <div className="text-[10px] text-gray-500 ml-3">
              {created.format("HH:mm DD/MM/YYYY")}
            </div>
          )}
        </div>
        {isOwner && !isDone && (
          <button
            onClick={() => onDelete(comment.id)}
            disabled={isDeleting}
            className="text-red-500 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 p-1 rounded transition-all duration-200 flex-shrink-0"
            type="button"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
      <p className="text-xs text-gray-700 whitespace-pre-line leading-relaxed ml-3">
        {comment.content}
      </p>
    </div>
  );
};

export default CommentItem;
