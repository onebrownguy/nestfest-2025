/**
 * Role-Based Access Control (RBAC) System for NestFest
 * 
 * This module handles permission management, role validation,
 * and access control throughout the application.
 */

import { UserRole, Permission } from '@/types'

// Define comprehensive permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    { id: 'read_competitions', resource: 'competitions', action: 'read' },
    { id: 'create_submission', resource: 'submissions', action: 'write' },
    { id: 'read_own_submissions', resource: 'own_submissions', action: 'read' },
    { id: 'update_own_submissions', resource: 'own_submissions', action: 'write' },
    { id: 'read_own_profile', resource: 'profile', action: 'read' },
    { id: 'update_own_profile', resource: 'profile', action: 'write' },
    { id: 'join_team', resource: 'teams', action: 'write' },
    { id: 'vote_public', resource: 'public_votes', action: 'write' },
    { id: 'read_public_results', resource: 'public_results', action: 'read' }
  ],

  reviewer: [
    { id: 'read_competitions', resource: 'competitions', action: 'read' },
    { id: 'read_all_submissions', resource: 'submissions', action: 'read' },
    { id: 'create_review', resource: 'reviews', action: 'write' },
    { id: 'update_own_reviews', resource: 'own_reviews', action: 'write' },
    { id: 'read_review_assignments', resource: 'review_assignments', action: 'read' },
    { id: 'comment_on_submissions', resource: 'comments', action: 'write' },
    { id: 'view_internal_notes', resource: 'internal_notes', action: 'read' },
    { id: 'read_scoring_rubrics', resource: 'scoring_rubrics', action: 'read' },
    { id: 'advance_submissions', resource: 'submission_advancement', action: 'write' }
  ],

  judge: [
    { id: 'read_competitions', resource: 'competitions', action: 'read' },
    { id: 'read_assigned_submissions', resource: 'assigned_submissions', action: 'read' },
    { id: 'create_vote', resource: 'votes', action: 'write' },
    { id: 'update_own_votes', resource: 'own_votes', action: 'write' },
    { id: 'read_judge_assignments', resource: 'judge_assignments', action: 'read' },
    { id: 'view_scoring_criteria', resource: 'scoring_criteria', action: 'read' },
    { id: 'declare_conflicts', resource: 'conflicts', action: 'write' },
    { id: 'access_judge_dashboard', resource: 'judge_dashboard', action: 'read' },
    { id: 'view_live_event', resource: 'live_event', action: 'read' }
  ],

  admin: [
    { id: 'manage_competitions', resource: 'competitions', action: 'admin' },
    { id: 'manage_users', resource: 'users', action: 'admin' },
    { id: 'manage_submissions', resource: 'submissions', action: 'admin' },
    { id: 'manage_reviews', resource: 'reviews', action: 'admin' },
    { id: 'manage_votes', resource: 'votes', action: 'admin' },
    { id: 'manage_judge_assignments', resource: 'judge_assignments', action: 'admin' },
    { id: 'view_all_data', resource: '*', action: 'read' },
    { id: 'modify_all_data', resource: '*', action: 'write' },
    { id: 'delete_any_data', resource: '*', action: 'delete' },
    { id: 'access_admin_dashboard', resource: 'admin_dashboard', action: 'read' },
    { id: 'manage_live_events', resource: 'live_events', action: 'admin' },
    { id: 'override_system_actions', resource: 'system_overrides', action: 'admin' },
    { id: 'view_audit_logs', resource: 'audit_logs', action: 'read' },
    { id: 'manage_permissions', resource: 'permissions', action: 'admin' }
  ],

  super_admin: [
    { id: 'full_system_access', resource: '*', action: 'admin' },
    { id: 'manage_admin_users', resource: 'admin_users', action: 'admin' },
    { id: 'system_configuration', resource: 'system_config', action: 'admin' },
    { id: 'emergency_procedures', resource: 'emergency_procedures', action: 'admin' },
    { id: 'database_management', resource: 'database', action: 'admin' }
  ]
}

