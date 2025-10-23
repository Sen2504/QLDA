import React from 'react';

const AssigneeItem = ({ assignee, editable = false }) => {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-2.5 py-1.5 text-xs shadow-sm">
      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"></div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-emerald-900 truncate">
          {assignee.user_name || assignee.name || assignee.user_email || assignee.email || "Ẩn danh"}
        </div>
        {assignee.role_name && (
          <div className="text-[10px] text-emerald-700 truncate">
            {assignee.role_name}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssigneeItem;
