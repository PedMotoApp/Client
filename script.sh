#!/bin/bash

ionic cordova build android --aot --minifyjs --minifycss --release

cd platforms/android

jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -storepass "123diego" -keypass "123diego" -keystore /home/diego/Downloads/my-release-key.keystore /home/diego/Documentos/Projetos/Diversos/NosVeja/platforms/android/app/build/outputs/bundle/release/app-release.aab Principal

./gradlew bundleRelease && jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -storepass "123diego" -keypass "123diego" -keystore /home/diego/Downloads/my-release-key.keystore ./app/build/outputs/bundle/release/app-release.aab Principal && cp ./app/build/outputs/bundle/release/app-release.aab /tmp/
