/**
 * POST /api/agents
 * Create a new AI agent
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const body = await readBody(event)

  if (!session.user || !session.organization?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - No organization context'
    })
  }

  const orgId = session.organization.id

  // Verify user has access
  const db = useDrizzle()
  const context = await requireOrgContext(session.user.id, orgId, db)

  // Verify user is owner or admin
  if (!['owner', 'admin'].includes(context.membership.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only organization admins can create agents'
    })
  }

  const {
    name,
    description,
    systemPrompt,
    model = 'gpt-4-mini',
    temperature = 0.7,
    maxTokens = 2048,
    service = 'chat',
    isPublic = false
  } = body

  // Validate input
  if (!name || !systemPrompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and system prompt are required'
    })
  }

  if (temperature < 0 || temperature > 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Temperature must be between 0 and 1'
    })
  }

  // Create agent
  const agentId = crypto.randomUUID()
  
  await db.insert(db.tables.agents).values({
    id: agentId,
    organizationId: orgId,
    name,
    description: description || null,
    systemPrompt,
    model,
    temperature,
    maxTokens,
    service,
    isPublic,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  // Return created agent
  const agent = await db.query.agents.findFirst({
    where: (t, { eq }) => eq(t.id, agentId)
  })

  return agent
})
