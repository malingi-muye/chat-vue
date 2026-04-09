/**
 * POST /api/analytics/[orgId]/errors/[errorId]/resolve
 * Mark an error as resolved
 */

import { useDrizzle, eq, and } from '~/server/utils/drizzle'
import { requireAuth } from '~/server/utils/session'
import { requireOrgContext } from '~/server/utils/rls'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)
  const { orgId, errorId } = getRouterParams(event)

  if (!session.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const db = useDrizzle()

  // Verify access to organization
  await requireOrgContext(session.user.id, orgId, db)

  // Update error to resolved
  await db.update(db.tables.errorLogs)
    .set({
      isResolved: true,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(db.tables.errorLogs.id, errorId),
        eq(db.tables.errorLogs.organizationId, orgId)
      )
    )

  return { success: true }
})
