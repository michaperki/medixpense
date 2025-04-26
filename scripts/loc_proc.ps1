
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
  # --- Auth Controller with duplicate validation block ---
  'apps\api\src\controllers\authController.js',

  # --- Auth Middleware ---
  'apps\api\src\middleware\auth.js',

  # --- Auth Routes ---
  'apps\api\src\routes\auth.js',

  # --- Frontend Auth Context ---
  'apps\web\src\app\context\AuthContext.tsx',

  # --- Auth Validation ---
  'apps\api\src\validation\auth.js',

  # --- Locations Controller (for GET /locations/:id and /:locationId/procedures) ---
  'apps\api\src\controllers\locationsController.js',

  # --- Procedures Controller (for getProceduresByLocation and related endpoints) ---
  'apps\api\src\controllers\proceduresController.js',

  # --- Locations Routes (wire /:locationId/procedures to getProceduresByLocation) ---
  'apps\api\src\routes\locations.js',

  # --- Procedures Routes (if separate, but you didn't show one, so skip for now) ---
  'apps\web\src\app\provider\locations\[locationId]\add-procedure\page.tsx',

  # --- Frontend Procedures Page (Location Procedures Management UI) ---
  'apps\web\src\app\provider\locations\[locationId]\procedures\page.tsx',

  # --- Frontend API Client (to fix getProceduresByLocation output) ---
  'apps\web\src\lib\api.ts'
  'apps\web\src\lib\apiClient.ts'
  'packages\logger\core.ts'
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

