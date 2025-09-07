<template>
  <div class="max-w-6xl mx-auto space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Download History</h1>
        <p class="text-lg text-gray-600">
          View and manage your downloaded videos
        </p>
      </div>
      
      <div class="mt-4 md:mt-0 flex items-center space-x-3">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search downloads..."
            class="input-field pl-10 pr-4 py-2 w-64"
          />
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <select v-model="statusFilter" class="input-field py-2">
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div class="card text-center">
        <div class="text-3xl font-bold text-primary-600">{{ totalDownloads }}</div>
        <div class="text-sm text-gray-600">Total Downloads</div>
      </div>
      
      <div class="card text-center">
        <div class="text-3xl font-bold text-green-600">{{ completedDownloads }}</div>
        <div class="text-sm text-gray-600">Completed</div>
      </div>
      
      <div class="card text-center">
        <div class="text-3xl font-bold text-red-600">{{ failedDownloads }}</div>
        <div class="text-sm text-gray-600">Failed</div>
      </div>
      
      <div class="card text-center">
        <div class="text-3xl font-bold text-blue-600">{{ totalSize }}</div>
        <div class="text-sm text-gray-600">Total Size</div>
      </div>
    </div>

    <!-- Downloads List -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-xl font-semibold text-gray-900">Downloads</h2>
      </div>
      
      <div v-if="filteredDownloads.length === 0" class="text-center py-12">
        <svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No downloads found</h3>
        <p class="text-gray-600 mb-4">
          {{ searchQuery || statusFilter ? 'Try adjusting your search or filter criteria.' : 'Start downloading videos to see them here.' }}
        </p>
        <RouterLink v-if="!searchQuery && !statusFilter" to="/download" class="btn-primary">
          Start Downloading
        </RouterLink>
      </div>
      
      <div v-else class="space-y-4">
        <div 
          v-for="download in paginatedDownloads" 
          :key="download.id"
          class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                {{ download.title }}
              </h3>
              
              <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0v16a1 1 0 001 1h6a1 1 0 001-1V4" />
                  </svg>
                  {{ download.format }}
                </div>
                
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ formatDate(download.createdAt) }}
                </div>
                
                <div class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {{ formatFileSize(download.fileSize) }}
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="download.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path v-if="download.status === 'completed'" fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    <path v-else fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                  {{ download.status }}
                </span>
                
                <span class="text-xs text-gray-500">
                  {{ download.quality }}
                </span>
              </div>
            </div>
            
            <div class="flex items-center space-x-2 ml-4">
              <a 
                v-if="download.status === 'completed'"
                :href="download.downloadUrl"
                class="btn-primary text-sm px-4 py-2"
                download
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </a>
              
              <button 
                @click="deleteDownload(download.id)"
                class="btn-secondary text-sm px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between pt-6 border-t border-gray-200">
        <div class="text-sm text-gray-700">
          Showing {{ (currentPage - 1) * itemsPerPage + 1 }} to {{ Math.min(currentPage * itemsPerPage, filteredDownloads.length) }} of {{ filteredDownloads.length }} results
        </div>
        
        <div class="flex items-center space-x-2">
          <button 
            @click="currentPage = Math.max(1, currentPage - 1)"
            :disabled="currentPage === 1"
            class="btn-secondary text-sm px-3 py-2"
            :class="{ 'opacity-50 cursor-not-allowed': currentPage === 1 }"
          >
            Previous
          </button>
          
          <span class="text-sm text-gray-700">
            Page {{ currentPage }} of {{ totalPages }}
          </span>
          
          <button 
            @click="currentPage = Math.min(totalPages, currentPage + 1)"
            :disabled="currentPage === totalPages"
            class="btn-secondary text-sm px-3 py-2"
            :class="{ 'opacity-50 cursor-not-allowed': currentPage === totalPages }"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDownloadStore } from '@/stores/download'
import { useToast } from 'vue-toastification'
import type { DownloadHistory } from '@/types'

const downloadStore = useDownloadStore()
const toast = useToast()

const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const itemsPerPage = 10

const filteredDownloads = computed(() => {
  let downloads = downloadStore.downloadHistory
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    downloads = downloads.filter(download => 
      download.title.toLowerCase().includes(query) ||
      download.format.toLowerCase().includes(query)
    )
  }
  
  if (statusFilter.value) {
    downloads = downloads.filter(download => download.status === statusFilter.value)
  }
  
  return downloads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const paginatedDownloads = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredDownloads.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredDownloads.value.length / itemsPerPage))

const totalDownloads = computed(() => downloadStore.downloadHistory.length)
const completedDownloads = computed(() => downloadStore.downloadHistory.filter(d => d.status === 'completed').length)
const failedDownloads = computed(() => downloadStore.downloadHistory.filter(d => d.status === 'failed').length)
const totalSize = computed(() => {
  const totalBytes = downloadStore.downloadHistory
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + d.fileSize, 0)
  return formatFileSize(totalBytes)
})

const deleteDownload = (id: string) => {
  // TODO: Implement delete functionality
  toast.info('Delete functionality coming soon')
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(() => {
  downloadStore.loadHistory()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
