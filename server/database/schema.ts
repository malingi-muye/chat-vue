import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, real } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

const timestamps = {
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date())
}

export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  username: text('username').notNull(),
  provider: text('provider', { enum: ['github'] }).notNull(),
  providerId: text('provider_id').notNull(),
  ...timestamps
}, table => [
  uniqueIndex('users_provider_id_idx').on(table.provider, table.providerId),
  uniqueIndex('users_email_idx').on(table.email)
])

// Organizations table for multi-tenancy
export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'starter', 'growth', 'enterprise'] }).notNull().default('free'),
  monthlyUsage: integer('monthly_usage').notNull().default(0),
  monthlyQuota: integer('monthly_quota').notNull().default(1000),
  costLimit: real('cost_limit').notNull().default(0),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps
}, table => [
  index('organizations_owner_id_idx').on(table.ownerId),
  uniqueIndex('organizations_slug_idx').on(table.slug)
])

// Organization membership for multi-tenancy
export const organizationMembers = sqliteTable('organization_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['owner', 'admin', 'member', 'viewer'] }).notNull().default('member'),
  ...timestamps
}, table => [
  index('organization_members_org_id_idx').on(table.organizationId),
  index('organization_members_user_id_idx').on(table.userId),
  uniqueIndex('organization_members_unique_idx').on(table.organizationId, table.userId)
])

export const usersRelations = relations(users, ({ many }) => ({
  chats: many(chats),
  organizationsOwned: many(organizations),
  organizationMemberships: many(organizationMembers)
}))

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, {
    fields: [organizations.ownerId],
    references: [users.id]
  }),
  members: many(organizationMembers),
  agents: many(agents),
  apiKeys: many(apiKeys),
  analytics: many(analytics),
  errorLogs: many(errorLogs)
}))

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMembers.organizationId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [organizationMembers.userId],
    references: [users.id]
  })
}))

export const chats = sqliteTable('chats', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title'),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  visibility: text('visibility', { enum: ['public', 'private'] }).notNull().default('private'),
  channel: text('channel', { enum: ['web', 'widget', 'sms', 'whatsapp', 'email'] }).default('web'),
  ...timestamps
}, table => [
  index('chats_org_id_idx').on(table.organizationId),
  index('chats_user_id_idx').on(table.userId),
  index('chats_agent_id_idx').on(table.agentId)
])

export const chatsRelations = relations(chats, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [chats.organizationId],
    references: [organizations.id]
  }),
  user: one(users, {
    fields: [chats.userId],
    references: [users.id]
  }),
  agent: one(agents, {
    fields: [chats.agentId],
    references: [agents.id]
  }),
  messages: many(messages)
}))

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  parts: text('parts', { mode: 'json' }),
  ...timestamps
}, table => [
  index('messages_chat_id_idx').on(table.chatId)
])

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id]
  })
}))

export const votes = sqliteTable('votes', {
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  messageId: text('message_id').notNull().references(() => messages.id, { onDelete: 'cascade' }),
  isUpvoted: integer('is_upvoted', { mode: 'boolean' }).notNull()
}, table => [
  primaryKey({ columns: [table.chatId, table.messageId] })
])

export const votesRelations = relations(votes, ({ one }) => ({
  chat: one(chats, {
    fields: [votes.chatId],
    references: [chats.id]
  }),
  message: one(messages, {
    fields: [votes.messageId],
    references: [messages.id]
  })
}))

// AI Agents table - for the chatbot/agent service
export const agents = sqliteTable('agents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  avatar: text('avatar'),
  systemPrompt: text('system_prompt').notNull(),
  model: text('model').notNull().default('gpt-4-mini'),
  temperature: real('temperature').notNull().default(0.7),
  maxTokens: integer('max_tokens').notNull().default(2048),
  service: text('service', { enum: ['chat', 'customer_support', 'page_analytics', 'github_analytics', 'sms_agent'] }).notNull().default('chat'),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  embedCode: text('embed_code'), // For widget embedding
  webhookUrl: text('webhook_url'), // For external integrations
  ...timestamps
}, table => [
  index('agents_org_id_idx').on(table.organizationId),
  index('agents_service_idx').on(table.service)
])

export const agentsRelations = relations(agents, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id]
  }),
  chats: many(chats),
  integrations: many(agentIntegrations)
}))

