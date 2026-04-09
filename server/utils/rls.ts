/**
 * Row-Level Security (RLS) utilities for multi-tenant database access control
 * Ensures users can only access data within their organization
 */

import type { User, Organization, OrganizationMember } from './drizzle'

export interface SecurityContext {
  userId: string
  user: User
  organizationId: string
  organization: Organization
  membership: OrganizationMember
}

/**
 * Verify user has access to organization
 * Returns security context if authorized, throws if not
 */
export async function requireOrgContext(
  userId: string,
  organizationId: string,
  db: any
): Promise<SecurityContext> {
  const { users, organizations, organizationMembers } = db.query

  // Get user
  const user = await db.query.users.findFirst({
    where: (t: any, { eq }: any) => eq(t.id, userId)
  })

  if (!user) {
    throw new Error('User not found')
  }

  // Get organization
  const organization = await db.query.organizations.findFirst({
    where: (t: any, { eq }: any) => eq(t.id, organizationId)
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Check membership (allow owner and members)
  const membership = await db.query.organizationMembers.findFirst({
    where: (t: any, { eq, and }: any) => and(
      eq(t.organizationId, organizationId),
      eq(t.userId, userId)
    )
  })

  // Allow access if user is member OR is the organization owner
  if (!membership && organization.ownerId !== userId) {
    throw new Error('User does not have access to this organization')
  }

  return {
    userId,
    user,
    organizationId,
    organization,
    membership: membership || {
      id: '',
      organizationId,
      userId,
      role: 'owner', // Owner role if no membership record
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    }
  }
}

/**
 * Check if user has specific role in organization
 */
export function hasRole(context: SecurityContext, requiredRoles: string[]): boolean {
  return requiredRoles.includes(context.membership.role)
}

/**
 * Check if user can modify organization data
 */
export function canManageOrg(context: SecurityContext): boolean {
  return hasRole(context, ['owner', 'admin'])
}

/**
 * Check if user can view organization data (any member)
 */
export function canViewOrg(context: SecurityContext): boolean {
  return hasRole(context, ['owner', 'admin', 'member', 'viewer'])
}

/**
 * Build org-scoped query filters
 * Use this to automatically filter queries by organization
 */
export function orgFilter(orgId: string, columnRef: any, eq: any): any {
  return eq(columnRef, orgId)
}

/**
 * Build org + user scoped query filters
 */
export function userOrgFilter(
  userId: string,
  orgId: string,
  userCol: any,
  orgCol: any,
  eq: any,
  and: any
): any {
  return and(
    eq(userCol, userId),
    eq(orgCol, orgId)
  )
}

/**
 * Encrypt sensitive config data (API keys, credentials)
 * In production, use proper encryption library like tweetnacl or libsodium
 */
export function encryptConfig(config: Record<string, any>, secretKey: string): string {
  // TODO: Implement proper encryption
  // For now, use base64 as placeholder
  return Buffer.from(JSON.stringify(config)).toString('base64')
}

/**
 * Decrypt sensitive config data
 */
export function decryptConfig(encrypted: string, secretKey: string): Record<string, any> {
  // TODO: Implement proper decryption
  // For now, decode from base64
  return JSON.parse(Buffer.from(encrypted, 'base64').toString('utf-8'))
}
