import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'

import * as schema from '../database/schema'

export { sql, eq, and, or, asc, desc, inArray } from 'drizzle-orm'

export const tables = schema

let _db: ReturnType<typeof drizzle<typeof schema>>

export function useDrizzle() {
  if (!_db) {
    _db = drizzle(createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:.data/sqlite.db',
      authToken: process.env.TURSO_AUTH_TOKEN
    }), { schema })
  }
  return _db
}

// User & Auth types
export type User = typeof schema.users.$inferSelect
export type Organization = typeof schema.organizations.$inferSelect
export type OrganizationMember = typeof schema.organizationMembers.$inferSelect

// Chat & Message types
export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect
export type Vote = typeof schema.votes.$inferSelect

// Agent & Integration types
export type Agent = typeof schema.agents.$inferSelect
export type AgentIntegration = typeof schema.agentIntegrations.$inferSelect
export type ApiKey = typeof schema.apiKeys.$inferSelect

// Analytics & Monitoring types
export type Analytics = typeof schema.analytics.$inferSelect
export type ErrorLog = typeof schema.errorLogs.$inferSelect

// Billing types
export type Subscription = typeof schema.subscriptions.$inferSelect
