<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Page Header -->
    <div>
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
      <p class="text-lg text-gray-600">
        Manage your account and application preferences
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Settings Navigation -->
      <div class="lg:col-span-1">
        <nav class="space-y-1">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="activeTab === tab.id ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
          >
            <component :is="tab.icon" class="w-4 h-4 mr-2 inline" />
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Settings Content -->
      <div class="lg:col-span-2">
        <!-- Account Settings -->
        <div v-if="activeTab === 'account'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Account Information</h2>
            <p class="text-gray-600 mt-1">Manage your account details</p>
          </div>
          
          <div class="space-y-6">
            <div class="flex items-center space-x-4">
              <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                <span class="text-white text-xl font-medium">
                  {{ userInitials }}
                </span>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">{{ authStore.user?.displayName }}</h3>
                <p class="text-gray-600">{{ authStore.user?.email }}</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  v-model="accountForm.displayName"
                  type="text"
                  class="input-field"
                  placeholder="Enter display name"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  v-model="accountForm.email"
                  type="email"
                  class="input-field"
                  placeholder="Enter email"
                />
              </div>
            </div>
            
            <div class="flex justify-end">
              <button class="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>

        <!-- Download Settings -->
        <div v-if="activeTab === 'downloads'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Download Preferences</h2>
            <p class="text-gray-600 mt-1">Configure your download settings</p>
          </div>
          
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Quality</label>
              <select v-model="downloadSettings.defaultQuality" class="input-field">
                <option value="best">Best Available</option>
                <option value="1080p">1080p</option>
                <option value="720p">720p</option>
                <option value="480p">480p</option>
                <option value="audio">Audio Only</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Download Location</label>
              <select v-model="downloadSettings.location" class="input-field">
                <option value="cloud">Cloud Storage (Firebase)</option>
                <option value="local">Local Storage</option>
              </select>
            </div>
            
            <div class="flex items-center">
              <input
                id="autoDownload"
                v-model="downloadSettings.autoDownload"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="autoDownload" class="ml-2 block text-sm text-gray-900">
                Auto-download after format selection
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                id="notifications"
                v-model="downloadSettings.notifications"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="notifications" class="ml-2 block text-sm text-gray-900">
                Enable download notifications
              </label>
            </div>
            
            <div class="flex justify-end">
              <button class="btn-primary">Save Settings</button>
            </div>
          </div>
        </div>

        <!-- Privacy Settings -->
        <div v-if="activeTab === 'privacy'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">Privacy & Security</h2>
            <p class="text-gray-600 mt-1">Manage your privacy preferences</p>
          </div>
          
          <div class="space-y-6">
            <div class="flex items-center">
              <input
                id="analytics"
                v-model="privacySettings.analytics"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="analytics" class="ml-2 block text-sm text-gray-900">
                Allow anonymous usage analytics
              </label>
            </div>
            
            <div class="flex items-center">
              <input
                id="dataRetention"
                v-model="privacySettings.dataRetention"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="dataRetention" class="ml-2 block text-sm text-gray-900">
                Keep download history for 30 days
              </label>
            </div>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <svg class="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <div>
                  <h4 class="text-sm font-medium text-yellow-800">Data Security</h4>
                  <p class="text-sm text-yellow-700 mt-1">
                    Your data is encrypted and stored securely. We never share your personal information with third parties.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="flex justify-end">
              <button class="btn-primary">Save Privacy Settings</button>
            </div>
          </div>
        </div>

        <!-- About -->
        <div v-if="activeTab === 'about'" class="card">
          <div class="card-header">
            <h2 class="text-xl font-semibold text-gray-900">About</h2>
            <p class="text-gray-600 mt-1">Application information and support</p>
          </div>
          
          <div class="space-y-6">
            <div class="text-center">
              <div class="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                </svg>
              </div>
              <h3 class="text-2xl font-bold text-gray-900">Video Downloader</h3>
              <p class="text-gray-600">Version 1.0.0</p>
            </div>
            
            <div class="space-y-4">
              <div>
                <h4 class="font-medium text-gray-900">Built with</h4>
                <p class="text-sm text-gray-600">Vue.js 3, TypeScript, Tailwind CSS, Firebase, Oracle Cloud</p>
              </div>
              
              <div>
                <h4 class="font-medium text-gray-900">Support</h4>
                <p class="text-sm text-gray-600">For support and feedback, please contact us at support@videodownloader.com</p>
              </div>
              
              <div>
                <h4 class="font-medium text-gray-900">Legal</h4>
                <div class="space-y-2 text-sm text-gray-600">
                  <a href="#" class="block hover:text-primary-600">Privacy Policy</a>
                  <a href="#" class="block hover:text-primary-600">Terms of Service</a>
                  <a href="#" class="block hover:text-primary-600">Open Source Licenses</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { computed, reactive, ref } from 'vue'

const authStore = useAuthStore()

const activeTab = ref('account')

const accountForm = reactive({
  displayName: authStore.user?.displayName || '',
  email: authStore.user?.email || ''
})

const downloadSettings = reactive({
  defaultQuality: 'best',
  location: 'cloud',
  autoDownload: false,
  notifications: true
})

const privacySettings = reactive({
  analytics: false,
  dataRetention: true
})

const userInitials = computed(() => {
  if (!authStore.user?.displayName) return 'U'
  return authStore.user.displayName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const tabs = [
  { id: 'account', name: 'Account', icon: 'UserIcon' },
  { id: 'downloads', name: 'Downloads', icon: 'DownloadIcon' },
  { id: 'privacy', name: 'Privacy', icon: 'ShieldIcon' },
  { id: 'about', name: 'About', icon: 'InformationIcon' }
]

// Icon components
// Icon components removed - not used
</script>
