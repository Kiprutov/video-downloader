# Product Requirements Document (PRD): Secure Video Downloader/Converter (Oracle Cloud, Cursor-Optimized)

## 1. Overview
### 1.1 Purpose
Build a secure, personal-use video downloader/converter to replace unsafe tools like y2mate.com. Users input video URLs (YouTube, TikTok, Facebook), fetch metadata, download videos/audio (MP4, MP3), and convert files. The backend runs on Oracle Cloud Free Tier (ARM VM), with Vue.js on Firebase Hosting, Firebase Storage/Firestore for files/history, and Cloudflare Workers for API proxying. Designed for Cursor (AI-powered code editor) to simplify development, leveraging JavaScript expertise (Vue.js, Node.js, Firebase, Cloudflare). AI agents (e.g., Grok) enhance automation and user experience.

### 1.2 Goals
- **Security**: No ads/malware; use Oracle Cloud, Cloudflare WAF/HTTPS, Firebase Auth.
- **Cost**: Free tiers: Oracle Cloud (4 OCPUs, 24GB RAM, 200GB storage), Firebase (Hosting, 1GB Storage/Firestore), Cloudflare Workers (100,000 requests/day).
- **Usability**: Simple Vue.js UI; optional CLI on Oracle VM.
- **AI Integration**: Use AI agents (Grok) for format suggestions, error handling; leverage Cursor’s AI for coding.
- **Performance**: Fast downloads/conversions with progress feedback.
- **Privacy**: User-controlled infrastructure; no third-party dependencies.
- **Legal**: Personal use, respecting platform copyrights.
- **Cursor-Friendly**: Minimal setup, with Cursor prompts for code generation, debugging, deployment.

### 1.3 Target Audience
- Primary user: JavaScript programmer in East Africa (04:46 PM EAT, Sep 7, 2025), skilled in Vue.js, Node.js, Firebase, Cloudflare, using Cursor for development.
- Use case: Personal video downloading/converting.
- Context: Oracle Cloud Free Tier account registered; no local host.

## 2. Functional Requirements
### 2.1 Core Features
- **URL Input/Validation**:
  - Input URLs via Vue.js UI (Firebase Hosting).
  - Validate URLs (YouTube, TikTok, Facebook).
  - **AI Agent Role**: Suggest URL corrections (e.g., “Fix youtube.com typo”).
  - **Cursor Prompt**: “Generate Vue.js component for URL input with validation.”
- **Metadata Fetching**:
  - Fetch metadata (title, formats like 720p MP4, 128kbps MP3) using yt-dlp on Oracle VM.
  - Display formats in UI.
  - **AI Agent Role**: Recommend formats (e.g., “720p for low storage”).
  - **Cursor Prompt**: “Create Node.js endpoint to fetch video metadata with yt-dlp.”
- **Download/Conversion**:
  - Download videos/audio with yt-dlp; convert (e.g., MP4 to MP3) with FFmpeg.
  - Save to Firebase Storage or Oracle VM disk.
  - **AI Agent Role**: Optimize format/conversion settings.
  - **Cursor Prompt**: “Generate Node.js endpoint for downloading/converting videos.”
- **History Tracking**:
  - Log downloads (URL, format, timestamp) in Firestore.
  - Show history in UI.
  - **AI Agent Role**: Summarize history.
  - **Cursor Prompt**: “Add Firestore integration to log downloads.”
- **Progress Feedback**:
  - Show progress in UI (polling).
  - **AI Agent Role**: Generate status updates (e.g., “Download 50% done”).
  - **Cursor Prompt**: “Create Vue.js progress bar component.”

### 2.2 Optional Features
- **Playlists**: Download multiple URLs.
  - **AI Agent Role**: Prioritize downloads.
  - **Cursor Prompt**: “Add playlist support to Node.js download endpoint.”
- **CLI Mode**: Node.js CLI on Oracle VM.
  - **Cursor Prompt**: “Generate CLI script for downloading videos.”

