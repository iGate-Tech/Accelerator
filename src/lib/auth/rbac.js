// Role-Based Access Control utilities
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
};

export const PERMISSIONS = {
  CREATE_PROJECT: 'create_project',
  EDIT_PROJECT: 'edit_project',
  DELETE_PROJECT: 'delete_project',
  VIEW_ALL_PROJECTS: 'view_all_projects',
  MANAGE_USERS: 'manage_users',
  VIEW_ANALYTICS: 'view_analytics'
};

// Role permissions mapping
const rolePermissions = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.VIEW_ALL_PROJECTS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.USER]: [
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT
  ],
  [ROLES.GUEST]: []
};

// Get user role (mocked for now)
export const getUserRole = (user) => {
  if (!user) return ROLES.GUEST;
  // In a real app, this would come from user data
  return ROLES.USER; // Default to user role
};

// Check if user has permission
export const hasPermission = (user, permission) => {
  const role = getUserRole(user);
  const permissions = rolePermissions[role] || [];
  return permissions.includes(permission);
};

// Check if user has role
export const hasRole = (user, role) => {
  const userRole = getUserRole(user);
  return userRole === role;
};

// Higher-order component for permission checking
export const withPermission = (permission) => (Component) => {
  return (props) => {
    const user = props.user; // Assume user is passed as prop
    if (!hasPermission(user, permission)) {
      return <div class="alert alert-error">Access denied. You don't have permission to view this content.</div>;
    }
    return <Component {...props} />;
  };
};

// Permission guard hook
export const usePermission = (permission) => {
  // In a real app, this would use user context
  const user = { id: 'mock-user' }; // Mock user
  return hasPermission(user, permission);
};