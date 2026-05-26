# Engangs-oppsett for Google Search Console OAuth → GitHub Secrets.
#
# Hva scriptet gjør:
#  1. Spør om GSC_CLIENT_ID og GSC_CLIENT_SECRET (fra Google Cloud Console)
#  2. Åpner Google OAuth-URL i nettleseren — du logger inn og klikker "Allow"
#  3. Spør om koden Google viste etter "Allow"
#  4. Bytter koden mot refresh_token via Google OAuth-endpoint
#  5. Setter alle tre verdier som GitHub Secrets via `gh secret set`
#
# Kjør: pwsh -File scripts\set_gsc_oauth.ps1
#
# Forutsetninger:
#  - Google Cloud Console-prosjekt med Search Console API aktivert
#  - OAuth 2.0 Client ID av type "Desktop app" opprettet
#  - Brukeren har eierskap på data1.no i Google Search Console
#  - `gh` CLI er pålogget xboxoslo/data1
#  - `az` CLI er pålogget (for Key Vault-backup)

[CmdletBinding()]
param(
    [string]$VaultName = 'micronet-shared-kv'
)

$ErrorActionPreference = 'Stop'

Write-Host ''
Write-Host '=== Google Search Console OAuth-oppsett ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'STEG 1: Sjekk at du har OAuth Client ID fra Google Cloud Console.' -ForegroundColor Yellow
Write-Host '  Hvis ikke:'
Write-Host '    1. https://console.cloud.google.com/apis/credentials'
Write-Host '    2. Create credentials → OAuth client ID'
Write-Host '    3. Application type: Desktop app'
Write-Host '    4. Last ned JSON. client_id og client_secret er det vi trenger.'
Write-Host ''
Write-Host '  Sørg også for at Search Console API er aktivert:'
Write-Host '    https://console.cloud.google.com/apis/library/searchconsole.googleapis.com'
Write-Host ''

$clientId = Read-Host 'Lim inn Client ID (slutter med .apps.googleusercontent.com)'
if ([string]::IsNullOrWhiteSpace($clientId)) { Write-Host 'Tomt — avbryter.' -ForegroundColor Red; exit 1 }
if (-not $clientId.EndsWith('.apps.googleusercontent.com')) {
    Write-Host 'ADVARSEL: Client ID slutter ikke med .apps.googleusercontent.com — fortsetter uansett' -ForegroundColor Yellow
}

$secretSecure = Read-Host -AsSecureString 'Lim inn Client Secret'
$clientSecret = [System.Net.NetworkCredential]::new('', $secretSecure).Password
if ([string]::IsNullOrWhiteSpace($clientSecret)) { Write-Host 'Tomt — avbryter.' -ForegroundColor Red; exit 1 }

# Steg 2: Konstruer OAuth-URL
$scope = 'https://www.googleapis.com/auth/webmasters.readonly'
$redirectUri = 'urn:ietf:wg:oauth:2.0:oob'  # "out-of-band" — Google viser koden i browseren
$authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
           '?client_id=' + [Uri]::EscapeDataString($clientId) +
           '&redirect_uri=' + [Uri]::EscapeDataString($redirectUri) +
           '&response_type=code' +
           '&scope=' + [Uri]::EscapeDataString($scope) +
           '&access_type=offline' +
           '&prompt=consent'

Write-Host ''
Write-Host '=== STEG 2: Logg inn på Google og godkjenn ===' -ForegroundColor Cyan
Write-Host ''
Write-Host 'Åpner OAuth-URL i din standard browser om 3 sekunder...'
Write-Host '  (Hvis det ikke åpner automatisk, kopier denne URL-en til en privat browser-fane):'
Write-Host ''
Write-Host $authUrl -ForegroundColor Blue
Write-Host ''
Start-Sleep -Seconds 3

try { Start-Process $authUrl } catch { Write-Host '  (Klarte ikke åpne automatisk — kopier URL-en manuelt)' -ForegroundColor Yellow }

Write-Host ''
Write-Host 'I browseren:' -ForegroundColor Yellow
Write-Host '  1. Logg inn med Google-kontoen som eier data1.no i Search Console'
Write-Host '  2. Klikk "Continue" / "Allow"'
Write-Host '  3. Du får vist en kode — KOPIER DEN'
Write-Host ''

$code = Read-Host 'Lim inn koden fra Google'
if ([string]::IsNullOrWhiteSpace($code)) { Write-Host 'Tomt — avbryter.' -ForegroundColor Red; exit 1 }

# Steg 3: Bytt code mot tokens
Write-Host ''
Write-Host '=== STEG 3: Henter refresh_token fra Google... ===' -ForegroundColor Cyan

