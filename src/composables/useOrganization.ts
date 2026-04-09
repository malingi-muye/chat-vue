/**
 * Organization context composable
 * Manages current organization context and provides access control utilities
 */

import type { Organization, OrganizationMember } from '~/server/utils/drizzle'

export interface OrganizationContext {
  organization: Organization | null
  membership: OrganizationMember | null
  isOwner: boolean
  isAdmin: boolean
  isMember: boolean
}

const currentOrg = ref<Organization | null>(null)
const currentMembership = ref<OrganizationMember | null>(null)
const isLoading = ref(false)

export function useOrganization() {
  /**
   * Set current organization context
   */
  const setOrganization = (org: Organization, membership: OrganizationMember) => {
    currentOrg.value = org
    currentMembership.value = membership
  }

  /**
   * Get current organization
   */
  const getOrganization = (): Organization | null => {
    return currentOrg.value
  }

  /**
   * Get current organization ID (throws if not set)
   */
  const getOrgId = (): string => {
    if (!currentOrg.value?.id) {
      throw new Error('No organization context set')
    }
    return currentOrg.value.id
  }

  /**
   * Check if user has specific role
   */
  const hasRole = (roles: string[]): boolean => {
    return currentMembership.value ? roles.includes(currentMembership.value.role) : false
  }

  /**
   * Check if user can manage organization
   */
  const canManage = (): boolean => {
    return hasRole(['owner', 'admin'])
  }

  /**
   * Check if user is organization owner
   */
  const isOrgOwner = (): boolean => {
    return hasRole(['owner'])
  }

  /**
   * Load user's organizations
   */
  const loadOrganizations = async () => {
    try {
      isLoading.value = true
      const response = await fetch('/api/user/organizations')
      if (!response.ok) throw new Error('Failed to load organizations')
      return await response.json()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Create new organization
   */
  const createOrganization = async (data: {
    name: string
    slug: string
    description?: string
  }) => {
    try {
      isLoading.value = true
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to create organization')
      return await response.json()
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Update current organization
   */
  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!currentOrg.value?.id) throw new Error('No organization selected')

    try {
      isLoading.value = true
      const response = await fetch(`/api/organizations/${currentOrg.value.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!response.ok) throw new Error('Failed to update organization')
      const updated = await response.json()
      currentOrg.value = updated
      return updated
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Get organization context (org + membership)
   */
  const getContext = (): OrganizationContext => ({
    organization: currentOrg.value,
    membership: currentMembership.value,
    isOwner: isOrgOwner(),
    isAdmin: hasRole(['admin']),
    isMember: hasRole(['member', 'viewer', 'admin', 'owner'])
  })

  return {
    currentOrg: readonly(currentOrg),
    currentMembership: readonly(currentMembership),
    isLoading: readonly(isLoading),
    setOrganization,
    getOrganization,
    getOrgId,
    hasRole,
    canManage,
    isOrgOwner,
    getContext,
    loadOrganizations,
    createOrganization,
    updateOrganization
  }
}
