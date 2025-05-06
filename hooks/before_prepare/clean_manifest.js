#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const manifestPath = path.join('platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let xml = fs.readFileSync(manifestPath, 'utf8');
  xml = xml.replace(
    /<service[\s\S]*?com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService[\s\S]*?<\/service>/g,
    ''
  );
  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('Serviço MyFirebaseMessagingService removido do manifesto.');
}