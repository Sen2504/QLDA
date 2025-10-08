import React from "react";

export default function ScrumBoardColumn({
  title,
  items = [],
  emptyText = "Trống",
  accent = "emerald",
  renderItem,
}) {
  const accentMap = {
    emerald: "border-emerald-300 bg-emerald-50/40",
    amber: "border-amber-300 bg-amber-50/40",
    violet: "border-violet-300 bg-violet-50/40",
  };
  return (
    <div
      className={`rounded-2xl p-3 flex flex-col min-h-[280px] border backdrop-blur-sm ${
        accentMap[accent] || "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
        <span className="text-xs text-gray-500">{items.length}</span>
      </div>
      <div className="space-y-2 overflow-y-auto pr-1 flex-1">
        {items.length
          ? items.map((it) => renderItem(it))
          : <p className="text-xs text-gray-500">{emptyText}</p>}
      </div>
    </div>
  );
}