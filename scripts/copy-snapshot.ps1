# scripts/copy-snapshot.ps1

Import-Module "$PSScriptRoot/RepoTools.psm1"

$Set = "default"

# Look through all args for a set name
foreach ($arg in $args) {
  if ($arg.StartsWith("--") -and $arg -ne "--") {
    $Set = $arg.Substring(2)
    break
  }
}

$fileSets = (Get-Content "$PSScriptRoot/file-sets.json" -Raw | ConvertFrom-Json)

if (-not ($fileSets.PSObject.Properties.Name -contains $Set)) {
  $availableSets = ($fileSets.PSObject.Properties.Name) -join ", "
  throw "❌ Unknown file set '$Set'. Available sets: $availableSets"
}

Copy-RepoSnapshot -Set $Set -Depth 2
