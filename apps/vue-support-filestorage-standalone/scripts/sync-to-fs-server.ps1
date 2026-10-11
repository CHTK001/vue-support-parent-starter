# 把 standalone 构建产物同步到文件服务器 classpath 静态资源目录。
#
#   dist/index.html   -> spring-support-filesystem-starter/src/main/resources/static/index.html（管理页壳）
#   dist/preview.html -> .../static/preview/index.html（统一预览入口壳，readPreviewShell 读取）
#   dist/assets/*     -> .../static/assets/*（共享 chunk）
#   dist/vendor/*     -> .../static/vendor/*（file-viewer 渲染器资源，Spring 静态资源直出）
#   dist/wasm/*       -> .../static/wasm/*
#
# 用法：在 apps/vue-support-filestorage-standalone 下执行
#   pnpm build; powershell -File scripts/sync-to-fs-server.ps1
#
# 注意：必须先 pnpm build。脚本只覆盖目标文件、不删除多余历史文件
# （assets 带 hash，旧版本残留无碍；如需彻底清理请手动处理）。

$ErrorActionPreference = "Stop"

$appRoot = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $appRoot "dist"
if (-not (Test-Path (Join-Path $dist "index.html"))) {
    Write-Error "dist/index.html 不存在：请先执行 pnpm build"
}

# 用 .NET API 直拷（避免 cmdlet 对 PathInfo 的参数绑定玄学）
$backendStatic = [System.IO.Path]::GetFullPath(
    (Join-Path $appRoot "..\..\..\spring-support-parent-starter\spring-support-filesystem-starter\src\main\resources\static"))
if (-not [System.IO.Directory]::Exists($backendStatic)) {
    Write-Error "后端静态资源目录不存在：$backendStatic"
}

function Sync-CopyFile([string]$src, [string]$dest) {
    $destParent = [System.IO.Path]::GetDirectoryName($dest)
    if (-not [System.IO.Directory]::Exists($destParent)) {
        [System.IO.Directory]::CreateDirectory($destParent) | Out-Null
    }
    [System.IO.File]::Copy($src, $dest, $true)
    Write-Host "sync: $src -> $dest"
}

# 1. 两个入口壳（preview.html 改名为 preview/index.html）
Sync-CopyFile (Join-Path $dist "index.html") (Join-Path $backendStatic "index.html")
Sync-CopyFile (Join-Path $dist "preview.html") (Join-Path $backendStatic "preview\index.html")

# 2. 共享构建产物目录
foreach ($dir in @("assets", "vendor", "wasm")) {
    $srcDir = Join-Path $dist $dir
    if (Test-Path $srcDir) {
        $destDir = Join-Path $backendStatic $dir
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $srcDir "*") -Destination $destDir -Recurse -Force
        Write-Host "sync: $dir/* -> $destDir"
    }
}

# 3. 渲染器资产清单（若存在）
$manifest = Join-Path $dist "flyfish-viewer-assets.json"
if (Test-Path $manifest) {
    Sync-CopyFile $manifest (Join-Path $backendStatic "flyfish-viewer-assets.json")
}

Write-Host "同步完成：$backendStatic"