// Resource hierarchy for permission inheritance
export const RESOURCE_HIERARCHY: Record<string, string[]> = {
  '*': [], // Root level - no parent
  'competitions': ['*'],
  'submissions': ['competitions'],
  'own_submissions': ['submissions'],
  'assigned_submissions': ['submissions'],
  'reviews': ['competitions'],
  'own_reviews': ['reviews'],
  'votes': ['competitions'],
  'own_votes': ['votes'],
  'teams': ['competitions'],
  'users': ['*'],
  'admin_users': ['users']
}

export class PermissionManager {
  /**
   * Check if a user role has permission to perform an action on a resource
   */
  hasPermission(
    userRole: UserRole,
    resource: string,
    action: 'read' | 'write' | 'delete' | 'admin'
  ): boolean {
    const permissions = ROLE_PERMISSIONS[userRole] || []
    
    // Check for exact permission match
    const exactMatch = permissions.some(permission => 
      permission.resource === resource && 
      (permission.action === action || permission.action === 'admin')
    )
    
    if (exactMatch) return true
    
    // Check for wildcard permissions
    const wildcardMatch = permissions.some(permission =>
      permission.resource === '*' && 
      (permission.action === action || permission.action === 'admin')
    )
    
    if (wildcardMatch) return true
    
    // Check for hierarchical permissions
    const hierarchy = RESOURCE_HIERARCHY[resource] || []
    for (const parentResource of hierarchy) {
      const hierarchicalMatch = permissions.some(permission =>
        permission.resource === parentResource && 
        (permission.action === action || permission.action === 'admin')
      )
      if (hierarchicalMatch) return true
    }
    
    return false
  }

  /**
   * Get all permissions for a specific role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Check if user can access a specific competition
   */
  canAccessCompetition(
    userRole: UserRole, 
    userId: string,
    competitionId: string,
    competitionStatus: string,
    userAssignments?: { judgeAssignments?: string[], reviewAssignments?: string[] }
  ): boolean {
    // Super admin and admin can access all competitions
    if (userRole === 'super_admin' || userRole === 'admin') {
      return true
    }

    // Students can access public competitions
    if (userRole === 'student') {
      return ['open', 'live', 'completed'].includes(competitionStatus)
    }

    // Judges can access competitions they are assigned to
    if (userRole === 'judge') {
      return userAssignments?.judgeAssignments?.includes(competitionId) || false
    }

    // Reviewers can access competitions they are assigned to review
    if (userRole === 'reviewer') {
      return userAssignments?.reviewAssignments?.includes(competitionId) || false
    }

    return false
  }

  /**
   * Check if user can modify a specific submission
   */
  canModifySubmission(
    userRole: UserRole,
    userId: string,
    submission: {
      user_id?: string
      team_id?: string
      status: string
      competition_status: string
    },
    userTeams?: string[]
  ): boolean {
    // Admin can modify any submission
    if (userRole === 'admin' || userRole === 'super_admin') {
      return true
    }

    // Students can modify their own submissions if not yet submitted
    if (userRole === 'student') {
      const isOwner = submission.user_id === userId || 
                     (submission.team_id && userTeams?.includes(submission.team_id))
      const canEdit = submission.status === 'draft' && 
                     submission.competition_status === 'open'
      return isOwner && canEdit
    }

    // Reviewers cannot modify submissions directly
    return false
  }

