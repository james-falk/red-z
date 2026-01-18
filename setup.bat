@echo off
REM Fantasy Red Zone - Quick Setup Script for Windows

echo 🚀 Fantasy Red Zone Setup
echo =========================
echo.

REM Check if pnpm is installed
where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pnpm is not installed. Please install it first:
    echo    npm install -g pnpm
    exit /b 1
)

echo ✓ pnpm found

REM Install dependencies
echo.
echo 📦 Installing dependencies...
call pnpm install

REM Build shared package
echo.
echo 🔨 Building shared package...
cd packages\shared
call pnpm build
cd ..\..

REM Check if .env files exist
echo.
echo 🔍 Checking environment files...

if not exist "apps\api\.env" (
    echo ⚠️  apps\api\.env not found. Creating from example...
    copy apps\api\env.example apps\api\.env
    echo    Please edit apps\api\.env with your configuration
)

if not exist "apps\web\.env" (
    echo ⚠️  apps\web\.env not found. Creating from example...
    copy apps\web\env.example apps\web\.env
    echo    Please edit apps\web\.env with your configuration
)

REM Set up database
echo.
echo 🗄️  Setting up database...
echo    Make sure PostgreSQL is running!
cd apps\api
call pnpm db:generate
call pnpm db:push
call pnpm db:seed
cd ..\..

echo.
echo ✅ Setup complete!
echo.
echo 📝 Next steps:
echo    1. Edit apps\api\.env and apps\web\.env with your configuration
echo    2. Set up Google OAuth credentials in apps\web\.env
echo    3. Run 'pnpm dev' to start development servers
echo.
echo 🌐 Access:
echo    - Frontend: http://localhost:3000
echo    - API: http://localhost:4000
echo.
echo 📚 See SETUP.md for detailed instructions

pause
