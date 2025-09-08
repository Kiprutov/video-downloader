@echo off
echo Testing Video Downloader Backend
echo.

REM Test health endpoint
echo Testing health endpoint...
curl -s http://localhost:3000/health
echo.
echo.

REM Test metadata endpoint with a sample YouTube URL
echo Testing metadata endpoint...
curl -X POST http://localhost:3000/api/metadata ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
echo.
echo.

echo Test completed!
pause
