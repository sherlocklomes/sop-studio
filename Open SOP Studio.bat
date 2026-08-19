@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required to run SOP Studio.
  echo Install it from https://nodejs.org and try again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing SOP Studio...
  call npm.cmd install
  if errorlevel 1 (
    echo Install failed.
    pause
    exit /b 1
  )
)
echo.
echo SOP Studio will open at http://localhost:5177
echo Keep this window open while you work. Close it to stop the server.
echo.
call npm.cmd run dev
