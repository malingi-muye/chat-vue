import { useSession, type HTTPEvent, type Session } from 'nitro/h3'
import type { Organization, OrganizationMember } from './drizzle'

export interface UserSession extends Session {
  user?: {
    id: string
    name: string
    avatar?: string
    username: string
    email: string
  }
  organization?: {
    id: string
    name: string
    slug: string
  }
  membership?: {
    role: 'owner' | 'admin' | 'member' | 'viewer'
  }
}

export function useUserSession (event: HTTPEvent) {
  if (!process.env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET environment variable is not set')
  }
  return useSession<UserSession>(event, {
    password: process.env.SESSION_SECRET
  })
}

/**
 * Get authenticated user from session or throw error
 */
export async function requireAuth(event: HTTPEvent) {
  const session = await useUserSession(event)
  
  if (!session.data?.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - User not authenticated'
    })
  }

  return session.data
}
