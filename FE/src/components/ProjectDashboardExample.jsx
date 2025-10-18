import { useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { usePermissions } from '../store/PermissionContext';
import PermissionGuard from '../components/PermissionGuard';

/**
 * Example component showing how to integrate permissions in a project page
 */
export default function ProjectDashboardExample() {
  const { currentProject } = useProject();
  const { loadPermissions, clearPermissions, loading, error, roleName, hasPermission } = usePermissions();

  // Load permissions when project changes
  useEffect(() => {
    if (currentProject?.id) {
      loadPermissions(currentProject.id);
    } else {
      clearPermissions();
    }
  }, [currentProject?.id, loadPermissions, clearPermissions]);

  if (!currentProject) {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold">Please select a project</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">Loading permissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded">
        <p className="text-red-700">Error loading permissions: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header with role info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{currentProject.name}</h1>
        <p className="text-gray-600 mt-2">Your role: <span className="font-semibold">{roleName}</span></p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <PermissionGuard resource="UserStory" action="Create">
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Create User Story
          </button>
        </PermissionGuard>

        <PermissionGuard resource="Task" action="Create">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Create Task
          </button>
        </PermissionGuard>

        <PermissionGuard resource="Sprint" action="Create">
          <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
            Create Sprint
          </button>
        </PermissionGuard>

        <PermissionGuard resource="Team" action="Edit">
          <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
            Manage Team
          </button>
        </PermissionGuard>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b mb-6">
        <nav className="flex gap-6">
          <PermissionGuard resource="UserStory" action="View">
            <a href="#user-stories" className="pb-2 border-b-2 border-blue-500">User Stories</a>
          </PermissionGuard>

          <PermissionGuard resource="Task" action="View">
            <a href="#tasks" className="pb-2 hover:border-b-2 hover:border-gray-300">Tasks</a>
          </PermissionGuard>

          <PermissionGuard resource="Sprint" action="View">
            <a href="#sprints" className="pb-2 hover:border-b-2 hover:border-gray-300">Sprints</a>
          </PermissionGuard>

          <PermissionGuard resource="Issue" action="View">
            <a href="#issues" className="pb-2 hover:border-b-2 hover:border-gray-300">Issues</a>
          </PermissionGuard>

          <PermissionGuard resource="ProjectRole" action="View">
            <a href="#permissions" className="pb-2 hover:border-b-2 hover:border-gray-300">Permissions</a>
          </PermissionGuard>
        </nav>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Stories Card */}
        <PermissionGuard resource="UserStory" action="View">
          <div className="border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">User Stories</h3>
            <p className="text-gray-600 mb-4">5 active stories</p>
            <div className="flex gap-2">
              <PermissionGuard resource="UserStory" action="Create">
                <button className="text-blue-600 hover:underline">Add Story</button>
              </PermissionGuard>
              <button className="text-gray-600 hover:underline">View All</button>
            </div>
          </div>
        </PermissionGuard>

        {/* Tasks Card */}
        <PermissionGuard resource="Task" action="View">
          <div className="border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Tasks</h3>
            <p className="text-gray-600 mb-4">12 pending tasks</p>
            <div className="flex gap-2">
              <PermissionGuard resource="Task" action="Create">
                <button className="text-blue-600 hover:underline">Add Task</button>
              </PermissionGuard>
              <button className="text-gray-600 hover:underline">View All</button>
            </div>
          </div>
        </PermissionGuard>

        {/* Sprints Card */}
        <PermissionGuard resource="Sprint" action="View">
          <div className="border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Sprints</h3>
            <p className="text-gray-600 mb-4">Current: Sprint 3</p>
            <div className="flex gap-2">
              <PermissionGuard resource="Sprint" action="Create">
                <button className="text-blue-600 hover:underline">New Sprint</button>
              </PermissionGuard>
              <button className="text-gray-600 hover:underline">View All</button>
            </div>
          </div>
        </PermissionGuard>

        {/* Team Members Card */}
        <PermissionGuard resource="Team" action="View">
          <div className="border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">Team</h3>
            <p className="text-gray-600 mb-4">8 members</p>
            <div className="flex gap-2">
              <PermissionGuard resource="Team" action="Edit">
                <button className="text-blue-600 hover:underline">Invite Member</button>
              </PermissionGuard>
              <button className="text-gray-600 hover:underline">View Team</button>
            </div>
          </div>
        </PermissionGuard>

        {/* Permissions Card - Only for Project Owner or those with ProjectRole.Edit */}
        <PermissionGuard resource="ProjectRole" action="Edit">
          <div className="border rounded-lg p-6 shadow-sm bg-yellow-50">
            <h3 className="text-xl font-semibold mb-4">⚙️ Permissions</h3>
            <p className="text-gray-600 mb-4">Manage role permissions</p>
            <button className="text-blue-600 hover:underline">Configure</button>
          </div>
        </PermissionGuard>
      </div>

      {/* Debug Info (remove in production) */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-gray-100 rounded text-sm">
          <h4 className="font-semibold mb-2">Debug - Your Permissions:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>Task.Create: {hasPermission('Task', 'Create') ? '✅' : '❌'}</div>
            <div>Task.Edit: {hasPermission('Task', 'Edit') ? '✅' : '❌'}</div>
            <div>Task.Delete: {hasPermission('Task', 'Delete') ? '✅' : '❌'}</div>
            <div>Task.Comment: {hasPermission('Task', 'Comment') ? '✅' : '❌'}</div>
            <div>UserStory.Create: {hasPermission('UserStory', 'Create') ? '✅' : '❌'}</div>
            <div>Sprint.Create: {hasPermission('Sprint', 'Create') ? '✅' : '❌'}</div>
            <div>Team.Edit: {hasPermission('Team', 'Edit') ? '✅' : '❌'}</div>
            <div>ProjectRole.Edit: {hasPermission('ProjectRole', 'Edit') ? '✅' : '❌'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
