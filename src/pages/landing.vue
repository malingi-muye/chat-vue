<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUserSession } from '../composables/useUserSession'
import { useRouter } from 'vue-router'

const router = useRouter()
const { loggedIn, openInPopup } = useUserSession()

// Redirect to dashboard if already logged in
if (loggedIn.value) {
  router.push('/')
}

const selectedPlan = ref<'free' | 'starter' | 'growth' | 'enterprise'>('starter')

const plans = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with essential features',
    price: 0,
    period: '/month',
    features: [
      'Up to 1,000 messages/month',
      '1 AI Agent',
      'Basic chat widget',
      'Community support',
      'Limited API access'
    ]
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for growing businesses',
    price: 2990,
    currency: 'KES',
    period: '/month',
    highlighted: true,
    features: [
      'Up to 50,000 messages/month',
      '5 AI Agents',
      'Advanced chat widget',
      'SMS & WhatsApp integration',
      'Email support',
      'Page visit analytics',
      'API access',
      'Cost breakdown reporting'
    ]
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'For scaling enterprises',
    price: 7990,
    currency: 'KES',
    period: '/month',
    features: [
      'Unlimited messages/month',
      'Unlimited AI Agents',
      'Custom branding',
      'Full SMS/WhatsApp/Email suite',
      'GitHub analytics agent',
      'Custom webhooks',
      'Priority email & phone support',
      'Advanced analytics dashboard',
      'Team collaboration tools'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions at scale',
    price: null,
    period: 'Custom pricing',
    features: [
      'Everything in Growth',
      'Dedicated account manager',
      'Custom AI model training',
      'On-premise deployment',
      'Advanced security & compliance',
      'SLA guarantee',
      'Custom integration support'
    ]
  }
]

const services = [
  {
    title: 'AI Chat Agents',
    description: 'Intelligent chatbots powered by latest AI models for customer support, sales, and engagement',
    icon: 'i-lucide-message-circle'
  },
  {
    title: 'Customer Support Widget',
    description: 'Embeddable chat widget for your website with instant responses and ticketing',
    icon: 'i-lucide-square-activity'
  },
  {
    title: 'Page Analytics Agent',
    description: 'Track visitor behavior, pages visited, and user engagement patterns in real-time',
    icon: 'i-lucide-activity'
  },
  {
    title: 'GitHub Analytics',
    description: 'Monitor repository activity, pull requests, issues, and team productivity',
    icon: 'i-lucide-git-branch'
  },
  {
    title: 'SMS & WhatsApp',
    description: 'Reach customers via SMS, WhatsApp, and Email through Mobiwave integration',
    icon: 'i-lucide-send'
  },
  {
    title: 'M-Pesa Payments',
    description: 'Process payments seamlessly with M-Pesa STK Push for Kenya clients',
    icon: 'i-lucide-credit-card'
  }
]

const stats = [
  { label: 'Uptime', value: '99.9%', description: 'Enterprise-grade reliability' },
  { label: 'Response Time', value: '<100ms', description: 'Lightning fast AI responses' },
  { label: 'Countries', value: '50+', description: 'Serving businesses worldwide' }
]

const faqs = [
  {
    question: 'How quickly can I set up an AI agent?',
    answer: 'You can create and deploy your first AI agent in under 2 minutes. Simply define your system prompt and customize the settings.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, all data is encrypted in transit and at rest. We comply with GDPR, CCPA, and offer on-premise deployment for enterprise clients.'
  },
  {
    question: 'Can I integrate with my existing systems?',
    answer: 'Absolutely. We provide REST APIs, webhooks, and pre-built integrations with popular platforms.'
  },
  {
    question: 'What happens if I exceed my plan limits?',
    answer: 'You&apos;ll receive notifications as you approach limits. You can upgrade anytime or set cost limits to prevent overage.'
  }
]
</script>

