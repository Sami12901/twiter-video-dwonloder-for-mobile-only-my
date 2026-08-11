#!/bin/bash
# Nexus - Termux 1-Click Setup Script
# Optimized for Realme 11 5G

echo -e "\033[1;34m====================================================\033[0m"
echo -e "\033[1;36m       NEXUS SOCIAL PLATFORM & DOWNLOADER           \033[0m"
echo -e "\033[1;36m           Termux 1-Click Installer                 \033[0m"
echo -e "\033[1;34m====================================================\033[0m"

echo -e "\n\033[1;33m[1/4] Installing Required System Dependencies...\033[0m"
pkg update -y
pkg upgrade -y
pkg install -y nodejs ffmpeg git python build-essential make clang binutils
termux-setup-storage

# Check if the repo exists or needs to be cloned
if [ -d "nexus-platform" ]; then
    echo -e "\n\033[1;33m[2/4] Directory 'nexus-platform' exists, entering...\033[0m"
    cd nexus-platform
else
    # Normally this would be a git clone command if running from curl
    # git clone https://github.com/YOUR_GITHUB_USERNAME/nexus-platform.git
    # cd nexus-platform
    echo -e "\n\033[1;33m[2/4] Setting up local directory...\033[0m"
fi

echo -e "\n\033[1;33m[3/4] Installing NPM Dependencies (This may take a minute)...\033[0m"
npm run install:all

echo -e "\n\033[1;33m[4/4] Setting up Database...\033[0m"
cd backend
npx prisma generate
npx prisma migrate deploy || npx prisma db push
cd ..

echo -e "\n\033[1;32m====================================================\033[0m"
echo -e "\033[1;32m          INSTALLATION COMPLETE!                    \033[0m"
echo -e "\033[1;32m====================================================\033[0m"
echo -e "\nTo start the platform, just run the following command in Termux:\n"
echo -e "\033[1;36m    npm start\033[0m\n"
echo -e "Then open Chrome and go to: \033[1;36mhttp://127.0.0.1:3000\033[0m\n"
