/**
 * DELETE /api/agents/[id]
 * Delete an agent
 */

import { useDrizzle, eq, and } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { id: agentId } = getRouterParams(event)

  if (!session.user || !session.organization?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No organization context'
    })
  }

  const orgId = session.organization.id
  const db = useDrizzle()

  // Verify user has access
  const context = await requireOrgContext(session.user.id, orgId, db)

  // Verify user is owner or admin
  if (!['owner', 'admin'].includes(context.membership.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only organization admins can delete agents'
    })
  }

  // Verify agent exists and belongs to organization
  const agent = await db.query.agents.findFirst({
    where: (t, { eq, and }) => and(
      eq(t.id, agentId),
      eq(t.organizationId, orgId)
    )
  })

  if (!agent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Agent not found'
    })
  }

  // Delete agent (and all related data via cascade)
  await db.delete(db.tables.agents).where(eq(db.tables.agents.id, agentId))

  return { success: true }
})
