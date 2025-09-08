export interface VideoMetadata {
  id: string
  title: string
  description?: string
  duration?: number
  thumbnail?: string
  uploader?: string
  upload_date?: string
  formats: VideoFormat[]
}

export interface VideoFormat {
  format_id: string
  format: string
  ext: string
  resolution?: string
  fps?: number
  vcodec?: string
  acodec?: string
  filesize?: number
  quality?: number
  vbr?: number
  abr?: number
}

export interface DownloadRequest {
  url: string;
  format: string;
  quality?: string;
  type?: "local" | "cloud";
}

export interface DownloadProgress {
  id: string;
  url?: string;
  format?: string;
  quality?: string;
  status: "pending" | "downloading" | "converting" | "completed" | "failed";
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
}

export interface DownloadHistory {
  id: string
  url: string
  title: string
  format: string
  quality: string
  fileSize: number
  downloadUrl: string
  createdAt: Date
  completedAt?: Date
  status: 'completed' | 'failed'
}

export interface User {
  uid: string
  email: string
  displayName?: string
  photoURL?: string
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ValidationError {
  field: string
  message: string
}

export type SupportedPlatform = 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'twitter'

export interface PlatformInfo {
  name: string
  icon: string
  supported: boolean
  maxQuality: string
}
