import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { VideoMetadata, DownloadRequest, DownloadProgress, DownloadHistory } from '@/types'

export const useDownloadStore = defineStore('download', () => {
  const metadata = ref<VideoMetadata | null>(null)
  const currentDownload = ref<DownloadProgress | null>(null)
  const downloadHistory = ref<DownloadHistory[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isDownloading = computed(() => 
    currentDownload.value?.status === 'downloading' || 
    currentDownload.value?.status === 'converting'
  )

  const fetchMetadata = async (url: string) => {
    loading.value = true
    error.value = null
    
    try {
      // TODO: Implement API call to fetch metadata
      // For now, simulate metadata fetch
      const mockMetadata: VideoMetadata = {
        id: 'mock-id',
        title: 'Sample Video Title',
        description: 'This is a sample video description',
        duration: 180,
        thumbnail: 'https://via.placeholder.com/320x180',
        uploader: 'Sample Channel',
        upload_date: '2024-01-01',
        formats: [
          {
            format_id: 'best',
            format: 'best - 1080p',
            ext: 'mp4',
            resolution: '1920x1080',
            fps: 30,
            vcodec: 'avc1',
            acodec: 'mp4a',
            filesize: 50000000,
            quality: 1080
          },
          {
            format_id: '720p',
            format: '720p - mp4',
            ext: 'mp4',
            resolution: '1280x720',
            fps: 30,
            vcodec: 'avc1',
            acodec: 'mp4a',
            filesize: 30000000,
            quality: 720
          },
          {
            format_id: 'audio',
            format: 'audio only - mp3',
            ext: 'mp3',
            acodec: 'mp3',
            filesize: 5000000,
            abr: 128
          }
        ]
      }
      
      metadata.value = mockMetadata
      return { success: true, data: mockMetadata }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch metadata'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  const startDownload = async (request: DownloadRequest) => {
    if (!metadata.value) {
      error.value = 'No metadata available'
      return { success: false, error: error.value }
    }

    const downloadId = `download-${Date.now()}`
    currentDownload.value = {
      id: downloadId,
      status: 'pending',
      progress: 0
    }

    try {
      // TODO: Implement actual download API call
      // For now, simulate download progress
      currentDownload.value.status = 'downloading'
      
      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        if (currentDownload.value) {
          currentDownload.value.progress = i
          currentDownload.value.speed = `${Math.random() * 5 + 1} MB/s`
          currentDownload.value.eta = `${Math.floor((100 - i) / 10)}s`
        }
      }

      currentDownload.value.status = 'converting'
      await new Promise(resolve => setTimeout(resolve, 1000))

      currentDownload.value.status = 'completed'
      
      // Add to history
      const historyItem: DownloadHistory = {
        id: downloadId,
        url: request.url,
        title: metadata.value.title,
        format: request.format,
        quality: request.quality || 'auto',
        fileSize: Math.floor(Math.random() * 100000000),
        downloadUrl: `https://example.com/downloads/${downloadId}.mp4`,
        createdAt: new Date(),
        completedAt: new Date(),
        status: 'completed'
      }
      
      downloadHistory.value.unshift(historyItem)
      
      return { success: true, data: historyItem }
    } catch (err) {
      if (currentDownload.value) {
        currentDownload.value.status = 'failed'
        currentDownload.value.error = err instanceof Error ? err.message : 'Download failed'
      }
      error.value = err instanceof Error ? err.message : 'Download failed'
      return { success: false, error: error.value }
    }
  }

  const cancelDownload = () => {
    if (currentDownload.value) {
      currentDownload.value.status = 'failed'
      currentDownload.value.error = 'Download cancelled by user'
    }
  }

  const clearError = () => {
    error.value = null
  }

  const clearMetadata = () => {
    metadata.value = null
  }

  const loadHistory = async () => {
    try {
      // TODO: Implement API call to load history
      // For now, load from localStorage
      const saved = localStorage.getItem('downloadHistory')
      if (saved) {
        downloadHistory.value = JSON.parse(saved)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load history'
    }
  }

  const saveHistory = () => {
    try {
      localStorage.setItem('downloadHistory', JSON.stringify(downloadHistory.value))
    } catch (err) {
      console.error('Failed to save history:', err)
    }
  }

  return {
    metadata,
    currentDownload,
    downloadHistory,
    loading,
    error,
    isDownloading,
    fetchMetadata,
    startDownload,
    cancelDownload,
    clearError,
    clearMetadata,
    loadHistory,
    saveHistory
  }
})
