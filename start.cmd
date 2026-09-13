@echo off
cd /d "%~dp0"
if not exist node_modules ( call npm.cmd install )
if not exist .data ( call npm.cmd run seed )
call npm.cmd run dev
pause
