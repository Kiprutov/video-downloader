const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const validator = require('validator');
const { exec } = require('child-process-promise');
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase Admin (only if credentials are provided)
let firebaseApp = null;
let storage = null;
let db = null;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    storage = admin.storage().bucket();
    db = admin.firestore();
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.log('⚠️  Firebase Admin not initialized:', error.message);
    console.log('   Running in local-only mode');
  }
}

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Store active downloads for progress tracking
const activeDownloads = new Map();

// Function to start download process with real-time progress
async function startDownloadProcess(downloadId, url, format, quality) {
  try {
    const timestamp = Date.now();
    const filename = `video_${timestamp}`;
    const outputPath = path.join(downloadsDir, filename);
    
    // Update status to downloading
    activeDownloads.set(downloadId, {
      ...activeDownloads.get(downloadId),
      status: 'downloading',
      progress: 10
    });
    
    io.emit('download-progress', {
      id: downloadId,
      status: 'downloading',
      progress: 10,
      speed: 'Starting...',
      eta: 'Unknown'
    });

    // Build yt-dlp command (with full path for Windows)
    const ytdlpPath = process.platform === 'win32' 
      ? 'C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe'
      : 'yt-dlp';
    
    let command = `"${ytdlpPath}" -f "${format}" -o "${outputPath}.%(ext)s" "${url}"`;
    
    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o "${outputPath}.%(ext)s" "${url}"`;
    }

    console.log(`🔧 Executing: ${command}`);
    
    // Use spawn instead of exec for real-time output
    const ytdlpProcess = spawn(ytdlpPath, [
      '-f', format,
      '-o', `${outputPath}.%(ext)s`,
      '--progress-template', 'download:%(progress.downloaded_bytes)s:%(progress.total_bytes)s:%(progress.speed)s:%(progress.eta)s',
      url
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let totalBytes = 0;
    let downloadedBytes = 0;
    let speed = '0 MB/s';
    let eta = 'Unknown';

    ytdlpProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp stdout:', output);
      
      // Parse progress from yt-dlp output
      const progressMatch = output.match(/download:(\d+):(\d+):([^:]+):([^\n]+)/);
      if (progressMatch) {
        downloadedBytes = parseInt(progressMatch[1]);
        totalBytes = parseInt(progressMatch[2]);
        speed = progressMatch[3];
        eta = progressMatch[4];
        
        const progress = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
        
        // Update progress
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId),
          progress: Math.min(progress, 95), // Cap at 95% until complete
          speed: speed,
          eta: eta
        });
        
        // Send progress update
        io.emit('download-progress', {
          id: downloadId,
          status: 'downloading',
          progress: Math.min(progress, 95),
          speed: speed,
          eta: eta
        });
      }
    });

    ytdlpProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp stderr:', output);
    });

    ytdlpProcess.on('close', async (code) => {
      if (code === 0) {
        // Download completed successfully
        console.log(`✅ Download completed: ${filename}`);
        
        // Find the downloaded file
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find(file => file.startsWith(filename));
        
        if (downloadedFile) {
          const filePath = path.join(downloadsDir, downloadedFile);
          const fileStats = fs.statSync(filePath);
          
          // Update final status
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            status: 'completed',
            progress: 100,
            speed: 'Complete',
            eta: '0s',
            filename: downloadedFile,
            filesize: fileStats.size
          });
          
          // Send completion update
          io.emit('download-progress', {
            id: downloadId,
            status: 'completed',
            progress: 100,
            speed: 'Complete',
            eta: '0s',
            filename: downloadedFile,
            filesize: fileStats.size,
            downloadUrl: `/api/download-file/${downloadedFile}`
          });
          
          // Clean up after 5 minutes
          setTimeout(() => {
            activeDownloads.delete(downloadId);
          }, 5 * 60 * 1000);
        }
      } else {
        // Download failed
        console.error(`❌ Download failed with code ${code}`);
        
        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId),
          status: 'failed',
          error: 'Download failed'
        });
        
        io.emit('download-progress', {
          id: downloadId,
          status: 'failed',
          error: 'Download failed'
        });
      }
    });

  } catch (error) {
    console.error('❌ Download process error:', error.message);
    
    activeDownloads.set(downloadId, {
      ...activeDownloads.get(downloadId),
      status: 'failed',
      error: error.message
    });
    
    io.emit('download-progress', {
      id: downloadId,
      status: 'failed',
      error: error.message
    });
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: downloadsDir,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    firebase: firebaseApp ? 'connected' : 'not configured'
  });
});

// Get video metadata
app.post('/api/metadata', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !validator.isURL(url)) {
      return res.status(400).json({ 
        error: 'Invalid URL provided',
        success: false 
      });
    }

    console.log(`📹 Fetching metadata for: ${url}`);
    
    // Use yt-dlp to get metadata (with full path for Windows)
    const ytdlpPath = process.platform === 'win32' 
      ? 'C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe'
      : 'yt-dlp';
    const command = `"${ytdlpPath}" --dump-json --no-download "${url}"`;
    const { stdout, stderr } = await exec(command);
    
    if (stderr) {
      console.log('yt-dlp stderr:', stderr);
    }
    
    const metadata = JSON.parse(stdout);
    
    // Extract relevant information
    const formats = metadata.formats
      .filter(format => format.vcodec !== 'none' || format.acodec !== 'none')
      .map(format => ({
        format_id: format.format_id,
        ext: format.ext,
        resolution: format.resolution || 'audio only',
        fps: format.fps,
        vcodec: format.vcodec,
        acodec: format.acodec,
        filesize: format.filesize,
        quality: format.quality,
        format_note: format.format_note
      }))
      .sort((a, b) => {
        // Sort by quality (higher is better)
        const qualityA = parseFloat(a.quality) || 0;
        const qualityB = parseFloat(b.quality) || 0;
        return qualityB - qualityA;
      });

    const response = {
      success: true,
      data: {
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        uploader: metadata.uploader,
        upload_date: metadata.upload_date,
        view_count: metadata.view_count,
        thumbnail: metadata.thumbnail,
        formats: formats
      }
    };

    console.log(`✅ Metadata fetched successfully: ${metadata.title}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching metadata:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch video metadata',
      details: error.message,
      success: false 
    });
  }
});

