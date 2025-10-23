import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { evaluateDueDate } from "../utils/dueDate";

export default function MyTaskCalendar({ tasks = [] }) {
  const [viewMonth, setViewMonth] = useState(dayjs());

  const currentMonth = viewMonth;
  const daysInMonth = currentMonth.daysInMonth();
  const firstDayOfMonth = currentMonth.startOf("month").day();

  const handlePrevMonth = () => setViewMonth((prev) => prev.subtract(1, "month"));
  const handleNextMonth = () => setViewMonth((prev) => prev.add(1, "month"));

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const date = dayjs(t.due_date);
      if (
        date.month() === currentMonth.month() &&
        date.year() === currentMonth.year()
      ) {
        const day = date.date();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    });
    return map;
  }, [tasks, currentMonth]);

  // Task color gradient - Ưu tiên: Done > Overdue > Due Soon > In Progress
  const getTaskColor = (task) => {
    const status = task.status?.toLowerCase();
    const isDone = status === "done" || status === "completed";
    
    // Nếu chưa done, kiểm tra due date
    if (!isDone) {
      const dueInfo = task.due_date ? evaluateDueDate(task.due_date) : null;
      if (dueInfo?.badgeClass?.includes("red"))
        return "from-red-500 to-pink-500";
      if (dueInfo?.badgeClass?.includes("yellow"))
        return "from-yellow-500 to-orange-500";
      return "from-blue-500 to-cyan-500";
    }
    
    // Nếu done rồi thì luôn màu xanh
    return "from-emerald-500 to-teal-500";
  };

  // Stats - Phân loại theo thứ tự ưu tiên
  const completed = tasks.filter((t) => {
    const status = t.status?.toLowerCase();
    return status === "done" || status === "completed";
  }).length;

  const overdue = tasks.filter((t) => {
    const status = t.status?.toLowerCase();
    const isDone = status === "done" || status === "completed";
    // Chỉ tính overdue nếu CHƯA done
    if (isDone) return false;
    const dueInfo = t.due_date ? evaluateDueDate(t.due_date) : null;
    return dueInfo?.badgeClass?.includes("red");
  }).length;

  const inProgress = tasks.length - completed - overdue;

  return (
    <div className="h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-3 px-4">
      {/* Statistics Bar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-md border border-emerald-100 px-6 py-3 mb-3">
        <div className="flex items-center gap-8">
          {/* Completed */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Completed</p>
              <p className="text-xl font-black text-emerald-600">{completed}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200"></div>

          {/* Overdue */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-red-500 to-pink-500">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Overdue</p>
              <p className="text-xl font-black text-red-600">{overdue}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-10 w-px bg-gray-200"></div>

          {/* In Progress */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">In Progress</p>
              <p className="text-xl font-black text-blue-600">{inProgress}</p>
            </div>
          </div>
        </div>

        {/* Total Tasks */}
        <div className="flex items-center gap-2 pl-6 border-l border-gray-200">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Total Tasks</p>
            <p className="text-xl font-black text-purple-600">{tasks.length}</p>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="rounded-2xl overflow-hidden shadow-xl border border-emerald-100 bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 text-white flex items-center justify-between">
          {/* Left - Month Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center min-w-[140px]">
              <h2 className="text-xl font-black">
                {currentMonth.format("MMMM YYYY")}
              </h2>
              <p className="text-xs font-medium opacity-90">
                Task Calendar
              </p>
            </div>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Empty State */}
        {tasks.length === 0 ? (
          <div className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
              <Clock className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              No Tasks Yet
            </h3>
            <p className="text-sm text-gray-500">
              Tasks will appear on the calendar when assigned.
            </p>
          </div>
        ) : (
          <div className="p-4">
            {/* Week header */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center font-bold text-xs text-gray-600">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentMonth.format("MM-YYYY")}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-7 gap-1.5"
              >
                {calendarDays.map((day, i) => {
                  const tasksToday = day ? tasksByDate[day] || [] : [];
                  const isToday =
                    day &&
                    dayjs().date() === day &&
                    dayjs().month() === currentMonth.month() &&
                    dayjs().year() === currentMonth.year();

                  return (
                    <div
                      key={i}
                      className={`min-h-[90px] rounded-lg p-1.5 transition-all border ${
                        day
                          ? isToday
                            ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400 ring-2 ring-emerald-200 shadow-md"
                            : "bg-white hover:shadow-md border-gray-200"
                          : "bg-transparent border-transparent"
                      }`}
                    >
                      {day && (
                        <>
                          {/* Date Header */}
                          <div
                            className={`flex items-center justify-between mb-1 ${
                              isToday ? "text-emerald-600" : "text-gray-700"
                            }`}
                          >
                            <span
                              className={`font-bold ${
                                isToday ? "text-base" : "text-xs"
                              }`}
                            >
                              {day}
                            </span>
                            {tasksToday.length > 0 && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isToday
                                    ? "bg-emerald-500 text-white"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {tasksToday.length}
                              </span>
                            )}
                          </div>

                          {/* Tasks List */}
                          <div className="space-y-0.5">
                            {tasksToday.slice(0, 2).map((t) => (
                              <Link
                                key={t.id}
                                to={`/tasks/${t.id}`}
                                className={`block bg-gradient-to-r ${getTaskColor(
                                  t
                                )} text-white text-[10px] px-1.5 py-1 rounded-md font-semibold truncate hover:scale-[1.02] hover:shadow-md transition-all`}
                                title={`${t.name || t.title} - ${
                                  t.status || "Pending"
                                }`}
                              >
                                <div className="flex items-center gap-1">
                                  <div className="w-1 h-1 bg-white rounded-full flex-shrink-0"></div>
                                  <span className="truncate">
                                    {t.name || t.title}
                                  </span>
                                </div>
                              </Link>
                            ))}

                            {tasksToday.length > 2 && (
                              <div className="text-[10px] text-gray-600 text-center bg-gray-100 rounded-md py-0.5 font-medium hover:bg-gray-200 cursor-pointer transition">
                                +{tasksToday.length - 2}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-bold text-gray-700 mb-2">
                Status Legend
              </h4>
              <div className="flex flex-wrap gap-3">
                {[
                  ["from-emerald-500 to-teal-500", "Completed"],
                  ["from-blue-500 to-cyan-500", "In Progress"],
                  ["from-yellow-500 to-orange-500", "Due Soon"],
                  ["from-red-500 to-pink-500", "Overdue"],
                ].map(([gradient, label]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded bg-gradient-to-r ${gradient}`}
                    ></div>
                    <span className="text-xs text-gray-600 font-medium">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
