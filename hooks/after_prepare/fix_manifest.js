#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const manifestPath = path.join('platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.log('⚠️  AndroidManifest.xml não encontrado. Hook ignorado.');
  return;
}

let xml = fs.readFileSync(manifestPath, 'utf8');

// Remove duplicates of MainActivity
xml = xml.replace(
  /(<activity[\s\S]*?android:name="MainActivity"[\s\S]*?<\/activity>)([\s\S]*?)<activity[\s\S]*?android:name="MainActivity"[\s\S]*?<\/activity>/g,
  '$1'
);

// Remove duplicates of FCMPluginActivity
xml = xml.replace(
  /(<activity[\s\S]*?android:name="com\.gae\.scaffolder\.plugin\.FCMPluginActivity"[\s\S]*?<\/activity>)([\s\S]*?)<activity[\s\S]*?android:name="com\.gae\.scaffolder\.plugin\.FCMPluginActivity"[\s\S]*?<\/activity>/g,
  '$1'
);

// Remove duplicates of MyFirebaseMessagingService
xml = xml.replace(
  /(<service[\s\S]*?android:name="com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService"[\s\S]*?<\/service>)([\s\S]*?)<service[\s\S]*?android:name="com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService"[\s\S]*?<\/service>/g,
  '$1'
);

// Add android:exported="true" to MainActivity if missing
xml = xml.replace(
  /<activity([^>]*android:name="MainActivity"[^>]*)(>)/,
  (match, p1, p2) => {
    if (/android:exported=/.test(p1)) return match;
    return `<activity${p1} android:exported="true"${p2}`;
  }
);

// Add android:exported="true" to FCMPluginActivity if missing
xml = xml.replace(
  /<activity([^>]*android:name="com\.gae\.scaffolder\.plugin\.FCMPluginActivity"[^>]*)(>)/,
  (match, p1, p2) => {
    if (/android:exported=/.test(p1)) return match;
    return `<activity${p1} android:exported="true"${p2}`;
  }
);

// Add android:exported="true" to MyFirebaseMessagingService if missing
xml = xml.replace(
  /<service([^>]*android:name="com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService"[^>]*)(>)/,
  (match, p1, p2) => {
    if (/android:exported=/.test(p1)) return match;
    return `<service${p1} android:exported="true"${p2}`;
  }
);

fs.writeFileSync(manifestPath, xml, 'utf8');
console.log('⚙️  AndroidManifest.xml: Added android:exported and removed duplicates.');