// Start download and return direct download URL
app.post('/api/download', async (req, res) => {
  const { url, format, quality } = req.body;
  
  if (!url || !validator.isURL(url)) {
    return res.status(400).json({ 
      error: 'Invalid URL provided',
      success: false 
    });
  }

  try {
    const timestamp = Date.now();
    const filename = `video_${timestamp}`;
    const outputPath = path.join(downloadsDir, filename);
    
    // Build yt-dlp command (with full path for Windows)
    const ytdlpPath = process.platform === 'win32' 
      ? 'C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe'
      : 'yt-dlp';
    
    let command = `"${ytdlpPath}" -f "${format}" -o "${outputPath}.%(ext)s" "${url}"`;
    
    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o "${outputPath}.%(ext)s" "${url}"`;
    }

    console.log(`🔧 Executing: ${command}`);
    
    // Execute download
    const { stdout, stderr } = await exec(command);
    
    if (stderr) {
      console.log('yt-dlp stderr:', stderr);
    }
    
    console.log('yt-dlp stdout:', stdout);
    
    // Find the downloaded file
    const files = fs.readdirSync(downloadsDir);
    const downloadedFile = files.find(file => file.startsWith(filename));
    
    if (!downloadedFile) {
      throw new Error('Downloaded file not found');
    }
    
    const filePath = path.join(downloadsDir, downloadedFile);
    const fileStats = fs.statSync(filePath);
    
    console.log(`✅ Download completed: ${downloadedFile} (${(fileStats.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Return direct download URL for browser to handle
    const downloadUrl = `http://localhost:${PORT}/api/download-file/${downloadedFile}`;
    
    res.json({
      success: true,
      data: {
        filename: downloadedFile,
        filesize: fileStats.size,
        downloadUrl: downloadUrl,
        message: 'Download ready - click to download'
      }
    });

  } catch (error) {
    console.error('❌ Download failed:', error.message);
    res.status(500).json({ 
      error: 'Download failed',
      details: error.message,
      success: false 
    });
  }
});

// Get direct download URL from yt-dlp (no server processing)
app.post('/api/download-direct', async (req, res) => {
    const { url, format, quality } = req.body;
    
    if (!url || !validator.isURL(url)) {
      return res.status(400).json({ 
        error: 'Invalid URL provided',
        success: false 
      });
    }

  try {
    // Build yt-dlp command to get direct URL
    const ytdlpPath = process.platform === 'win32' 
      ? 'C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe'
      : 'yt-dlp';
    
    let command = `"${ytdlpPath}" -f "${format}" --get-url "${url}"`;
    
    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" --get-url "${url}"`;
    }

    console.log(`🔧 Getting direct URL: ${command}`);
    
    // Execute command to get direct URL
    const { stdout, stderr } = await exec(command);
    
    if (stderr) {
      console.log('yt-dlp stderr:', stderr);
    }
    
    const directUrl = stdout.trim();
    
    if (!directUrl || directUrl.includes('ERROR')) {
      throw new Error('Could not get direct download URL');
    }
    
    console.log(`✅ Direct URL obtained: ${directUrl}`);
    
    // Get filename for download
    const filenameCommand = `"${ytdlpPath}" --get-filename -o "%(title)s.%(ext)s" "${url}"`;
    const { stdout: filenameOutput } = await exec(filenameCommand);
    const filename = filenameOutput.trim().replace(/[<>:"/\\|?*]/g, '_'); // Sanitize filename
    
    res.json({
      success: true,
      data: {
        directUrl: directUrl,
        filename: filename,
        method: 'direct'
      }
    });

  } catch (error) {
    console.error('❌ Direct download failed:', error.message);
    res.status(500).json({ 
      error: 'Direct download failed',
      details: error.message,
      success: false 
    });
  }
});

// Streaming download with real progress
app.get('/api/download-stream', async (req, res) => {
  const { url, format, quality } = req.query;
  
  if (!url || !validator.isURL(url)) {
    return res.status(400).json({ 
      error: 'Invalid URL provided',
      success: false 
    });
  }

  try {
    // Build yt-dlp command for streaming
    const ytdlpPath = process.platform === 'win32' 
      ? 'C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe'
      : 'yt-dlp';
    
    let command = `"${ytdlpPath}" -f "${format}" -o - "${url}"`;
    
    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o - "${url}"`;
    }

    console.log(`🔧 Streaming download: ${command}`);
    
    // Get filename for download
    const filenameCommand = `"${ytdlpPath}" --get-filename -o "%(title)s.%(ext)s" "${url}"`;
    const { stdout: filenameOutput } = await exec(filenameCommand);
    const filename = filenameOutput.trim().replace(/[<>:"/\\|?*]/g, '_'); // Sanitize filename
    
    // Set headers for streaming download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Execute streaming download
    const ytdlpProcess = spawn(ytdlpPath, [
      '-f', format,
      '-o', '-',
      url
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Handle errors
    ytdlpProcess.stderr.on('data', (data) => {
      console.log('yt-dlp stderr:', data.toString());
    });
    
    ytdlpProcess.on('error', (error) => {
      console.error('yt-dlp process error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming download failed' });
      }
    });
    
    // Pipe output to response
    ytdlpProcess.stdout.pipe(res);
    
    // Handle process completion
    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
    });

  } catch (error) {
    console.error('❌ Streaming download failed:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Streaming download failed',
        details: error.message
      });
    }
  }
});

// Streaming download with real progress (POST version)
app.post('/api/download-stream', async (req, res) => {
  const { url, format, quality } = req.body;
  
  if (!url || !validator.isURL(url)) {
    return res.status(400).json({ 
      error: 'Invalid URL provided',
      success: false 
    });
  }

  try {
    // Build yt-dlp command for streaming
    const ytdlpPath = process.platform === 'win32' 
      ? 'C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe'
      : 'yt-dlp';
    
    let command = `"${ytdlpPath}" -f "${format}" -o - "${url}"`;
    
    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o - "${url}"`;
    }

    console.log(`🔧 Streaming download: ${command}`);
    
    // Get filename for download
    const filenameCommand = `"${ytdlpPath}" --get-filename -o "%(title)s.%(ext)s" "${url}"`;
    const { stdout: filenameOutput } = await exec(filenameCommand);
    const filename = filenameOutput.trim().replace(/[<>:"/\\|?*]/g, '_'); // Sanitize filename
    
    // Set headers for streaming download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Execute streaming download
    const ytdlpProcess = spawn(ytdlpPath, [
      '-f', format,
      '-o', '-',
      url
    ], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Handle errors
    ytdlpProcess.stderr.on('data', (data) => {
      console.log('yt-dlp stderr:', data.toString());
    });
    
    ytdlpProcess.on('error', (error) => {
      console.error('yt-dlp process error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Streaming download failed' });
      }
    });
    
    // Pipe output to response
    ytdlpProcess.stdout.pipe(res);
    
    // Handle process completion
    ytdlpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' });
        }
      }
    });

  } catch (error) {
    console.error('❌ Streaming download failed:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Streaming download failed',
        details: error.message
      });
    }
  }
});