// API Keys table for organizations
export const apiKeys = sqliteTable('api_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  key: text('key').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastUsedAt: integer('last_used_at', { mode: 'timestamp' }),
  ...timestamps
}, table => [
  index('api_keys_org_id_idx').on(table.organizationId)
])

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  organization: one(organizations, {
    fields: [apiKeys.organizationId],
    references: [organizations.id]
  })
}))

// Agent Integrations table (Mobiwave, M-Pesa, etc.)
export const agentIntegrations = sqliteTable('agent_integrations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentId: text('agent_id').notNull().references(() => agents.id, { onDelete: 'cascade' }),
  type: text('type', { enum: ['mobiwave_sms', 'mobiwave_whatsapp', 'mobiwave_email', 'mpesa', 'github', 'webhook'] }).notNull(),
  config: text('config', { mode: 'json' }).notNull(), // Encrypted credentials
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps
}, table => [
  index('agent_integrations_agent_id_idx').on(table.agentId)
])

export const agentIntegrationsRelations = relations(agentIntegrations, ({ one }) => ({
  agent: one(agents, {
    fields: [agentIntegrations.agentId],
    references: [agents.id]
  })
}))

// Analytics table - comprehensive metrics
export const analytics = sqliteTable('analytics', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  channel: text('channel', { enum: ['web', 'widget', 'sms', 'whatsapp', 'email'] }).notNull(),
  // Metrics
  totalChats: integer('total_chats').notNull().default(0),
  totalMessages: integer('total_messages').notNull().default(0),
  totalUsers: integer('total_users').notNull().default(0),
  costUSD: real('cost_usd').notNull().default(0),
  avgResponseTime: real('avg_response_time').notNull().default(0), // milliseconds
  successRate: real('success_rate').notNull().default(0), // 0-100
  errorCount: integer('error_count').notNull().default(0),
  ...timestamps
}, table => [
  index('analytics_org_id_idx').on(table.organizationId),
  index('analytics_agent_id_idx').on(table.agentId),
  index('analytics_date_idx').on(table.date),
  index('analytics_channel_idx').on(table.channel)
])

export const analyticsRelations = relations(analytics, ({ one }) => ({
  organization: one(organizations, {
    fields: [analytics.organizationId],
    references: [organizations.id]
  }),
  agent: one(agents, {
    fields: [analytics.agentId],
    references: [agents.id]
  })
}))

// Error Logs table for debugging and monitoring
export const errorLogs = sqliteTable('error_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  agentId: text('agent_id').references(() => agents.id, { onDelete: 'cascade' }),
  chatId: text('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
  errorType: text('error_type').notNull(), // e.g., 'API_ERROR', 'VALIDATION_ERROR'
  message: text('message').notNull(),
  stackTrace: text('stack_trace'),
  metadata: text('metadata', { mode: 'json' }),
  severity: text('severity', { enum: ['low', 'medium', 'high', 'critical'] }).notNull().default('medium'),
  isResolved: integer('is_resolved', { mode: 'boolean' }).notNull().default(false),
  ...timestamps
}, table => [
  index('error_logs_org_id_idx').on(table.organizationId),
  index('error_logs_agent_id_idx').on(table.agentId),
  index('error_logs_severity_idx').on(table.severity),
  index('error_logs_created_at_idx').on(table.createdAt)
])

export const errorLogsRelations = relations(errorLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [errorLogs.organizationId],
    references: [organizations.id]
  }),
  agent: one(agents, {
    fields: [errorLogs.agentId],
    references: [agents.id]
  }),
  chat: one(chats, {
    fields: [errorLogs.chatId],
    references: [chats.id]
  })
}))

// Subscriptions table for billing
export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  plan: text('plan', { enum: ['free', 'starter', 'growth', 'enterprise'] }).notNull(),
  status: text('status', { enum: ['active', 'canceled', 'expired'] }).notNull().default('active'),
  mpesaTransactionId: text('mpesa_transaction_id'),
  billingCycleStart: integer('billing_cycle_start', { mode: 'timestamp' }).notNull(),
  billingCycleEnd: integer('billing_cycle_end', { mode: 'timestamp' }).notNull(),
  amount: real('amount').notNull(),
  ...timestamps
}, table => [
  index('subscriptions_org_id_idx').on(table.organizationId),
  index('subscriptions_status_idx').on(table.status)
])

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id]
  })
}))
