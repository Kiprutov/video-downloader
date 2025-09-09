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

// Helper: resolve yt-dlp path reliably (EC2 pipx path or fallback)
function getYtdlpPath() {
  if (process.platform === 'win32') {
    return 'yt-dlp';
  }
  const pipxPath = '/home/ubuntu/.local/bin/yt-dlp';
  return fs.existsSync(pipxPath) ? pipxPath : 'yt-dlp';
}

// Helper: run yt-dlp with args and capture stdout/stderr safely
function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn(getYtdlpPath(), args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    ytdlp.stdout.on('data', (d) => { stdout += d.toString(); });
    ytdlp.stderr.on('data', (d) => { stderr += d.toString(); });
    ytdlp.on('error', (err) => reject(err));
    ytdlp.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(stderr || `yt-dlp exited with code ${code}`));
      }
      resolve({ stdout, stderr, code });
    });
  });
}

// Function to start download process with real-time progress
async function startDownloadProcess(downloadId, url, format, quality) {
  try {
    const timestamp = Date.now();
    const filename = `video_${timestamp}`;
    const outputPath = path.join(downloadsDir, filename);

    // Try to prefetch duration for better conversion ETA/percent
    let totalDurationSeconds = null;
    try {
      const metaArgs = [
        "--extractor-args",
        "youtube:player_client=web",
        "--user-agent",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "--referer",
        "https://www.youtube.com/",
        "--no-check-certificate",
        "-q",
        "--no-warnings",
        "--dump-json",
        "--no-download",
        url,
      ];
      const { stdout: metaStdout } = await runYtDlp(metaArgs);
      const jsonLine =
        metaStdout
          .split("\n")
          .map((l) => l.trim())
          .find((l) => l.startsWith("{") && l.endsWith("}")) ||
        metaStdout.trim();
      const metadata = JSON.parse(jsonLine);
      if (metadata && typeof metadata.duration === "number") {
        totalDurationSeconds = metadata.duration;
      }
    } catch (e) {
      // Non-fatal if we can't get duration
    }

    // Initialize status as starting (0%)
    activeDownloads.set(downloadId, {
      ...activeDownloads.get(downloadId),
      status: "starting",
      progress: 0,
      speed: "Starting...",
      eta: "Unknown",
    });

    io.emit("download-progress", {
      id: downloadId,
      status: "starting",
      progress: 0,
      speed: "Starting...",
      eta: "Unknown",
    });

    // Build yt-dlp command (with full path for Windows)
    const ytdlpPath =
      process.platform === "win32"
        ? "C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe"
        : "yt-dlp";

    let command = `"${ytdlpPath}" -f "${format}" -o "${outputPath}.%(ext)s" "${url}"`;

    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o "${outputPath}.%(ext)s" "${url}"`;
    }

    console.log(`🔧 Executing: ${command}`);

    // Use spawn instead of exec for real-time output
    const ytdlpProcess = spawn(
      ytdlpPath,
      [
        "-f",
        format,
        "-o",
        `${outputPath}.%(ext)s`,
        "--progress-template",
        "download:%(progress.downloaded_bytes)s:%(progress.total_bytes)s:%(progress.speed)s:%(progress.eta)s",
        // Forward FFmpeg post-processing progress to stdout for parsing
        "--ppa",
        "Merger:-progress pipe:1 -nostats -v quiet",
        "--ppa",
        "FFmpegVideoConvertor:-progress pipe:1 -nostats -v quiet",
        "--ppa",
        "FFmpegVideoRemuxer:-progress pipe:1 -nostats -v quiet",
        "--ppa",
        "FFmpegAudioConvertor:-progress pipe:1 -nostats -v quiet",
        url,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let totalBytes = 0;
    let downloadedBytes = 0;
    let speed = "0 MB/s";
    let eta = "Unknown";
    let hasEmittedDownloading = false;
    let isConverting = false;

    ytdlpProcess.stdout.on("data", (data) => {
      const text = data.toString();
      console.log("yt-dlp stdout:", text);

      // Split to handle combined download and ffmpeg progress lines
      text.split(/\r?\n/).forEach((lineRaw) => {
        const line = lineRaw.trim();
        if (!line) return;

        // yt-dlp download progress
        const dlMatch = line.match(/download:(\d+):(\d+):([^:]+):(.+)/);
        if (dlMatch) {
          downloadedBytes = parseInt(dlMatch[1]);
          totalBytes = parseInt(dlMatch[2]);
          speed = dlMatch[3];
          eta = dlMatch[4];

          const progress =
            totalBytes > 0
              ? Math.round((downloadedBytes / totalBytes) * 100)
              : 0;

          if (!hasEmittedDownloading) {
            hasEmittedDownloading = true;
            activeDownloads.set(downloadId, {
              ...activeDownloads.get(downloadId),
              status: "downloading",
            });
          }

          const clamped = Math.min(progress, 95);
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            progress: clamped,
            speed: speed,
            eta: eta,
          });

          io.emit("download-progress", {
            id: downloadId,
            status: isConverting ? "converting" : "downloading",
            progress: clamped,
            speed: isConverting ? "Processing..." : speed,
            eta: isConverting ? "Finalizing" : eta,
          });
          return;
        }

        // ffmpeg post-processing progress (from -progress pipe:1)
        if (line.startsWith("out_time_ms=") || line.startsWith("out_time=")) {
          isConverting = true;

          let outTimeMs = null;
          if (line.startsWith("out_time_ms=")) {
            const v = line.split("=")[1];
            const num = parseInt(v, 10);
            if (!Number.isNaN(num)) outTimeMs = num;
          }

          // Update progress based on duration if available
          let convProgress = activeDownloads.get(downloadId)?.progress || 95;
          if (outTimeMs != null && totalDurationSeconds) {
            const denom = totalDurationSeconds * 1_000_000; // out_time_ms is in microseconds
            if (denom > 0) {
              convProgress = Math.min(
                99,
                Math.max(96, Math.round((outTimeMs / denom) * 100))
              );
            }
          } else {
            convProgress = Math.min(99, Math.max(convProgress, 96));
          }

          // Emit converting update (speed/eta refined below if we parse speed line)
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            status: "converting",
            progress: convProgress,
            speed: "Processing...",
            eta: "Finalizing",
          });

          io.emit("download-progress", {
            id: downloadId,
            status: "converting",
            progress: convProgress,
            speed: "Processing...",
            eta: "Finalizing",
          });
          return;
        }

        if (line.startsWith("speed=")) {
          // Example: speed=1.23x
          const sp = line.split("=")[1]?.trim();
          const speedDisplay = sp ? `${sp}` : "Processing...";
          const current = activeDownloads.get(downloadId) || {};
          activeDownloads.set(downloadId, {
            ...current,
            status: "converting",
            speed: speedDisplay,
          });

          io.emit("download-progress", {
            id: downloadId,
            status: "converting",
            progress: current.progress || 97,
            speed: speedDisplay,
            eta: current.eta || "Finalizing",
          });
          return;
        }

        if (line.startsWith("progress=")) {
          // progress=continue|end — keep status converting until close event
          if (!isConverting) {
            isConverting = true;
          }
          const current = activeDownloads.get(downloadId) || {};
          activeDownloads.set(downloadId, {
            ...current,
            status: "converting",
          });
          io.emit("download-progress", {
            id: downloadId,
            status: "converting",
            progress: current.progress || 97,
            speed: current.speed || "Processing...",
            eta: current.eta || "Finalizing",
          });
          return;
        }
      });
    });

    ytdlpProcess.stderr.on("data", (data) => {
      const output = data.toString();
      console.log("yt-dlp stderr:", output);

      // Detect post-processing/conversion phase from stderr
      if (!isConverting) {
        const lower = output.toLowerCase();
        if (
          lower.includes("merging formats") ||
          lower.includes("[merger]") ||
          lower.includes("post-processing") ||
          lower.includes("ffmpeg") ||
          lower.includes("extractaudio") ||
          lower.includes("writing") ||
          lower.includes("destination")
        ) {
          isConverting = true;
          const current = activeDownloads.get(downloadId) || {};
          const newProgress = Math.max(current.progress || 95, 96);
          activeDownloads.set(downloadId, {
            ...current,
            status: "converting",
            progress: Math.min(newProgress, 99),
            speed: "Processing...",
            eta: "Finalizing",
          });

          io.emit("download-progress", {
            id: downloadId,
            status: "converting",
            progress: Math.min(newProgress, 99),
            speed: "Processing...",
            eta: "Finalizing",
          });
        }
      }
    });

    ytdlpProcess.on("close", async (code) => {
      if (code === 0) {
        // Download completed successfully
        console.log(`✅ Download completed: ${filename}`);

        // Find the downloaded file
        const files = fs.readdirSync(downloadsDir);
        const downloadedFile = files.find((file) => file.startsWith(filename));

        if (downloadedFile) {
          const filePath = path.join(downloadsDir, downloadedFile);
          const fileStats = fs.statSync(filePath);

          // Update final status
          activeDownloads.set(downloadId, {
            ...activeDownloads.get(downloadId),
            status: "completed",
            progress: 100,
            speed: "Complete",
            eta: "0s",
            filename: downloadedFile,
            filesize: fileStats.size,
            downloadUrl: `https://api.shuleni.co.ke/api/download-file/${downloadedFile}`,
          });

          // Send completion update
          io.emit("download-progress", {
            id: downloadId,
            status: "completed",
            progress: 100,
            speed: "Complete",
            eta: "0s",
            filename: downloadedFile,
            filesize: fileStats.size,
            downloadUrl: `https://api.shuleni.co.ke/api/download-file/${downloadedFile}`,
          });

          // Clean up after 30 minutes (give users time to download)
          setTimeout(() => {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Cleaned up file: ${downloadedFile}`);
              }
            } catch (error) {
              console.error(`❌ Error cleaning up file: ${error.message}`);
            }
            activeDownloads.delete(downloadId);
          }, 30 * 60 * 1000); // 30 minutes
        }
      } else {
        // Download failed
        console.error(`❌ Download failed with code ${code}`);

        activeDownloads.set(downloadId, {
          ...activeDownloads.get(downloadId),
          status: "failed",
          error: "Download failed",
        });

        io.emit("download-progress", {
          id: downloadId,
          status: "failed",
          error: "Download failed",
        });
      }
    });
  } catch (error) {
    console.error("❌ Download process error:", error.message);

    activeDownloads.set(downloadId, {
      ...activeDownloads.get(downloadId),
      status: "failed",
      error: error.message,
    });

    io.emit("download-progress", {
      id: downloadId,
      status: "failed",
      error: error.message,
    });
  }
}

// Configure multer for file uploads
const upload = multer({
  dest: downloadsDir,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    firebase: firebaseApp ? "connected" : "not configured",
  });
});

// Internal handler to fetch metadata (used by GET/POST)
async function handleMetadata(url, res) {
  if (!url || !validator.isURL(url)) {
    return res
      .status(400)
      .json({ error: "Invalid URL provided", success: false });
  }

  console.log(`📹 Fetching metadata for: ${url}`);

  try {
    const args = [
      "--extractor-args",
      "youtube:player_client=web",
      "--user-agent",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "--referer",
      "https://www.youtube.com/",
      "--no-check-certificate",
      "-q",
      "--no-warnings",
      "--dump-json",
      "--no-download",
      url,
    ];

    const { stdout, stderr } = await runYtDlp(args);
    if (stderr) {
      console.log("yt-dlp stderr:", stderr.slice(0, 500));
    }

    // Some builds may include logs; pick the JSON line
    const jsonLine =
      stdout
        .split("\n")
        .map((l) => l.trim())
        .find((l) => l.startsWith("{") && l.endsWith("}")) || stdout.trim();

    const metadata = JSON.parse(jsonLine);

    const formats = Array.isArray(metadata.formats)
      ? metadata.formats
          .filter(
            (fmt) => fmt && (fmt.vcodec !== "none" || fmt.acodec !== "none")
          )
          .map((fmt) => ({
            format_id: fmt.format_id,
            ext: fmt.ext,
            resolution: fmt.resolution || "audio only",
            fps: fmt.fps,
            vcodec: fmt.vcodec,
            acodec: fmt.acodec,
            filesize: fmt.filesize || fmt.filesize_approx,
            quality: fmt.quality,
            format_note: fmt.format_note,
          }))
          .sort(
            (a, b) =>
              (parseFloat(b.quality) || 0) - (parseFloat(a.quality) || 0)
          )
      : [];

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
        formats,
      },
    };

    console.log(`✅ Metadata fetched: ${metadata.title}`);
    return res.json(response);
  } catch (error) {
    console.error("❌ Error fetching metadata:", error.message);
    return res.status(500).json({
      error: "Failed to fetch video metadata",
      details: error.message,
      success: false,
    });
  }
}

// GET and POST variants for metadata
app.get("/api/metadata", async (req, res) => {
  const { url } = req.query;
  return handleMetadata(url, res);
});

app.post("/api/metadata", async (req, res) => {
  const { url } = req.body;
  return handleMetadata(url, res);
});

// Start download and return direct download URL
app.post("/api/download", async (req, res) => {
  const { url, format, quality } = req.body;

  if (!url || !validator.isURL(url)) {
    return res.status(400).json({
      error: "Invalid URL provided",
      success: false,
    });
  }

  try {
    const timestamp = Date.now();
    const filename = `video_${timestamp}`;
    const outputPath = path.join(downloadsDir, filename);

    // Build yt-dlp command (with full path for Windows)
    const ytdlpPath =
      process.platform === "win32"
        ? "C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe"
        : "yt-dlp";

    let command = `"${ytdlpPath}" -f "${format}" -o "${outputPath}.%(ext)s" "${url}"`;

    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o "${outputPath}.%(ext)s" "${url}"`;
    }

    console.log(`🔧 Executing: ${command}`);

    // Execute download
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      console.log("yt-dlp stderr:", stderr);
    }

    console.log("yt-dlp stdout:", stdout);

    // Find the downloaded file
    const files = fs.readdirSync(downloadsDir);
    const downloadedFile = files.find((file) => file.startsWith(filename));

    if (!downloadedFile) {
      throw new Error("Downloaded file not found");
    }

    const filePath = path.join(downloadsDir, downloadedFile);
    const fileStats = fs.statSync(filePath);

    console.log(
      `✅ Download completed: ${downloadedFile} (${(
        fileStats.size /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    // Return direct download URL for browser to handle
    const downloadUrl = `http://localhost:${PORT}/api/download-file/${downloadedFile}`;

    res.json({
      success: true,
      data: {
        filename: downloadedFile,
        filesize: fileStats.size,
        downloadUrl: downloadUrl,
        message: "Download ready - click to download",
      },
    });
  } catch (error) {
    console.error("❌ Download failed:", error.message);
    res.status(500).json({
      error: "Download failed",
      details: error.message,
      success: false,
    });
  }
});

