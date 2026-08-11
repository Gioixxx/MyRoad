<#
.SYNOPSIS
  Ricostruisce l'APK Android firmato del gioco: export statico Next.js -> sync Capacitor ->
  assembleRelease (firmato con android/keystore.properties) -> dist/MyRoad.apk.

.DESCRIPTION
  Da rilanciare ogni volta che si vuole distribuire una nuova versione ai tester Android.
  Richiede android/keystore.properties (locale, MAI committato, vedi android/.gitignore) che
  punta alla keystore di firma di release — senza quel file la build risulta non firmata e
  Android tratterà ogni installazione come un'app diversa invece che un aggiornamento (vedi
  android/app/build.gradle e .claude/memory/decisions.md per il dettaglio).
  Richiede JAVA_HOME/ANDROID_HOME impostati (es. Android Studio JBR + Android SDK locale).
#>

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$androidDir = Join-Path $repoRoot "android"
$distDir = Join-Path $repoRoot "dist"

if (-not (Test-Path (Join-Path $androidDir "keystore.properties"))) {
    throw "android/keystore.properties non trovato — la build non sarebbe firmata con una chiave stabile. Vedi lo script per il dettaglio."
}

Write-Host "==> npm run build (export statico Next.js)" -ForegroundColor Cyan
Push-Location $repoRoot
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build fallito (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

Write-Host "==> npx cap sync android" -ForegroundColor Cyan
Push-Location $repoRoot
try {
    npx cap sync android
    if ($LASTEXITCODE -ne 0) { throw "cap sync fallito (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

$packageJson = Get-Content (Join-Path $repoRoot "package.json") -Raw | ConvertFrom-Json
Write-Host "==> Versione da package.json: $($packageJson.version)" -ForegroundColor Cyan

Write-Host "==> gradlew assembleRelease (firmato)" -ForegroundColor Cyan
Push-Location $androidDir
try {
    & .\gradlew.bat assembleRelease
    if ($LASTEXITCODE -ne 0) { throw "gradlew assembleRelease fallito (exit $LASTEXITCODE)" }
} finally {
    Pop-Location
}

$apkSrc = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apkSrc)) { throw "APK di release non trovata in $apkSrc" }

Write-Host "==> Copio l'APK in dist/MyRoad.apk" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $distDir | Out-Null
Copy-Item $apkSrc (Join-Path $distDir "MyRoad.apk") -Force

$apk = Get-Item (Join-Path $distDir "MyRoad.apk")
Write-Host "==> Fatto: $($apk.FullName) ($([math]::Round($apk.Length / 1MB, 1)) MB)" -ForegroundColor Green
