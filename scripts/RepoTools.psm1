
# scripts/RepoTools.psm1
[CmdletBinding()]
param()

$global:RepoToolsExclude = 'node_modules','.git','.next','.vscode','dist','build','*.log'

function Get-TreeLines {
  param(
    [string]$Path,
    [string]$Prefix = '',
    [int]$Level = 1,
    [int]$MaxDepth = [int]::MaxValue
  )
  if ($Level -gt $MaxDepth) { return @() }

  $items = Get-ChildItem -LiteralPath $Path |
           Where-Object { $RepoToolsExclude -notcontains $_.Name } |
           Sort-Object PSIsContainer, Name -Descending

  $out = @()
  for ($i=0; $i -lt $items.Count; $i++) {
    $item = $items[$i]
    $isLast = ($i -eq $items.Count - 1)
    $branch = $isLast ? '└── ' : '├── '
    $out += "$Prefix$branch$($item.Name)"
    if ($item.PSIsContainer) {
      $newPrefix = $Prefix + ($isLast ? '    ' : '│   ')
      $out += Get-TreeLines -Path $item.FullName -Prefix $newPrefix -Level ($Level+1) -MaxDepth $MaxDepth
    }
  }
  return $out
}

function Copy-RepoSnapshot {
  [CmdletBinding()]
  param(
    [string]$Set = "default",
    [int]$Depth = [int]::MaxValue,
    [switch]$NoClipboard,
    [string]$OutFile
  )

  $repoRoot = Resolve-Path "$PSScriptRoot\.."
  $repoName = Split-Path $repoRoot -Leaf

  $fileSets = (Get-Content "$PSScriptRoot/file-sets.json" -Raw | ConvertFrom-Json)
  $files = $fileSets.$Set
  if (-not $files) {
    $availableSets = ($fileSets | Get-Member -MemberType NoteProperty).Name -join ', '
    throw "❌ Unknown file set '$Set'. Available sets: $availableSets"
  }

  $tree = @("├── $repoName") + (Get-TreeLines -Path $repoRoot -Prefix '│   ' -MaxDepth $Depth)

  $output = @("// --- FILE TREE ---") + $tree + ''

  foreach ($f in $files) {
    $full = Join-Path $repoRoot $f
    if (Test-Path $full) {
      $output += "// --- $f ---"
      $output += (Get-Content $full -Raw).Split("`r`n")
      $output += ''
    }
    else {
      Write-Warning "⚠️ Missing file: $f"
    }
  }

  $final = $output -join "`r`n"

  if ($OutFile) {
    $final | Set-Content -Path $OutFile -Encoding utf8
    Write-Host "✅ Copied tree + $($files.Count) files to '$OutFile'"
  }
  elseif (-not $NoClipboard) {
    $final | Set-Clipboard
    Write-Host "✅ Copied tree + $($files.Count) files to clipboard"
  }
  else {
    $final
  }
}
