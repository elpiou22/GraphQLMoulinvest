param(
    [string]$ProjectRoot = "C:\Users\macéo.fauchier\Desktop\SRA_DEV_GRAPHQL\x3-services-dev-studio-64.0.82.2298115",
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

function Resolve-GitExecutable {
    $GitCommand = Get-Command "git.exe" -ErrorAction SilentlyContinue
    if ($null -ne $GitCommand) {
        return $GitCommand.Source
    }

    $GitHubDesktopRoot = Join-Path $env:LOCALAPPDATA "GitHubDesktop"
    $BundledGit = Get-ChildItem -LiteralPath $GitHubDesktopRoot -Filter "git.exe" -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '\\resources\\app\\git\\cmd\\git\.exe$' } |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1

    if ($null -ne $BundledGit) {
        return $BundledGit.FullName
    }

    throw "Git est introuvable. Installez Git ou GitHub Desktop, puis relancez le script."
}

if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) {
    throw "Projet introuvable : $ProjectRoot"
}

Write-Host "[1/7] Mise a jour du projet depuis GitHub..." -ForegroundColor Cyan
Push-Location $ProjectRoot
try {
    $GitExecutable = Resolve-GitExecutable
    $GitChanges = & $GitExecutable status --porcelain
    if ($LASTEXITCODE -ne 0) {
        throw "Impossible de lire l'etat Git du projet."
    }

    if ($GitChanges) {
        Write-Host $GitChanges
        throw "Le projet contient des modifications locales. Committez-les ou annulez-les avant le deploiement."
    }

    Invoke-CheckedCommand -Executable $GitExecutable -Arguments @(
        "pull",
        "--ff-only",
        "origin",
        "main"
    )

    Write-Host "[2/7] Generation du package..." -ForegroundColor Cyan
    Invoke-CheckedCommand -Executable "npm.cmd" -Arguments @("run", "generate")

    Write-Host "[3/7] Compilation TypeScript..." -ForegroundColor Cyan
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

Write-Host "[4/7] Nettoyage de $ResolvedTarget..." -ForegroundColor Cyan
Get-ChildItem -LiteralPath $ResolvedTarget -Force | ForEach-Object {
    Write-Host "  Suppression : $($_.Name)"
    Remove-Item -LiteralPath $_.FullName -Recurse -Force
}

Write-Host "[5/7] Copie du build et de package.json..." -ForegroundColor Cyan
Copy-Item -LiteralPath $BuildSource -Destination $ResolvedTarget -Recurse -Force
Copy-Item -LiteralPath $PackageJsonSource -Destination $ResolvedTarget -Force

Write-Host "[6/7] Verification du deploiement..." -ForegroundColor Cyan
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

Write-Host "[7/7] Redemarrage du service Sage X3 sur $ServerName..." -ForegroundColor Cyan
try {
    $RemoteServices = [System.ServiceProcess.ServiceController]::GetServices(
        $ServerName
    )
}
catch {
    throw "Impossible de lire les services sur $ServerName : $($_.Exception.Message)"
}

$MatchingServices = @(
    $RemoteServices | Where-Object {
        $_.ServiceName -ieq $ServiceIdentifier -or
        $_.DisplayName -ieq $ServiceIdentifier
    }
)

if ($MatchingServices.Count -eq 0) {
    throw "Service introuvable sur $ServerName : $ServiceIdentifier"
}

if ($MatchingServices.Count -gt 1) {
    $Names = ($MatchingServices | ForEach-Object { $_.ServiceName }) -join ", "
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
