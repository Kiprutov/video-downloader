<template>
  <div class="max-w-4xl mx-auto space-y-8">
    <!-- Page Header -->
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-4">Download Videos & MP3s</h1>
      <p class="text-lg text-gray-600">
        Enter a video URL to get started with your download
      </p>
    </div>

    <!-- URL Input Section -->
    <div class="card">
      <div class="card-header">
        <h2 class="text-xl font-semibold text-gray-900">Video URL</h2>
        <p class="text-gray-600 mt-1">Paste the URL of the video you want to download</p>
      </div>
      
      <UrlInput 
        v-model="videoUrl"
        @submit="handleUrlSubmit"
        :loading="downloadStore.loading"
        :error="downloadStore.error"
      />
    </div>

    <!-- Metadata Display -->
    <div v-if="downloadStore.metadata" ref="videoInfoSection" class="card animate-fade-in">
      <div class="card-header">
        <h2 class="text-xl font-semibold text-gray-900">Video Information</h2>
      </div>
      
      <VideoMetadata 
        ref="videoMetadataComponent"
        :metadata="downloadStore.metadata"
        @local-download="handleLocalDownload"
        @cloud-download="handleCloudDownload"
        @direct-download="handleDirectDownload"
        @streaming-download="handleStreamingDownload"
        @legacy-download="handleLegacyDownload"
        @format-selected="handleFormatSelected"
      />
    </div>

    <!-- Download Progress -->
    <div v-if="downloadStore.currentDownload" class="card animate-fade-in">
      <div class="card-header">
        <h2 class="text-xl font-semibold text-gray-900">Download Progress</h2>
      </div>
      
      <DownloadProgress 
        :progress="downloadStore.currentDownload"
        @cancel="handleCancelDownload"
      />
    </div>

    <!-- Download History Preview -->
    <div v-if="downloadStore.downloadHistory.length > 0" class="card">
      <div class="card-header">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold text-gray-900">Recent Downloads</h2>
          <RouterLink 
            to="/history" 
            class="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </RouterLink>
        </div>
      </div>
      
      <div class="space-y-3">
        <div 
          v-for="item in recentDownloads" 
          :key="item.id"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-medium text-gray-900 truncate">
              {{ item.title }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ item.format }} • {{ formatFileSize(item.fileSize) }} • 
              {{ formatDate(item.createdAt) }}
            </p>
          </div>
          <div class="flex items-center space-x-2 ml-4">
            <span 
              class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
              :class="item.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ item.status }}
            </span>
            <a 
              v-if="item.status === 'completed'"
              :href="item.downloadUrl"
              class="text-primary-600 hover:text-primary-700 text-sm font-medium"
              download
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Tips -->
    <div class="card bg-blue-50 border-blue-200">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
          </svg>
        </div>
        <div>
          <h3 class="text-sm font-medium text-blue-900">Quick Tips</h3>
          <div class="mt-2 text-sm text-blue-700">
            <ul class="list-disc list-inside space-y-1">
              <li>Supported platforms: YouTube, TikTok, Facebook, Instagram</li>
              <li>Choose the quality that best fits your needs</li>
              <li>Audio-only downloads are available for most videos</li>
              <li>Downloads are stored securely and can be accessed anytime</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DownloadProgress from '@/components/DownloadProgress.vue'
import UrlInput from '@/components/UrlInput.vue'
import VideoMetadata from '@/components/VideoMetadata.vue'
import { useAuthStore } from '@/stores/auth'
import { useDownloadStore } from '@/stores/download'
import type { DownloadRequest } from '@/types'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const downloadStore = useDownloadStore()
const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const videoUrl = ref('')
const selectedFormat = ref('')
const videoInfoSection = ref<HTMLElement>()
const videoMetadataComponent = ref<InstanceType<typeof VideoMetadata>>()

const recentDownloads = computed(() => 
  downloadStore.downloadHistory.slice(0, 3)
)

