"""
Test Permission API Endpoints

Run with: pytest BE/tests/test_permission_api.py -v
"""

import pytest
from flask import json


class TestPermissionAPI:
    """Test permission API endpoints"""

    def test_get_user_permissions_success(self, client, auth_headers, sample_project_with_team):
        """Test getting user permissions for a project"""
        project = sample_project_with_team
        
        response = client.get(
            f'/api/permissions/matrix?project_id={project.id}',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Check response structure
        assert 'role_id' in data
        assert 'role_name' in data
        assert 'permissions' in data
        
        # Check permissions structure
        permissions = data['permissions']
        assert isinstance(permissions, dict)
        
        # Should have common resources
        assert 'Task' in permissions
        assert 'UserStory' in permissions
        assert 'Sprint' in permissions
        
        # Each resource should have action mappings
        task_perms = permissions['Task']
        assert isinstance(task_perms, dict)
        assert 'View' in task_perms
        assert 'Create' in task_perms
        assert 'Edit' in task_perms
        assert 'Delete' in task_perms
        assert 'Comment' in task_perms
        
        # All values should be boolean
        assert isinstance(task_perms['View'], bool)
        assert isinstance(task_perms['Create'], bool)

    def test_get_user_permissions_no_project_id(self, client, auth_headers):
        """Test getting permissions without project_id parameter"""
        response = client.get(
            '/api/permissions/matrix',
            headers=auth_headers
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'project_id is required' in data['error']

    def test_get_user_permissions_not_member(self, client, auth_headers, sample_project):
        """Test getting permissions for project where user is not a member"""
        # Create a project but don't add current user to team
        other_project_id = 9999  # Non-existent or not member
        
        response = client.get(
            f'/api/permissions/matrix?project_id={other_project_id}',
            headers=auth_headers
        )
        
        assert response.status_code == 403
        data = json.loads(response.data)
        assert 'error' in data

    def test_get_user_permissions_unauthorized(self, client, sample_project):
        """Test getting permissions without authentication"""
        response = client.get(
            f'/api/permissions/matrix?project_id={sample_project.id}'
        )
        
        assert response.status_code == 401

    def test_project_owner_has_all_permissions(self, client, auth_headers_owner, sample_project_owner):
        """Test that Project Owner has all permissions"""
        project = sample_project_owner
        
        response = client.get(
            f'/api/permissions/matrix?project_id={project.id}',
            headers=auth_headers_owner
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['role_name'] == 'Project Owner'
        
        permissions = data['permissions']
        
        # Owner should have all permissions
        for resource, actions in permissions.items():
            for action, allowed in actions.items():
                assert allowed is True, f"Owner should have {resource}.{action}"

    def test_forced_view_permissions(self, client, auth_headers, sample_project_member):
        """Test that View permission is forced for UserStory, Sprint, Issue"""
        project = sample_project_member
        
        response = client.get(
            f'/api/permissions/matrix?project_id={project.id}',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        permissions = data['permissions']
        
        # These should always have View = True
        assert permissions['UserStory']['View'] is True
        assert permissions['Sprint']['View'] is True
        assert permissions['Issue']['View'] is True

    def test_comment_only_on_task(self, client, auth_headers, sample_project_with_team):
        """Test that Comment action only exists for Task resource"""
        project = sample_project_with_team
        
        response = client.get(
            f'/api/permissions/matrix?project_id={project.id}',
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        permissions = data['permissions']
        
        # Task should have Comment
        assert 'Comment' in permissions['Task']
        
        # Others should NOT have Comment
        assert 'Comment' not in permissions.get('UserStory', {})
        assert 'Comment' not in permissions.get('Sprint', {})
        assert 'Comment' not in permissions.get('Issue', {})


# Fixtures (add to conftest.py if not already there)
@pytest.fixture
def sample_project_with_team(db, sample_user, sample_project):
    """Create a project with user as team member"""
    from flask_api.models import Team, ProjectRole, Role
    
    # Create a role
    role = Role.query.filter_by(name='Developer').first()
    if not role:
        role = Role(name='Developer')
        db.session.add(role)
        db.session.commit()
    
    # Create project role
    proj_role = ProjectRole(
        project_id=sample_project.id,
        role_id=role.id,
        name='Developer'
    )
    db.session.add(proj_role)
    db.session.commit()
    
    # Add user to team
    team = Team(
        user_id=sample_user.id,
        projrole_id=proj_role.id
    )
    db.session.add(team)
    db.session.commit()
    
    return sample_project


@pytest.fixture
def sample_project_owner(db, sample_user, sample_project):
    """Create a project with user as Project Owner"""
    from flask_api.models import Team, ProjectRole, Role
    
    # Create owner role
    role = Role.query.filter_by(name='Project Owner').first()
    if not role:
        role = Role(name='Project Owner')
        db.session.add(role)
        db.session.commit()
    
    # Create project role
    proj_role = ProjectRole(
        project_id=sample_project.id,
        role_id=role.id,
        name='Project Owner'
    )
    db.session.add(proj_role)
    db.session.commit()
    
    # Add user as owner
    team = Team(
        user_id=sample_user.id,
        projrole_id=proj_role.id
    )
    db.session.add(team)
    db.session.commit()
    
    return sample_project


@pytest.fixture
def auth_headers_owner(client, sample_user_owner):
    """Get auth headers for project owner"""
    # Login logic here
    # Return headers with session cookie
    pass
