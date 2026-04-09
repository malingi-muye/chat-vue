/**
 * POST /api/organizations
 * Create a new organization for the current user
 */

import { useDrizzle } from '~/server/utils/drizzle'
import { requireOrgContext } from '~/server/utils/rls'
import { organizations } from '~/server/database/schema'
import { eq, and } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const { name, slug, description } = await readBody(event)

  // Validate input
  if (!name || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and slug are required'
    })
  }

  // Validate slug format
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Slug must contain only lowercase letters, numbers, and hyphens'
    })
  }

  const db = useDrizzle()

  // Check if slug already exists
  const existing = await db.query.organizations.findFirst({
    where: (t, { eq }) => eq(t.slug, slug)
  })

  if (existing) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Organization slug already exists'
    })
  }

  // Create organization
  const orgId = crypto.randomUUID()
  await db.insert(organizations).values({
    id: orgId,
    name,
    slug,
    description: description || null,
    ownerId: user.id,
    plan: 'free',
    monthlyUsage: 0,
    monthlyQuota: 1000,
    costLimit: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  // Return created organization
  const newOrg = await db.query.organizations.findFirst({
    where: (t, { eq }) => eq(t.id, orgId)
  })

  return newOrg
})
