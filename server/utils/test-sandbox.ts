/**
 * In-Memory Test Sandbox Service
 * Manages temporary test agents without persistence
 */

interface TestAgent {
  id: string
  sessionId: string
  name: string
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  createdAt: Date
  expiresAt: Date
  conversations: TestConversation[]
}

interface TestConversation {
  id: string
  messages: TestMessage[]
}

interface TestMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

// Store test agents in memory (clears when server restarts)
const testAgents = new Map<string, TestAgent>()
const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

/**
 * Create a temporary test agent
 */
export function createTestAgent(
  sessionId: string,
  agentConfig: {
    name: string
    systemPrompt: string
    model: string
    temperature: number
    maxTokens: number
  }
): TestAgent {
  const agentId = crypto.randomUUID()
  const now = new Date()
  
  const testAgent: TestAgent = {
    id: agentId,
    sessionId,
    ...agentConfig,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_TIMEOUT_MS),
    conversations: [
      {
        id: crypto.randomUUID(),
        messages: []
      }
    ]
  }

  testAgents.set(agentId, testAgent)

  // Schedule cleanup
  setTimeout(() => {
    testAgents.delete(agentId)
  }, SESSION_TIMEOUT_MS)

  return testAgent
}

/**
 * Get a test agent by ID
 */
export function getTestAgent(agentId: string): TestAgent | undefined {
  const agent = testAgents.get(agentId)
  
  // Check if expired
  if (agent && agent.expiresAt < new Date()) {
    testAgents.delete(agentId)
    return undefined
  }

  return agent
}

/**
 * Delete a test agent
 */
export function deleteTestAgent(agentId: string): boolean {
  return testAgents.delete(agentId)
}

/**
 * Add message to conversation
 */
export function addTestMessage(
  agentId: string,
  conversationId: string,
  message: Omit<TestMessage, 'id' | 'timestamp'>
): TestMessage | undefined {
  const agent = getTestAgent(agentId)
  if (!agent) return undefined

  const conversation = agent.conversations.find(c => c.id === conversationId)
  if (!conversation) return undefined

  const testMessage: TestMessage = {
    id: crypto.randomUUID(),
    ...message,
    timestamp: new Date()
  }

  conversation.messages.push(testMessage)
  return testMessage
}

/**
 * Get conversation history
 */
export function getConversation(agentId: string, conversationId: string) {
  const agent = getTestAgent(agentId)
  if (!agent) return undefined

  return agent.conversations.find(c => c.id === conversationId)
}

/**
 * Create new conversation in agent
 */
export function createTestConversation(agentId: string) {
  const agent = getTestAgent(agentId)
  if (!agent) return undefined

  const conversation: TestConversation = {
    id: crypto.randomUUID(),
    messages: []
  }

  agent.conversations.push(conversation)
  return conversation
}

/**
 * Get all test agents for a session
 */
export function getSessionAgents(sessionId: string): TestAgent[] {
  return Array.from(testAgents.values())
    .filter(agent => agent.sessionId === sessionId && agent.expiresAt > new Date())
}

/**
 * Clean up expired agents
 */
export function cleanupExpiredAgents(): number {
  const now = new Date()
  let cleaned = 0

  for (const [id, agent] of testAgents.entries()) {
    if (agent.expiresAt < now) {
      testAgents.delete(id)
      cleaned++
    }
  }

  return cleaned
}

// Run cleanup every 5 minutes
setInterval(() => {
  cleanupExpiredAgents()
}, 5 * 60 * 1000)
