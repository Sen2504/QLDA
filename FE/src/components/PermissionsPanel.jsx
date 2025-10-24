import { useEffect, useMemo, useState } from "react";
import { useProject } from "../store/ProjectContext";
import PermissionService from "../services/permissionService";
import PopupMessage from "../components/Popup_message";
import {
  Eye,
  Plus,
  Trash2,
  Edit3,
  MessageSquare,
  Lock,
} from "lucide-react";

export default function PermissionsPanel() {
  const { currentProject } = useProject();
  const [matrixData, setMatrixData] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [localMatrix, setLocalMatrix] = useState({});
  const [message, setMessage] = useState(null);
  const [openSections, setOpenSections] = useState(() => new Set());

  // Load permission matrix
  useEffect(() => {
    if (!currentProject) return;
    PermissionService.getMatrix(currentProject.id)
      .then((res) => {
        const data = res.data;
        setMatrixData(data);
        if (data.roles?.length) {
          const firstRole = data.roles[0];
          setSelectedRole(firstRole.id);
          setLocalMatrix(data.matrix[firstRole.id] || {});
        }
      })
      .catch(() =>
        setMessage({ text: "Không thể tải phân quyền.", type: "error" })
      );
  }, [currentProject]);

  // Update when switching role
  useEffect(() => {
    if (!matrixData || !selectedRole) return;
    const cloned = JSON.parse(
      JSON.stringify(matrixData.matrix[selectedRole] || {})
    );
    setLocalMatrix(cloned);
  }, [selectedRole, matrixData]);

  // Toggle permission
  const toggleAction = (resName, actName) => {
    const lockedView =
      actName === "View" &&
      ["UserStory", "Sprint", "Issue"].includes(resName);
    const isOwner = (matrixData?.roles || []).some(
      (r) => r.id === selectedRole && r.name === "Project Owner"
    );
    if (lockedView || isOwner) return;

    setLocalMatrix((prev) => {
      const next = { ...prev };
      const resObj = { ...(next[resName] || {}) };
      resObj[actName] = !resObj[actName];
      next[resName] = resObj;
      return next;
    });
  };

  // Save permissions
  const save = async () => {
    try {
      await PermissionService.updateRole(
        currentProject.id,
        selectedRole,
        localMatrix
      );
      setMessage({ text: "Update successful", type: "success" });
      setMatrixData((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, matrix: { ...prev.matrix } };
        updated.matrix[selectedRole] = JSON.parse(JSON.stringify(localMatrix));
        return updated;
      });
    } catch {
      setMessage({ text: "Lỗi khi lưu phân quyền.", type: "error" });
    }
  };

  const isDirty = useMemo(() => {
    if (!matrixData || !selectedRole) return false;
    const original = matrixData.matrix[selectedRole] || {};
    return JSON.stringify(original) !== JSON.stringify(localMatrix);
  }, [matrixData, selectedRole, localMatrix]);

  if (!currentProject)
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 font-medium">
          Select a project to manage permissions
        </p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-gray-700 to-gray-800 bg-clip-text text-transparent">
            Permissions Matrix
          </h3>
          <p className="text-sm text-gray-600">
            Configure role-based access control
          </p>
        </div>

        <div className="flex items-center gap-3 mt-3 sm:mt-0">
          <select
            value={selectedRole || ""}
            onChange={(e) => setSelectedRole(Number(e.target.value))}
            className="pl-4 pr-10 py-2 border border-gray-300 rounded-xl bg-white font-medium text-gray-800 focus:ring-2 focus:ring-gray-400 outline-none"
          >
            {matrixData?.roles?.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            onClick={save}
            disabled={!isDirty}
            className={`px-5 py-2 rounded-xl font-semibold transition-all ${
              isDirty
                ? "bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Permissions */}
      {!matrixData ? (
        <div className="py-16 text-center text-gray-600">
          Loading permissions...
        </div>
      ) : (
        <div className="space-y-4">
          {matrixData.resources.map((res) => {
            const resActions = localMatrix[res] || {};
            const open = openSections.has(res);

            return (
              <div
                key={res}
                className="border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Resource header */}
                <button
                  type="button"
                  onClick={() =>
                    setOpenSections((prev) => {
                      const next = new Set(prev);
                      next.has(res) ? next.delete(res) : next.add(res);
                      return next;
                    })
                  }
                  className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    {/* Resource icon */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center shadow">
                      <Lock className="w-5 h-5 text-white" />
                    </div>

                    {/* Resource name + count */}
                    <div>
                      <span className="font-bold text-gray-800 block">{res}</span>

                      {/* 🔹 Hiển thị số quyền được bật */}
                      {(() => {
                        const resActions = localMatrix[res] || {};
                        const total = Object.keys(resActions).length || matrixData.actions.length;
                        const enabled = Object.values(resActions).filter(Boolean).length;

                        return (
                          <span className="text-xs text-gray-500 font-medium">
                            {enabled}/{total}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Chevron */}
                  <svg
                    className={`w-5 h-5 text-gray-500 transform transition-transform ${
                      open ? "rotate-90" : "rotate-0"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>


                {/* Actions list */}
                {open && (
                  <div className="p-4 bg-white/70 space-y-2">
                    {Object.keys(resActions).map((act) => {
                      const checked = !!resActions[act];
                      const isLockedView =
                        act === "View" &&
                        ["UserStory", "Sprint", "Issue"].includes(res);
                      const isOwnerSelected = (matrixData?.roles || []).some(
                        (r) =>
                          r.id === selectedRole && r.name === "Project Owner"
                      );
                      const disabled = isLockedView || isOwnerSelected;

                      const getIcon = () => {
                        switch (act) {
                          case "View":
                            return <Eye className="w-4 h-4" />;
                          case "Create":
                            return <Plus className="w-4 h-4" />;
                          case "Edit":
                            return <Edit3 className="w-4 h-4" />;
                          case "Delete":
                            return <Trash2 className="w-4 h-4" />;
                          case "Comment":
                            return <MessageSquare className="w-4 h-4" />;
                          default:
                            return <Lock className="w-4 h-4" />;
                        }
                      };

                      return (
                        <div
                          key={`${res}-${act}`}
                          className={`flex items-center justify-between px-4 py-2 border rounded-xl transition ${
                            checked
                              ? "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-300"
                              : "bg-white hover:bg-gray-50"
                          } ${disabled ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                checked
                                  ? "bg-gradient-to-br from-gray-600 to-gray-700 text-white"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {getIcon()}
                            </div>

                            <span
                              className={`font-medium ${
                                checked
                                  ? "text-gray-800"
                                  : "text-gray-600"
                              }`}
                            >
                              {act} {res}
                            </span>

                            {disabled && (
                              <Lock className="w-4 h-4 text-amber-500" />
                            )}
                          </div>

                          <button
                            onClick={() => !disabled && toggleAction(res, act)}
                            className={`relative w-12 h-7 rounded-full transition ${
                              checked
                                ? "bg-gradient-to-r from-gray-600 to-gray-700"
                                : "bg-gray-300"
                            } ${
                              disabled
                                ? "cursor-not-allowed"
                                : "hover:scale-105"
                            }`}
                          >
                            <span
                              className={`absolute top-1 left-1 h-5 w-5 bg-white rounded-full shadow transition-transform ${
                                checked ? "translate-x-5" : ""
                              }`}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {message && (
        <PopupMessage
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
    </div>
  );
}
