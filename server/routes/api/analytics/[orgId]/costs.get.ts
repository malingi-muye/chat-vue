/**
 * GET /api/analytics/[orgId]/costs
 * Get cost breakdown and forecasting for an organization
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'
import { getCostAnalytics } from '~/server/utils/analytics'
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

  // Get cost analytics
  const monthsBack = parseInt(query.months as string) || 3
  const costs = await getCostAnalytics(orgId, monthsBack)

  return costs
})