// Start server-side download with progress tracking
app.post("/api/download-server", async (req, res) => {
  const { url, format, quality } = req.body;

  if (!url || !validator.isURL(url)) {
    return res.status(400).json({
      error: "Invalid URL provided",
      success: false,
    });
  }

  try {
    const downloadId = `download-${Date.now()}`;
    const timestamp = Date.now();
    const filename = `video_${timestamp}`;
    const outputPath = path.join(downloadsDir, filename);

    // Initialize download tracking
    activeDownloads.set(downloadId, {
      id: downloadId,
      status: "starting",
      progress: 0,
      speed: "Starting...",
      eta: "Unknown",
      filename: null,
      filesize: 0,
      downloadUrl: null,
    });

    // Start download process in background
    startDownloadProcess(downloadId, url, format, quality, outputPath);

    res.json({
      success: true,
      data: {
        downloadId: downloadId,
        status: "starting",
        message: "Download started. Use WebSocket to track progress.",
      },
    });
  } catch (error) {
    console.error("❌ Server download failed:", error.message);
    res.status(500).json({
      error: "Server download failed",
      details: error.message,
      success: false,
    });
  }
});

// Get download status
app.get("/api/download-status/:downloadId", (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.status(404).json({
      success: false,
      error: "Download not found",
    });
  }

  res.json({
    success: true,
    data: download,
  });
});