<template>
  <div class="min-h-screen bg-default">
    <!-- Navigation Bar -->
    <nav class="fixed top-0 w-full backdrop-blur-sm bg-default/80 border-b border-default z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary" />
          <span class="text-lg font-bold text-foreground">Mobiwave AI</span>
        </div>
        <div class="flex items-center gap-4">
          <button
            v-if="!loggedIn"
            type="button"
            class="px-4 py-2 text-sm font-semibold text-foreground hover:text-muted transition"
            @click="openInPopup('/auth/github')"
          >
            Sign in
          </button>
          <UButton
            v-if="!loggedIn"
            label="Get Started"
            @click="openInPopup('/auth/github')"
          />
          <UButton
            v-else
            label="Dashboard"
            to="/"
          />
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="text-center">
        <span class="inline-block px-3 py-1 text-sm font-semibold text-primary bg-primary/10 rounded-full mb-4">
          AI-Powered Service Platform
        </span>
        <h1 class="text-5xl sm:text-6xl font-bold text-foreground mb-6 text-balance">
          Your AI Agents Business Starts Here
        </h1>
        <p class="text-xl text-muted max-w-2xl mx-auto mb-8">
          Build, deploy, and monetize intelligent AI agents for customer support, analytics, and engagement. Built for Kenya, trusted globally.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            size="lg"
            label="Start Free Trial"
            @click="openInPopup('/auth/github')"
          />
          <UButton
            size="lg"
            variant="outline"
            label="View Demo"
          />
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="bg-primary/5 py-16 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div
            v-for="stat in stats"
            :key="stat.label"
            class="text-center"
          >
            <div class="text-4xl font-bold text-primary mb-2">{{ stat.value }}</div>
            <div class="text-lg font-semibold text-foreground mb-1">{{ stat.label }}</div>
            <div class="text-muted">{{ stat.description }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Grid -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-foreground mb-4">
          Complete AI Service Suite
        </h2>
        <p class="text-xl text-muted max-w-2xl mx-auto">
          Everything you need to build and scale AI-powered services
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="service in services"
          :key="service.title"
          class="p-6 rounded-lg border border-default bg-default hover:border-primary/50 transition"
        >
          <UIcon
            :name="service.icon"
            class="h-8 w-8 text-primary mb-4"
          />
          <h3 class="text-lg font-semibold text-foreground mb-2">
            {{ service.title }}
          </h3>
          <p class="text-muted">{{ service.description }}</p>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="bg-primary/5 py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p class="text-xl text-muted max-w-2xl mx-auto">
            Choose the plan that fits your business needs
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.id"
            :class="[
              'relative p-6 rounded-lg border transition',
              plan.highlighted
                ? 'border-primary bg-primary/5 ring-2 ring-primary scale-105'
                : 'border-default bg-default hover:border-primary/50'
            ]"
          >
            <div v-if="plan.highlighted" class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">
              Popular
            </div>

            <h3 class="text-2xl font-bold text-foreground mb-2">{{ plan.name }}</h3>
            <p class="text-muted text-sm mb-4">{{ plan.description }}</p>

            <div class="mb-6">
              <span class="text-4xl font-bold text-foreground">
                {{ plan.price === 0 ? 'Free' : `${plan.price}` }}
              </span>
              <span v-if="plan.price" class="text-muted ml-2">{{ plan.currency }}</span>
              <div class="text-muted text-sm mt-1">{{ plan.period }}</div>
            </div>

            <UButton
              block
              :variant="plan.highlighted ? 'soft' : 'outline'"
              :label="plan.price === null ? 'Contact Sales' : 'Get Started'"
              @click="openInPopup('/auth/github')"
            />

            <div class="mt-6 space-y-3">
              <div
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-start gap-3"
              >
                <UIcon name="i-lucide-check" class="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span class="text-sm text-foreground">{{ feature }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-bold text-foreground mb-4">
          Frequently Asked Questions
        </h2>
      </div>

      <div class="space-y-4">
        <details
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="group p-6 rounded-lg border border-default bg-default cursor-pointer hover:border-primary/50 transition"
        >
          <summary class="flex items-center justify-between font-semibold text-foreground">
            {{ faq.question }}
            <UIcon name="i-lucide-chevron-down" class="h-5 w-5 group-open:rotate-180 transition" />
          </summary>
          <p class="text-muted mt-4">{{ faq.answer }}</p>
        </details>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-gradient-to-r from-primary to-secondary text-white py-20 px-4 sm:px-6 lg:px-8">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-4xl font-bold mb-4">Ready to get started?</h2>
        <p class="text-lg mb-8 opacity-90">
          Join hundreds of businesses leveraging AI to transform their customer interactions
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            size="lg"
            color="white"
            label="Start Free Trial"
            @click="openInPopup('/auth/github')"
          />
          <UButton
            size="lg"
            variant="outline"
            color="white"
            label="Schedule Demo"
          />
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-default border-t border-default py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 class="font-semibold text-foreground mb-4">Product</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-muted hover:text-foreground transition">Features</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">Pricing</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-4">Company</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-muted hover:text-foreground transition">About</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">Blog</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-4">Legal</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-muted hover:text-foreground transition">Privacy</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">Terms</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">Security</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-semibold text-foreground mb-4">Social</h3>
            <ul class="space-y-2">
              <li><a href="#" class="text-muted hover:text-foreground transition">Twitter</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">GitHub</a></li>
              <li><a href="#" class="text-muted hover:text-foreground transition">LinkedIn</a></li>
            </ul>
          </div>
        </div>

        <div class="border-t border-default pt-8 text-center text-muted">
          <p>&copy; 2024 Mobiwave AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}
</style>
