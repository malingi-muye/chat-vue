/**
 * GET /api/user/organizations
 * Get all organizations for the current user
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { eq, or } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const db = useDrizzle()

  // Get organizations where user is owner or member
  const organizations = await db.query.organizations.findMany({
    where: (t, { eq, or }) => or(
      eq(t.ownerId, session.user!.id),
      // This will be handled through membership join
    ),
    with: {
      members: true
    }
  })

  // Also get organizations where user is a member (but not owner)
  const memberOrgs = await db.query.organizationMembers.findMany({
    where: (t, { eq }) => eq(t.userId, session.user!.id),
    with: {
      organization: {
        with: {
          members: true
        }
      }
    }
  })

  // Combine and deduplicate
  const allOrgs = new Map()
  
  organizations.forEach(org => {
    allOrgs.set(org.id, org)
  })

  memberOrgs.forEach(membership => {
    if (!allOrgs.has(membership.organizationId)) {
      allOrgs.set(membership.organizationId, membership.organization)
    }
  })

  return Array.from(allOrgs.values())
})
