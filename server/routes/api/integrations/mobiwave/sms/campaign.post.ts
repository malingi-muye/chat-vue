/**
 * POST /api/integrations/mobiwave/sms/campaign
 * Send SMS campaign to contact list
 */

import { useDrizzle, eq, and } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'
import { createMobiwaveClient } from '~/server/utils/mobiwave'

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
  const { contactListIds, message, agentId } = body

  if (!contactListIds || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Contact list IDs and message are required'
    })
  }

  const db = useDrizzle()

  // Verify user has access
  const context = await requireOrgContext(session.user.id, orgId, db)

  if (!['owner', 'admin'].includes(context.membership.role)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Only organization admins can send campaigns'
    })
  }

  // Get Mobiwave integration
  const integration = await db.query.integrations.findFirst({
    where: (t, { eq, and }) => and(
      eq(t.organizationId, orgId),
      eq(t.type, 'mobiwave'),
      eq(t.isActive, true)
    )
  })

  if (!integration) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Mobiwave integration not configured'
    })
  }

  const config = integration.config as any
  if (!config.apiToken || !config.senderId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Mobiwave integration incomplete'
    })
  }

  // Send SMS campaign via Mobiwave
  try {
    const mobiwave = createMobiwaveClient(config.apiToken)
    const result = await mobiwave.sms.sendCampaign({
      contactListIds,
      message,
      senderId: config.senderId
    })

    // Log campaign in database
    const campaignId = crypto.randomUUID()
    await db.insert(db.tables.communicationCampaigns).values({
      id: campaignId,
      organizationId: orgId,
      agentId: agentId || null,
      channel: 'sms',
      contactListIds: Array.isArray(contactListIds) ? contactListIds : [contactListIds],
      message,
      status: 'sent',
      recipientCount: result.recipientCount || 0,
      metadata: result,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return {
      success: true,
      campaignId,
      message: `Campaign sent to ${result.recipientCount || 'multiple'} recipients`
    }
  } catch (error) {
    console.error('Failed to send campaign:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to send campaign: ${error.message}`
    })
  }
})
