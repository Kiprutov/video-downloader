<template>
  <div class="space-y-4">
    <!-- Progress Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
          <!-- Clock Icon -->
          <svg v-if="statusIcon === 'clock'" class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <!-- Download Icon -->
          <svg v-else-if="statusIcon === 'download'" class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <!-- Cog Icon -->
          <svg v-else-if="statusIcon === 'cog'" class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <!-- Check Icon -->
          <svg v-else-if="statusIcon === 'check'" class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <!-- X Icon -->
          <svg v-else-if="statusIcon === 'x'" class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-medium text-gray-900">{{ statusText }}</h3>
          <p class="text-sm text-gray-600">{{ progressDescription }}</p>
        </div>
      </div>
      
      <button
        v-if="canCancel"
        @click="$emit('cancel')"
        class="btn-secondary text-sm px-4 py-2"
      >
        Cancel
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="space-y-2">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">{{ progressDescription }}</span>
        <span class="text-gray-900 font-medium">{{ progress.progress }}%</span>
      </div>
      
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${progress.progress}%` }"
        ></div>
      </div>
    </div>

    <!-- Download Stats -->
    <div v-if="showStats" class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ progress.progress }}%</div>
        <div class="text-sm text-gray-600">Complete</div>
      </div>
      
      <div v-if="progress.speed" class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ progress.speed }}</div>
        <div class="text-sm text-gray-600">Download Speed</div>
      </div>
      
      <div v-if="progress.eta" class="text-center">
        <div class="text-2xl font-bold text-gray-900">{{ progress.eta }}</div>
        <div class="text-sm text-gray-600">Time Remaining</div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="progress.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <svg class="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
        <div>
          <h4 class="text-sm font-medium text-red-800">Download Failed</h4>
          <p class="text-sm text-red-700 mt-1">{{ progress.error }}</p>
        </div>
      </div>
    </div>

    <!-- Success Message -->
    <div v-if="progress.status === 'completed'" class="bg-green-50 border border-green-200 rounded-lg p-4">
      <div class="flex items-start space-x-3">
        <svg class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-green-800">Download Complete!</h4>
          <p class="text-sm text-green-700 mt-1">Your video has been downloaded successfully.</p>
          <div v-if="progress.downloadUrl && progress.filename" class="mt-3">
            <button
              @click="downloadFile(progress.downloadUrl, progress.filename)"
              class="btn-primary text-sm px-4 py-2"
            >
              <svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download File
            </button>
            <p class="text-xs text-green-600 mt-1">
              File: {{ progress.filename }} ({{ formatFileSize(progress.filesize || 0) }})
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDownloadStore } from '@/stores/download';
import type { DownloadProgress } from '@/types';
import { computed } from 'vue';

interface Props {
  progress: DownloadProgress
}

interface Emits {
  (e: 'cancel'): void
}

const props = defineProps<Props>()
defineEmits<Emits>()

const statusText = computed(() => {
  switch (props.progress.status) {
    case 'pending':
      return 'Preparing Download'
    case 'downloading':
      return 'Downloading Video'
    case 'converting':
      return 'Converting Format'
    case 'completed':
      return 'Download Complete'
    case 'failed':
      return 'Download Failed'
    default:
      return 'Processing'
  }
})

const progressDescription = computed(() => {
  switch (props.progress.status) {
    case 'pending':
      return 'Initializing download...'
    case 'downloading':
      return 'Downloading video file...'
    case 'converting':
      return 'Converting to selected format...'
    case 'completed':
      return 'Download completed successfully!'
    case 'failed':
      return 'Download failed'
    default:
      return 'Processing...'
  }
})

const canCancel = computed(() => {
  return ['pending', 'downloading', 'converting'].includes(props.progress.status)
})

const showStats = computed(() => {
  return ['downloading', 'converting'].includes(props.progress.status)
})

const statusIcon = computed(() => {
  switch (props.progress.status) {
    case 'pending':
      return 'clock'
    case 'downloading':
      return 'download'
    case 'converting':
      return 'cog'
    case 'completed':
      return 'check'
    case 'failed':
      return 'x'
    default:
      return 'clock'
  }
})

const downloadStore = useDownloadStore();

const downloadFile = (downloadUrl: string, filename: string) => {
  downloadStore.downloadFile(downloadUrl, filename);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
</script>