const scrollToVideoInfo = async () => {
  await nextTick()
  if (videoInfoSection.value) {
    const elementTop = videoInfoSection.value.offsetTop
    const offset = 100 // Offset from top of viewport
    window.scrollTo({
      top: elementTop - offset,
      behavior: 'smooth'
    })
  }
}

const scrollToDownloadMethod = async () => {
  await nextTick()
  if (videoMetadataComponent.value) {
    // Find the download method section within the VideoMetadata component
    const downloadMethodSection = videoMetadataComponent.value.$el.querySelector('[data-download-method]')
    if (downloadMethodSection) {
      const elementTop = downloadMethodSection.offsetTop
      const offset = 100 // Offset from top of viewport
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      })
    }
  }
}

const handleUrlSubmit = async (url: string) => {
  videoUrl.value = url
  const result = await downloadStore.fetchMetadata(url)
  
  if (result.success) {
    toast.success('Video metadata loaded successfully!')
    // Scroll to video information section
    await scrollToVideoInfo()
  } else {
    toast.error(result.error || 'Failed to load video metadata')
  }
}

const handleFormatSelected = async () => {
  // Scroll to download method section when format is selected
  await scrollToDownloadMethod()
}

const handleLocalDownload = async (format: string) => {
  selectedFormat.value = format
  
  if (!videoUrl.value) {
    toast.error('No video URL provided')
    return
  }

  const request: DownloadRequest = {
    url: videoUrl.value,
    format: format,
    type: 'local'
  }

  const result = await downloadStore.startDownload(request)
  
  if (result.success) {
    toast.success('Download started successfully!')
  } else {
    toast.error(result.error || 'Failed to start download')
  }
}

const handleCloudDownload = async (format: string) => {
  selectedFormat.value = format
  
  if (!videoUrl.value) {
    toast.error('No video URL provided')
    return
  }

  // Check if user is authenticated for cloud download
  if (!authStore.isAuthenticated) {
    toast.error('Please sign in to save downloads to cloud storage')
    router.push('/login')
    return
  }

  const request: DownloadRequest = {
    url: videoUrl.value,
    format: format,
    type: 'cloud'
  }

  const result = await downloadStore.startDownload(request)
  
  if (result.success) {
    toast.success('Cloud download started successfully!')
  } else {
    toast.error(result.error || 'Failed to start cloud download')
  }
}

const handleCancelDownload = () => {
  downloadStore.cancelDownload()
  toast.info('Download cancelled')
}

const handleDirectDownload = async (format: string) => {
  selectedFormat.value = format
  
  if (!videoUrl.value) {
    toast.error('No video URL provided')
    return
  }

  const request: DownloadRequest = {
    url: videoUrl.value,
    format: format,
    type: 'local'
  }

  const result = await downloadStore.startDirectDownload(request)
  
  if (result.success) {
    toast.success('Direct download started!')
  } else {
    toast.error(result.error || 'Failed to start direct download')
  }
}

const handleStreamingDownload = async (format: string) => {
  selectedFormat.value = format
  
  if (!videoUrl.value) {
    toast.error('No video URL provided')
    return
  }

  const request: DownloadRequest = {
    url: videoUrl.value,
    format: format,
    type: 'local'
  }

  const result = await downloadStore.startStreamingDownload(request)
  
  if (result.success) {
    toast.success('Streaming download started!')
  } else {
    toast.error(result.error || 'Failed to start streaming download')
  }
}

const handleLegacyDownload = async (format: string) => {
  selectedFormat.value = format
  
  if (!videoUrl.value) {
    toast.error('No video URL provided')
    return
  }

  const request: DownloadRequest = {
    url: videoUrl.value,
    format: format,
    type: 'local'
  }

  const result = await downloadStore.startServerDownloadWithProgress(request)
  
  if (result.success) {
    toast.success('Server download started with progress tracking!')
  } else {
    toast.error(result.error || 'Failed to start server download')
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

onMounted(() => {
  downloadStore.loadHistory()
})
</script>
