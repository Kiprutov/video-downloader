@echo off
echo Starting Video Downloader (Local Development)
echo.

REM Check if backend directory exists
if not exist "backend" (
    echo ERROR: Backend directory not found. Please run setup-backend.bat first.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "frontend" (
    echo ERROR: Frontend directory not found.
    pause
    exit /b 1
)

echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm start"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers are starting up!
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
