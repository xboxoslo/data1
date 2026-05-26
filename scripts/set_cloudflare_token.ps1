# Interaktiv setter for Cloudflare-API-token i Azure Key Vault.
# Prompter for tokenet via SecureString (vises ikke i historikk eller skjerm),
# verifiserer at det er gyldig + har Zero Trust Access-scopes, og lagrer det
# i micronet-shared-kv.
#
# Kjør: pwsh -File scripts\set_cloudflare_token.ps1
# (eller fra cmd: powershell -File scripts\set_cloudflare_token.ps1)

[CmdletBinding()]
param(
    [string]$VaultName = 'micronet-shared-kv',
    [string]$SecretName = 'Cloudflare-Api-Token',
    # Micronet-kontoen — hardkodet sa scriptet ikke trenger 'Account Settings:Read'-scope
    [string]$AccountId = '3f04201b8ded48862163768ab4faee9c'
)

$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '=== Cloudflare API-token setter ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Dette scriptet lagrer en ny Cloudflare API-token i Azure Key Vault.'
Write-Host ''
Write-Host 'STEG 1: Lag tokenet i Cloudflare:' -ForegroundColor Yellow
Write-Host '  https://dash.cloudflare.com/profile/api-tokens -> Create Token -> Custom token'
Write-Host ''
Write-Host '  Permissions (alle tre obligatoriske):' -ForegroundColor Yellow
Write-Host '    * Account -> Access: Apps and Policies -> Edit'
Write-Host '    * Account -> Access: Service Tokens     -> Edit'
Write-Host '    * Zone    -> Zone                       -> Read'
Write-Host ''
Write-Host '  Account Resources: Include -> Micronet-konto'
Write-Host '  Zone Resources:    Include -> data1.no'
Write-Host '  Client IP Filtering: (la stå tomt)'
Write-Host '  TTL: (la stå tomt for ingen utløp, eller sett 1 år)'
Write-Host ''
Write-Host 'STEG 2: Lim inn tokenet under (vises ikke på skjerm).' -ForegroundColor Yellow
Write-Host ''

# Prompt via SecureString — vises ikke i historikk, vises ikke på skjerm
$sec = Read-Host -AsSecureString 'Cloudflare API-token'
$tok = [System.Net.NetworkCredential]::new('', $sec).Password

if ([string]::IsNullOrWhiteSpace($tok)) {
    Write-Host '  FEIL: Tomt token. Avbryter.' -ForegroundColor Red
    exit 1
}

$tokLen = $tok.Length
$prefix = $tok.Substring(0, [Math]::Min(6, $tokLen))
Write-Host ''
Write-Host "Mottok token (lengde=$tokLen, prefix='$prefix')..."

# ===== Format-sjekk FØR HTTP-kall =====
# Cloudflare API-tokens (nytt format, 2024+) skal begynne med 'cfut_' (User) eller 'cfat_' (Account-owned)
# Gamle tokens er 40-tegn hex uten prefix. IndexNow-nøkler er 32-tegn hex uten prefix
# (vanlig forveksling — vi advarer eksplisitt).
$looksLikeNewFormat = $tok.StartsWith('cfut_') -or $tok.StartsWith('cfat_')
$looksLikeOldFormat = $tokLen -eq 40 -and $tok -match '^[a-zA-Z0-9_-]+$'
$looksLikeIndexNow = $tokLen -eq 32 -and $tok -match '^[a-f0-9]+$'

if ($looksLikeIndexNow) {
    Write-Host ''
    Write-Host '  FEIL: Dette ser ut som en IndexNow-nøkkel (32 tegn ren hex), ikke et' -ForegroundColor Red
    Write-Host '        Cloudflare API-token.' -ForegroundColor Red
    Write-Host ''
    Write-Host '  Cloudflare API-tokens skal:' -ForegroundColor Yellow
    Write-Host '    - Begynne med "cfut_" (User token) eller "cfat_" (Account-owned)' -ForegroundColor Yellow
    Write-Host '    - Være ca. 50 tegn lange' -ForegroundColor Yellow
    Write-Host '    - Genereres på https://dash.cloudflare.com/profile/api-tokens' -ForegroundColor Yellow
    Write-Host '      via "Create Token" → "Custom token"' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  Avbryter — ingenting er lagret.' -ForegroundColor Red
    Remove-Variable tok, sec
    exit 1
}

if (-not ($looksLikeNewFormat -or $looksLikeOldFormat)) {
    Write-Host ''
    Write-Host '  ADVARSEL: Tokenet matcher ikke kjent Cloudflare-format.' -ForegroundColor Yellow
    Write-Host '            Forventet: "cfut_..." (anbefalt) eller "cfat_..." eller 40-tegn alfanumerisk.' -ForegroundColor Yellow
    Write-Host "            Mottatt:   prefix='$prefix', lengde=$tokLen" -ForegroundColor Yellow
    Write-Host '            Prøver verifisering uansett...' -ForegroundColor Yellow
}

