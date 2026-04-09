<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOrganization } from '~/src/composables/useOrganization'
import { useUserSession } from '~/src/composables/useUserSession'
import { $fetch } from 'ofetch'
import { useToast } from '#ui/composables/useToast'

const router = useRouter()
const { getOrgId } = useOrganization()
const { user } = useUserSession()
const toast = useToast()

const loading = ref(false)
const agents = ref<any[]>([])
const showCreateModal = ref(false)

// Form state
const form = ref({
  name: '',
  description: '',
  systemPrompt: '',
  model: 'gpt-4-mini',
  temperature: 0.7,
  maxTokens: 2048,
  service: 'chat',
  isPublic: false
})

const models = [
  { value: 'gpt-4-mini', label: 'GPT-4 Mini (Fast & Cheap)' },
  { value: 'gpt-4', label: 'GPT-4 (Most Capable)' },
  { value: 'claude-opus', label: 'Claude Opus (Balanced)' },
  { value: 'claude-haiku', label: 'Claude Haiku (Fast)' },
  { value: 'gemini-pro', label: 'Gemini Pro (Google)' }
]

const services = [
  { value: 'chat', label: 'Customer Support Chat' },
  { value: 'customer_support', label: 'Ticketing System' },
  { value: 'sms_agent', label: 'SMS Agent' },
  { value: 'page_analytics', label: 'Page Analytics' },
  { value: 'github_analytics', label: 'GitHub Analytics' }
]

async function loadAgents() {
  loading.value = true
  try {
    agents.value = await $fetch('/api/agents')
  } catch (error) {
    console.error('Failed to load agents:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load agents',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function createAgent() {
  if (!form.value.name || !form.value.systemPrompt) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'red'
    })
    return
  }

  loading.value = true
  try {
    const newAgent = await $fetch('/api/agents', {
      method: 'POST',
      body: form.value
    })

    toast.add({
      title: 'Success',
      description: 'Agent created successfully',
      color: 'green'
    })

    // Reset form
    form.value = {
      name: '',
      description: '',
      systemPrompt: '',
      model: 'gpt-4-mini',
      temperature: 0.7,
      maxTokens: 2048,
      service: 'chat',
      isPublic: false
    }

    showCreateModal.value = false
    await loadAgents()
    router.push(`/dashboard/agents/${newAgent.id}`)
  } catch (error) {
    console.error('Failed to create agent:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to create agent',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function deleteAgent(agentId: string) {
  if (!confirm('Are you sure you want to delete this agent? This cannot be undone.')) {
    return
  }

  try {
    await $fetch(`/api/agents/${agentId}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Success',
      description: 'Agent deleted successfully',
      color: 'green'
    })

    await loadAgents()
  } catch (error) {
    console.error('Failed to delete agent:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete agent',
      color: 'red'
    })
  }
}

onMounted(async () => {
  await loadAgents()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">AI Agents</h1>
        <p class="text-muted">Create and manage your AI agents</p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Create Agent"
        @click="showCreateModal = true"
      />
    </div>

    <!-- Agents Grid -->
    <div v-if="!loading && agents.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard
        v-for="agent in agents"
        :key="agent.id"
        class="cursor-pointer hover:shadow-lg transition"
        @click="router.push(`/dashboard/agents/${agent.id}`)"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-semibold text-foreground">{{ agent.name }}</h3>
              <p class="text-xs text-muted capitalize">{{ agent.service }}</p>
            </div>
            <UButton
              icon="i-lucide-trash-2"
              color="red"
              variant="ghost"
              size="xs"
              @click.stop="deleteAgent(agent.id)"
            />
          </div>
        </template>

        <div class="space-y-3">
          <p v-if="agent.description" class="text-sm text-muted line-clamp-2">
            {{ agent.description }}
          </p>

          <div class="flex flex-wrap gap-2">
            <span class="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
              {{ agent.model }}
            </span>
            <span
              v-if="agent.isPublic"
              class="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600"
            >
              Public
            </span>
            <span
              v-if="!agent.isActive"
              class="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-600"
            >
              Inactive
            </span>
          </div>

          <div class="pt-3 border-t border-default text-xs text-muted">
            <div>Temperature: {{ agent.temperature }}</div>
            <div>Max Tokens: {{ agent.maxTokens }}</div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else-if="!loading" class="text-center py-12">
      <UIcon name="i-lucide-robot" class="h-12 w-12 text-muted mx-auto mb-4 opacity-50" />
      <p class="text-muted mb-4">No agents yet. Create your first AI agent to get started.</p>
      <UButton
        label="Create Your First Agent"
        @click="showCreateModal = true"
      />
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-primary animate-spin" />
    </div>

    <!-- Create Agent Modal -->
    <UModal v-model="showCreateModal" title="Create New Agent">
      <UCard class="m-4">
        <form @submit.prevent="createAgent" class="space-y-4">
          <!-- Name -->
          <UFormGroup label="Agent Name *" name="name">
            <UInput
              v-model="form.name"
              placeholder="e.g., Customer Support Bot"
              required
            />
          </UFormGroup>

          <!-- Description -->
          <UFormGroup label="Description" name="description">
            <UTextarea
              v-model="form.description"
              placeholder="What does this agent do?"
              rows="2"
            />
          </UFormGroup>

          <!-- Service Type -->
          <UFormGroup label="Service Type" name="service">
            <USelect
              v-model="form.service"
              :options="services"
            />
          </UFormGroup>

          <!-- System Prompt -->
          <UFormGroup label="System Prompt *" name="systemPrompt">
            <UTextarea
              v-model="form.systemPrompt"
              placeholder="Define the agent's behavior and instructions..."
              rows="4"
              required
            />
          </UFormGroup>

          <!-- Model Selection -->
          <UFormGroup label="AI Model" name="model">
            <USelect
              v-model="form.model"
              :options="models"
            />
          </UFormGroup>

          <!-- Temperature -->
          <UFormGroup label="Temperature" name="temperature">
            <div class="flex items-center gap-4">
              <input
                v-model.number="form.temperature"
                type="range"
                min="0"
                max="1"
                step="0.1"
                class="flex-1"
              />
              <span class="text-sm font-semibold text-foreground w-12">
                {{ form.temperature.toFixed(1) }}
              </span>
            </div>
            <p class="text-xs text-muted mt-1">
              Lower values are more deterministic, higher values are more creative
            </p>
          </UFormGroup>

          <!-- Max Tokens -->
          <UFormGroup label="Max Tokens" name="maxTokens">
            <UInput
              v-model.number="form.maxTokens"
              type="number"
              min="100"
              max="10000"
            />
          </UFormGroup>

          <!-- Public Toggle -->
          <UFormGroup>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.isPublic"
                type="checkbox"
                class="rounded border-default"
              />
              <span class="text-sm text-foreground">Make this agent public</span>
            </label>
            <p class="text-xs text-muted mt-1">
              Public agents can be used by anyone with the embed code
            </p>
          </UFormGroup>

          <!-- Actions -->
          <div class="flex gap-2 pt-4">
            <UButton
              variant="outline"
              label="Cancel"
              @click="showCreateModal = false"
            />
            <UButton
              type="submit"
              label="Create Agent"
              :loading="loading"
            />
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>
