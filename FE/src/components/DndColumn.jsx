import React, { useState } from "react";

export default function DndColumn({
  title,
  accent = "emerald",
  statusKey,
  items = [],
  emptyText = "Trống.",
  onDropTask,
  renderItem,
}) {
  const [isOver, setIsOver] = useState(false);

  const onDragOver = (e) => {
    if (e.dataTransfer.types.includes("application/x-task-id")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (!isOver) setIsOver(true);
    }
  };
  const onDragLeave = () => setIsOver(false);
  const onDrop = (e) => {
    setIsOver(false);
    const taskId = e.dataTransfer.getData("application/x-task-id");
    if (taskId && onDropTask) onDropTask(taskId, statusKey);
  };

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`rounded-2xl border p-3 flex flex-col gap-3 min-h-[220px] bg-${accent}-50/30 border-${accent}-100 transition ${
        isOver ? `ring-2 ring-${accent}-400 ring-offset-1` : ""
      }`}
    >
      <h4 className={`text-sm font-semibold text-${accent}-700 flex items-center gap-1`}>
        <span className={`w-2 h-2 rounded-full bg-${accent}-500`} />
        {title}
        <span className="text-xs text-gray-500">({items.length})</span>
      </h4>
      <div className="space-y-2">
        {items.length
          ? items.map((it) => (
              <React.Fragment key={it.id}>
                {renderItem ? renderItem(it) : null}
              </React.Fragment>
            ))
          : (
            <p className="text-xs text-gray-400 italic">{emptyText}</p>
            )}
      </div>
    </div>
  );
}
