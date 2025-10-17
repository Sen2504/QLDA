import dayjs from "dayjs";

const PRIORITY_META = {
  overdue: {
    key: "overdue",
    label: "Overdue",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    rowClass: "bg-red-50/80",
    level: 0,
  },
  soon: {
    key: "soon",
    label: "High priority",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    rowClass: "bg-amber-50/80",
    level: 1,
  },
  later: {
    key: "later",
    label: "Upcoming",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    rowClass: "bg-sky-50/80",
    level: 2,
  },
  none: {
    key: "none",
    label: "No deadline set",
    badgeClass: "bg-gray-100 text-gray-600 border border-gray-200",
    rowClass: "",
    level: 3,
  },
};

export function evaluateDueDate(dueDateInput, options = {}) {
  const { soonThreshold = 3 } = options;
  if (!dueDateInput) {
    const meta = PRIORITY_META.none;
    return {
      ...meta,
      dueDate: null,
      dueDisplay: "—",
      diffDays: null,
    };
  }

  const dueDate = dayjs(dueDateInput);
  if (!dueDate.isValid()) {
    const meta = PRIORITY_META.none;
    return {
      ...meta,
      dueDate: null,
      dueDisplay: "—",
      diffDays: null,
    };
  }

  const today = dayjs().startOf("day");
  const diffDays = dueDate.startOf("day").diff(today, "day");
  let meta;
  if (diffDays < 0) {
    meta = PRIORITY_META.overdue;
  } else if (diffDays <= soonThreshold) {
    meta = PRIORITY_META.soon;
  } else {
    meta = PRIORITY_META.later;
  }

  return {
    ...meta,
    dueDate,
    dueDisplay: dueDate.format("DD/MM/YYYY"),
    diffDays,
  };
}

export { PRIORITY_META };

export function describeDiffDays(diffDays) {
  if (diffDays === null || diffDays === undefined) {
    return "";
  }
  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return daysLate === 1
      ? "1 day late"
      : `${daysLate} date late`;
  }
  if (diffDays === 0) {
    return "Due today";
  }
  if (diffDays === 1) {
    return "1 day left";
  }
  return `${diffDays} date left`;
}
