<template>
  <div class="space-y-12">
    <!-- Hero Section -->
    <section class="text-center">
      <div class="max-w-3xl mx-auto">
        <h1 class="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Download Videos
          <span class="text-gradient">Securely & Fast</span>
        </h1>
        <p class="text-xl text-gray-600 mb-8 leading-relaxed">
          A modern, secure video downloader for personal use. Download from YouTube, 
          TikTok, Facebook and more with our business-grade infrastructure.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink 
            to="/download" 
            class="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Start Downloading
          </RouterLink>
          <button 
            @click="scrollToFeatures"
            class="btn-secondary text-lg px-8 py-3 inline-flex items-center justify-center"
          >
            Learn More
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-16">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Downloader?</h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          Built with modern technology and security-first principles for the best user experience.
        </p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard
          icon="shield"
          title="Secure & Private"
          description="Your data is protected with enterprise-grade security. No ads, no malware, no tracking."
        />
        <FeatureCard
          icon="lightning"
          title="Lightning Fast"
          description="Optimized infrastructure ensures fast downloads with real-time progress tracking."
        />
        <FeatureCard
          icon="cloud"
          title="Cloud-Powered"
          description="Built on Oracle Cloud with Firebase and Cloudflare for maximum reliability."
        />
      </div>
    </section>

    <!-- Supported Platforms -->
    <section class="py-16 bg-white rounded-2xl shadow-soft">
      <div class="text-center mb-12">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Supported Platforms</h2>
        <p class="text-lg text-gray-600">
          Download from all major video platforms
        </p>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <PlatformCard
          name="YouTube"
          icon="youtube"
          supported="true"
          max-quality="4K"
        />
        <PlatformCard
          name="TikTok"
          icon="tiktok"
          supported="true"
          max-quality="1080p"
        />
        <PlatformCard
          name="Facebook"
          icon="facebook"
          supported="true"
          max-quality="1080p"
        />
        <PlatformCard
          name="Instagram"
          icon="instagram"
          supported="true"
          max-quality="1080p"
        />
      </div>
    </section>

    <!-- CTA Section -->
    <section class="text-center py-16 bg-primary-50 rounded-2xl">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
        <p class="text-lg text-gray-600 mb-8">
          Join thousands of users who trust our secure video downloader for their personal needs.
        </p>
        <RouterLink 
          to="/download" 
          class="btn-primary text-lg px-8 py-3 inline-flex items-center justify-center"
        >
          Start Downloading Now
          <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import FeatureCard from '@/components/FeatureCard.vue'
import PlatformCard from '@/components/PlatformCard.vue'

const scrollToFeatures = () => {
  const featuresSection = document.getElementById('features')
  if (featuresSection) {
    featuresSection.scrollIntoView({ behavior: 'smooth' })
  }
}

onMounted(() => {
  // Any initialization logic
})
</script>
