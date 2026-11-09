# Nova Launcher CI Windows test build.
# Uses a clean pinned Modrinth checkout and the Nova UI source from this repository.
# Supports GitHub Actions and GitLab CI without depending on their runner directory names.
# This is UNSIGNED and NOT a public release.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
Set-StrictMode -Version Latest
function Assert-Exit([string]$task) { if ($LASTEXITCODE -ne 0) { throw "$task failed, exit $LASTEXITCODE" } }

if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_WORKSPACE)) {
  $repo = $env:GITHUB_WORKSPACE
} elseif (-not [string]::IsNullOrWhiteSpace($env:CI_PROJECT_DIR)) {
  $repo = $env:CI_PROJECT_DIR
} else {
  throw 'Run inside a GitHub Actions or GitLab CI Windows job.'
}
$tools = Join-Path $repo '.nova-tools'
$target = Join-Path $repo 'modrinth-upstream'
$nodeVersion = '24.15.0'
$pnpmVersion = '12.11.2'
$upstreamSha = 'f73010ae0809813120a16b733a3d0bfd23f76e24'
New-Item -ItemType Directory -Force -Path $tools | Out-Null

Write-Host '--- 1/7 Node and pnpm ---'
$nodeName = "node-v$nodeVersion-win-x64"
$nodeZip = Join-Path $tools "$nodeName.zip"
$nodeBin = Join-Path $tools "$nodeName\node.exe"
if (!(Test-Path $nodeBin)) {
  Invoke-WebRequest -Uri "https://nodejs.org/dist/v$nodeVersion/$nodeName.zip" -OutFile $nodeZip -UseBasicParsing
  Expand-Archive -Path $nodeZip -DestinationPath $tools -Force
}
$env:PATH = "$(Split-Path $nodeBin -Parent);$env:PATH"
$env:npm_config_prefix = Join-Path $tools 'npm-global'
New-Item -ItemType Directory -Force -Path $env:npm_config_prefix | Out-Null
$env:PATH = "$env:npm_config_prefix;$env:PATH"
& npm.cmd install --global "pnpm@$pnpmVersion" --no-audit --no-fund
Assert-Exit 'pnpm install'
& node.exe --version
Assert-Exit 'Node version'
& pnpm.cmd --version
Assert-Exit 'pnpm version'

Write-Host '--- 2/7 Get pinned Modrinth source ---'
New-Item -ItemType Directory -Force -Path $target | Out-Null
Push-Location $target
try {
  & git init -q
  Assert-Exit 'git init'
  & git remote add origin 'https://github.com/modrinth/code.git'
  Assert-Exit 'git remote'
  & git fetch --depth 1 origin $upstreamSha
  Assert-Exit 'git fetch upstream'
  & git checkout -q --detach FETCH_HEAD
  Assert-Exit 'git checkout upstream'
  $actualSha = (& git rev-parse HEAD).Trim()
  Assert-Exit 'git rev-parse'
  if ($actualSha -ne $upstreamSha) { throw "Unexpected upstream revision $actualSha" }
} finally { Pop-Location }

Write-Host '--- 3/7 Install Rust toolchain ---'
& git config --global core.longpaths true
Assert-Exit 'Enable long Git paths'
$env:CARGO_HOME = 'C:\c' # Short root avoids Windows MAX_PATH in tauri git dependencies
$env:RUSTUP_HOME = 'C:\r'
$env:PATH = "$env:CARGO_HOME\bin;$env:PATH"
if (!(Test-Path (Join-Path $env:CARGO_HOME 'bin\rustc.exe'))) {
  $rustupInit = Join-Path $tools 'rustup-init.exe'
  Invoke-WebRequest -Uri 'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe' -OutFile $rustupInit -UseBasicParsing
  & $rustupInit -y --no-modify-path --profile minimal --default-toolchain stable-x86_64-pc-windows-msvc
  Assert-Exit 'rustup'
}
& cargo.exe --version
Assert-Exit 'cargo'

Write-Host '--- 4/7 Ensure JDK 17 ---'
$jdk = @()
$jdkRoot = 'C:\Program Files\Eclipse Adoptium'
if (Test-Path $jdkRoot) {
  $jdk = @(Get-ChildItem $jdkRoot -Directory | Where-Object { $_.Name -match '^jdk-17' })
}
if ($jdk.Count -eq 0) {
  & choco.exe install temurin17 -y --no-progress
  Assert-Exit 'Install JDK 17'
  $jdk = @(Get-ChildItem $jdkRoot -Directory | Where-Object { $_.Name -match '^jdk-17' })
}
if ($jdk.Count -eq 0) { throw 'Cannot locate JDK 17' }
$env:JAVA_HOME = $jdk[0].FullName
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
& java.exe -version
Assert-Exit 'JDK validation'

Write-Host '--- 5/7 Apply Nova source and generate distinct Windows icons ---'
& node.exe (Join-Path $repo 'nova\apply.mjs') $target
Assert-Exit 'Nova patch'
& python.exe -m pip install --disable-pip-version-check Pillow
Assert-Exit 'Install Pillow'
& python.exe (Join-Path $repo 'nova\generate_icon.py') (Join-Path $target 'apps\app\icons')
Assert-Exit 'Generate Nova icons'
Copy-Item (Join-Path $target 'packages\app-lib\.env.prod') (Join-Path $target 'packages\app-lib\.env') -Force

Write-Host '--- 6/7 Install dependencies and compile ---'
$env:CARGO_INCREMENTAL = '0'
$env:CARGO_BUILD_JOBS = '2'
$env:TURBO_TELEMETRY_DISABLED = '1'
Push-Location $target
try {
  & pnpm.cmd install --frozen-lockfile
  Assert-Exit 'pnpm install upstream'
  # Do NOT use tauri-release.conf.json: it contains Modrinth signing and updater settings.
  & pnpm.cmd --filter=@modrinth/app run tauri build --bundles nsis
  Assert-Exit 'Tauri Windows NSIS build'
} finally { Pop-Location }

Write-Host '--- 7/7 Export unsigned installer and SHA256 ---'
$nsis = Join-Path $target 'target\release\bundle\nsis'
$installers = @(Get-ChildItem -Path $nsis -Filter '*setup.exe' -File -ErrorAction SilentlyContinue)
if ($installers.Count -eq 0) { throw "No NSIS installer found in $nsis" }
$output = Join-Path $repo 'out'
New-Item -ItemType Directory -Force -Path $output | Out-Null
foreach ($installer in $installers) {
  $destination = Join-Path $output ('NovaLauncher-UNSIGNED-TEST-' + $installer.Name)
  Copy-Item -LiteralPath $installer.FullName -Destination $destination -Force
  $hash = (Get-FileHash $destination -Algorithm SHA256).Hash.ToLowerInvariant()
  Set-Content -Path "$destination.sha256" -Value "$hash  $(Split-Path $destination -Leaf)" -Encoding ascii
  Write-Host "Built: $destination"
}
Write-Host 'This is an unsigned development installer. Microsoft login, game launch, asset licensing, and updates still require validation.'