### 2.3 Non-Functional Requirements
- **Security**: Sanitize inputs (`validator.js`), Firebase Auth, Cloudflare WAF/HTTPS.
- **Cost**: Free (Oracle, Firebase, Cloudflare free tiers).
- **Performance**: Handle 720p videos in <5 min; low-latency metadata via Cloudflare.
- **Usability**: Simple Vue.js UI (Pinia, Vue Router).
- **Scalability**: Single-user; extensible.
- **Reliability**: AI-driven error handling (e.g., retry rate-limited downloads).
- **Cursor Optimization**: Code, test, deploy with Cursor’s AI autocompletion and prompts.

## 3. System Architecture
### 3.1 Overview
- **Frontend**: Vue.js 3 SPA on Firebase Hosting.
- **Backend**:
  - Cloudflare Workers: Validate URLs, proxy metadata/downloads.
  - Node.js: Run yt-dlp/FFmpeg on Oracle Cloud VM (Ubuntu 22.04, 1-4 OCPUs, 6-24GB RAM).
- **Storage**: Firebase Storage (cloud), Oracle VM disk (temporary).
- **Database**: Firestore for history.
- **Tools**: yt-dlp (downloads), FFmpeg (conversions).
- **Security**: Cloudflare WAF/HTTPS, Firebase Auth.

### 3.2 Data Flow
1. User inputs URL in Vue.js UI.
2. UI calls Cloudflare Workers.
3. Workers validate and proxy to Node.js on Oracle VM.
4. Node.js uses yt-dlp for metadata; Workers return to UI.
5. User selects format; UI sends download request to Workers.
6. Workers trigger Node.js to download (yt-dlp), convert (FFmpeg), save to Firebase Storage/VM disk.
7. Firestore logs action; UI shows download link.
8. **AI Agent Role**: Optimize tasks, provide feedback.

### 3.3 Tech Stack
- **Frontend**: Vue.js 3, Vue Router, Pinia, Axios, vue-progressbar (Firebase Hosting).
- **Backend**:
  - Cloudflare Workers: JavaScript, `itty-router`, `validator.js`.
  - Node.js: Express.js, `child-process-promise`, `firebase-admin`, `cors`, `helmet` (Oracle VM).