// Download completed file
app.get("/api/download-file/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(downloadsDir, filename);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      error: "File not found",
    });
  }

  // Set headers for file download
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "application/octet-stream");

  // Stream file to client
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);

  // Clean up file after download (optional - you might want to keep files for a while)
  fileStream.on("end", () => {
    console.log(`📁 File served: ${filename}`);
    // Uncomment the next line if you want to delete files immediately after download
    // setTimeout(() => fs.unlinkSync(filePath), 5000);
  });
});

// Get direct download URL from yt-dlp (no server processing) - Keep for compatibility
app.post("/api/download-direct", async (req, res) => {
  const { url, format, quality } = req.body;

  if (!url || !validator.isURL(url)) {
    return res.status(400).json({
      error: "Invalid URL provided",
      success: false,
    });
  }

  try {
    // Build yt-dlp command to get direct URL
    const ytdlpPath =
      process.platform === "win32"
        ? "C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe"
        : "/home/ubuntu/.local/bin/yt-dlp";

    let command = `"${ytdlpPath}" --extractor-args "youtube:player_client=web" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f "${format}" --get-url "${url}"`;

    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" --extractor-args "youtube:player_client=web" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -f "${format}[height<=${quality}]" --get-url "${url}"`;
    }

    console.log(`🔧 Getting direct URL: ${command}`);

    // Execute command to get direct URL
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      console.log("yt-dlp stderr:", stderr);
    }

    const directUrl = stdout.trim();

    if (!directUrl || directUrl.includes("ERROR")) {
      throw new Error("Could not get direct download URL");
    }

    console.log(`✅ Direct URL obtained: ${directUrl}`);

    // Get filename for download
    const filenameCommand = `"${ytdlpPath}" --extractor-args "youtube:player_client=web" --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" --get-filename -o "%(title)s.%(ext)s" "${url}"`;
    const { stdout: filenameOutput } = await exec(filenameCommand);
    const filename = filenameOutput.trim().replace(/[<>:"/\\|?*]/g, "_"); // Sanitize filename

    res.json({
      success: true,
      data: {
        directUrl: directUrl,
        filename: filename,
        method: "direct",
      },
    });
  } catch (error) {
    console.error("❌ Direct download failed:", error.message);
    res.status(500).json({
      error: "Direct download failed",
      details: error.message,
      success: false,
    });
  }
});

