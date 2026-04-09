/**
 * POST /api/test-sandbox
 * Create a temporary test agent
 */

import { useUserSession } from '~/server/utils/session'
import { createTestAgent } from '~/server/utils/test-sandbox'

export default defineEventHandler(async (event) => {
  const session = await useUserSession(event)
  const body = await readBody(event)

  // Test sandbox doesn't require authentication
  // But we use session ID if available for tracking

  const {
    name = 'Test Agent',
    systemPrompt,
    model = 'gpt-4-mini',
    temperature = 0.7,
    maxTokens = 2048
  } = body

  if (!systemPrompt) {
    throw createError({
      statusCode: 400,
      statusMessage: 'System prompt is required'
    })
  }

  // Get or create session ID
  const sessionId = session.data?.user?.id || crypto.randomUUID()

  // Create test agent
  const testAgent = createTestAgent(sessionId, {
    name,
    systemPrompt,
    model,
    temperature,
    maxTokens
  })

  return {
    id: testAgent.id,
    sessionId: testAgent.sessionId,
    name: testAgent.name,
    model: testAgent.model,
    expiresAt: testAgent.expiresAt,
    conversationId: testAgent.conversations[0].id
  }
})
