import { useEffect, useMemo, useState } from "react";
import { useProject } from "../store/ProjectContext";
import PermissionService from "../services/permissionService";
import PopupMessage from "../components/Popup_message";

export default function PermissionsPanel() {
  const { currentProject } = useProject();
  const [matrixData, setMatrixData] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [localMatrix, setLocalMatrix] = useState({});
  const [message, setMessage] = useState(null);
  const [openSections, setOpenSections] = useState(() => new Set());

  useEffect(() => {
    if (!currentProject) return;
    PermissionService.getMatrix(currentProject.id)
      .then((res) => {
        const data = res.data;
        setMatrixData(data);
        if (data.roles && data.roles.length > 0) {
          const roleId = data.roles[0].id;
          setSelectedRole(roleId);
          setLocalMatrix(data.matrix[roleId] || {});
        }
      })
      .catch((err) => {
        console.error(err);
        setMessage({ text: "Không thể tải phân quyền.", type: "error" });
      });
  }, [currentProject]);

  useEffect(() => {
    if (!matrixData || !selectedRole) return;
    const orig = matrixData.matrix[selectedRole] || {};
    const cloned = JSON.parse(JSON.stringify(orig));
    setLocalMatrix(cloned);
  }, [selectedRole, matrixData]);

  const toggleAction = (resName, actName) => {
    const lockedView = actName === "View" && ["UserStory", "Sprint", "Issue"].includes(resName);
    const isOwnerSelected = (matrixData?.roles || []).some((r) => r.id === selectedRole && r.name === "Project Owner");
    if (lockedView || isOwnerSelected) return;
    setLocalMatrix((prev) => {
      const copy = { ...prev };
      const resObj = { ...(copy[resName] || {}) };
      resObj[actName] = !resObj[actName];
      copy[resName] = resObj;
      return copy;
    });
  };

  const toggleSection = (resName) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(resName)) next.delete(resName);
      else next.add(resName);
      return next;
    });
  };

  const save = async () => {
    try {
      await PermissionService.updateRole(currentProject.id, selectedRole, localMatrix);
      setMessage({ text: "Cập nhật quyền thành công.", type: "success" });
      setMatrixData((prev) => {
        if (!prev) return prev;
        const next = { ...prev, matrix: { ...prev.matrix } };
        next.matrix[selectedRole] = JSON.parse(JSON.stringify(localMatrix));
        return next;
      });
    } catch (err) {
      console.error(err);
      setMessage({ text: "Lỗi khi lưu phân quyền.", type: "error" });
    }
  };

  const isDirty = useMemo(() => {
    if (!matrixData || !selectedRole) return false;
    try {
      const original = matrixData.matrix[selectedRole] || {};
      return JSON.stringify(original) !== JSON.stringify(localMatrix);
    } catch {
      return true;
    }
  }, [matrixData, selectedRole, localMatrix]);

  if (!currentProject) return <div>Chọn project để quản lý phân quyền.</div>;

  return (
    <div className="mt-2">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-5">
        <h3 className="text-lg font-semibold text-emerald-700">Permissions</h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedRole || ""}
            onChange={(e) => setSelectedRole(Number(e.target.value))}
            className="border rounded-lg px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-emerald-500"
          >
            {matrixData?.roles?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <button
            onClick={save}
            disabled={!isDirty}
            className={`px-4 py-2 rounded-lg text-white transition ${isDirty ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Save
          </button>
        </div>
      </div>

      {!matrixData ? (
        <p className="text-gray-500">Đang tải...</p>
      ) : (
        <div className="divide-y divide-gray-200">
          {matrixData.resources.map((res) => {
            const resActions = localMatrix[res] || {};
            const total = Object.keys(resActions).length || matrixData.actions.length;
            const enabled = Object.values(resActions).filter(Boolean).length;
            const open = openSections.has(res);

            return (
              <div key={res} className="py-3">
                <button
                  type="button"
                  onClick={() => toggleSection(res)}
                  className="w-full flex items-center justify-between px-2 py-2 hover:bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-gray-800">{res}</span>
                    <span className="text-sm text-gray-500">{enabled}/{total}</span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${open ? "rotate-90" : "rotate-0"}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {open && (
                  <div className="mt-3 grid gap-2">
                    {Object.keys(resActions).map((act) => {
                      const checked = !!resActions[act];
                      const display = `${act} ${res}`;
                      const isLockedView = act === "View" && ["UserStory", "Sprint", "Issue"].includes(res);
                      const isOwnerSelected = (matrixData?.roles || []).some((r) => r.id === selectedRole && r.name === "Project Owner");
                      const disabled = isLockedView || isOwnerSelected;
                      return (
                        <div key={`${res}-${act}`} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                          <span className="text-gray-700">{display}</span>
                          <button
                            onClick={() => !disabled && toggleAction(res, act)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-gray-300"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                            aria-pressed={checked}
                            aria-disabled={disabled}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`}
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
        <PopupMessage message={message.text} type={message.type} onClose={() => setMessage(null)} />
      )}
    </div>
  );
}