// Legacy download endpoint (for backward compatibility)
app.post('/api/download-legacy', async (req, res) => {
  try {
    const { url, format, quality } = req.body;
    
    if (!url || !validator.isURL(url)) {
      return res.status(400).json({ 
        error: 'Invalid URL provided',
        success: false 
      });
    }

    console.log(`⬇️  Starting download with progress: ${url}`);
    console.log(`   Format: ${format}, Quality: ${quality}`);

    // Generate download ID for progress tracking
    const downloadId = `download-${Date.now()}`;
    
    // Initialize download in active downloads
    activeDownloads.set(downloadId, {
      id: downloadId,
      url: url,
      format: format,
      quality: quality,
      status: 'pending',
      progress: 0,
      speed: '0 MB/s',
      eta: 'Unknown'
    });

    // Start the download process with progress tracking
    startDownloadProcess(downloadId, url, format, quality)
      .then((result) => {
    res.json({
      success: true,
      data: {
            downloadId: downloadId,
            message: 'Download started with progress tracking',
            progressUrl: `/api/download-progress/${downloadId}`
          }
        });
      })
      .catch((error) => {
        console.error('❌ Download process failed:', error.message);
        res.status(500).json({ 
          error: 'Download process failed',
          details: error.message,
          success: false 
        });
    });

  } catch (error) {
    console.error('❌ Download failed:', error.message);
    res.status(500).json({ 
      error: 'Download failed',
      details: error.message,
      success: false 
    });
  }
});

