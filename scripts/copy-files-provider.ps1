<#
.SYNOPSIS
  Copy an ASCII file-tree under the current repo (names only, no full paths) plus selected files.
.PARAMETER Depth
  How many levels deep to recurse. Default is unlimited.
#>
[CmdletBinding()]
param(
  [int]$Depth = [int]::MaxValue
)
# where we start
$repoRoot = Resolve-Path "$PSScriptRoot\.."
$repoName = Split-Path $repoRoot -Leaf
# folders/files to skip
$exclude = 'node_modules','.git','.next','.vscode','dist','build','*.log'
function Get-TreeLines {
  param(
    [string]$Path,
    [string]$Prefix = '',
    [int]$Level = 1
  )
  if ($Level -gt $Depth) { return @() }
  $items = Get-ChildItem -LiteralPath $Path `
            | Where-Object { $exclude -notcontains $_.Name } `
            | Sort-Object PSIsContainer, Name -Descending
  $out = @()
  for ($i=0; $i -lt $items.Count; $i++) {
    $item = $items[$i]
    $isLast = ($i -eq $items.Count - 1)
    $branch = $isLast ? '└── ' : '├── '
    $leaf   = [IO.Path]::GetFileName($item.FullName)
    $out += "$Prefix$branch$leaf"
    if ($item.PSIsContainer) {
      $newPrefix = $Prefix + ($isLast ? '    ' : '│   ')
      $out += Get-TreeLines -Path $item.FullName -Prefix $newPrefix -Level ($Level+1)
    }
  }
  return $out
}
# build and copy
$tree  = @("├── $repoName") + (Get-TreeLines -Path $repoRoot -Prefix '│   ')
$files = @(
  # Original files
  'apps\api\.env',
  'apps\api\package.json',
  'apps\api\src\index.js',
  'apps\api\src\components\providers\LocationList.jsx',
  'apps\api\src\components\providers\ProcedureList.jsx',
  'apps\api\src\routes\auth.js',
  'apps\api\src\controllers\locationsController.jsx',
  'apps\web\src\lib\api.ts',
  'apps\web\src\lib\apiClient.ts',
  'apps\web\src\app\context\AuthContext.tsx',
  
  # Profile related files
  'apps\web\src\app\provider\profile\page.tsx',
  'apps\web\src\app\provider\settings\page.tsx',
  'apps\web\src\components\profile\ProfileForm.jsx',
  'apps\web\src\components\profile\ProfileHeader.jsx',
  'apps\web\src\components\settings\SettingsForm.jsx',
  'apps\web\src\components\settings\SecuritySettings.jsx',
  'apps\web\src\components\settings\NotificationSettings.jsx',
  'apps\web\src\services\profileService.ts',
  'apps\web\src\services\settingsService.ts',
  'apps\api\src\routes\profile.js',
  'apps\api\src\routes\settings.js',
  'apps\api\src\controllers\profileController.js',
  'apps\api\src\controllers\settingsController.js',
  'apps\api\src\validation\profile.js',
  'apps\api\src\validation\settings.js'
)
$output = @("// --- FILE TREE ---") + $tree + ''
foreach ($f in $files) {
  $full = Join-Path $repoRoot $f
  if (Test-Path $full) {
    $output += "// --- $f ---"
    $output += (Get-Content $full -Raw).Split("`r`n")
    $output += ''
  }
}
$output -join "`r`n" | Set-Clipboard
Write-Host "✅ Copied tree + $($files.Count) files to clipboard"
