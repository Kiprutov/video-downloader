<template>
  <div class="text-center p-6 rounded-lg border-2 transition-all duration-300"
       :class="supported ? platformColors.border : 'border-gray-200 bg-gray-50'">
    <div class="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
         :class="supported ? platformColors.iconBg : 'bg-gray-100'">
      <component :is="iconComponent" class="w-8 h-8" :class="supported ? platformColors.icon : 'text-gray-400'" />
    </div>
    <h3 class="text-lg font-semibold mb-2" :class="supported ? 'text-gray-900' : 'text-gray-500'">
      {{ name }}
    </h3>
    <p class="text-sm" :class="supported ? platformColors.text : 'text-gray-400'">
      {{ supported ? `Video: ${maxQuality} | MP3: 320kbps` : 'Coming Soon' }}
    </p>
    <div v-if="supported" class="mt-3">
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        Supported
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Facebook, Instagram, Music, Youtube } from 'lucide-vue-next'
import { computed } from 'vue'

interface Props {
  name: string
  icon: string
  supported: boolean
  maxQuality: string
}

const props = defineProps<Props>()

const iconComponent = computed(() => {
  const icons = {
    youtube: Youtube,
    tiktok: Music,
    facebook: Facebook,
    instagram: Instagram
  }
  return icons[props.icon as keyof typeof icons] || Youtube
})

const platformColors = computed(() => {
  const colorSchemes = {
    youtube: {
      border: 'border-red-200 bg-red-50 hover:border-red-300',
      iconBg: 'bg-red-100',
      icon: 'text-red-600',
      text: 'text-red-600'
    },
    tiktok: {
      border: 'border-pink-200 bg-pink-50 hover:border-pink-300',
      iconBg: 'bg-pink-100',
      icon: 'text-pink-600',
      text: 'text-pink-600'
    },
    facebook: {
      border: 'border-blue-200 bg-blue-50 hover:border-blue-300',
      iconBg: 'bg-blue-100',
      icon: 'text-blue-600',
      text: 'text-blue-600'
    },
    instagram: {
      border: 'border-purple-200 bg-purple-50 hover:border-purple-300',
      iconBg: 'bg-purple-100',
      icon: 'text-purple-600',
      text: 'text-purple-600'
    }
  }
  return colorSchemes[props.icon as keyof typeof colorSchemes] || colorSchemes.youtube
})
</script>
