// Fallback Video Download APIs
const axios = require('axios');

class FallbackVideoAPIs {
  constructor() {
    this.apis = [
      {
        name: 'youtube-dl',
        priority: 1,
        method: 'youtube-dl'
      },
      {
        name: 'invidious',
        priority: 2,
        method: 'invidious',
        instances: [
          'https://invidious.io',
          'https://invidious.flokinet.to',
          'https://invidious.nerdvpn.de'
        ]
      },
      {
        name: 'piped',
        priority: 3,
        method: 'piped',
        instances: [
          'https://pipedapi.kavin.rocks',
          'https://api-piped.mha.fi',
          'https://pipedapi.tux.pizza'
        ]
      },
      {
        name: 'vevioz',
        priority: 4,
        method: 'vevioz',
        baseUrl: 'https://api.vevioz.com'
      }
    ];
  }

  async getVideoInfo(videoId, url) {
    for (const api of this.apis.sort((a, b) => a.priority - b.priority)) {
      try {
        console.log(`🔄 Trying ${api.name}...`);
        const result = await this.tryAPI(api, videoId, url);
        if (result.success) {
          console.log(`✅ Success with ${api.name}`);
          return result;
        }
      } catch (error) {
        console.log(`❌ ${api.name} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All fallback APIs failed');
  }

  async tryAPI(api, videoId, url) {
    switch (api.method) {
      case 'youtube-dl':
        return await this.tryYouTubeDL(url);
      case 'invidious':
        return await this.tryInvidious(api.instances, videoId);
      case 'piped':
        return await this.tryPiped(api.instances, videoId);
      case 'vevioz':
        return await this.tryVevioz(api.baseUrl, videoId);
      default:
        throw new Error(`Unknown API method: ${api.method}`);
    }
  }

  async tryYouTubeDL(url) {
    const { exec } = require('child_process-promise');
    const command = `youtube-dl -j "${url}"`;
    const { stdout } = await exec(command);
    const data = JSON.parse(stdout);
    
    return {
      success: true,
      data: {
        title: data.title,
        duration: data.duration,
        thumbnail: data.thumbnail,
        formats: data.formats
      }
    };
  }

  async tryInvidious(instances, videoId) {
    for (const instance of instances) {
      try {
        const response = await axios.get(`${instance}/api/v1/videos/${videoId}`, {
          timeout: 10000
        });
        
        const data = response.data;
        return {
          success: true,
          data: {
            title: data.title,
            duration: data.lengthSeconds,
            thumbnail: data.videoThumbnails?.[0]?.url,
            formats: data.adaptiveFormats || data.formatStreams
          }
        };
      } catch (error) {
        continue;
      }
    }
    throw new Error('All Invidious instances failed');
  }

  async tryPiped(instances, videoId) {
    for (const instance of instances) {
      try {
        const response = await axios.get(`${instance}/streams/${videoId}`, {
          timeout: 10000
        });
        
        const data = response.data;
        return {
          success: true,
          data: {
            title: data.title,
            duration: data.duration,
            thumbnail: data.thumbnailUrl,
            formats: data.videoStreams || data.audioStreams
          }
        };
      } catch (error) {
        continue;
      }
    }
    throw new Error('All Piped instances failed');
  }

  async tryVevioz(baseUrl, videoId) {
    try {
      const response = await axios.get(`${baseUrl}/api/button/mp4/${videoId}`, {
        timeout: 10000
      });
      
      const data = response.data;
      return {
        success: true,
        data: {
          title: data.title,
          duration: data.duration,
          thumbnail: data.thumbnail,
          downloadUrl: data.url
        }
      };
    } catch (error) {
      throw new Error('Vevioz API failed');
    }
  }

  // Extract video ID from various YouTube URL formats
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    throw new Error('Invalid YouTube URL');
  }
}

module.exports = FallbackVideoAPIs;
