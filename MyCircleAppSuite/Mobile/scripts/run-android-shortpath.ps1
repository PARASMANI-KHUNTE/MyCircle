$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$driveLetter = "X:"
$target = "$driveLetter\"

$existingDrive = Get-PSDrive -Name $driveLetter.TrimEnd(':') -ErrorAction SilentlyContinue
if (-not $existingDrive) {
    subst $driveLetter $projectRoot | Out-Null
}

try {
    Set-Location $target
    npx react-native run-android --port 8081
}
finally {
    Set-Location $projectRoot
}
