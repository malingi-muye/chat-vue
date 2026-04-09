<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserSession } from '~/src/composables/useUserSession'
import { useOrganization } from '~/src/composables/useOrganization'
import { $fetch } from 'ofetch'

const { user, session } = useUserSession()
const { currentOrg, getOrgId } = useOrganization()

const loading = ref(false)
const selectedPeriod = ref('30') // days
const analytics = ref<any>(null)
const errors = ref<any>(null)
const costs = ref<any>(null)

const dateRange = computed(() => {
  const days = parseInt(selectedPeriod.value)
  const end = new Date()
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return { start: start.toLocaleDateString(), end: end.toLocaleDateString() }
})

async function loadAnalytics() {
  loading.value = true
  try {
    const orgId = getOrgId()
    const days = selectedPeriod.value

    const [analyticsData, errorsData, costsData] = await Promise.all([
      $fetch(`/api/analytics/${orgId}/summary?days=${days}`),
      $fetch(`/api/analytics/${orgId}/errors?limit=50`),
      $fetch(`/api/analytics/${orgId}/costs?months=3`)
    ])

    analytics.value = analyticsData
    errors.value = errorsData
    costs.value = costsData
  } catch (error) {
    console.error('Failed to load analytics:', error)
    useToast().add({
      title: 'Error',
      description: 'Failed to load analytics',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadAnalytics()
})

// Format currency
const formatCurrency = (value: number) => {
  return `$${value.toFixed(2)}`
}

const formatTime = (ms: number) => {
  return `${(ms / 1000).toFixed(1)}s`
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          Dashboard
        </h1>
        <p class="text-muted">
          {{ currentOrg?.name || 'Loading...' }}
        </p>
      </div>
      <div class="flex items-center gap-3">
        <USelect
          v-model="selectedPeriod"
          :options="[
            { value: '7', label: 'Last 7 days' },
            { value: '30', label: 'Last 30 days' },
            { value: '90', label: 'Last 90 days' }
          ]"
          @update:model-value="loadAnalytics"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          variant="outline"
          :loading="loading"
          @click="loadAnalytics"
        />
      </div>
    </div>

    <div v-if="!loading && analytics">
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-muted">Total Chats</span>
              <UIcon name="i-lucide-message-circle" class="h-4 w-4 text-primary" />
            </div>
          </template>
          <div class="text-3xl font-bold text-foreground">
            {{ analytics.totalChats.toLocaleString() }}
          </div>
          <p class="text-sm text-muted mt-2">Conversations this period</p>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-muted">Total Messages</span>
              <UIcon name="i-lucide-send" class="h-4 w-4 text-primary" />
            </div>
          </template>
          <div class="text-3xl font-bold text-foreground">
            {{ analytics.totalMessages.toLocaleString() }}
          </div>
          <p class="text-sm text-muted mt-2">Messages exchanged</p>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-muted">Total Cost</span>
              <UIcon name="i-lucide-credit-card" class="h-4 w-4 text-primary" />
            </div>
          </template>
          <div class="text-3xl font-bold text-foreground">
            {{ formatCurrency(analytics.totalCost) }}
          </div>
          <p class="text-sm text-muted mt-2">USD spent this period</p>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-muted">Success Rate</span>
              <UIcon name="i-lucide-check-circle" class="h-4 w-4 text-primary" />
            </div>
          </template>
          <div class="text-3xl font-bold text-foreground">
            {{ analytics.successRate.toFixed(1) }}%
          </div>
          <p class="text-sm text-muted mt-2">Message success rate</p>
        </UCard>
      </div>

      <!-- Performance Metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <UCard>
          <template #header>
            <h3 class="font-semibold text-foreground">Performance Metrics</h3>
          </template>
          <div class="space-y-4">
            <div>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-muted">Avg Response Time</span>
                <span class="text-sm font-semibold text-foreground">
                  {{ formatTime(analytics.avgResponseTime) }}
                </span>
              </div>
              <div class="w-full bg-default rounded-full h-2">
                <div
                  class="bg-primary h-2 rounded-full"
                  :style="{ width: Math.min(100, (analytics.avgResponseTime / 10000) * 100) + '%' }"
                />
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-muted">Total Users</span>
                <span class="text-sm font-semibold text-foreground">
                  {{ analytics.totalUsers.toLocaleString() }}
                </span>
              </div>
            </div>
            <div>
              <div class="flex justify-between mb-2">
                <span class="text-sm text-muted">Error Count</span>
                <span :class="[
                  'text-sm font-semibold',
                  analytics.errorCount > 0 ? 'text-red-500' : 'text-green-500'
                ]">
                  {{ analytics.errorCount }}
                </span>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Channel Breakdown -->
        <UCard>
          <template #header>
            <h3 class="font-semibold text-foreground">By Channel</h3>
          </template>
          <div class="space-y-3">
            <div
              v-for="(metrics, channel) in analytics.byChannel"
              :key="channel"
              class="flex items-center justify-between p-3 rounded-lg bg-default/50"
            >
              <div>
                <div class="font-semibold text-foreground capitalize">{{ channel }}</div>
                <div class="text-sm text-muted">
                  {{ metrics.chats }} chats • {{ metrics.messages }} messages
                </div>
              </div>
              <div class="text-right">
                <div class="font-semibold text-foreground">
                  {{ formatCurrency(metrics.cost) }}
                </div>
                <div class="text-sm text-muted">
                  {{ metrics.successRate.toFixed(0) }}% success
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Errors Section -->
      <UCard v-if="errors && errors.unresolved > 0">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-foreground">
              Recent Errors ({{ errors.unresolved }} unresolved)
            </h3>
            <UButton
              variant="ghost"
              size="xs"
              label="View all"
              to="/dashboard/errors"
            />
          </div>
        </template>
        <div class="space-y-2">
          <div
            v-for="error in errors.recent"
            :key="error.id"
            :class="[
              'p-3 rounded-lg border',
              error.severity === 'critical' ? 'border-red-500 bg-red-50/10' :
              error.severity === 'high' ? 'border-orange-500 bg-orange-50/10' :
              error.severity === 'medium' ? 'border-yellow-500 bg-yellow-50/10' :
              'border-blue-500 bg-blue-50/10'
            ]"
          >
            <div class="flex items-center justify-between">
              <div>
                <div class="font-semibold text-foreground">{{ error.errorType }}</div>
                <div class="text-sm text-muted line-clamp-1">{{ error.message }}</div>
              </div>
              <span :class="[
                'text-xs font-semibold px-2 py-1 rounded capitalize',
                error.severity === 'critical' ? 'bg-red-500 text-white' :
                error.severity === 'high' ? 'bg-orange-500 text-white' :
                error.severity === 'medium' ? 'bg-yellow-500 text-white' :
                'bg-blue-500 text-white'
              ]">
                {{ error.severity }}
              </span>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Cost Forecast -->
      <UCard v-if="costs">
        <template #header>
          <h3 class="font-semibold text-foreground">Cost Forecast</h3>
        </template>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div class="text-sm text-muted mb-1">Current Month</div>
            <div class="text-2xl font-bold text-foreground">
              {{ formatCurrency(costs.currentMonthCost) }}
            </div>
          </div>
          <div>
            <div class="text-sm text-muted mb-1">Forecast (Next Month)</div>
            <div class="text-2xl font-bold text-primary">
              {{ formatCurrency(costs.forecast) }}
            </div>
          </div>
        </div>
        <div class="text-sm text-muted">
          <div>Average monthly cost: {{ formatCurrency(costs.averageMonthCost) }}</div>
          <div>Total ({{ costs.history.length }} months): {{ formatCurrency(costs.totalCost) }}</div>
        </div>
      </UCard>
    </div>

    <!-- Loading State -->
    <div v-else class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="h-8 w-8 text-primary animate-spin" />
    </div>
  </div>
</template>
