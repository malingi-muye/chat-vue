/**
 * POST /api/integrations/mobiwave/setup
 * Configure Mobiwave integration for organization
 */

import { useDrizzle, eq, and } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'
import { getMobiwaveProfile } from '~/server/utils/mobiwave'

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
  const { apiToken, senderId } = body

  if (!apiToken || !senderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'API token and sender ID are required'
    })
  }

  const db = useDrizzle()

  // Verify user has access and is admin
  const context = await requireOrgContext(session.user.id, orgId, db)

  if (!['owner', 'admin'].includes(context.membership.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only organization admins can configure integrations'
    })
  }

  // Test Mobiwave connection
  try {
    const profile = await getMobiwaveProfile(apiToken)
    
    if (!profile) {
      throw new Error('Invalid API token')
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Failed to verify Mobiwave API token. Please check your credentials.'
    })
  }

  // Store integration config
  // First, check if integration exists
  const existing = await db.query.integrations.findFirst({
    where: (t, { eq, and }) => and(
      eq(t.organizationId, orgId),
      eq(t.type, 'mobiwave')
    )
  })

  const integrationConfig = {
    apiToken,
    senderId,
    verified: true,
    verifiedAt: new Date().toISOString()
  }

  if (existing) {
    // Update existing
    await db.update(db.tables.integrations)
      .set({
        config: integrationConfig,
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(db.tables.integrations.id, existing.id))
  } else {
    // Create new
    const integrationId = crypto.randomUUID()
    await db.insert(db.tables.integrations).values({
      id: integrationId,
      organizationId: orgId,
      type: 'mobiwave',
      config: integrationConfig,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }

  return {
    success: true,
    message: 'Mobiwave integration configured successfully',
    profile: {
      senderId
    }
  }
})
