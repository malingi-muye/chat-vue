/**
 * Analytics aggregation service
 * Collects, aggregates, and retrieves metrics for organizations
 */

import { useDrizzle, eq, and, gte, lte } from '~/server/utils/drizzle'
import type { Analytics } from '~/server/utils/drizzle'

export interface MetricsSummary {
  totalChats: number
  totalMessages: number
  totalUsers: number
  totalCost: number
  avgResponseTime: number
  successRate: number
  errorCount: number
  byChannel: Record<string, ChannelMetrics>
  byAgent: Record<string, AgentMetrics>
  trend: TrendData[]
}

export interface ChannelMetrics {
  chats: number
  messages: number
  cost: number
  successRate: number
}

export interface AgentMetrics {
  chats: number
  messages: number
  users: number
  cost: number
  successRate: number
}

export interface TrendData {
  date: string
  chats: number
  messages: number
  cost: number
}

/**
 * Get aggregated analytics for an organization
 */
export async function getOrgAnalytics(
  organizationId: string,
  dateRange: { start: Date; end: Date }
): Promise<MetricsSummary> {
  const db = useDrizzle()

  // Get all analytics entries for the date range
  const entries = await db.query.analytics.findMany({
    where: (t, { eq, and, gte, lte }) => and(
      eq(t.organizationId, organizationId),
      gte(t.date, dateRange.start),
      lte(t.date, dateRange.end)
    ),
    with: {
      agent: true
    }
  })

  // Aggregate metrics
  let totals = {
    chats: 0,
    messages: 0,
    users: 0,
    cost: 0,
    responseTime: 0,
    successRate: 0,
    errors: 0,
    count: 0
  }

  const byChannel: Record<string, ChannelMetrics> = {}
  const byAgent: Record<string, AgentMetrics> = {}
  const trend: TrendData[] = []

  entries.forEach(entry => {
    // Accumulate totals
    totals.chats += entry.totalChats
    totals.messages += entry.totalMessages
    totals.users += entry.totalUsers
    totals.cost += entry.costUSD
    totals.responseTime += entry.avgResponseTime
    totals.successRate += entry.successRate
    totals.errors += entry.errorCount
    totals.count++

    // By channel
    if (!byChannel[entry.channel]) {
      byChannel[entry.channel] = { chats: 0, messages: 0, cost: 0, successRate: 0 }
    }
    byChannel[entry.channel].chats += entry.totalChats
    byChannel[entry.channel].messages += entry.totalMessages
    byChannel[entry.channel].cost += entry.costUSD
    byChannel[entry.channel].successRate += entry.successRate

    // By agent
    if (entry.agent) {
      if (!byAgent[entry.agent.id]) {
        byAgent[entry.agent.id] = { chats: 0, messages: 0, users: 0, cost: 0, successRate: 0 }
      }
      byAgent[entry.agent.id].chats += entry.totalChats
      byAgent[entry.agent.id].messages += entry.totalMessages
      byAgent[entry.agent.id].users += entry.totalUsers
      byAgent[entry.agent.id].cost += entry.costUSD
      byAgent[entry.agent.id].successRate += entry.successRate
    }

    // Trend
    const dateStr = entry.date.toISOString().split('T')[0]
    let trendEntry = trend.find(t => t.date === dateStr)
    if (!trendEntry) {
      trendEntry = { date: dateStr, chats: 0, messages: 0, cost: 0 }
      trend.push(trendEntry)
    }
    trendEntry.chats += entry.totalChats
    trendEntry.messages += entry.totalMessages
    trendEntry.cost += entry.costUSD
  })

  // Calculate averages
  const avgResponseTime = totals.count > 0 ? totals.responseTime / totals.count : 0
  const avgSuccessRate = totals.count > 0 ? totals.successRate / totals.count : 100

  // Normalize channel success rates
  Object.keys(byChannel).forEach(channel => {
    const metrics = byChannel[channel]
    metrics.successRate = metrics.successRate / entries.filter(e => e.channel === channel).length || 100
  })

  return {
    totalChats: totals.chats,
    totalMessages: totals.messages,
    totalUsers: totals.users,
    totalCost: totals.cost,
    avgResponseTime,
    successRate: avgSuccessRate,
    errorCount: totals.errors,
    byChannel,
    byAgent,
    trend: trend.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }
}

