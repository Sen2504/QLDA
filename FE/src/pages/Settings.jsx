import { useProject } from "../store/ProjectContext";
import CustomRoleManager from "../components/CustomRoleManager";

export default function Settings() {
  const { currentProject } = useProject();

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-bold text-green-700">
        Cài đặt Project {currentProject?.name}
      </h2>

      {/* Quản lý Role Custom */}
      {currentProject && (
        <CustomRoleManager projectId={currentProject.id} />
      )}
    </div>
  );
}
