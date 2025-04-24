
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
  # --- Backend API ---
  'apps\api\src\controllers\*.js',
  'apps\api\src\routes\*.js',
  'apps\api\src\services\*.js',
  'apps\api\src\middleware\*.js',
  'apps\api\src\validation\*.js',
  'apps\api\src\hooks\**\*.js',

  # --- Front-end / shared code not yet reviewed ---
  'apps\web\src\app\provider\**\*.tsx',
  'apps\web\src\components\layout\**\*.tsx',
  'apps\web\src\components\maps\**\*.tsx',
  'apps\web\src\lib\apiClient.ts',
  'apps\web\src\lib\api.ts',

  # --- Shared UI & common packages ---
  'packages\ui\**\*.tsx',
  'packages\ui\**\*.jsx',
  'packages\common\**\*.ts',
  'packages\common\**\*.tsx',

  # --- Database schema / migrations / seeds ---
  'packages\database\prisma\schema.prisma',
  'packages\database\prisma\migrations\*\migration.sql',
  'packages\database\prisma\seeds\*.js',

  # --- Infrastructure & ops ---
  'infrastructure\terraform\**\*.tf',
  'docker\*.Dockerfile',
  '.github\workflows\*.yml',

  # --- Scripts & docs ---
  'scripts\copy-files*.ps1',
  'scripts\gather-backlog-targets*.ps1',
  'docs\**\*.md',
  'README.md'
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

