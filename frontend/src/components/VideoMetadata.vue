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

    <!-- Download Button -->
    <div class="flex justify-end pt-4 border-t border-gray-200">
      <button
        @click="handleDownload"
        :disabled="!selectedFormat"
        class="btn-primary px-8 py-3 text-lg flex items-center space-x-2"
        :class="{ 'opacity-50 cursor-not-allowed': !selectedFormat }"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>Download {{ selectedFormatName }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { VideoMetadata, VideoFormat } from '@/types'

interface Props {
  metadata: VideoMetadata
}

interface Emits {
  (e: 'format-selected', format: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedFormat = ref('')

const availableFormats = computed(() => {
  // Sort formats by quality (highest first)
  return [...props.metadata.formats].sort((a, b) => {
    const qualityA = a.quality || 0
    const qualityB = b.quality || 0
    return qualityB - qualityA
  })
})

const selectedFormatName = computed(() => {
  const format = props.metadata.formats.find(f => f.format_id === selectedFormat.value)
  return format?.format || 'Selected Format'
})

const selectFormat = (formatId: string) => {
  selectedFormat.value = formatId
}

const handleDownload = () => {
  if (selectedFormat.value) {
    emit('format-selected', selectedFormat.value)
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
