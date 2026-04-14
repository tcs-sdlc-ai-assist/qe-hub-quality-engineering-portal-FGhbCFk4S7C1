export const ROLES = {
  VIEW_ONLY: 'VIEW_ONLY',
  TEST_LEAD: 'TEST_LEAD',
  ADMIN: 'ADMIN',
}

export const PERMISSIONS = {
  [ROLES.VIEW_ONLY]: {
    view: true,
    edit_rag: false,
    edit_confidence: false,
    edit_comments: false,
    edit_dsr: false,
    manage_content: false,
    upload_data: false,
    manage_dashboards: false,
  },
  [ROLES.TEST_LEAD]: {
    view: true,
    edit_rag: true,
    edit_confidence: true,
    edit_comments: true,
    edit_dsr: true,
    manage_content: false,
    upload_data: true,
    manage_dashboards: false,
  },
  [ROLES.ADMIN]: {
    view: true,
    edit_rag: true,
    edit_confidence: true,
    edit_comments: true,
    edit_dsr: true,
    manage_content: true,
    upload_data: true,
    manage_dashboards: true,
  },
}

export function hasPermission(role, action) {
  const rolePermissions = PERMISSIONS[role]
  if (!rolePermissions) {
    return false
  }
  return rolePermissions[action] === true
}