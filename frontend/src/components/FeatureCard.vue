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
import { Cloud, Shield, Zap } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  icon: string
  title: string
  description: string
}

const props = defineProps<Props>()

const iconComponent = computed(() => {
  const icons = {
    shield: Shield,
    lightning: Zap,
    cloud: Cloud
  }
  return icons[props.icon as keyof typeof icons] || Shield
})
</script>