// Streaming download with real progress
app.get("/api/download-stream", async (req, res) => {
  const { url, format, quality } = req.query;

  if (!url || !validator.isURL(url)) {
    return res.status(400).json({
      error: "Invalid URL provided",
      success: false,
    });
  }

  try {
    // Build yt-dlp command for streaming
    const ytdlpPath =
      process.platform === "win32"
        ? "C:\\Users\\SYSTEM 6\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe"
        : "yt-dlp";

    let command = `"${ytdlpPath}" -f "${format}" -o - "${url}"`;

    // Add quality preference if specified
    if (quality) {
      command = `"${ytdlpPath}" -f "${format}[height<=${quality}]" -o - "${url}"`;
    }

    console.log(`🔧 Streaming download: ${command}`);

    // Get filename for download
    const filenameCommand = `"${ytdlpPath}" --get-filename -o "%(title)s.%(ext)s" "${url}"`;
    const { stdout: filenameOutput } = await exec(filenameCommand);
    const filename = filenameOutput.trim().replace(/[<>:"/\\|?*]/g, "_"); // Sanitize filename

    // Set headers for streaming download
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    // Execute streaming download
    const ytdlpProcess = spawn(ytdlpPath, ["-f", format, "-o", "-", url], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Handle errors
    ytdlpProcess.stderr.on("data", (data) => {
      console.log("yt-dlp stderr:", data.toString());
    });

    ytdlpProcess.on("error", (error) => {
      console.error("yt-dlp process error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Streaming download failed" });
      }
    });

    // Pipe output to response
    ytdlpProcess.stdout.pipe(res);

    // Handle process completion
    ytdlpProcess.on("close", (code) => {
      if (code !== 0) {
        console.error(`yt-dlp process exited with code ${code}`);
        if (!res.headersSent) {
          res.status(500).json({ error: "Download failed" });
        }
      }
    });
  } catch (error) {
    console.error("❌ Streaming download failed:", error.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: "Streaming download failed",
        details: error.message,
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
