/**
 * POST /api/test-sandbox/[agentId]/messages
 * Send a message to test agent
 */

import { getTestAgent, addTestMessage } from '~/server/utils/test-sandbox'

export default defineEventHandler(async (event) => {
  const { agentId } = getRouterParams(event)
  const { conversationId, message } = await readBody(event)

  if (!message) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Message is required'
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

  // Add user message
  const userMessage = addTestMessage(agentId, conversationId, {
    role: 'user',
    content: message
  })

  if (!userMessage) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Conversation not found'
    })
  }

  // Simulate AI response (in real implementation, call AI provider)
  // For now, return a placeholder response
  const assistantMessage = addTestMessage(agentId, conversationId, {
    role: 'assistant',
    content: `[Test Response] I received your message: "${message}". In a production environment, this would call an AI model based on the agent's configuration.`
  })

  return {
    userMessage,
    assistantMessage
  }
})