# ===== STEG A: Verifiser at tokenet er gyldig =====
Write-Host ''
Write-Host '=== Verifiserer token mot Cloudflare API ===' -ForegroundColor Cyan

$headers = @{ 'Authorization' = "Bearer $tok"; 'Content-Type' = 'application/json' }

try {
    $verify = Invoke-RestMethod -Uri 'https://api.cloudflare.com/client/v4/user/tokens/verify' -Headers $headers -Method GET -ErrorAction Stop
} catch {
    Write-Host "  FEIL: Token-verifisering feilet med HTTP-feil:" -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    Remove-Variable tok, sec
    exit 1
}

if (-not $verify.success) {
    Write-Host '  FEIL: Tokenet er ikke gyldig.' -ForegroundColor Red
    Write-Host "  Cloudflare-svar: $($verify.errors | ConvertTo-Json -Compress)" -ForegroundColor Red
    Remove-Variable tok, sec
    exit 1
}

Write-Host "  Token aktiv (id=$($verify.result.id), status=$($verify.result.status))" -ForegroundColor Green

# ===== STEG B: Test Zero Trust Access-scope mot kjent account-ID =====
Write-Host ''
Write-Host "=== Tester Zero Trust Access-scope (account=$AccountId) ===" -ForegroundColor Cyan

$accessOk = $false
$accessError = $null
try {
    $apps = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$AccountId/access/apps?per_page=1" -Headers $headers -Method GET -ErrorAction Stop
    if ($apps.success) {
        $count = $apps.result_info.total_count
        Write-Host "  OK — kan lese Access apps (eksisterende: $count)" -ForegroundColor Green
        $accessOk = $true
    } else {
        $accessError = ($apps.errors | ConvertTo-Json -Compress)
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $accessError = "HTTP $statusCode — $($_.Exception.Message)"
    # Forsøk å lese kropp for bedre feilmelding
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $body = $reader.ReadToEnd()
        $accessError += "`n  Body: $body"
    } catch {}
}

if (-not $accessOk) {
    Write-Host '  FEIL: Kan ikke lese Access-apps.' -ForegroundColor Red
    Write-Host "  $accessError" -ForegroundColor Red
    Write-Host ''
    Write-Host '  Mest sannsynlige årsaker:' -ForegroundColor Yellow
    Write-Host '    1. Tokenet mangler scope "Account → Access: Apps and Policies → Edit"' -ForegroundColor Yellow
    Write-Host '    2. "Account Resources" på tokenet er ikke satt til Micronet-kontoen' -ForegroundColor Yellow
    Write-Host '       (under token-oppsettet: Account Resources → Include → Specific accounts → Micronet)' -ForegroundColor Yellow
    Write-Host '    3. Cloudflare Zero Trust er ikke aktivert på kontoen ennå' -ForegroundColor Yellow
    Write-Host '       (gå til https://one.dash.cloudflare.com og fullfør førstegangsoppsett)' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  AVBRYTER — tokenet er IKKE lagret i Key Vault.' -ForegroundColor Red
    Remove-Variable tok, sec
    exit 1
}

# ===== STEG D: Lagre i Key Vault =====
Write-Host ''
Write-Host "=== Lagrer i Azure Key Vault ($VaultName / $SecretName) ===" -ForegroundColor Cyan

# Sjekk Azure CLI-pålogging
try {
    $azAccount = az account show --query name -o tsv 2>$null
    if ([string]::IsNullOrWhiteSpace($azAccount)) {
        throw "ikke pålogget"
    }
    Write-Host "  Azure-konto: $azAccount" -ForegroundColor Green
} catch {
    Write-Host "  FEIL: Ikke pålogget Azure. Kjør 'az login' først." -ForegroundColor Red
    Remove-Variable tok, sec
    exit 1
}

# Skriv til Key Vault
$result = az keyvault secret set `
    --vault-name $VaultName `
    --name $SecretName `
    --value $tok `
    --tags "set-by=set_cloudflare_token.ps1" "validated=$(Get-Date -Format 'yyyy-MM-dd')" `
    -o json 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "  FEIL: Klarte ikke skrive til Key Vault:" -ForegroundColor Red
    Write-Host "  $result" -ForegroundColor Red
    Remove-Variable tok, sec
    exit 1
}

$secret = $result | ConvertFrom-Json
Write-Host "  Lagret som $($secret.id)" -ForegroundColor Green
Write-Host "  Versjon: $($secret.attributes.version)" -ForegroundColor Green

# ===== Rydd opp =====
Remove-Variable tok, sec, headers

Write-Host ''
Write-Host '=== Ferdig ===' -ForegroundColor Green
Write-Host 'Tokenet er verifisert og lagret. Claude (eller andre scripts) kan nå hente det med:'
Write-Host '  az keyvault secret show --vault-name micronet-shared-kv --name Cloudflare-Api-Token --query value -o tsv'
Write-Host ''
Write-Host "Account-ID for Access-API-kall: $AccountId" -ForegroundColor Cyan
Write-Host ''
