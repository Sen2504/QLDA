import React from "react";

export default function DraggableTask({ task }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData("application/x-task-id", String(task.id));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing shadow-sm hover:border-emerald-300 transition select-none"
    >
      <p className="font-medium text-gray-800 truncate">{task.name}</p>
      {task.description && (
        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{task.description}</p>
      )}
    </div>
  );
}
