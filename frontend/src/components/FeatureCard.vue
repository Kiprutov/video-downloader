<template>
  <div class="card hover:shadow-lg transition-shadow duration-300">
    <div class="flex items-center mb-4">
      <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
        <component :is="iconComponent" class="w-6 h-6 text-primary-600" />
      </div>
      <h3 class="text-xl font-semibold text-gray-900">{{ title }}</h3>
    </div>
    <p class="text-gray-600 leading-relaxed">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  icon: string
  title: string
  description: string
}

const props = defineProps<Props>()

const iconComponent = computed(() => {
  const icons = {
    shield: ShieldIcon,
    lightning: LightningIcon,
    cloud: CloudIcon
  }
  return icons[props.icon as keyof typeof icons] || ShieldIcon
})

// Icon components
const ShieldIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  `
}

const LightningIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  `
}

const CloudIcon = {
  template: `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
    </svg>
  `
}
</script>
