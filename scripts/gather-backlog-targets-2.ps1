
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
$files += @(
  'apps\web\src\services\settingsService.ts',
  'apps\web\src\services\searchService.ts',
  'apps\web\src\services\profileService.ts',
  'apps\web\src\services\procedureService.ts',
  'apps\web\src\services\notificationService.ts',
  'apps\web\src\services\locationService.ts',
  'apps\web\src\hooks\useToast.tsx',
  'apps\web\src\hooks\useQuery.ts',
  'apps\web\src\app\provider\dashboard\page.tsx',
  'apps\web\src\app\provider\profile\page.tsx',
  'apps\web\src\app\provider\settings\page.tsx',
  'apps\web\src\app\provider\procedures\page.tsx',
  'apps\web\src\app\(public)\search\results\page.tsx',
  'packages\database\prisma\seeds\subscription-tiers.js',
  'packages\database\prisma\seeds\procedure-categories.js',
  'packages\database\prisma\seeds\location-seeds.js'
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

