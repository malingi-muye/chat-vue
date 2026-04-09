<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useOrganization } from '~/src/composables/useOrganization'
import { useUserSession } from '~/src/composables/useUserSession'
import { $fetch } from 'ofetch'
import { useToast } from '#ui/composables/useToast'

const { user } = useUserSession()
const toast = useToast()

const step = ref<'setup' | 'configured' | 'send'>('setup')
const loading = ref(false)
const sendingMessage = ref(false)

// Setup form
const setupForm = ref({
  apiToken: '',
  senderId: ''
})

// Send SMS form
const smsForm = ref({
  recipient: '',
  message: ''
})

// Integration status
const integration = ref<any>(null)

// Tabs
const tabs = [
  { value: 'setup', label: 'Setup' },
  { value: 'send', label: 'Send SMS' },
  { value: 'campaigns', label: 'Campaigns' }
]

const selectedTab = ref('setup')

async function setupMobiwave() {
  if (!setupForm.value.apiToken || !setupForm.value.senderId) {
    toast.add({
      title: 'Validation Error',
      description: 'API Token and Sender ID are required',
      color: 'red'
    })
    return
  }

  loading.value = true
  try {
    const result = await $fetch('/api/integrations/mobiwave/setup', {
      method: 'POST',
      body: setupForm.value
    })

    toast.add({
      title: 'Success',
      description: result.message,
      color: 'green'
    })

    integration.value = result
    step.value = 'configured'
    selectedTab.value = 'send'
  } catch (error) {
    console.error('Setup failed:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to setup Mobiwave integration',
      color: 'red'
    })
  } finally {
    loading.value = false
  }
}

async function sendSMS() {
  if (!smsForm.value.recipient || !smsForm.value.message) {
    toast.add({
      title: 'Validation Error',
      description: 'Recipient and message are required',
      color: 'red'
    })
    return
  }

  sendingMessage.value = true
  try {
    const result = await $fetch('/api/integrations/mobiwave/sms/send', {
      method: 'POST',
      body: smsForm.value
    })

    toast.add({
      title: 'Success',
      description: 'SMS sent successfully',
      color: 'green'
    })

    // Reset form
    smsForm.value = {
      recipient: '',
      message: ''
    }
  } catch (error) {
    console.error('Failed to send SMS:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to send SMS',
      color: 'red'
    })
  } finally {
    sendingMessage.value = false
  }
}

