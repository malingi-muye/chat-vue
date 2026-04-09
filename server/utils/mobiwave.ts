/**
 * Mobiwave API Integration Service
 * SMS, WhatsApp, Email, and Contact Management
 */

import { $fetch } from 'ofetch'

const MOBIWAVE_API_URL = process.env.MOBIWAVE_API_URL || 'https://sms.mobiwave.co.ke/api/v3/'
const MOBIWAVE_API_KEY = process.env.MOBIWAVE_API_KEY

interface MobiwaveConfig {
  apiToken: string
}

/**
 * Initialize Mobiwave client with API token
 */
export function createMobiwaveClient(apiToken: string) {
  return {
    sms: createSmsService(apiToken),
    whatsapp: createWhatsAppService(apiToken),
    email: createEmailService(apiToken),
    contacts: createContactsService(apiToken)
  }
}

/**
 * SMS Service
 */
function createSmsService(apiToken: string) {
  return {
    /**
     * Send SMS to single or multiple recipients
     */
    async send(options: {
      recipient: string | string[]
      message: string
      senderId: string
      scheduledTime?: string
    }) {
      const recipients = Array.isArray(options.recipient)
        ? options.recipient.join(',')
        : options.recipient

      const response = await $fetch(`${MOBIWAVE_API_URL}sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          recipient: recipients,
          sender_id: options.senderId,
          type: 'plain',
          message: options.message,
          schedule_time: options.scheduledTime
        }
      })

      return response
    },

    /**
     * Send SMS campaign to contact list
     */
    async sendCampaign(options: {
      contactListIds: string | string[]
      message: string
      senderId: string
      scheduledTime?: string
    }) {
      const lists = Array.isArray(options.contactListIds)
        ? options.contactListIds.join(',')
        : options.contactListIds

      const response = await $fetch(`${MOBIWAVE_API_URL}sms/campaign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          contact_list_id: lists,
          sender_id: options.senderId,
          type: 'plain',
          message: options.message,
          schedule_time: options.scheduledTime
        }
      })

      return response
    },

    /**
     * Get SMS status
     */
    async getStatus(smsId: string) {
      return await $fetch(`${MOBIWAVE_API_URL}sms/${smsId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })
    },

    /**
     * Get all SMS messages
     */
    async getAll() {
      return await $fetch(`${MOBIWAVE_API_URL}sms/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })
    }
  }
}

/**
 * WhatsApp Service
 */
function createWhatsAppService(apiToken: string) {
  return {
    /**
     * Send WhatsApp message
     */
    async send(options: {
      recipient: string
      message: string
      senderId: string
      scheduledTime?: string
    }) {
      const response = await $fetch(`${MOBIWAVE_API_URL}sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          recipient: options.recipient,
          sender_id: options.senderId,
          type: 'whatsapp',
          message: options.message,
          schedule_time: options.scheduledTime
        }
      })

      return response
    }
  }
}

/**
 * Email Service
 */
function createEmailService(apiToken: string) {
  return {
    /**
     * Send email (via Mobiwave email integration)
     */
    async send(options: {
      recipient: string | string[]
      subject: string
      message: string
      senderId: string
    }) {
      // Note: Mobiwave API documentation shows SMS/WhatsApp focus
      // Email would be implemented through their email service or custom integration
      throw new Error('Email integration requires custom setup with Mobiwave email service')
    }
  }
}

/**
 * Contacts Management Service
 */
function createContactsService(apiToken: string) {
  return {
    /**
     * Create contact group
     */
    async createGroup(name: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: { name }
      })

      return response
    },

    /**
     * Get all contact groups
     */
    async getGroups() {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      return response
    },

    /**
     * Get specific group
     */
    async getGroup(groupId: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}/show`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      return response
    },

    /**
     * Update contact group
     */
    async updateGroup(groupId: string, name: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: { name }
      })

      return response
    },

    /**
     * Delete contact group
     */
    async deleteGroup(groupId: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      return response
    },

    /**
     * Add contact to group
     */
    async addContact(groupId: string, options: {
      phone: string
      firstName?: string
      lastName?: string
    }) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}/store`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          phone: options.phone,
          first_name: options.firstName,
          last_name: options.lastName
        }
      })

      return response
    },

    /**
     * Get contact
     */
    async getContact(groupId: string, contactId: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}/search/${contactId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      return response
    },

    /**
     * Update contact
     */
    async updateContact(groupId: string, contactId: string, options: {
      phone: string
      firstName?: string
      lastName?: string
    }) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}/update/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: {
          phone: options.phone,
          first_name: options.firstName,
          last_name: options.lastName
        }
      })

      return response
    },

    /**
     * Delete contact
     */
    async deleteContact(groupId: string, contactId: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}/delete/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      return response
    },

    /**
     * Get all contacts in group
     */
    async getContacts(groupId: string) {
      const response = await $fetch(`${MOBIWAVE_API_URL}contacts/${groupId}/all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Accept': 'application/json'
        }
      })

      return response
    }
  }
}

/**
 * Get account balance
 */
export async function getMobiwaveBalance(apiToken: string) {
  return await $fetch(`${MOBIWAVE_API_URL}balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
    }
  })
}

/**
 * Get profile information
 */
export async function getMobiwaveProfile(apiToken: string) {
  return await $fetch(`${MOBIWAVE_API_URL}me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Accept': 'application/json'
    }
  })
}
