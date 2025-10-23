import React from 'react';
import { Hash } from 'lucide-react';

const HashtagBadge = ({ tag, onRemove = null, editable = false }) => {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-2.5 py-0.5 text-xs text-white font-semibold shadow-sm">
      <Hash className="w-2.5 h-2.5" />
      {tag.name}
      {editable && onRemove && (
        <button
          onClick={() => onRemove(tag.id)}
          className="hover:bg-white/20 rounded-full p-0.5 transition-colors duration-200"
          type="button"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default HashtagBadge;