$body = @{
    client_id     = $clientId
    client_secret = $clientSecret
    code          = $code.Trim()
    grant_type    = 'authorization_code'
    redirect_uri  = $redirectUri
}

try {
    $tokens = Invoke-RestMethod -Uri 'https://oauth2.googleapis.com/token' -Method POST -Body $body -ContentType 'application/x-www-form-urlencoded' -ErrorAction Stop
} catch {
    Write-Host '  FEIL: OAuth-bytting feilet:' -ForegroundColor Red
    Write-Host "  $_" -ForegroundColor Red
    Remove-Variable clientSecret, secretSecure, code
    exit 1
}

if (-not $tokens.refresh_token) {
    Write-Host '  FEIL: Google returnerte ikke refresh_token.' -ForegroundColor Red
    Write-Host '  Vanligst fordi du ikke fikk "prompt=consent" — prøv å revoke tilgangen:' -ForegroundColor Yellow
    Write-Host '    https://myaccount.google.com/permissions' -ForegroundColor Yellow
    Write-Host '  Fjern data1-prosjektet, og kjør scriptet på nytt.' -ForegroundColor Yellow
    Remove-Variable clientSecret, secretSecure, code, tokens
    exit 1
}

$refreshToken = $tokens.refresh_token
Write-Host "  OK — fikk refresh_token (lengde=$($refreshToken.Length))" -ForegroundColor Green

# Steg 4: Test refresh-token mot Search Console
Write-Host ''
Write-Host '=== STEG 4: Tester at refresh_token gir tilgang til data1.no ===' -ForegroundColor Cyan

# Get access token using refresh token
$refreshBody = @{
    client_id     = $clientId
    client_secret = $clientSecret
    refresh_token = $refreshToken
    grant_type    = 'refresh_token'
}
$accessTokenResp = Invoke-RestMethod -Uri 'https://oauth2.googleapis.com/token' -Method POST -Body $refreshBody -ContentType 'application/x-www-form-urlencoded'
$accessToken = $accessTokenResp.access_token

# List sites
$sites = Invoke-RestMethod -Uri 'https://searchconsole.googleapis.com/webmasters/v3/sites' -Headers @{ 'Authorization' = "Bearer $accessToken" } -Method GET
$hasData1 = $false
foreach ($s in $sites.siteEntry) {
    Write-Host "  Property: $($s.siteUrl) (permission=$($s.permissionLevel))"
    if ($s.siteUrl -match 'data1\.no') { $hasData1 = $true }
}

if (-not $hasData1) {
    Write-Host ''
    Write-Host '  ADVARSEL: Ingen data1.no-property funnet. Du må legge til data1.no i GSC først:' -ForegroundColor Yellow
    Write-Host '    https://search.google.com/search-console/welcome' -ForegroundColor Yellow
    Write-Host '  Lagrer secrets uansett, men SEO-sync vil ikke fungere før property er lagt til.' -ForegroundColor Yellow
}

# Steg 5: Lagre som GitHub Secrets
Write-Host ''
Write-Host '=== STEG 5: Lagrer som GitHub Secrets ===' -ForegroundColor Cyan

gh secret set GSC_CLIENT_ID --body $clientId
gh secret set GSC_CLIENT_SECRET --body $clientSecret
gh secret set GSC_REFRESH_TOKEN --body $refreshToken
Write-Host '  OK — tre GitHub Secrets satt' -ForegroundColor Green

# Steg 6: Backup i Key Vault
Write-Host ''
Write-Host '=== STEG 6: Backup-kopi i Key Vault ===' -ForegroundColor Cyan

az keyvault secret set --vault-name $VaultName --name GSC-Client-Id --value $clientId --tags "set-by=set_gsc_oauth.ps1" -o none
az keyvault secret set --vault-name $VaultName --name GSC-Client-Secret --value $clientSecret --tags "set-by=set_gsc_oauth.ps1" -o none
az keyvault secret set --vault-name $VaultName --name GSC-Refresh-Token --value $refreshToken --tags "set-by=set_gsc_oauth.ps1" -o none
Write-Host '  OK — tre Key Vault secrets satt' -ForegroundColor Green

# Rydd opp
Remove-Variable clientSecret, secretSecure, code, tokens, refreshToken, accessToken, body, refreshBody, accessTokenResp

Write-Host ''
Write-Host '=== Ferdig ===' -ForegroundColor Green
Write-Host 'GSC OAuth er konfigurert. Neste dashboard-sync (06:30 UTC i morgen) henter ekte SEO-data.'
Write-Host 'For å trigge umiddelbart:'
Write-Host '  gh workflow run dashboard-sync.yml'
Write-Host ''
