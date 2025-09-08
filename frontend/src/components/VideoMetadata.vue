<template>
  <div class="space-y-6">
    <!-- Video Info -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Thumbnail -->
      <div class="flex-shrink-0">
        <img 
          :src="metadata.thumbnail || '/placeholder-video.jpg'" 
          :alt="metadata.title"
          class="w-full md:w-64 h-36 object-cover rounded-lg shadow-sm"
        />
      </div>
      
      <!-- Video Details -->
      <div class="flex-1 min-w-0">
        <h3 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
          {{ metadata.title }}
        </h3>
        
        <div class="space-y-2 text-sm text-gray-600">
          <div v-if="metadata.uploader" class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {{ metadata.uploader }}
          </div>
          
          <div v-if="metadata.duration" class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ formatDuration(metadata.duration) }}
          </div>
          
          <div v-if="metadata.upload_date" class="flex items-center">
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {{ formatDate(metadata.upload_date) }}
          </div>
        </div>
        
        <p v-if="metadata.description" class="mt-3 text-sm text-gray-600 line-clamp-3">
          {{ metadata.description }}
        </p>
      </div>
    </div>

    <!-- Format Selection -->
    <div>
      <h4 class="text-lg font-medium text-gray-900 mb-4">Choose Download Format</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="format in availableFormats" 
          :key="format.format_id"
          class="border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md"
          :class="selectedFormat === format.format_id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'"
          @click="selectFormat(format.format_id)"
        >
          <div class="flex items-center justify-between mb-2">
            <h5 class="font-medium text-gray-900">{{ format.format }}</h5>
            <div v-if="selectedFormat === format.format_id" class="w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
          
          <div class="space-y-1 text-sm text-gray-600">
            <div v-if="format.resolution" class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3m0 0h8m-8 0v16a1 1 0 001 1h6a1 1 0 001-1V4" />
              </svg>
              {{ format.resolution }}
            </div>
            
            <div v-if="format.fps" class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {{ format.fps }}fps
            </div>
            
            <div v-if="format.filesize" class="flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              {{ formatFileSize(format.filesize) }}
            </div>
            
            <div v-if="format.vcodec" class="flex items-center">
              <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {{ format.vcodec }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Download Options -->
    <div class="pt-4 border-t border-gray-200" data-download-method>
      <h4 class="text-lg font-medium text-gray-900 mb-4">Choose Download Method</h4>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Direct Download (Recommended) -->
        <div class="border-2 border-green-200 rounded-lg p-4 hover:border-green-300 transition-colors bg-green-50">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h5 class="text-lg font-medium text-gray-900">Direct Download ⚡</h5>
              <p class="text-sm text-gray-600 mt-1">Fastest method - browser handles download directly</p>
              <div class="mt-2 text-xs text-green-600 font-medium">Recommended</div>
              <button
                @click="handleDirectDownload"
                :disabled="!selectedFormat || isDownloading"
                class="mt-3 btn-primary px-6 py-2 text-sm flex items-center space-x-2"
                :class="{ 
                  'opacity-50 cursor-not-allowed': !selectedFormat || isDownloading,
                  'animate-pulse': isDownloading
                }"
              >
                <svg v-if="!isDownloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{{ isDownloading ? 'Downloading...' : 'Download Direct' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Streaming Download -->
        <div class="border-2 border-blue-200 rounded-lg p-4 hover:border-blue-300 transition-colors bg-blue-50">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h5 class="text-lg font-medium text-gray-900">Streaming Download</h5>
              <p class="text-sm text-gray-600 mt-1">Streams file as it downloads with real progress</p>
              <button
                @click="handleStreamingDownload"
                :disabled="!selectedFormat || isDownloading"
                class="mt-3 btn-primary px-6 py-2 text-sm flex items-center space-x-2"
                :class="{ 
                  'opacity-50 cursor-not-allowed': !selectedFormat || isDownloading,
                  'animate-pulse': isDownloading
                }"
              >
                <svg v-if="!isDownloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{{ isDownloading ? 'Streaming...' : 'Stream Download' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Legacy Download -->
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h5 class="text-lg font-medium text-gray-900">Server Download 📊</h5>
              <p class="text-sm text-gray-600 mt-1">Server processes with real-time progress tracking</p>
              <div class="mt-2 text-xs text-blue-600 font-medium">Shows progress</div>
              <button
                @click="handleLegacyDownload"
                :disabled="!selectedFormat || isDownloading"
                class="mt-3 btn-primary px-6 py-2 text-sm flex items-center space-x-2"
                :class="{ 
                  'opacity-50 cursor-not-allowed': !selectedFormat || isDownloading,
                  'animate-pulse': isDownloading
                }"
              >
                <svg v-if="!isDownloading" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{{ isDownloading ? 'Processing...' : 'Download with Progress' }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Cloud Download -->
        <div class="border-2 border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <h5 class="text-lg font-medium text-gray-900">Save to Cloud</h5>
              <p class="text-sm text-gray-600 mt-1">Save to your cloud storage and access from anywhere.</p>
              <button
                @click="handleCloudDownload"
                :disabled="!selectedFormat"
                class="mt-3 btn-secondary px-6 py-2 text-sm flex items-center space-x-2"
                :class="{ 'opacity-50 cursor-not-allowed': !selectedFormat }"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                <span>Save to Cloud</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDownloadStore } from '@/stores/download'
import type { VideoMetadata } from '@/types'
import { computed, ref } from 'vue'

interface Props {
  metadata: VideoMetadata
}

interface Emits {
  (e: 'format-selected', format: string): void
  (e: 'local-download', format: string): void
  (e: 'cloud-download', format: string): void
  (e: 'direct-download', format: string): void
  (e: 'streaming-download', format: string): void
  (e: 'legacy-download', format: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const downloadStore = useDownloadStore()
const selectedFormat = ref('')

const isDownloading = computed(() => downloadStore.isDownloading)

const availableFormats = computed(() => {
  // Sort formats by quality (highest first)
  return [...props.metadata.formats].sort((a, b) => {
    const qualityA = a.quality || 0
    const qualityB = b.quality || 0
    return qualityB - qualityA
  })
})

// Removed unused computed property

const selectFormat = (formatId: string) => {
  selectedFormat.value = formatId
  emit('format-selected', formatId)
}

const handleLocalDownload = () => {
  if (selectedFormat.value) {
    emit('local-download', selectedFormat.value)
  }
}

const handleCloudDownload = () => {
  if (selectedFormat.value) {
    emit('cloud-download', selectedFormat.value)
  }
}

const handleDirectDownload = () => {
  if (selectedFormat.value) {
    emit('direct-download', selectedFormat.value)
  }
}

const handleStreamingDownload = () => {
  if (selectedFormat.value) {
    emit('streaming-download', selectedFormat.value)
  }
}

const handleLegacyDownload = () => {
  if (selectedFormat.value) {
    emit('legacy-download', selectedFormat.value)
  }
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
