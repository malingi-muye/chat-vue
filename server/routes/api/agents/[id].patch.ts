/**
 * PATCH /api/agents/[id]
 * Update an agent
 */

import { useDrizzle, eq, and } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { id: agentId } = getRouterParams(event)
  const body = await readBody(event)

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
      statusMessage: 'Only organization admins can update agents'
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

  // Validate update
  if (body.temperature !== undefined && (body.temperature < 0 || body.temperature > 1)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Temperature must be between 0 and 1'
    })
  }

  // Update agent
  const updates: Record<string, any> = {
    updatedAt: new Date()
  }

  // Only allow updating specific fields
  const allowedFields = ['name', 'description', 'systemPrompt', 'model', 'temperature', 'maxTokens', 'isPublic', 'isActive']
  
  for (const field of allowedFields) {
    if (field in body) {
      updates[field] = body[field]
    }
  }

  await db.update(db.tables.agents)
    .set(updates)
    .where(eq(db.tables.agents.id, agentId))

  // Return updated agent
  const updated = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId)
  })

  return updated
})
