#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const manifestPath = path.join('platforms', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (!fs.existsSync(manifestPath)) {
  console.log('⚠️  AndroidManifest.xml não encontrado. Hook ignorado.');
  return;
}

let xml = fs.readFileSync(manifestPath, 'utf8');

// 1) Remove TODAS as instâncias do MyFirebaseMessagingService
xml = xml.replace(
  /<service[\s\S]*?com\.gae\.scaffolder\.plugin\.MyFirebaseMessagingService[\s\S]*?<\/service>/g,
  ''
);

// 2) Remove TODAS as instâncias do FCMPluginActivity
xml = xml.replace(
  /<activity[\s\S]*?com\.gae\.scaffolder\.plugin\.FCMPluginActivity[\s\S]*?<\/activity>/g,
  ''
);

// 3) Garante android:exported="true" na MainActivity
xml = xml.replace(
  /<activity([^>]*android:name="MainActivity"[^>]*)>/,
  (m, p1) => {
    if (/android:exported=/.test(p1)) return m;
    return `<activity${p1} android:exported="true">`;
  }
);

// 4) Adiciona o MyFirebaseMessagingService manualmente (após remover duplicatas)
const serviceXml = `
    <service android:name="com.gae.scaffolder.plugin.MyFirebaseMessagingService" android:exported="true" android:stopWithTask="false">
        <intent-filter>
            <action android:name="com.google.firebase.MESSAGING_EVENT"/>
        </intent-filter>
    </service>
`;
xml = xml.replace(
  /<\/application>/,
  `${serviceXml}\n    </application>`
);

// 5) Adiciona o FCMPluginActivity manualmente (após remover duplicatas)
const activityXml = `
    <activity android:name="com.gae.scaffolder.plugin.FCMPluginActivity" android:exported="true" android:launchMode="singleTop">
        <intent-filter>
            <action android:name="FCM_PLUGIN_ACTIVITY"/>
            <category android:name="android.intent.category.DEFAULT"/>
        </intent-filter>
    </activity>
`;
xml = xml.replace(
  /<\/application>/,
  `${activityXml}\n    </application>`
);

fs.writeFileSync(manifestPath, xml, 'utf8');
console.log('⚙️  AndroidManifest.xml: duplicatas removidas e FCMPluginActivity/MyFirebaseMessagingService injetados corretamente.');