onMounted(async () => {
  // Check if Mobiwave is already configured
  // This would require an endpoint to fetch existing integration
})
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-3xl font-bold text-foreground mb-2">Mobiwave Integration</h1>
      <p class="text-muted">Send SMS, WhatsApp, and manage contacts with Mobiwave</p>
    </div>

    <!-- Integration Status -->
    <UCard v-if="integration">
      <template #header>
        <div class="flex items-center gap-3">
          <div class="h-3 w-3 rounded-full bg-green-500" />
          <span class="font-semibold text-foreground">Integration Active</span>
        </div>
      </template>
      <div class="space-y-2">
        <div>
          <span class="text-sm text-muted">Sender ID:</span>
          <span class="ml-2 font-semibold text-foreground">{{ integration.profile.senderId }}</span>
        </div>
        <div>
          <span class="text-sm text-muted">Status:</span>
          <span class="ml-2 font-semibold text-green-600">Connected</span>
        </div>
      </div>
    </UCard>

    <!-- Tabs -->
    <UTabs v-model="selectedTab" :items="tabs">
      <!-- Setup Tab -->
      <template #setup>
        <UCard class="mt-4">
          <template #header>
            <h2 class="font-semibold text-foreground">Configure Mobiwave</h2>
          </template>

          <div v-if="!integration" class="space-y-4">
            <!-- Instructions -->
            <div class="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p class="text-sm text-muted mb-3">
                <strong>Get your credentials:</strong>
              </p>
              <ol class="text-sm text-muted space-y-1 list-decimal list-inside">
                <li>Sign up for a <a href="https://mobiwave.co.ke" target="_blank" class="text-primary hover:underline">Mobiwave account</a></li>
                <li>Get your API token from the dashboard</li>
                <li>Configure a sender ID (registered with Mobiwave)</li>
                <li>Paste both values below</li>
              </ol>
            </div>

            <!-- Setup Form -->
            <form @submit.prevent="setupMobiwave" class="space-y-4">
              <!-- API Token -->
              <UFormGroup label="Mobiwave API Token *" name="apiToken">
                <UInput
                  v-model="setupForm.apiToken"
                  type="password"
                  placeholder="Paste your API token here"
                  required
                />
              </UFormGroup>

              <!-- Sender ID -->
              <UFormGroup label="Sender ID *" name="senderId">
                <UInput
                  v-model="setupForm.senderId"
                  placeholder="e.g., MYCOMPANY"
                  required
                />
              </UFormGroup>

              <!-- Actions -->
              <UButton
                type="submit"
                label="Connect Mobiwave"
                block
                :loading="loading"
              />
            </form>
          </div>

          <div v-else class="text-center py-8">
            <UIcon name="i-lucide-check-circle" class="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p class="text-foreground font-semibold mb-2">Mobiwave is connected</p>
            <p class="text-muted text-sm mb-4">You can now send SMS and manage campaigns</p>
            <UButton
              variant="outline"
              label="Reconnect Account"
              @click="step = 'setup'"
            />
          </div>
        </UCard>
      </template>

      <!-- Send SMS Tab -->
      <template #send>
        <UCard class="mt-4">
          <template #header>
            <h2 class="font-semibold text-foreground">Send SMS</h2>
          </template>

          <div v-if="integration" class="space-y-4">
            <form @submit.prevent="sendSMS">
              <!-- Recipient -->
              <UFormGroup label="Recipient Phone Number *" name="recipient">
                <UInput
                  v-model="smsForm.recipient"
                  placeholder="e.g., +254712345678"
                  required
                />
              </UFormGroup>

              <!-- Message -->
              <UFormGroup label="Message *" name="message">
                <UTextarea
                  v-model="smsForm.message"
                  placeholder="Enter your SMS message"
                  rows="4"
                  maxlength="160"
                  required
                />
                <div class="text-xs text-muted mt-1">
                  {{ smsForm.message.length }} / 160 characters
                </div>
              </UFormGroup>

              <!-- Actions -->
              <div class="flex gap-2 pt-4">
                <UButton
                  type="submit"
                  label="Send SMS"
                  :loading="sendingMessage"
                />
                <UButton
                  variant="outline"
                  label="Clear"
                  @click="smsForm = { recipient: '', message: '' }"
                />
              </div>
            </form>
          </div>

          <div v-else class="text-center py-8">
            <p class="text-muted">Configure Mobiwave in the Setup tab to send SMS</p>
          </div>
        </UCard>
      </template>

      <!-- Campaigns Tab -->
      <template #campaigns>
        <UCard class="mt-4">
          <div class="text-center py-8">
            <UIcon name="i-lucide-construction" class="h-12 w-12 text-muted mx-auto mb-4 opacity-50" />
            <p class="text-muted">SMS campaign management coming soon</p>
          </div>
        </UCard>
      </template>
    </UTabs>

    <!-- Features Section -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-message-circle" class="h-5 w-5 text-primary" />
            <span class="font-semibold text-foreground">SMS</span>
          </div>
        </template>
        <p class="text-sm text-muted">Send individual SMS messages to phone numbers worldwide</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-send" class="h-5 w-5 text-primary" />
            <span class="font-semibold text-foreground">Campaigns</span>
          </div>
        </template>
        <p class="text-sm text-muted">Send SMS campaigns to contact groups and lists</p>
      </UCard>

      <UCard>
        <template #header>
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-phone" class="h-5 w-5 text-primary" />
            <span class="font-semibold text-foreground">Contacts</span>
          </div>
        </template>
        <p class="text-sm text-muted">Manage contact groups and recipient lists</p>
      </UCard>
    </div>
  </div>
</template>
