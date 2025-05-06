#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const manifestPath = path.join('platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.log('⚠️  AndroidManifest.xml não encontrado. Hook ignorado.');
  return;
}

let xml = fs.readFileSync(manifestPath, 'utf8');

// Remove duplicatas de MainActivity
xml = xml.replace(
  /(<activity[\s\S]*?android:name="MainActivity"[\s\S]*?<\/activity>)([\s\S]*?)<activity[\s\S]*?android:name="MainActivity"[\s\S]*?<\/activity>/g,
  '$1'
);

// Remove duplicatas de FCMPluginActivity
xml = xml.replace(
  /(<activity[\s\S]*?com\.gae\.scaffolder\.plugin\.FCMPluginActivity[\s\S]*?<\/activity>)([\s\S]*?)<activity[\s\S]*?com\.gae\.scaffolder\.plugin\.FCMPluginActivity[\s\S]*?<\/activity>/g,
  '$1'
);

// Remove duplicatas de MyFirebaseMessagingService
xml = xml.replace(
  /(<service[\s\S]*?com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService[\s\S]*?<\/service>)([\s\S]*?)<service[\s\S]*?com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService[\s\S]*?<\/service>/g,
  '$1'
);

// Remove duplicatas de FileProvider
xml = xml.replace(
  /(<provider[\s\S]*?org\.apache\.cordova\.camera\.FileProvider[\s\S]*?<\/provider>)([\s\S]*?)<provider[\s\S]*?org\.apache\.cordova\.camera\.FileProvider[\s\S]*?<\/provider>/g,
  '$1'
);

fs.writeFileSync(manifestPath, xml, 'utf8');
console.log('⚙️  AndroidManifest.xml: duplicatas removidas.');