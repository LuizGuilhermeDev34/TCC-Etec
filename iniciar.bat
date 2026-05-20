@echo off
title PoliticosBR
echo.
echo  ==========================================
echo   PoliticosBR - Iniciando...
echo  ==========================================
echo.

:: Mata processos nas portas 8000 e 3000 se ja estiverem rodando
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000 " ^| findstr "LISTENING" 2^>nul') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

:: [1/2] Backend - usa caminho completo do Python para evitar resolver o stub da Microsoft Store
echo  [1/2] Iniciando backend (FastAPI)...
start "Backend - PoliticosBR" /D "%~dp0backend" cmd /k "C:\Users\luizk\AppData\Local\Programs\Python\Python314\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

:: Aguarda backend inicializar (loop ate responder ou timeout de 30s)
echo  Aguardando backend ficar pronto...
set TRIES=0
:WAIT_BACKEND
set /a TRIES+=1
if %TRIES% gtr 15 goto BACKEND_TIMEOUT
timeout /t 2 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:8000/api/v1' -UseBasicParsing -TimeoutSec 2; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto WAIT_BACKEND
echo  Backend pronto!
goto BACKEND_OK

:BACKEND_TIMEOUT
echo  [AVISO] Backend demorou mais que o esperado. Continuando mesmo assim...

:BACKEND_OK

:: [2/2] Frontend
echo  [2/2] Iniciando frontend (Vite)...
start "Frontend - PoliticosBR" /D "%~dp0" cmd /k "npm run dev"

:: Aguarda frontend compilar
echo  Aguardando frontend compilar...
timeout /t 8 /nobreak >nul

:: Abre o navegador
echo  Abrindo navegador em http://localhost:3000 ...
start http://localhost:3000

echo.
echo  ==========================================
echo   Tudo iniciado!
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   Feche as janelas pretas para encerrar.
echo  ==========================================
echo.
