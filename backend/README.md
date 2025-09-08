# Video Downloader Backend

Local backend server for the video downloader application.

## Prerequisites

Before running the backend, make sure you have the following installed:

1. **Node.js** (v16 or higher)
2. **Python 3** (for yt-dlp)
3. **yt-dlp** - Video downloader tool
4. **FFmpeg** - Video/audio converter

### Installation

#### Windows

```bash
# Install yt-dlp
pip install yt-dlp

# Install FFmpeg
# Download from https://ffmpeg.org/download.html
# Or use chocolatey: choco install ffmpeg
```

#### macOS

```bash
# Install yt-dlp
pip3 install yt-dlp

# Install FFmpeg
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)

```bash
# Install yt-dlp
pip3 install yt-dlp

# Install FFmpeg
sudo apt update
sudo apt install ffmpeg
```

## Setup

1. **Install dependencies:**

   ```bash
   cd backend
   npm install
   ```

2. **Configure environment (optional):**

   ```bash
   cp env.example .env
   # Edit .env with your Firebase credentials if you want cloud storage
   ```

3. **Start the server:**

   ```bash
   # Development mode (with auto-restart)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Health Check

- **GET** `/health` - Check server status

### Video Metadata

- **POST** `/api/metadata`
  - Body: `{ "url": "https://youtube.com/watch?v=..." }`
  - Returns: Video information and available formats

### Download Video

- **POST** `/api/download`
  - Body: `{ "url": "...", "format": "best", "quality": "720" }`
  - Returns: Download information and file URL

### Download History

- **GET** `/api/history` - Get download history (requires Firebase)

### File Download

- **GET** `/api/download-file/:filename` - Download a specific file

## Configuration

### Local Mode (Default)

- Files are stored in `./downloads/` directory
- No cloud storage or database
- Perfect for development and testing

### Firebase Mode (Optional)

- Set up Firebase credentials in `.env`
- Files uploaded to Firebase Storage
- Download history stored in Firestore
- Requires Firebase project setup

## Troubleshooting

### yt-dlp not found

Make sure yt-dlp is installed and accessible from command line:

```bash
yt-dlp --version
```

### FFmpeg not found

Make sure FFmpeg is installed and accessible from command line:

```bash
ffmpeg -version
```

### Permission errors

On Linux/macOS, you might need to make the downloads directory writable:

```bash
chmod 755 downloads/
```

## Development

The server runs on `http://localhost:3000` by default. Make sure your frontend is configured to connect to this URL.

For development with auto-restart:

```bash
npm run dev
```
