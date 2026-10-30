# blender-kit.ps1 - lancia blender_kit.py con il Python che Blender si porta dietro: non serve un Python di sistema.
#
# Uso:  powershell -NoProfile -ExecutionPolicy Bypass -File blender-kit.ps1 <comando> [opzioni]
# Comandi: find, check, new <scena.py>, stills <scena.py> <frame,...>, render <scena.py>, preview [cartella]
# (dettagli in blender_kit.py). Blender si cerca in $env:BLENDER_BIN, poi nelle cartelle d'installazione standard
# (Blender Foundation, Steam), poi nel PATH. Se manca Python in Blender, si usa py -3 o python.
$ErrorActionPreference = 'Stop'

function Get-VersionKey([string]$exe) {
  $m = [regex]::Match((Split-Path (Split-Path $exe -Parent) -Leaf), '\d+(\.\d+)+')
  if ($m.Success) { return [version]($m.Value + '.0.0' -replace '^(\d+\.\d+\.\d+).*$', '$1') }
  return [version]'0.0.0'
}

function Find-Blender {
  if ($env:BLENDER_BIN) {
    if (Test-Path -LiteralPath $env:BLENDER_BIN -PathType Leaf) { return $env:BLENDER_BIN }
    return $null
  }
  $found = @()
  $roots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}, $env:ProgramW6432) | Where-Object { $_ } | Select-Object -Unique
  foreach ($root in $roots) {
    $base = Join-Path $root 'Blender Foundation'
    if (Test-Path -LiteralPath $base) {
      foreach ($d in Get-ChildItem -LiteralPath $base -Directory) {
        $exe = Join-Path $d.FullName 'blender.exe'
        if (Test-Path -LiteralPath $exe -PathType Leaf) { $found += $exe }
      }
    }
    $steam = Join-Path $root 'Steam\steamapps\common\Blender\blender.exe'
    if (Test-Path -LiteralPath $steam -PathType Leaf) { $found += $steam }
  }
  if ($found.Count) { return ($found | Sort-Object { Get-VersionKey $_ } -Descending | Select-Object -First 1) }
  $cmd = Get-Command blender -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($cmd) { return $cmd.Source }
  return $null
}

$blender = Find-Blender
$python = $null
if ($blender) {
  $env:BLENDER_BIN = $blender
  # Il Python di Blender sta in <cartella di Blender>\<versione>\python\bin\python.exe
  foreach ($d in Get-ChildItem -LiteralPath (Split-Path $blender -Parent) -Directory | Where-Object { $_.Name -match '^\d+\.\d+$' }) {
    $p = Join-Path $d.FullName 'python\bin\python.exe'
    if (Test-Path -LiteralPath $p -PathType Leaf) { $python = $p }
  }
}
$pre = @()
if (-not $python) {
  $py = Get-Command py -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($py) { $python = $py.Source; $pre = @('-3') }
  else {
    $py = Get-Command python -CommandType Application -ErrorAction SilentlyContinue | Where-Object { $_.Source -notmatch 'WindowsApps' } | Select-Object -First 1
    if ($py) { $python = $py.Source }
  }
}
if (-not $python) {
  if (-not $blender) { Write-Host 'Blender non trovato: installalo da blender.org oppure imposta BLENDER_BIN col percorso di blender.exe.' }
  else { Write-Host "Nessun Python utilizzabile: ne' in Blender ne' nel sistema." }
  exit 2
}
& $python @pre -B (Join-Path $PSScriptRoot 'blender_kit.py') @args
exit $LASTEXITCODE
