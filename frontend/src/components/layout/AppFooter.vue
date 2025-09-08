<template>
  <footer class="bg-white border-t border-gray-200 mt-16">
    <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="col-span-1 md:col-span-2">
          <div class="flex items-center space-x-2 mb-4">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
              </svg>
            </div>
            <span class="text-xl font-bold text-gray-900">Video Downloader</span>
          </div>
          <p class="text-gray-600 text-sm max-w-md">
            A secure, fast, and reliable video downloader for personal use. 
            Download videos from YouTube, TikTok, Facebook and more with ease.
          </p>
        </div>
        
        <!-- Quick Links -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Quick Links
          </h3>
          <ul class="space-y-2">
            <li>
              <RouterLink to="/" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Home
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/download" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Download
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/history" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                History
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/settings" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Settings
              </RouterLink>
            </li>
          </ul>
        </div>
        
        <!-- Support -->
        <div>
          <h3 class="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
            Support
          </h3>
          <ul class="space-y-2">
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="#" class="text-gray-600 hover:text-gray-900 text-sm transition-colors">
                Contact Us
              </a>
            </li>
          </ul>
        </div>
      </div>
      
      <!-- Bottom Bar -->
      <div class="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
        <p class="text-gray-500 text-sm">
          © {{ currentYear }} Video Downloader. All rights reserved.
        </p>
        <div class="flex items-center space-x-4 mt-4 md:mt-0">
          <span class="text-gray-500 text-sm">Built with</span>
          <div class="flex items-center space-x-2">
            <span class="text-red-500">❤️</span>
            <span class="text-gray-500 text-sm">Vue.js & Tailwind CSS</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const currentYear = computed(() => new Date().getFullYear())
</script>
