#!/bin/bash

# Caffeine.Pro APK Build Script
# This script builds the Android APK using Capacitor

set -e

echo "🚀 Building Caffeine.Pro APK..."
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Step 2: Build web app
echo "🔨 Building web app..."
npm run build

# Step 3: Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Step 4: Build APK
echo "📱 Building Android APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug

# Step 5: Copy APK to project root
echo "📋 Copying APK..."
cp app/build/outputs/apk/debug/app-debug.apk ../caffeine-pro-debug.apk

echo ""
echo "✅ Build complete!"
echo "📱 APK location: caffeine-pro-debug.apk"
echo ""
echo "To install on a connected device:"
echo "  adb install caffeine-pro-debug.apk"
