#!/bin/bash

# Define environment variables for passwords
STORE_PASS="123diego"
KEY_PASS="123diego"

# Check if environment variables are set
if [ -z "$STORE_PASS" ] || [ -z "$KEY_PASS" ]; then
  echo "Error: STORE_PASS and KEY_PASS must be set."
  exit 1
fi

# Export passwords for Gradle
export STORE_PASS
export KEY_PASS

# Build the release APK with optimizations
ionic cordova build android --release --aot --minifyjs --minifycss

# Navigate to the Android platform directory
cd platforms/android

# Verify the signed APK produced by Gradle
apksigner verify --verbose ./app/build/outputs/apk/release/app-release.apk

# Copy the verified APK to the desired location
cp ./app/build/outputs/apk/release/app-release.apk /tmp/app-release-signed.apk