// Get download progress
app.get('/api/download-progress/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);
  
  if (!download) {
    return res.status(404).json({ 
      error: 'Download not found',
      success: false 
    });
  }
  
  res.json({
    success: true,
    data: download
  });
});

// Get download result when completed
app.get('/api/download-result/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);
  
  if (!download) {
    return res.status(404).json({ 
      error: 'Download not found',
      success: false 
    });
  }
  
  if (download.status !== 'completed') {
    return res.status(400).json({ 
      error: 'Download not completed yet',
      success: false 
    });
  }
  
  res.json({
    success: true,
    data: {
      filename: download.filename,
      filesize: download.filesize,
      downloadUrl: download.downloadUrl,
      localPath: download.localPath
    }
  });
});

// Serve downloaded files
app.get('/api/download-file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(downloadsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.download(filePath, filename);
  } catch (error) {
    console.error('Error serving file:', error.message);
    res.status(500).json({ error: 'Error serving file' });
  }
});

// Get download history
app.get('/api/history', async (req, res) => {
  try {
    if (!db) {
      return res.json({ 
        success: true, 
        data: [],
        message: 'Firebase not configured - no history available'
      });
    }
    
    const snapshot = await db.collection('downloads')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();
    
    const history = [];
    snapshot.forEach(doc => {
      history.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching history:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch history',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Downloads directory: ${downloadsDir}`);
  console.log(`🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log(`🔌 WebSocket server ready for real-time updates`);
  
  if (firebaseApp) {
    console.log('🔥 Firebase Admin connected');
  } else {
    console.log('⚠️  Firebase Admin not configured - running in local mode');
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  process.exit(0);
});
