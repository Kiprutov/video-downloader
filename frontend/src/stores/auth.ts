import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  const initialize = async () => {
    loading.value = true
    try {
      // TODO: Initialize Firebase Auth
      // For now, we'll simulate authentication
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        user.value = JSON.parse(savedUser)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Authentication failed'
    } finally {
      loading.value = false
    }
  }

  const login = async (email: string, password: string) => {
    loading.value = true
    error.value = null
    
    try {
      // TODO: Implement Firebase Auth login
      // For now, simulate login
      const mockUser: User = {
        uid: 'mock-uid',
        email,
        displayName: email.split('@')[0]
      }
      
      user.value = mockUser
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const register = async (email: string, password: string, displayName?: string) => {
    loading.value = true
    error.value = null
    
    try {
      // TODO: Implement Firebase Auth registration
      // For now, simulate registration
      const mockUser: User = {
        uid: 'mock-uid',
        email,
        displayName: displayName || email.split('@')[0]
      }
      
      user.value = mockUser
      localStorage.setItem('user', JSON.stringify(mockUser))
      
      return { success: true }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      // TODO: Implement Firebase Auth logout
      user.value = null
      localStorage.removeItem('user')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
    } finally {
      loading.value = false
    }
  }

  const clearError = () => {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    initialize,
    login,
    register,
    logout,
    clearError
  }
})
