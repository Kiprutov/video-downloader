<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <AppHeader />
    
    <!-- Main Content -->
    <main class=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot/>
    </main>
    
    <!-- Footer -->
    <AppFooter />
    
    <!-- Global Loading Overlay -->
    <LoadingOverlay v-if="isLoading" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDownloadStore } from '@/stores/download'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import LoadingOverlay from './LoadingOverlay.vue'

const authStore = useAuthStore()
const downloadStore = useDownloadStore()

const isLoading = computed(() => 
  authStore.loading || downloadStore.loading
)
</script>
