<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrganization } from '~/src/composables/useOrganization'
import { useUserSession } from '~/src/composables/useUserSession'
import { $fetch } from 'ofetch'
import { useToast } from '#ui/composables/useToast'

const { getOrgId } = useOrganization()
const { user } = useUserSession()

const loading = ref(false)
const errors = ref<any>(null)
const selectedSeverity = ref<string | null>(null)
const selectedType = ref<string | null>(null)

const filteredErrors = computed(() => {
  if (!errors.value) return []
  
  let filtered = errors.value.recent || []
  
  if (selectedSeverity.value) {
    filtered = filtered.filter((e: any) => e.severity === selectedSeverity.value)
  }
  
  if (selectedType.value) {
    filtered = filtered.filter((e: any) => e.errorType === selectedType.value)
  }
  
  return filtered
})

const errorTypes = computed(() => {
  if (!errors.value) return []
  return Object.keys(errors.value.byType || {})
})

const severityOptions = ['low', 'medium', 'high', 'critical']

async function loadErrors() {
  loading.value = true
  try {
    const orgId = getOrgId()
    const errorData = await $fetch(`/api/analytics/${orgId}/errors?limit=200`)
    errors.value = errorData
  } catch (error) {
    console.error('Failed to load errors:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load errors',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function resolveError(errorId: string) {
  try {
    await $fetch(`/api/analytics/${getOrgId()}/errors/${errorId}/resolve`, {
      method: 'POST'
    })
    
    useToast().add({
      title: 'Success',
      description: 'Error marked as resolved',
      color: 'green'
    })
    
    await loadErrors()
  } catch (error) {
    console.error('Failed to resolve error:', error)
  }
}

onMounted(async () => {
  await loadErrors()
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-foreground mb-2">
        Error Logs
      </h1>
      <div v-if="errors" class="flex gap-4">
        <div>
          <div class="text-sm text-muted">Total Errors</div>
          <div class="text-2xl font-bold text-foreground">{{ errors.total }}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Unresolved</div>
          <div class="text-2xl font-bold text-red-500">{{ errors.unresolved }}</div>
        </div>
        <div>
          <div class="text-sm text-muted">Resolved</div>
          <div class="text-2xl font-bold text-green-500">{{ errors.resolved }}</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-3">
      <UButton
        v-for="severity in severityOptions"
        :key="severity"
        :variant="selectedSeverity === severity ? 'soft' : 'outline'"
        size="sm"
        :label="severity"
        :color="
          severity === 'critical' ? 'red' :
          severity === 'high' ? 'orange' :
          severity === 'medium' ? 'yellow' :
          'blue'
        "
        @click="selectedSeverity = selectedSeverity === severity ? null : severity"
      />
      
      <USelect
        v-if="errorTypes.length > 0"
        v-model="selectedType"
        :options="[
          { value: null, label: 'All error types' },
          ...errorTypes.map(type => ({ value: type, label: type }))
        ]"
        placeholder="Filter by error type"
      />

      <div class="ml-auto">
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          :loading="loading"
          @click="loadErrors"
        />
      </div>
    </div>

    <!-- Errors List -->
    <div v-if="!loading && errors" class="space-y-3">
      <div
        v-for="error in filteredErrors"
        :key="error.id"
        :class="[
          'p-4 rounded-lg border transition hover:shadow-md',
          error.isResolved ? 'border-green-500/30 bg-green-50/5' :
          error.severity === 'critical' ? 'border-red-500 bg-red-50/10' :
          error.severity === 'high' ? 'border-orange-500 bg-orange-50/10' :
          error.severity === 'medium' ? 'border-yellow-500 bg-yellow-50/10' :
          'border-blue-500 bg-blue-50/10'
        ]"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-foreground">{{ error.errorType }}</h3>
              <span :class="[
                'text-xs font-semibold px-2 py-1 rounded capitalize',
                error.severity === 'critical' ? 'bg-red-500 text-white' :
                error.severity === 'high' ? 'bg-orange-500 text-white' :
                error.severity === 'medium' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              ]">
                {{ error.severity }}
              </span>
              <span v-if="error.isResolved" class="text-xs px-2 py-1 rounded bg-green-500/20 text-green-600">
                Resolved
              </span>
            </div>
            <p class="text-sm text-muted mt-1">{{ error.message }}</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-muted">
              {{ new Date(error.createdAt).toLocaleString() }}
            </div>
          </div>
        </div>

        <div v-if="error.agent || error.chat" class="text-xs text-muted mb-3 space-y-1">
          <div v-if="error.agent">Agent: <span class="font-semibold">{{ error.agent.name }}</span></div>
          <div v-if="error.chat">Chat: <span class="font-semibold">{{ error.chat.title || 'Untitled' }}</span></div>
        </div>

        <div v-if="error.stackTrace" class="mb-3 p-2 bg-default/50 rounded text-xs font-mono text-muted overflow-x-auto">
          <div class="line-clamp-3">{{ error.stackTrace }}</div>
        </div>

        <div v-if="!error.isResolved" class="flex justify-end gap-2">
          <UButton
            size="xs"
            variant="outline"
            label="Resolve"
            @click="resolveError(error.id)"
          />
        </div>
      </div>

      <div v-if="filteredErrors.length === 0" class="text-center py-12">
        <UIcon name="i-lucide-inbox" class="h-12 w-12 text-muted mx-auto mb-4 opacity-50" />
        <p class="text-muted">No errors found</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-primary animate-spin" />
    </div>
  </div>
</template>
