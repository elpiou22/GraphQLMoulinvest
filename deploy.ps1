param(
    [string]$ProjectRoot = "C:\Users\damien.chamerlin\Desktop\SRA_DEV_GRAPHQL\x3-services-dev-studio-64.0.82.2298115",
    [string]$TargetRoot = '\\EC2PSRAMOULX3F1\d$\sage\X3Services\add-ons\DEV\@ADMIN\admin-specifiques-sra',
    [string]$ServerName = "EC2PSRAMOULX3F1",
    [string]$ServiceIdentifier = "Sage X3 Services SERVICE"
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ExpectedTarget = '\\EC2PSRAMOULX3F1\d$\sage\X3Services\add-ons\DEV\@ADMIN\admin-specifiques-sra'
$PackageRoot = Join-Path $ProjectRoot "shared\admin-specifiques-sra"
$BuildSource = Join-Path $PackageRoot "build"
$PackageJsonSource = Join-Path $PackageRoot "package.json"
$TsConfig = Join-Path $PackageRoot "tsconfig.json"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Executable,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $Executable @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "La commande '$Executable $($Arguments -join ' ')' a echoue avec le code $LASTEXITCODE."
    }
}

if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) {
    throw "Projet introuvable : $ProjectRoot"
}

Write-Host "[1/6] Generation du package..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    Invoke-CheckedCommand -Executable "npm.cmd" -Arguments @("run", "generate")

    Write-Host "[2/6] Compilation TypeScript..." -ForegroundColor Cyan
    Invoke-CheckedCommand -Executable "npx.cmd" -Arguments @(
        "tsc",
        "-p",
        "shared/admin-specifiques-sra/tsconfig.json"
    )
}
finally {
    Pop-Location
}

if (-not (Test-Path -LiteralPath $BuildSource -PathType Container)) {
    throw "Dossier build introuvable apres compilation : $BuildSource"
}

if (-not (Test-Path -LiteralPath $PackageJsonSource -PathType Leaf)) {
    throw "Fichier package.json introuvable : $PackageJsonSource"
}

if (-not (Test-Path -LiteralPath $TargetRoot -PathType Container)) {
    throw "Dossier cible inaccessible ou introuvable : $TargetRoot"
}

$ResolvedTarget = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath(
    $TargetRoot
).TrimEnd("\")
$NormalizedExpectedTarget = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath(
    $ExpectedTarget
).TrimEnd("\")

if ($ResolvedTarget -ine $NormalizedExpectedTarget) {
    throw "Securite : la cible resolue '$ResolvedTarget' ne correspond pas a '$NormalizedExpectedTarget'."
}

if ((Split-Path -Leaf $ResolvedTarget) -ine "admin-specifiques-sra") {
    throw "Securite : le dossier cible n'est pas admin-specifiques-sra."
}

Write-Host "[3/6] Nettoyage de $ResolvedTarget..." -ForegroundColor Cyan
Get-ChildItem -LiteralPath $ResolvedTarget -Force | ForEach-Object {
    Write-Host "  Suppression : $($_.Name)"
    Remove-Item -LiteralPath $_.FullName -Recurse -Force
}

Write-Host "[4/6] Copie du build et de package.json..." -ForegroundColor Cyan
Copy-Item -LiteralPath $BuildSource -Destination $ResolvedTarget -Recurse -Force
Copy-Item -LiteralPath $PackageJsonSource -Destination $ResolvedTarget -Force

Write-Host "[5/6] Verification du deploiement..." -ForegroundColor Cyan
$BuildTarget = Join-Path $ResolvedTarget "build"
$PackageJsonTarget = Join-Path $ResolvedTarget "package.json"

if (-not (Test-Path -LiteralPath $BuildTarget -PathType Container)) {
    throw "Le dossier build n'a pas ete copie dans la cible."
}

if (-not (Test-Path -LiteralPath $PackageJsonTarget -PathType Leaf)) {
    throw "Le fichier package.json n'a pas ete copie dans la cible."
}

Get-ChildItem -LiteralPath $ResolvedTarget -Force |
    Select-Object Name, Length, LastWriteTime |
    Format-Table -AutoSize

Write-Host "[6/6] Redemarrage du service Sage X3 sur $ServerName..." -ForegroundColor Cyan
$MatchingServices = @(
    Get-Service -ComputerName $ServerName -ErrorAction Stop |
        Where-Object {
            $_.Name -ieq $ServiceIdentifier -or
            $_.DisplayName -ieq $ServiceIdentifier
        }
)

if ($MatchingServices.Count -eq 0) {
    throw "Service introuvable sur $ServerName : $ServiceIdentifier"
}

if ($MatchingServices.Count -gt 1) {
    $Names = ($MatchingServices | ForEach-Object { $_.Name }) -join ", "
    throw "Plusieurs services correspondent a '$ServiceIdentifier' sur $ServerName : $Names"
}

$Service = $MatchingServices[0]
$Timeout = [TimeSpan]::FromSeconds(90)

$Service.Refresh()
if ($Service.Status -ne [System.ServiceProcess.ServiceControllerStatus]::Stopped) {
    Write-Host "  Arret de $($Service.DisplayName)..."
    $Service.Stop()
    $Service.WaitForStatus(
        [System.ServiceProcess.ServiceControllerStatus]::Stopped,
        $Timeout
    )
}

Write-Host "  Demarrage de $($Service.DisplayName)..."
$Service.Start()
$Service.WaitForStatus(
    [System.ServiceProcess.ServiceControllerStatus]::Running,
    $Timeout
)
$Service.Refresh()

Write-Host "  Etat du service : $($Service.Status)" -ForegroundColor Green
Write-Host "Deploiement termine avec succes." -ForegroundColor Green
