/**
 * GET /api/test-sandbox/[agentId]/conversation?conversationId=...
 * Get conversation history for test agent
 */

import { getTestAgent, getConversation } from '~/server/utils/test-sandbox'
import { getQuery } from 'nitro/h3'

export default defineEventHandler(async (event) => {
  const { agentId } = getRouterParams(event)
  const { conversationId } = getQuery(event)

  if (!conversationId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Conversation ID is required'
    })
  }

  // Get test agent
  const agent = getTestAgent(agentId)
  if (!agent) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Test agent not found or expired'
    })
  }

  // Get conversation
  const conversation = getConversation(agentId, conversationId as string)
  if (!conversation) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conversation not found'
    })
  }

  return {
    agentId,
    agentName: agent.name,
    conversationId: conversation.id,
    messages: conversation.messages,
    expiresAt: agent.expiresAt
  }
})
