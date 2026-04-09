/**
 * GET /api/analytics/[orgId]/summary
 * Get analytics summary for an organization
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'
import { getOrgAnalytics } from '~/server/utils/analytics'
import { getQuery } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { orgId } = getRouterParams(event)
  const query = getQuery(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const db = useDrizzle()

  // Verify access
  await requireOrgContext(session.user.id, orgId, db)

  // Parse date range
  const days = parseInt(query.days as string) || 30
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)

  // Get analytics
  const analytics = await getOrgAnalytics(orgId, { start, end })

  return analytics
})
