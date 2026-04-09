/**
 * POST /api/integrations/mobiwave/sms/send
 * Send SMS via Mobiwave
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
  const { recipient, message } = body

  if (!recipient || !message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recipient and message are required'
    })
  }

  const db = useDrizzle()

  // Verify user has access
  await requireOrgContext(session.user.id, orgId, db)

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

  // Send SMS via Mobiwave
  try {
    const mobiwave = createMobiwaveClient(config.apiToken)
    const result = await mobiwave.sms.send({
      recipient,
      message,
      senderId: config.senderId
    })

    // Log SMS in database
    const smsLogId = crypto.randomUUID()
    await db.insert(db.tables.communicationLogs).values({
      id: smsLogId,
      organizationId: orgId,
      channel: 'sms',
      recipient,
      message,
      status: 'sent',
      metadata: result,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return {
      success: true,
      logId: smsLogId,
      recipient,
      message
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to send SMS: ${error.message}`
    })
  }
})
