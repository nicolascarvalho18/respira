@echo off
set ANDROID_HOME=C:\Users\dev\AppData\Local\Android\Sdk
set PATH=C:\Users\dev\AppData\Local\Android\Sdk\platform-tools;C:\Users\dev\AppData\Local\Android\Sdk\emulator;%PATH%
echo Starting Expo on Android...
npx expo start --android
