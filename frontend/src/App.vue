<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <AppLayout>
      <RouterView />
    </AppLayout>
  </div>
</template>

<script setup lang="ts">
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { onMounted } from 'vue'
const authStore = useAuthStore()

onMounted(async () => {
  // Initialize auth state
  await authStore.initialize()
})
</script>
