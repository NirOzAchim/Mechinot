@echo off
chcp 65001 >nul 2>&1
cd /d "%~dp0"
title Mechinot

rem ============================================================
rem   The only thing you need to run.
rem   Double-click it in Explorer, or  .\start.cmd  in a terminal.
rem   ------------------------------------------------------------
rem   It pulls the latest code, installs what is missing, clears
rem   the Vite cache, starts the server and opens the browser.
rem
rem   ~~ WHY THIS FILE TALKS ENGLISH ~~
rem   The Windows console has no bidi support. Hebrew printed here
rem   comes out reversed character by character - it looks broken,
rem   and nobody can read the one line that tells them what to do.
rem   The app is Hebrew; this window is not, and that is deliberate.
rem
rem   ~ npm.cmd, not npm, and one command per line ~
rem     ExecutionPolicy blocks npm.ps1, and cmd.exe has no &&.
rem ============================================================

echo.
echo   ==========================================
echo      M E C H I N O T
echo   ==========================================
echo.

rem ============================================================
rem  0. Is a server already running?
rem  ------------------------------------------------------------
rem  ~~ WHY THIS STOPS INSTEAD OF OPENING THE BROWSER ~~
rem  The first version saw the port taken, said "already running"
rem  and opened the browser. That is exactly wrong right after an
rem  update: Vite serves the client FROM DISK while the Node
rem  process keeps the routes it loaded at startup - so the browser
rem  gets a new screen against an old server, and the answer is
rem  "no endpoint named admin/state". A message that describes the
rem  symptom precisely and sends you hunting a bug that isn't there.
rem
rem  A server left over from before the pull is the common case,
rem  not the exception. So the default is to stop and say so.
rem
rem  ~ goto labels, not a parenthesised block ~
rem    choice plus conditions inside one block is a permanent
rem    source of batch bugs. A label costs two lines and works.
rem ============================================================
netstat -ano | findstr ":5180 " | findstr "LISTENING" >nul 2>&1
if not errorlevel 1 goto running
goto notrunning

:running
echo   [!] A server is already running on port 5180, in another window.
echo.
echo       If you just pulled new code, THAT SERVER IS STALE: it still
echo       serves the routes it loaded when it started, while the
echo       browser gets the new screen from disk. The screen then says
echo       "no endpoint named ...".
echo.
echo   ------------------------------------------
echo      1   Restart it  (recommended)
echo      2   Leave it, just open the browser
echo      3   Quit
echo   ------------------------------------------
echo.
choice /c 123 /n /m "   Choose 1, 2 or 3:  "
if errorlevel 3 goto bye
if errorlevel 2 goto justopen

rem ~~ WHY THIS KILLS BY PORT AND DOES NOT ASK ~~
rem The previous version said "close that window and run again".
rem That failed in practice: there is no reliable way for someone to
rem know WHICH of their open windows holds the server, and a wrong
rem guess leaves them staring at the same error with no idea why.
rem The port knows exactly which process it is. Asking a person to
rem do what the machine can do precisely is how instructions fail.
echo.
echo   Stopping the old server...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5180 " ^| findstr "LISTENING"') do taskkill /f /pid %%p >nul 2>&1
rem  ~ give the socket a moment, or the new bind hits EADDRINUSE ~
timeout /t 2 >nul
echo   Stopped.
echo.
goto notrunning

:justopen
start http://localhost:5180/console

:bye
exit /b 0

:notrunning

rem ---------- 1. Pull ----------
where git >nul 2>&1
if errorlevel 1 goto skipgit

echo   [1/4] Pulling the latest code...

rem  ~~ A SILENT STASH IS NOT A SAVE ~~
rem  A local change blocks git pull with a message that explains
rem  nothing, and the copy quietly stays behind. stash is
rem  reversible - but someone who does not know their change was
rem  moved will never go looking for it. So it is said out loud.
set MX_STASHED=
for /f "delims=" %%i in ('git status --porcelain 2^>nul') do set MX_STASHED=1
if defined MX_STASHED (
  git stash push -u -m "start.cmd" >nul 2>&1
  echo.
  echo   [!] You had local changes. They were stashed so the pull could run.
  echo       To bring them back:  git stash pop
  echo.
)

git pull --ff-only 2>nul
if errorlevel 1 (
  echo   [!] Could not pull. Continuing with what is on disk.
)
goto aftergit

:skipgit
echo   [1/4] git is not installed - skipping the pull.

:aftergit

rem ---------- 2. Install ----------
if not exist node_modules (
  echo   [2/4] Installing packages. First time, about a minute...
  call npm.cmd install
) else (
  echo   [2/4] Packages are installed.
)

rem ---------- 3. Vite cache ----------
rem  ~~ NEW SOURCE FILE, CACHE HOLDING THE OLD BUNDLE ~~
rem  node_modules\.vite keeps a bundle built before the file
rem  existed, and importing it fails with ReferenceError on code
rem  that is perfectly correct: the build passes, the browser
rem  shows a white screen. Deleting it costs a second and saves
rem  an hour.
echo   [3/4] Clearing cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite

rem ---------- 4. Server, then browser ----------
rem  ~ the browser opens AFTER the server answers, not with it ~
rem    Opening immediately gives "cannot connect", and whoever
rem    sees that concludes it is broken.
echo   [4/4] Starting the server...
echo.
echo   ------------------------------------------
echo     The console opens in your browser shortly:
echo     http://localhost:5180/console
echo.
echo     On first run it asks you to create a root
echo     admin - a username and password you pick.
echo   ------------------------------------------
echo.
echo   To stop: Ctrl+C, or just close this window.
echo.

start "" cmd /c "timeout /t 7 >nul & start http://localhost:5180/console"

call npm.cmd run dev

echo.
echo   Server stopped.
pause
