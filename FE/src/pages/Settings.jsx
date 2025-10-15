import { useProject } from "../store/ProjectContext";
import CustomRoleManager from "../components/CustomRoleManager";
import MainLayout from "../layouts/MainLayout";

export default function Settings() {
  const { currentProject } = useProject();

  return (
    <MainLayout>
      <div className="p-6 space-y-8">
        <h2 className="text-2xl font-bold text-green-700">
          Setting project {currentProject?.name}
        </h2>

        {/* Quản lý Role Custom */}
        {currentProject && (
          <CustomRoleManager projectId={currentProject.id} />
        )}
      </div>
    </MainLayout>
  );
}
