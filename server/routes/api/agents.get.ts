/**
 * GET /api/agents
 * List all agents for the current organization
 */

import { useDrizzle, eq } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  if (!session.user || !session.organization?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No organization context'
    })
  }

  const orgId = session.organization.id

  // Verify user has access
  const db = useDrizzle()
  await requireOrgContext(session.user.id, orgId, db)

  // Get agents
  const agents = await db.query.agents.findMany({
    where: (t, { eq }) => eq(t.organizationId, orgId),
    orderBy: (t, { desc }) => desc(t.createdAt)
  })

  return agents
})
