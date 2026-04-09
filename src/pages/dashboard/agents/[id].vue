<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { $fetch } from 'ofetch'
import { useToast } from '#ui/composables/useToast'

const router = useRouter()
const route = useRoute()
const toast = useToast()

const agentId = computed(() => route.params.id as string)
const loading = ref(false)
const saving = ref(false)
const agent = ref<any>(null)
const hasChanges = ref(false)

const form = ref({
  name: '',
  description: '',
  systemPrompt: '',
  model: 'gpt-4-mini',
  temperature: 0.7,
  maxTokens: 2048,
  isPublic: false,
  isActive: true
})

const models = [
  { value: 'gpt-4-mini', label: 'GPT-4 Mini (Fast & Cheap)' },
  { value: 'gpt-4', label: 'GPT-4 (Most Capable)' },
  { value: 'claude-opus', label: 'Claude Opus (Balanced)' },
  { value: 'claude-haiku', label: 'Claude Haiku (Fast)' },
  { value: 'gemini-pro', label: 'Gemini Pro (Google)' }
]

const tabs = [
  { value: 'settings', label: 'Settings' },
  { value: 'prompt', label: 'System Prompt' },
  { value: 'test', label: 'Test Agent' }
]

const selectedTab = ref('settings')

async function loadAgent() {
  loading.value = true
  try {
    agent.value = await $fetch(`/api/agents/${agentId.value}`)
    
    // Fill form
    form.value = {
      name: agent.value.name,
      description: agent.value.description || '',
      systemPrompt: agent.value.systemPrompt,
      model: agent.value.model,
      temperature: agent.value.temperature,
      maxTokens: agent.value.maxTokens,
      isPublic: agent.value.isPublic,
      isActive: agent.value.isActive
    }
    
    hasChanges.value = false
  } catch (error) {
    console.error('Failed to load agent:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load agent',
      color: 'red'
    })
    router.back()
  } finally {
    loading.value = false
  }
}

function markAsChanged() {
  hasChanges.value = true
}

async function saveAgent() {
  saving.value = true
  try {
    await $fetch(`/api/agents/${agentId.value}`, {
      method: 'PATCH',
      body: form.value
    })

    toast.add({
      title: 'Success',
      description: 'Agent updated successfully',
      color: 'green'
    })

    hasChanges.value = false
    await loadAgent()
  } catch (error) {
    console.error('Failed to save agent:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to save agent',
      color: 'red'
    })
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await loadAgent()
})
</script>

<template>
  <div class="min-h-screen p-6">
    <div v-if="!loading && agent" class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <UButton
            icon="i-lucide-arrow-left"
            variant="ghost"
            @click="router.back()"
          />
          <h1 class="text-3xl font-bold text-foreground">{{ agent.name }}</h1>
          <p class="text-muted capitalize">{{ agent.service }}</p>
        </div>
        <div class="flex gap-2">
          <UButton
            v-if="hasChanges"
            label="Cancel"
            variant="outline"
            @click="loadAgent"
          />
          <UButton
            v-if="hasChanges"
            label="Save Changes"
            :loading="saving"
            @click="saveAgent"
          />
          <UButton
            variant="outline"
            label="Embed Code"
          />
        </div>
      </div>

      <!-- Tabs -->
      <UTabs v-model="selectedTab" :items="tabs">
        <!-- Settings Tab -->
        <template #settings>
          <UCard class="mt-4">
            <form class="space-y-6">
              <!-- Name -->
              <UFormGroup label="Agent Name" name="name">
                <UInput
                  v-model="form.name"
                  @input="markAsChanged"
                />
              </UFormGroup>

              <!-- Description -->
              <UFormGroup label="Description" name="description">
                <UTextarea
                  v-model="form.description"
                  rows="3"
                  @input="markAsChanged"
                />
              </UFormGroup>

              <!-- Service Type -->
              <UFormGroup label="Service Type" name="service">
                <p class="text-sm text-muted">
                  {{ agent.service }}
                </p>
              </UFormGroup>

              <!-- AI Model -->
              <UFormGroup label="AI Model" name="model">
                <USelect
                  v-model="form.model"
                  :options="models"
                  @update:model-value="markAsChanged"
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
                    @input="markAsChanged"
                  />
                  <span class="text-sm font-semibold text-foreground w-12">
                    {{ form.temperature.toFixed(1) }}
                  </span>
                </div>
                <p class="text-xs text-muted mt-2">
                  Lower = Deterministic, Higher = Creative
                </p>
              </UFormGroup>

              <!-- Max Tokens -->
              <UFormGroup label="Max Tokens" name="maxTokens">
                <UInput
                  v-model.number="form.maxTokens"
                  type="number"
                  min="100"
                  max="10000"
                  @input="markAsChanged"
                />
              </UFormGroup>

              <!-- Toggles -->
              <div class="space-y-3">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="form.isPublic"
                    type="checkbox"
                    class="rounded"
                    @change="markAsChanged"
                  />
                  <span class="text-foreground">Make this agent public</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input
                    v-model="form.isActive"
                    type="checkbox"
                    class="rounded"
                    @change="markAsChanged"
                  />
                  <span class="text-foreground">Active</span>
                </label>
              </div>
            </form>
          </UCard>
        </template>

        <!-- System Prompt Tab -->
        <template #prompt>
          <UCard class="mt-4">
            <UFormGroup label="System Prompt" name="systemPrompt">
              <UTextarea
                v-model="form.systemPrompt"
                rows="12"
                placeholder="Define the agent's behavior, personality, and instructions..."
                @input="markAsChanged"
              />
            </UFormGroup>
            <div class="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p class="text-sm text-muted">
                <strong>Tip:</strong> Use clear instructions to define how your agent should behave. 
                Include guidelines for tone, response length, and specific behaviors.
              </p>
            </div>
          </UCard>
        </template>

        <!-- Test Tab -->
        <template #test>
          <UCard class="mt-4">
            <div class="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
              <UIcon name="i-lucide-construction" class="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
              <p class="text-muted">Agent testing sandbox coming soon</p>
            </div>
          </UCard>
        </template>
      </UTabs>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-primary animate-spin" />
    </div>
  </div>
</template>
