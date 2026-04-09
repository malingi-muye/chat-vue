<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { $fetch } from 'ofetch'
import { useToast } from '#ui/composables/useToast'

const toast = useToast()

const step = ref<'create' | 'chat'>('create')
const loading = ref(false)
const sending = ref(false)

// Create form
const createForm = ref({
  name: 'My Test Agent',
  systemPrompt: 'You are a helpful customer support assistant. Be friendly and concise.',
  model: 'gpt-4-mini',
  temperature: 0.7,
  maxTokens: 2048
})

// Chat state
const testAgent = ref<any>(null)
const conversationId = ref('')
const messages = ref<any[]>([])
const inputMessage = ref('')
const chatContainer = ref<HTMLElement>()

const models = [
  { value: 'gpt-4-mini', label: 'GPT-4 Mini (Fast)' },
  { value: 'gpt-4', label: 'GPT-4 (Capable)' },
  { value: 'claude-opus', label: 'Claude Opus' },
  { value: 'gemini-pro', label: 'Gemini Pro' }
]

async function createTestAgent() {
  if (!createForm.value.systemPrompt) {
    toast.add({
      title: 'Validation Error',
      description: 'System prompt is required',
      color: 'red'
    })
    return
  }

  loading.value = true
  try {
    const agent = await $fetch('/api/test-sandbox', {
      method: 'POST',
      body: createForm.value
    })

    testAgent.value = agent
    conversationId.value = agent.conversationId
    messages.value = []
    step.value = 'chat'

    toast.add({
      title: 'Success',
      description: `Test agent "${agent.name}" created (expires in 30 minutes)`,
      color: 'green'
    })
  } catch (error) {
    console.error('Failed to create test agent:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to create test agent',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function sendMessage() {
  const message = inputMessage.value.trim()
  if (!message) return

  // Add user message to UI
  messages.value.push({
    id: crypto.randomUUID(),
    role: 'user',
    content: message,
    timestamp: new Date()
  })

  inputMessage.value = ''
  sending.value = true

  try {
    await nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })

    const response = await $fetch(
      `/api/test-sandbox/${testAgent.value.id}/messages`,
      {
        method: 'POST',
        body: {
          conversationId: conversationId.value,
          message
        }
      }
    )

    // Add assistant message
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.assistantMessage.content,
      timestamp: new Date()
    })

    await nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight
      }
    })
  } catch (error) {
    console.error('Failed to send message:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to send message',
      color: 'red'
    })
  } finally {
    sending.value = false
  }
}

function resetSandbox() {
  step.value = 'create'
  testAgent.value = null
  conversationId.value = ''
  messages.value = []
  inputMessage.value = ''
}

const timeRemaining = computed(() => {
  if (!testAgent.value) return ''
  
  const now = new Date().getTime()
  const expiresAt = new Date(testAgent.value.expiresAt).getTime()
  const remaining = expiresAt - now

  if (remaining <= 0) return 'Expired'

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return `${minutes}m ${seconds}s`
})

onMounted(() => {
  // Focus input when chat starts
  const input = document.querySelector('input[placeholder="Type your message..."]') as HTMLInputElement
  if (input) input.focus()
})
</script>

