<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="flex justify-center">
          <div class="w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          {{ isLogin ? 'Sign in to your account' : 'Create your account' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          {{ isLogin ? "Don't have an account?" : 'Already have an account?' }}
          <button 
            @click="toggleMode"
            class="font-medium text-primary-600 hover:text-primary-500"
          >
            {{ isLogin ? 'Sign up' : 'Sign in' }}
          </button>
        </p>
      </div>

      <!-- Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4">
          <div v-if="!isLogin">
            <label for="displayName" class="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              id="displayName"
              v-model="form.displayName"
              type="text"
              class="input-field mt-1"
              placeholder="Enter your display name"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field mt-1"
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field mt-1"
              placeholder="Enter your password"
            />
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="authStore.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-start space-x-3">
            <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <div>
              <h4 class="text-sm font-medium text-red-800">Authentication Error</h4>
              <p class="text-sm text-red-700 mt-1">{{ authStore.error }}</p>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="btn-primary w-full py-3 text-lg"
            :class="{ 'opacity-50 cursor-not-allowed': authStore.loading }"
          >
            <svg v-if="authStore.loading" class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ authStore.loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account') }}
          </button>
        </div>

        <!-- Demo Mode -->
        <div class="text-center">
          <button
            @click="handleDemoLogin"
            class="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Try Demo Mode (No Authentication Required)
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

const isLogin = ref(true)

const form = reactive({
  email: '',
  password: '',
  displayName: ''
})

const toggleMode = () => {
  isLogin.value = !isLogin.value
  authStore.clearError()
  // Clear form
  form.email = ''
  form.password = ''
  form.displayName = ''
}

const handleSubmit = async () => {
  if (isLogin.value) {
    const result = await authStore.login(form.email, form.password)
    if (result.success) {
      toast.success('Welcome back!')
      router.push('/download')
    } else {
      toast.error(result.error || 'Login failed')
    }
  } else {
    const result = await authStore.register(form.email, form.password, form.displayName)
    if (result.success) {
      toast.success('Account created successfully!')
      router.push('/download')
    } else {
      toast.error(result.error || 'Registration failed')
    }
  }
}

const handleDemoLogin = () => {
  // Set demo user
  authStore.user = {
    uid: 'demo-user',
    email: 'demo@example.com',
    displayName: 'Demo User'
  }
  localStorage.setItem('user', JSON.stringify(authStore.user))
  toast.success('Demo mode activated!')
  router.push('/download')
}
</script>
