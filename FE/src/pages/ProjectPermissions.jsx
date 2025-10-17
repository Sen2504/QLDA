import MainLayout from "../layouts/MainLayout";
import PermissionsPanel from "../components/PermissionsPanel";

export default function ProjectPermissions() {
  return (
    <MainLayout>
      <div className="mt-6 bg-white rounded-2xl shadow p-6">
        <PermissionsPanel />
      </div>
    </MainLayout>
  );
}
