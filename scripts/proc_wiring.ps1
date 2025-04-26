
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
        [int]   $Level  = 1
    )
    if ($Level -gt $Depth) { return @() }

    $items = Get-ChildItem -LiteralPath $Path `
             | Where-Object { $exclude -notcontains $_.Name } `
             | Sort-Object PSIsContainer, Name -Descending

    $out = @()
    for ($i = 0; $i -lt $items.Count; $i++) {
        $item   = $items[$i]
        $isLast = ($i -eq $items.Count - 1)
        $branch = $isLast ? '└── ' : '├── '
        $leaf   = $item.Name

        $out += "$Prefix$branch$leaf"

        if ($item.PSIsContainer) {
            $newPrefix = $Prefix + ($isLast ? '    ' : '│   ')
            $out += Get-TreeLines -Path $item.FullName -Prefix $newPrefix -Level ($Level + 1)
        }
    }

    return $out
}

# list of files to include
$files = @(
    # --- Locations Controller (GET /locations and /locations/:locationId/procedures) ---
    'apps\api\src\controllers\locationsController.js',

    # --- Procedures Controller (create, update, fetch procedures) ---
    'apps\api\src\controllers\proceduresController.js',

    # --- Search Controller (search endpoints for procedures and templates) ---
    'apps\api\src\controllers\searchController.js',

    # --- Locations Routes (wiring /locations and /locations/:locationId/procedures) ---
    'apps\api\src\routes\locations.js',

    # --- Procedures Routes (wiring /procedures endpoints) ---
    'apps\api\src\routes\procedures.js',

    # --- Search Routes (wiring /search or /procedures search endpoints) ---
    'apps\api\src\routes\search.js',

    # --- Frontend Location Procedures Page (UI for listing procedures) ---
    'apps\web\src\app\provider\locations\[locationId]\procedures\page.tsx',

    # --- Frontend Add Procedure Page (UI for adding a new procedure) ---
    'apps\web\src\app\provider\locations\[locationId]\add-procedure\page.tsx',

    # --- Frontend Procedures Overview Page ---
    'apps\web\src\app\provider\procedures\page.tsx',

    # --- Frontend API Definitions (typed methods for backend calls) ---
    'apps\web\src\lib\api.ts',

    # --- Frontend API Client (Axios instance configuration) ---
    'apps\web\src\lib\apiClient.ts',

    # --- Frontend Logger (client-side logging utilities) ---
    'apps\web\src\lib\logger.ts',

    # --- Location Service (client-side abstraction for /locations) ---
    'apps\web\src\services\locationService.ts',

    # --- Procedure Service (client-side abstraction for /procedures) ---
    'apps\web\src\services\procedureService.ts',

    # --- Search Service (client-side abstraction for search) ---
    'apps\web\src\services\searchService.ts',

    # --- Main Logger Core (shared logging utilities, node & browser) ---
    'packages\logger\core.ts'
)

# build the ASCII tree
$tree = @("├── $repoName") + (Get-TreeLines -Path $repoRoot -Prefix '│   ')

# initialize output and missing lists
$output   = @("// --- FILE TREE ---") + $tree + ''
$notFound = @()

# append each file or track missing
foreach ($f in $files) {
    $full = Join-Path $repoRoot $f

    if (Test-Path -LiteralPath $full) {
        $output += "// --- $f ---"
        $output += (Get-Content -LiteralPath $full -Raw).Split("`r`n")
        $output += ''
    }
    else {
        $notFound += $f
    }
}

# assemble full text
$text = $output -join "`r`n"

# count tokens (whitespace-separated)
$tokenCount = ($text -split '\s+').Count

# copy to clipboard and report
$text | Set-Clipboard
Write-Host "✅ Copied tree + $($files.Count) files to clipboard"
Write-Host "ℹ️ Total tokens copied: $tokenCount"

if ($notFound.Count) {
    Write-Host "⚠️ The following files were NOT found:"
    $notFound | ForEach-Object { Write-Host "   - $_" }
}