<template>
  <div class="min-h-screen bg-default flex flex-col">
    <!-- Header -->
    <header class="bg-default border-b border-default sticky top-0 z-10">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-foreground">Test Sandbox</h1>
          <p class="text-sm text-muted">Try out agents without persistence or costs</p>
        </div>
        <UButton
          v-if="step === 'chat'"
          variant="outline"
          label="Reset"
          @click="resetSandbox"
        />
      </div>
    </header>

    <!-- Main Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Create Agent Panel -->
      <div
        v-if="step === 'create'"
        class="w-full flex items-center justify-center p-4"
      >
        <UCard class="w-full max-w-2xl">
          <template #header>
            <h2 class="text-2xl font-bold text-foreground">Create Test Agent</h2>
          </template>

          <form @submit.prevent="createTestAgent" class="space-y-4">
            <!-- Agent Name -->
            <UFormGroup label="Agent Name" name="name">
              <UInput
                v-model="createForm.name"
                placeholder="e.g., Customer Support Bot"
              />
            </UFormGroup>

            <!-- System Prompt -->
            <UFormGroup label="System Prompt *" name="systemPrompt">
              <UTextarea
                v-model="createForm.systemPrompt"
                placeholder="Define how your agent should behave..."
                rows="6"
                required
              />
            </UFormGroup>

            <!-- Model -->
            <UFormGroup label="AI Model" name="model">
              <USelect
                v-model="createForm.model"
                :options="models"
              />
            </UFormGroup>

            <!-- Temperature -->
            <UFormGroup label="Temperature" name="temperature">
              <div class="flex items-center gap-4">
                <input
                  v-model.number="createForm.temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  class="flex-1"
                />
                <span class="text-sm font-semibold w-12">
                  {{ createForm.temperature.toFixed(1) }}
                </span>
              </div>
            </UFormGroup>

            <!-- Max Tokens -->
            <UFormGroup label="Max Tokens" name="maxTokens">
              <UInput
                v-model.number="createForm.maxTokens"
                type="number"
                min="100"
                max="10000"
              />
            </UFormGroup>

            <!-- Info -->
            <div class="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p class="text-sm text-muted">
                <strong>Test Sandbox:</strong> Your agent will be available for 30 minutes. 
                No data is persisted and no costs are incurred.
              </p>
            </div>

            <!-- Action -->
            <UButton
              type="submit"
              size="lg"
              block
              label="Create Test Agent"
              :loading="loading"
            />
          </form>
        </UCard>
      </div>

      <!-- Chat Panel -->
      <div v-else class="w-full flex flex-col">
        <!-- Chat Info -->
        <div class="bg-primary/5 border-b border-default p-4">
          <div class="max-w-6xl mx-auto flex items-center justify-between">
            <div>
              <h2 class="font-semibold text-foreground">{{ testAgent.name }}</h2>
              <p class="text-sm text-muted">{{ testAgent.model }}</p>
            </div>
            <div class="text-right text-sm">
              <div class="font-semibold text-muted">{{ timeRemaining }}</div>
              <div class="text-xs text-muted">expires</div>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div
          ref="chatContainer"
          class="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <div v-if="messages.length === 0" class="flex items-center justify-center h-full text-center">
            <div>
              <UIcon name="i-lucide-message-circle" class="h-12 w-12 text-muted mx-auto mb-4 opacity-50" />
              <p class="text-muted">Start a conversation with {{ testAgent.name }}</p>
            </div>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="[
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            ]"
          >
            <div
              :class="[
                'max-w-xs lg:max-w-md p-3 rounded-lg',
                msg.role === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-default border border-default'
              ]"
            >
              <p class="text-sm">{{ msg.content }}</p>
              <p :class="[
                'text-xs mt-1',
                msg.role === 'user' ? 'text-white/70' : 'text-muted'
              ]">
                {{ new Date(msg.timestamp).toLocaleTimeString() }}
              </p>
            </div>
          </div>

          <div v-if="sending" class="flex justify-start">
            <div class="bg-default border border-default p-3 rounded-lg">
              <div class="flex gap-1">
                <div class="h-2 w-2 bg-muted rounded-full animate-bounce" />
                <div class="h-2 w-2 bg-muted rounded-full animate-bounce delay-100" />
                <div class="h-2 w-2 bg-muted rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="border-t border-default bg-default p-4">
          <div class="max-w-6xl mx-auto">
            <form @submit.prevent="sendMessage" class="flex gap-2">
              <UInput
                v-model="inputMessage"
                placeholder="Type your message..."
                :disabled="sending"
                @keydown.enter.prevent="sendMessage"
              />
              <UButton
                type="submit"
                icon="i-lucide-send"
                :loading="sending"
                :disabled="!inputMessage.trim() || sending"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.delay-100 {
  animation-delay: 0.1s;
}

.delay-200 {
  animation-delay: 0.2s;
}
</style>
