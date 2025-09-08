@echo off
echo Setting up Video Downloader Backend...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js first.
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed. Please install Python first.
    echo Download from: https://python.org/
    pause
    exit /b 1
)

REM Check if yt-dlp is installed
yt-dlp --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing yt-dlp...
    pip install yt-dlp
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install yt-dlp
        pause
        exit /b 1
    )
)

REM Check if FFmpeg is installed
ffmpeg -version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: FFmpeg is not installed. Video conversion may not work.
    echo Download from: https://ffmpeg.org/download.html
    echo Or install via chocolatey: choco install ffmpeg
    echo.
)

REM Create backend directory if it doesn't exist
if not exist "backend" (
    echo Creating backend directory...
    mkdir backend
)

REM Install backend dependencies
echo Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy env.example .env
    echo.
    echo .env file created. You can edit it to add Firebase credentials if needed.
)

REM Create downloads directory
if not exist "downloads" (
    echo Creating downloads directory...
    mkdir downloads
)

echo.
echo ✅ Backend setup complete!
echo.
echo To start the backend server:
echo   cd backend
echo   npm start
echo.
echo Or for development with auto-restart:
echo   cd backend
echo   npm run dev
echo.
pause
