import React from "react";

export default function DraggableUserStory({ userStory, onClick }) {
  const onDragStart = (e) => {
    e.dataTransfer.setData("application/x-user-story-id", String(userStory.id));
    e.dataTransfer.effectAllowed = "move";
  };
  return (
    <button
      type="button"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      className="block w-full text-left bg-white rounded-xl border border-emerald-100 hover:border-emerald-300 hover:shadow-sm p-3 transition cursor-grab active:cursor-grabbing"
    >
      <p className="font-medium text-emerald-700 truncate">{userStory.name}</p>
      <p className="text-xs text-gray-600 line-clamp-2 mt-1">
        {userStory.description || "—"}
      </p>
    </button>
  );
}
