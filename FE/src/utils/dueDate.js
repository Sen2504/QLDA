import dayjs from "dayjs";

const PRIORITY_META = {
  overdue: {
    key: "overdue",
    label: "Quá hạn",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    rowClass: "bg-red-50/80",
    level: 0,
  },
  soon: {
    key: "soon",
    label: "Ưu tiên cao",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    rowClass: "bg-amber-50/80",
    level: 1,
  },
  later: {
    key: "later",
    label: "Sắp tới",
    badgeClass: "bg-sky-100 text-sky-700 border border-sky-200",
    rowClass: "bg-sky-50/80",
    level: 2,
  },
  none: {
    key: "none",
    label: "Chưa đặt hạn",
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
      ? "Trễ 1 ngày"
      : `Trễ ${daysLate} ngày`;
  }
  if (diffDays === 0) {
    return "Hạn hôm nay";
  }
  if (diffDays === 1) {
    return "Còn 1 ngày";
  }
  return `Còn ${diffDays} ngày`;
}
