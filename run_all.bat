@echo off
title Repositorio Académico — Arranque de Servidores
color 0B
cls

echo =====================================================================
echo  Colegio Nuestra Señora de Fátima — Repositorio Académico
echo  Desarrollado por: Alejandro Villa — Servicio Comunitario USM
echo =====================================================================
echo.
echo  [1/2] Iniciando Servidor BACKEND (pnpm run dev)...
start "Backend - Repositorio Académico" cmd /k "cd backend && pnpm run dev"

echo  [2/2] Iniciando Servidor FRONTEND (pnpm run dev)...
start "Frontend - Repositorio Académico" cmd /k "cd frontend && pnpm run dev"
echo.
echo =====================================================================
echo  ¡Listo! Los servidores se han iniciado en ventanas independientes.
echo.
echo  * Backend:  http://localhost:3001/api (Health check: /api/health)
echo  * Frontend: http://localhost:5173/usuarios
echo.
echo  Por favor, NO cierres las nuevas ventanas abiertas para mantener
echo  los servidores activos.
echo =====================================================================
echo.
pause
