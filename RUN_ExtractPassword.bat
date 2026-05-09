@echo off
title Tozed Router Password Extractor
powershell -ExecutionPolicy Bypass -File "%~dp0GetRouterPassword.ps1"
pause
