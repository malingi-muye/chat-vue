/**
 * POST /api/organizations/[id]/switch
 * Switch current session to a different organization
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { useUserSession, requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { id: orgId } = getRouterParams(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const db = useDrizzle()

  // Verify user has access to this organization
  const context = await requireOrgContext(session.user.id, orgId, db)

  // Update session with new organization
  const userSession = await useUserSession(event)
  
  await userSession.update({
    ...session,
    organization: {
      id: context.organization.id,
      name: context.organization.name,
      slug: context.organization.slug
    },
    membership: {
      role: context.membership.role
    }
  })

  return {
    success: true,
    organization: context.organization
  }
})
