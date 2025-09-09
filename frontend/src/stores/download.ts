import type {
  DownloadHistory,
  DownloadProgress,
  DownloadRequest,
  VideoMetadata,
} from "@/types";
import { defineStore } from "pinia";
import { io, type Socket } from "socket.io-client";
import { computed, ref } from "vue";

export const useDownloadStore = defineStore("download", () => {
  const metadata = ref<VideoMetadata | null>(null);
  const currentDownload = ref<DownloadProgress | null>(null);
  const downloadHistory = ref<DownloadHistory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // WebSocket connection
  let socket: Socket | null = null;
  const isConnected = ref(false);

  const isDownloading = computed(
    () =>
      currentDownload.value?.status === "downloading" ||
      currentDownload.value?.status === "converting"
  );

  const fetchMetadata = async (url: string) => {
    loading.value = true;
    error.value = null;

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/metadata`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch metadata");
      }

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch metadata");
      }

      // Transform the API response to match our VideoMetadata type
      const apiData = result.data;
      const transformedMetadata: VideoMetadata = {
        id: `video-${Date.now()}`,
        title: apiData.title,
        description: apiData.description || "",
        duration: apiData.duration || 0,
        thumbnail: apiData.thumbnail || "",
        uploader: apiData.uploader || "",
        upload_date: apiData.upload_date || "",
        formats: apiData.formats.map((format: any) => ({
          format_id: format.format_id,
          format: `${format.resolution || "audio only"} - ${format.ext}`,
          ext: format.ext,
          resolution: format.resolution || "audio only",
          fps: format.fps || 0,
          vcodec: format.vcodec || "none",
          acodec: format.acodec || "none",
          filesize: format.filesize || 0,
          quality: format.quality || 0,
          abr: format.abr || 0,
        })),
      };

      metadata.value = transformedMetadata;
      return { success: true, data: transformedMetadata };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch metadata";
      return { success: false, error: error.value };
    } finally {
      loading.value = false;
    }
  };

  const startDownload = async (request: DownloadRequest) => {
    if (!metadata.value) {
      error.value = "No metadata available";
      return { success: false, error: error.value };
    }

    // Prevent multiple simultaneous downloads
    if (currentDownload.value && isDownloading.value) {
      error.value = "A download is already in progress";
      return { success: false, error: error.value };
    }

    const downloadId = `download-${Date.now()}`;
    currentDownload.value = {
      id: downloadId,
      url: request.url,
      format: request.format,
      quality: request.quality,
      status: "downloading",
      progress: 0,
    };

    try {
      // Try direct download first (fastest, no server processing)
      const directResult = await startDirectDownload(request);
      if (directResult.success) {
        currentDownload.value.status = "completed";
        currentDownload.value.progress = 100;
        return directResult;
      }

      // Fallback to streaming download
      const streamResult = await startStreamingDownload(request);
      if (streamResult.success) {
        currentDownload.value.status = "completed";
        currentDownload.value.progress = 100;
        return streamResult;
      }

      // Fallback to legacy download
      const legacyResult = await startLegacyDownload(request);
      if (legacyResult.success) {
        currentDownload.value.status = "completed";
        currentDownload.value.progress = 100;
        return legacyResult;
      }

      throw new Error("All download methods failed");
    } catch (error) {
      console.error("Download failed:", error);
      currentDownload.value.status = "failed";
      currentDownload.value.error =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  };

  const startDirectDownload = async (request: DownloadRequest) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/download-direct`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: request.url,
          format: request.format,
          quality: request.quality,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Direct download failed");
      }

      if (!result.success) {
        throw new Error(result.error || "Direct download failed");
      }

      // Trigger browser download with direct URL
      const link = document.createElement("a");
      link.href = result.data.directUrl;
      link.download = result.data.filename;
      link.target = "_blank"; // Open in new tab for direct downloads
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true, method: "direct" };
    } catch (error) {
      console.error("Direct download failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Direct download failed",
      };
    }
  };

  const startStreamingDownload = async (request: DownloadRequest) => {
    try {
      // Use POST request for streaming download
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/download-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: request.url,
          format: request.format,
          quality: request.quality,
        }),
      });

      if (!response.ok) {
        throw new Error("Streaming download failed");
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "") || "video"
        : "video";

      // Create blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      window.URL.revokeObjectURL(url);

      return { success: true, method: "streaming" };
    } catch (error) {
      console.error("Streaming download failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Streaming download failed",
      };
    }
  };

  // Progress polling management
  let pollingInterval: NodeJS.Timeout | null = null;

  const startProgressPolling = (downloadId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Poll every 1 second
    pollingInterval = setInterval(async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await fetch(
          `${apiBaseUrl}/api/download-progress/${downloadId}`
        );
        const result = await response.json();

        if (result.success && currentDownload.value?.id === downloadId) {
          const progress = result.data;
          console.log("📊 Download progress:", progress);

          currentDownload.value = {
            ...currentDownload.value,
            ...progress,
          };

          // Stop polling if download is complete or failed
          if (progress.status === "completed" || progress.status === "failed") {
            stopProgressPolling();

            // If completed, trigger download
            if (
              progress.status === "completed" &&
              progress.downloadUrl &&
              progress.filename
            ) {
              downloadFile(progress.downloadUrl, progress.filename);

              // Add to history
              const historyItem: DownloadHistory = {
                id: downloadId,
                url: currentDownload.value?.url || "",
                title: metadata.value?.title || "Unknown",
                format: currentDownload.value?.format || "",
                quality: currentDownload.value?.quality || "auto",
                fileSize: progress.filesize || 0,
                downloadUrl: progress.downloadUrl,
                createdAt: new Date(),
                completedAt: new Date(),
                status: "completed",
              };
              downloadHistory.value.unshift(historyItem);
              saveHistory();
            }
          }
        }
      } catch (error) {
        console.error("Progress polling failed:", error);
        // Don't stop polling on network errors, just log them
      }
    }, 1000);
  };

  const stopProgressPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  // WebSocket connection management (kept for compatibility)
  const connectWebSocket = () => {
    if (socket?.connected) return;

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    socket = io(apiBaseUrl);

    socket.on("connect", () => {
      console.log("🔌 WebSocket connected");
      isConnected.value = true;
    });

    socket.on("disconnect", () => {
      console.log("🔌 WebSocket disconnected");
      isConnected.value = false;
    });

    socket.on("download-progress", (data: DownloadProgress) => {
      console.log("📊 Download progress:", data);
      if (currentDownload.value?.id === data.id) {
        currentDownload.value = {
          ...currentDownload.value,
          ...data,
        };
      }
    });
  };

  const disconnectWebSocket = () => {
    if (socket) {
      socket.disconnect();
      socket = null;
      isConnected.value = false;
    }
  };

  const startServerDownloadWithProgress = async (request: DownloadRequest) => {
    try {
      // Start download with progress tracking
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/download-server`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: request.url,
          format: request.format,
          quality: request.quality,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Download failed");
      }

      if (!result.success) {
        throw new Error(result.error || "Download failed");
      }

      // Set up progress tracking
      const downloadId = result.data.downloadId;
      currentDownload.value = {
        id: downloadId,
        url: request.url,
        format: request.format,
        quality: request.quality,
        status: "starting",
        progress: 0,
        speed: "Starting...",
        eta: "Unknown",
      };

      // Start polling for progress updates
      startProgressPolling(downloadId);

      return {
        success: true,
        downloadId,
        message: "Download started with progress tracking",
      };
    } catch (err) {
      if (currentDownload.value) {
        currentDownload.value.status = "failed";
        currentDownload.value.error =
          err instanceof Error ? err.message : "Download failed";
      }
      error.value = err instanceof Error ? err.message : "Download failed";
      return { success: false, error: error.value };
    }
  };

  const downloadFile = (downloadUrl: string, filename: string) => {
    // Create a temporary link to trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startLegacyDownload = async (request: DownloadRequest) => {
    try {
      // Start download with progress tracking
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/download-legacy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: request.url,
          format: request.format,
          quality: request.quality,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Download failed");
      }

      if (!result.success) {
        throw new Error(result.error || "Download failed");
      }

      // Set up progress tracking
      const downloadId = result.data.downloadId;
      currentDownload.value = {
        id: downloadId,
        url: request.url,
        format: request.format,
        quality: request.quality,
        status: "starting",
        progress: 0,
        speed: "Starting...",
        eta: "Unknown",
      };

      // Start polling for progress updates
      startProgressPolling(downloadId);

      return {
        success: true,
        message: "Download started with progress tracking",
      };
    } catch (err) {
      if (currentDownload.value) {
        currentDownload.value.status = "failed";
        currentDownload.value.error =
          err instanceof Error ? err.message : "Download failed";
      }
      error.value = err instanceof Error ? err.message : "Download failed";
      return { success: false, error: error.value };
    }
  };

  const cancelDownload = () => {
    stopProgressPolling();
    if (currentDownload.value) {
      currentDownload.value.status = "failed";
      currentDownload.value.error = "Download cancelled by user";
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const clearMetadata = () => {
    metadata.value = null;
  };

  const loadHistory = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${apiBaseUrl}/api/history`);
      const result = await response.json();

      if (response.ok && result.success) {
        // Transform API response to match our DownloadHistory type
        downloadHistory.value = result.data.map((item: any) => ({
          id: item.id,
          url: item.url,
          title: item.title || "Unknown Title",
          format: item.format,
          quality: item.quality || "auto",
          fileSize: item.filesize || 0,
          downloadUrl: item.downloadUrl || "",
          createdAt: item.timestamp?.toDate
            ? item.timestamp.toDate()
            : new Date(),
          completedAt: item.timestamp?.toDate
            ? item.timestamp.toDate()
            : new Date(),
          status: "completed" as const,
        }));
      } else {
        // Fallback to localStorage if API fails
        const saved = localStorage.getItem("downloadHistory");
        if (saved) {
          downloadHistory.value = JSON.parse(saved);
        }
      }
    } catch (err) {
      // Fallback to localStorage if API fails
      try {
        const saved = localStorage.getItem("downloadHistory");
        if (saved) {
          downloadHistory.value = JSON.parse(saved);
        }
      } catch (localErr) {
        error.value =
          err instanceof Error ? err.message : "Failed to load history";
      }
    }
  };

  const saveHistory = () => {
    try {
      localStorage.setItem(
        "downloadHistory",
        JSON.stringify(downloadHistory.value)
      );
    } catch (err) {
      console.error("Failed to save history:", err);
    }
  };

  return {
    metadata,
    currentDownload,
    downloadHistory,
    loading,
    error,
    isDownloading,
    isConnected,
    fetchMetadata,
    startDownload,
    startDirectDownload,
    startStreamingDownload,
    startLegacyDownload,
    startServerDownloadWithProgress,
    downloadFile,
    connectWebSocket,
    disconnectWebSocket,
    startProgressPolling,
    stopProgressPolling,
    cancelDownload,
    clearError,
    clearMetadata,
    loadHistory,
    saveHistory,
  };
});