- **Tools**: yt-dlp, FFmpeg (Oracle VM).
- **Storage**: Firebase Storage, Oracle VM disk.
- **Database**: Firestore.
- **Security**: Cloudflare WAF/HTTPS, Firebase Auth.
- **AI Agents**: Grok (https://x.ai/api) for automation.

## 4. AI Agent Integration
AI agents (Grok) enhance functionality; Cursor’s AI assists development.

### 4.1 AI Agent Roles
- **Development (Cursor)**:
  - Generate code: “Create Vue.js URL input component.”
  - Debug: “Fix Node.js endpoint error for invalid URLs.”
  - Test: “Test /metadata endpoint with YouTube URL.”
- **Runtime (Grok)**:
  - Validate URLs: Suggest corrections.
  - Optimize formats: Recommend based on metadata.
  - Error handling: Retry failures, suggest alternatives.
  - Feedback: “Download 70% complete.”
- **Deployment**:
  - Automate: “Run `firebase deploy`.”
  - Monitor: “Check Oracle VM CPU usage.”

### 4.2 AI Agent Implementation
- **Grok API**: Call from Node.js: `axios.post('https://x.ai/api', { task: 'suggest format', data: metadata })`.
- **Cursor AI**: Use prompts in Cursor to generate/test code.
- **Security**: Secure API calls with tokens; limit sensitive data.

## 5. Deployment (Cursor-Optimized)
### 5.1 Oracle Cloud Free Tier (Backend)
- **Setup**:
  1. **Account**: Registered at oracle.com/cloud/free.
  2. **Compartment**:
     - In Oracle Console, go to Identity & Security > Compartments.
     - Create: Name “video-downloader”, Parent: Root tenancy.
     - **Cursor Prompt**: “Generate bash script to check Oracle compartment creation.”
  3. **Launch VM**:
     - Console > Compute > Instances > Create Instance.
     - Name: “downloader-vm”.
     - Compartment: “video-downloader”.
     - Image: Canonical Ubuntu 22.04.
     - Shape: VM.Standard.A1.Flex (1 OCPU, 6GB RAM; try 4 OCPUs/24GB).
     - Networking: New VCN (“downloader-vcn”), public subnet (CIDR: 10.0.0.0/24), public IP.
     - SSH: Generate key pair; save private key (`downloader-vm_private.pem`, `chmod 400`).
     - Create. Note public IP (e.g., 123.45.67.89).
     - **Cursor Prompt**: “Create SSH config for Oracle VM.”
  4. **Networking**:
     - Console > Networking > Virtual Cloud Networks > “downloader-vcn” > Security Lists > Default Security List.
     - Add Ingress Rules: Source: 0.0.0.0/0, Protocol: TCP, Ports: 22 (SSH), 3000 (Node.js).
     - **Cursor Prompt**: “Generate script to verify Oracle networking rules.”
  5. **SSH**:
     - In Cursor’s terminal: `ssh -i downloader-vm_private.pem ubuntu@<public_ip>`
  6. **Install Dependencies**:
     ```bash
     sudo apt update && sudo apt upgrade -y
     sudo apt install nodejs npm ffmpeg python3 python3-pip git -y
     pip3 install yt-dlp
     ```
     - **Cursor Prompt**: “Write bash script to install Node.js, FFmpeg, yt-dlp on Ubuntu.”
  7. **Node.js Project**:
     - In Cursor, create `server.js`:
       ```javascript
       const express = require('express');
       const { exec } = require('child-process-promise');
       const { initializeApp } = require('firebase-admin/app');
       const { getStorage } = require('firebase-admin/storage');
       const { getFirestore } = require('firebase-admin/firestore');
       const validator = require('validator');
       const cors = require('cors');
       const helmet = require('helmet');

       const app = express();
       app.use(cors());
       app.use(helmet());
       app.use(express.json());

       const firebaseApp = initializeApp({ credential: require('./serviceAccount.json') });
       const storage = getStorage().bucket();
       const db = getFirestore();

       app.post('/metadata', async (req, res) => {
         const { url } = req.body;
         if (!validator.isURL(url)) return res.status(400).json({ error: 'Invalid URL' });
         try {
           const { stdout } = await exec(`yt-dlp --dump-json "${url}"`);
           const metadata = JSON.parse(stdout);
           res.json({ title: metadata.title, formats: metadata.formats });
         } catch (error) {
           res.status(500).json({ error: 'Failed to fetch metadata' });
         }
       });

       app.post('/download', async (req, res) => {
         const { url, format } = req.body;
         if (!validator.isURL(url)) return res.status(400).json({ error: 'Invalid URL' });
         try {
           const output = `downloads/${Date.now()}.mp4`;
           await exec(`yt-dlp -f "${format}" -o "${output}" "${url}"`);
           const destination = `videos/${output}`;
           await storage.upload(output, { destination });
           const [downloadUrl] = await storage.file(destination).getSignedUrl({
             action: 'read',
             expires: '03-09-2026',
           });
           await db.collection('downloads').add({ url, format, timestamp: new Date() });
           res.json({ downloadUrl });
         } catch (error) {
           res.status(500).json({ error: 'Download failed' });
         }
       });

       app.listen(3000, () => console.log('API running on http://0.0.0.0:3000'));
       ```
     - **Cursor Prompt**: “Generate Express.js server with yt-dlp and Firebase integration.”
     - Create Firebase `serviceAccount.json` (Firebase Console > Project Settings > Service Accounts).
     - Copy files to VM:
       ```bash
       scp -i downloader-vm_private.pem server.js ubuntu@<public_ip>:~/video-downloader-backend/
       scp -i downloader-vm_private.pem serviceAccount.json ubuntu@<public_ip>:~/video-downloader-backend/
       ```
     - **Cursor Prompt**: “Write SCP commands to transfer files to Oracle VM.”
  8. **Run**:
     - SSH: `cd video-downloader-backend && npm init -y && npm install express child-process-promise firebase-admin validator cors helmet`
     - Start: `node server.js`
     - Use PM2: `npm install -g pm2 && pm2 start server.js --name downloader && pm2 startup`
     - **Cursor Prompt**: “Generate PM2 setup script for Node.js.”
  9. **Test**:
     - `curl -X POST http://<public_ip>:3000/metadata -H "Content-Type: application/json" -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'`
     - **Cursor Prompt**: “Write curl command to test Node.js endpoint.”

### 5.2 Firebase Hosting (Frontend)
- Create Vue.js project in Cursor:
  - `npm create vue@latest`
  - Select Vue 3, JavaScript, Pinia, Vue Router.
  - **Cursor Prompt**: “Set up Vue 3 project with Pinia and Router.”
- Create `src/components/Downloader.vue`:
  ```vue
  <template>
    <div>
      <input v-model="url" placeholder="Enter video URL" />
      <button @click="fetchMetadata">Get Formats</button>
      <div v-if="metadata">
        <h3>{{ metadata.title }}</h3>
        <select v-model="selectedFormat">
          <option v-for="f in metadata.formats" :value="f.format_id">{{ f.format }}</option>
        </select>
        <button @click="download">Download</button>
      </div>
    </div>
  </template>

  <script>
  import axios from 'axios';

  export default {
    data() {
      return { url: '', metadata: null, selectedFormat: '' };
    },
    methods: {
      async fetchMetadata() {
        try {
          const res = await axios.post('https://your-worker.workers.dev/metadata', { url: this.url });
          this.metadata = res.data;
        } catch (error) {
          alert('Error fetching metadata');
        }
      },
      async download() {
        try {
          const res = await axios.post('https://your-worker.workers.dev/download', {
            url: this.url,
            format: this.selectedFormat,
          });
          window.location.href = res.data.downloadUrl;
        } catch (error) {
          alert('Download failed');
        }
      },
    },
  };
  </script>
  ```
  - **Cursor Prompt**: “Generate Vue.js component for video downloader UI.”
- Install deps: `npm install axios vue-progressbar`
- Deploy to Firebase:
  - `firebase init hosting`
  - Build: `npm run build`
  - Deploy: `firebase deploy --only hosting`
  - **Cursor Prompt**: “Generate Firebase Hosting deployment script.”
- Set Firebase Security Rules (Firestore/Storage):
  ```javascript
  // Firestore (firestore.rules)
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /downloads/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == "YOUR_UID";
      }
    }
  }

  // Storage (storage.rules)
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /videos/{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == "YOUR_UID";
      }
    }
  }
  ```
  - **Cursor Prompt**: “Write Firebase security rules for Firestore and Storage.”

### 5.3 Cloudflare Workers (API Proxy)
- Create Worker in Cursor:
  ```javascript
  import { Router } from 'itty-router';
  import validator from 'validator';

  const router = Router();

  router.post('/metadata', async ({ json }) => {
    const { url } = await json();
    if (!validator.isURL(url)) return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
    const response = await fetch('http://<oracle_public_ip>:3000/metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  });

  router.post('/download', async ({ json }) => {
    const { url, format } = await json();
    if (!validator.isURL(url)) return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400 });
    const response = await fetch('http://<oracle_public_ip>:3000/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, format }),
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  });

  export default {
    fetch: router.handle,
  };
  ```
  - **Cursor Prompt**: “Generate Cloudflare Worker for proxying Node.js API.”
- Install Wrangler: `npm install -g @cloudflare/wrangler`
- Deploy: `wrangler deploy`
- Configure DNS/WAF in Cloudflare dashboard.
- **Cursor Prompt**: “Write Wrangler deploy script for Cloudflare Worker.”

### 5.4 AI Agent Deployment
- Integrate Grok in `server.js`:
  ```javascript
  const axios = require('axios');
  // Example: Suggest format
  async function suggestFormat(metadata) {
    try {
      const response = await axios.post('https://x.ai/api', {
        task: 'suggest format',
        data: metadata,
      });
      return response.data.suggestedFormat;
    } catch (error) {
      return 'best'; // Fallback
    }
  }
  ```
  - **Cursor Prompt**: “Add Grok API call to Node.js for format suggestion.”
- Cursor tasks: “Debug Worker proxy”, “Test Vue.js component”, “Monitor Oracle VM.”

## 6. Success Criteria
- **MVP Success** (1-2 days):
  - Vue.js UI on Firebase Hosting.
  - Node.js on Oracle VM.
  - Download/convert YouTube video.
  - Log to Firestore; store in Firebase Storage.
  - Cloudflare Worker proxy.
  - AI suggests format or handles one error.
- **User Satisfaction**: Secure, free, simple UI, Cursor-optimized.
- **Performance**: 720p downloads in <5 min.

## 7. Risks and Mitigation
- **Risk**: yt-dlp fails (platform changes).
  - **Mitigation**: Update yt-dlp; AI retries.
  - **Cursor Prompt**: “Check yt-dlp version and update.”
- **Risk**: Oracle VM limits.
  - **Mitigation**: Monitor Console; scale OCPU.
  - **Cursor Prompt**: “Script to monitor Oracle VM CPU.”
- **Risk**: Security issues.
  - **Mitigation**: `validator.js`, Cloudflare WAF, Firebase Auth; AI scans inputs.
  - **Cursor Prompt**: “Add input validation to Node.js endpoint.”
- **Risk**: Firebase limits.
  - **Mitigation**: Monitor usage; use Oracle disk.
  - **Cursor Prompt**: “Check Firebase Storage usage.”

## 8. Development Plan
### 8.1 Phase 1: MVP (1-2 Days)
- Set up Oracle VM.
- Deploy Vue.js to Firebase.
- Implement Node.js endpoints.
- Integrate Firestore/Storage.
- Deploy Cloudflare Worker.
- Test with YouTube URL.
- **Cursor Prompt**: “Generate full MVP code for video downloader.”

### 8.2 Phase 2: Enhancements (2-3 Days)
- Add progress feedback.
- Support playlists.
- Secure with Firebase Auth, Cloudflare WAF.
- **Cursor Prompt**: “Add WebSocket for progress in Vue.js.”

### 8.3 Phase 3: Polish (1-2 Days)
- Add CLI on Oracle VM.
- Test TikTok/Facebook.
- AI features (history summary).
- **Cursor Prompt**: “Generate CLI for Node.js.”

## 9. AI Agent Instructions (Cursor/Grok)
- **Cursor (Development)**:
  - “Generate Vue.js component for URL input.”
  - “Debug Node.js endpoint for download errors.”
  - “Write Firebase deployment script.”
- **Grok (Runtime)**:
  - `POST https://x.ai/api` with `{ metadata: {...} }` → `{ suggestedFormat: "720p" }`.
  - “Retry download if rate-limited.”
- **Deployment**:
  - “Run `wrangler deploy`.”
  - “Monitor Oracle VM CPU.”
- **Security**: “Scan URLs for malicious patterns.”

## 10. Appendix
- **Firebase**: Generate `serviceAccount.json` in Console.
- **Cloudflare**: Wrangler CLI; DNS/WAF setup.
- **Oracle**: Free Tier: 4 OCPUs, 24GB RAM, 200GB storage.
- **Legal**: Comply with platform terms; no content distribution.