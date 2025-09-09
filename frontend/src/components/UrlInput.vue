<template>
  <div class="space-y-4">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </div>
      <input
        v-model="inputValue"
        type="url"
        placeholder="Paste video URL here (YouTube, TikTok, Facebook, etc.)"
        class="input-field pl-10 pr-4 py-3 text-lg"
        :class="{ 'border-red-300 focus:ring-red-500': error }"
        :disabled="loading"
        @keydown.enter="handleSubmit"
        @input="clearError"
      />
    </div>
    
    <!-- Error Message -->
    <div v-if="error" class="flex items-center space-x-2 text-red-600 text-sm">
      <svg class="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <span>{{ error }}</span>
    </div>
    
    <!-- Submit Button -->
    <div class="flex justify-end">
      <button
        @click="handleSubmit"
        :disabled="!inputValue.trim() || loading"
        class="btn-primary px-8 py-3 text-lg flex items-center space-x-2"
        :class="{ 'opacity-50 cursor-not-allowed': !inputValue.trim() || loading }"
      >
        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span>{{ loading ? 'Analyzing...' : 'Get Video Info' }}</span>
      </button>
    </div>
    
    <!-- Supported Platforms -->
    <div class="mt-6">
      <p class="text-sm text-gray-500 mb-3">Supported platforms:</p>
      <div class="flex flex-wrap gap-2">
        <span 
          v-for="platform in supportedPlatforms" 
          :key="platform.name"
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
        >
          <component :is="platform.icon" class="w-3 h-3 mr-1" />
          {{ platform.name }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string
  loading?: boolean
  error?: string | null
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', url: string): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null
})

const emit = defineEmits<Emits>()

const inputValue = ref(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  inputValue.value = newValue
})

watch(inputValue, (newValue) => {
  emit('update:modelValue', newValue)
})

const handleSubmit = () => {
  if (inputValue.value.trim() && !props.loading) {
    emit('submit', inputValue.value.trim())
  }
}

const clearError = () => {
  // Error will be cleared by parent component
}

const supportedPlatforms = [
  { name: 'YouTube', icon: 'YouTubeIcon' },
  { name: 'TikTok', icon: 'TikTokIcon' },
  { name: 'Facebook', icon: 'FacebookIcon' },
  { name: 'Instagram', icon: 'InstagramIcon' }
]

// Icon components removed - not used in this component
</script>