/**
 * Get error analytics for an organization
 */
export async function getErrorAnalytics(
  organizationId: string,
  limit: number = 100
) {
  const db = useDrizzle()

  const errors = await db.query.errorLogs.findMany({
    where: (t, { eq }) => eq(t.organizationId, organizationId),
    with: {
      agent: true,
      chat: true
    },
    limit,
    orderBy: (t, { desc }) => desc(t.createdAt)
  })

  // Group by error type and count
  const errorsByType: Record<string, { count: number; severity: string; latest: string }> = {}

  errors.forEach(error => {
    if (!errorsByType[error.errorType]) {
      errorsByType[error.errorType] = {
        count: 0,
        severity: error.severity,
        latest: error.createdAt.toISOString()
      }
    }
    errorsByType[error.errorType].count++
  })

  return {
    total: errors.length,
    byType: errorsByType,
    recent: errors.slice(0, 10),
    resolved: errors.filter(e => e.isResolved).length,
    unresolved: errors.filter(e => !e.isResolved).length
  }
}

/**
 * Get agent performance metrics
 */
export async function getAgentMetrics(
  agentId: string,
  dateRange: { start: Date; end: Date }
) {
  const db = useDrizzle()

  const analytics = await db.query.analytics.findMany({
    where: (t, { eq, and, gte, lte }) => and(
      eq(t.agentId, agentId),
      gte(t.date, dateRange.start),
      lte(t.date, dateRange.end)
    )
  })

  const chats = analytics.reduce((sum, a) => sum + a.totalChats, 0)
  const messages = analytics.reduce((sum, a) => sum + a.totalMessages, 0)
  const users = analytics.reduce((sum, a) => sum + a.totalUsers, 0)
  const cost = analytics.reduce((sum, a) => sum + a.costUSD, 0)
  const avgResponseTime = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.avgResponseTime, 0) / analytics.length
    : 0
  const avgSuccessRate = analytics.length > 0
    ? analytics.reduce((sum, a) => sum + a.successRate, 0) / analytics.length
    : 100

  return {
    agentId,
    chats,
    messages,
    users,
    cost,
    avgResponseTime,
    avgSuccessRate,
    costPerChat: chats > 0 ? cost / chats : 0,
    messagesPerChat: chats > 0 ? messages / chats : 0
  }
}

/**
 * Calculate monthly costs and forecast
 */
export async function getCostAnalytics(
  organizationId: string,
  monthsBack: number = 3
) {
  const db = useDrizzle()

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)

  const analytics = await db.query.analytics.findMany({
    where: (t, { eq, gte }) => eq(t.organizationId, organizationId),
    gte(t.date, startDate)
  })

  // Group by month
  const byMonth: Record<string, { cost: number; chats: number; messages: number }> = {}

  analytics.forEach(entry => {
    const monthKey = entry.date.toISOString().substring(0, 7) // YYYY-MM
    if (!byMonth[monthKey]) {
      byMonth[monthKey] = { cost: 0, chats: 0, messages: 0 }
    }
    byMonth[monthKey].cost += entry.costUSD
    byMonth[monthKey].chats += entry.totalChats
    byMonth[monthKey].messages += entry.totalMessages
  })

  // Calculate trend and forecast
  const months = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }))

  // Simple linear forecast for next month
  let forecast = months.length > 0 ? months[months.length - 1].cost : 0
  if (months.length > 1) {
    const trend = months[months.length - 1].cost - months[0].cost
    forecast = months[months.length - 1].cost + (trend / (months.length - 1))
  }

  return {
    history: months,
    currentMonthCost: months.length > 0 ? months[months.length - 1].cost : 0,
    totalCost: months.reduce((sum, m) => sum + m.cost, 0),
    averageMonthCost: months.length > 0 ? months.reduce((sum, m) => sum + m.cost, 0) / months.length : 0,
    forecast: Math.max(0, forecast)
  }
}
