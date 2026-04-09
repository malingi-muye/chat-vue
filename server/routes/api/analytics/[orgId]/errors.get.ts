/**
 * GET /api/analytics/[orgId]/errors
 * Get error logs and analysis for an organization
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'
import { getErrorAnalytics } from '~/server/utils/analytics'
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

  // Get error analytics
  const limit = parseInt(query.limit as string) || 100
  const errors = await getErrorAnalytics(orgId, limit)

  return errors
})