  /**
   * Generate context-aware permissions for frontend
   */
  getContextualPermissions(
    userRole: UserRole,
    userId: string,
    context: {
      competitionId?: string
      submissionId?: string
      currentRoute?: string
      resourceOwner?: string
    }
  ): {
    canCreate: boolean
    canRead: boolean
    canUpdate: boolean
    canDelete: boolean
    canAdmin: boolean
    specificPermissions: string[]
  } {
    const basePermissions = this.getRolePermissions(userRole)
    const specificPermissions: string[] = []

    // Determine resource based on context
    let resource = '*'
    if (context.currentRoute?.includes('/admin')) {
      resource = 'admin_dashboard'
    } else if (context.currentRoute?.includes('/submissions')) {
      resource = context.resourceOwner === userId ? 'own_submissions' : 'submissions'
    } else if (context.currentRoute?.includes('/competitions')) {
      resource = 'competitions'
    }

    const canCreate = this.hasPermission(userRole, resource, 'write')
    const canRead = this.hasPermission(userRole, resource, 'read')
    const canUpdate = this.hasPermission(userRole, resource, 'write')
    const canDelete = this.hasPermission(userRole, resource, 'delete')
    const canAdmin = this.hasPermission(userRole, resource, 'admin')

    // Add specific permissions based on role
    basePermissions.forEach(permission => {
      if (permission.resource === resource || permission.resource === '*') {
        specificPermissions.push(permission.id)
      }
    })

    return {
      canCreate,
      canRead,
      canUpdate,
      canDelete,
      canAdmin,
      specificPermissions
    }
  }

  /**
   * Validate API request permissions
   */
  validateAPIRequest(
    userRole: UserRole,
    userId: string,
    method: string,
    resource: string,
    resourceId?: string,
    resourceOwner?: string
  ): { allowed: boolean; reason?: string } {
    // Map HTTP methods to actions
    const actionMap: Record<string, 'read' | 'write' | 'delete' | 'admin'> = {
      'GET': 'read',
      'POST': 'write',
      'PUT': 'write',
      'PATCH': 'write',
      'DELETE': 'delete'
    }

    const action = actionMap[method.toUpperCase()]
    if (!action) {
      return { allowed: false, reason: 'Invalid HTTP method' }
    }

    // Check if user owns the resource
    const isOwner = resourceOwner === userId
    const ownershipResource = isOwner ? `own_${resource}` : resource

    // Check permission
    const hasPermission = this.hasPermission(userRole, ownershipResource, action) ||
                         this.hasPermission(userRole, resource, action)

    if (!hasPermission) {
      return { 
        allowed: false, 
        reason: `Insufficient permissions for ${action} on ${resource}` 
      }
    }

    return { allowed: true }
  }

  /**
   * Generate permission matrix for role comparison
   */
  generatePermissionMatrix(): Record<UserRole, Record<string, boolean>> {
    const matrix: Record<UserRole, Record<string, boolean>> = {
      student: {},
      reviewer: {},
      judge: {},
      admin: {},
      super_admin: {}
    }

    const allResources = new Set<string>()
    const allActions = ['read', 'write', 'delete', 'admin'] as const

    // Collect all resources
    Object.values(ROLE_PERMISSIONS).forEach(permissions => {
      permissions.forEach(permission => {
        allResources.add(permission.resource)
      })
    })

    // Build matrix
    Object.keys(matrix).forEach(role => {
      const userRole = role as UserRole
      allResources.forEach(resource => {
        allActions.forEach(action => {
          const key = `${resource}:${action}`
          matrix[userRole][key] = this.hasPermission(userRole, resource, action)
        })
      })
    })

    return matrix
  }
}

// Export singleton instance
export const permissionManager = new PermissionManager()

// Utility functions for common permission checks
export const canUserAccess = (
  userRole: UserRole,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'admin'
): boolean => {
  return permissionManager.hasPermission(userRole, resource, action)
}

export const isAdmin = (userRole: UserRole): boolean => {
  return userRole === 'admin' || userRole === 'super_admin'
}

export const canManageUsers = (userRole: UserRole): boolean => {
  return permissionManager.hasPermission(userRole, 'users', 'admin')
}

export const canManageCompetitions = (userRole: UserRole): boolean => {
  return permissionManager.hasPermission(userRole, 'competitions', 'admin')
}

export const canViewAdminDashboard = (userRole: UserRole): boolean => {
  return permissionManager.hasPermission(userRole, 'admin_dashboard', 'read')
}