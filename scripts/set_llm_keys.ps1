# Interaktiv setter for LLM API-nøkler → GitHub Secrets + Key Vault backup.
# Brukes til å aktivere full AI-synlighet-sync (Claude + GPT + Perplexity + Gemini).
#
# Anthropic er allerede satt fra 9. mai 2026, men du kan rotere her om ønskelig.
#
# Kjør: pwsh -File scripts\set_llm_keys.ps1
#
# Forutsetninger:
#  - `gh` CLI pålogget xboxoslo/data1
#  - `az` CLI pålogget (for Key Vault-backup)

[CmdletBinding()]
param(
    [string]$VaultName = 'micronet-shared-kv'
)

$ErrorActionPreference = 'Stop'

# Lokal helper — sett én nøkkel hvis brukeren gir én
function Set-LlmKey {
    param(
        [string]$Label,         # F.eks. "OpenAI"
        [string]$GhSecret,      # F.eks. OPENAI_API_KEY
        [string]$KvSecret,      # F.eks. OpenAI-Api-Key
        [string]$PrefixHint,    # F.eks. "sk-..."
        [string]$AcquireUrl,    # Hvor brukeren henter nøkkelen
        [scriptblock]$Validate  # Skript som tester at nøkkelen virker; tar $key, returnerer $true/$false
    )
    Write-Host ''
    Write-Host "=== $Label ===" -ForegroundColor Cyan
    Write-Host "  Hent fra: $AcquireUrl"
    Write-Host "  Forventet format: $PrefixHint"
    Write-Host ''
    $sec = Read-Host -AsSecureString "$Label API-nøkkel (tom for å hoppe over)"
    $key = [System.Net.NetworkCredential]::new('', $sec).Password

    if ([string]::IsNullOrWhiteSpace($key)) {
        Write-Host "  Hoppet over $Label." -ForegroundColor Yellow
        Remove-Variable sec, key
        return
    }

    Write-Host "  Tester nøkkelen mot $Label..."
    $ok = & $Validate $key
    if (-not $ok) {
        Write-Host "  FEIL: $Label-nøkkelen validerte ikke. Hoppet over lagring." -ForegroundColor Red
        Remove-Variable sec, key
        return
    }
    Write-Host "  OK — nøkkelen virker." -ForegroundColor Green

    gh secret set $GhSecret --body $key
    az keyvault secret set --vault-name $VaultName --name $KvSecret --value $key --tags "set-by=set_llm_keys.ps1" -o none
    Write-Host "  Lagret som GitHub Secret '$GhSecret' + Key Vault '$KvSecret'" -ForegroundColor Green
    Remove-Variable sec, key
}

Write-Host '=== LLM API-nøkler for AI-synlighet-sync ===' -ForegroundColor Cyan
Write-Host 'Lim inn nøkler under. Trykk Enter på tom linje for å hoppe over en.'
Write-Host ''

Set-LlmKey -Label 'Anthropic' -GhSecret 'ANTHROPIC_API_KEY' -KvSecret 'Anthropic-Api-Key' `
    -PrefixHint 'sk-ant-...' `
    -AcquireUrl 'https://console.anthropic.com/settings/keys' `
    -Validate {
        param($k)
        try {
            $h = @{ 'x-api-key' = $k; 'anthropic-version' = '2023-06-01'; 'Content-Type' = 'application/json' }
            $b = '{"model":"claude-haiku-4-5","max_tokens":4,"messages":[{"role":"user","content":"hi"}]}'
            $null = Invoke-RestMethod -Uri 'https://api.anthropic.com/v1/messages' -Headers $h -Method POST -Body $b -ErrorAction Stop
            return $true
        } catch { return $false }
    }

Set-LlmKey -Label 'OpenAI' -GhSecret 'OPENAI_API_KEY' -KvSecret 'OpenAI-Api-Key' `
    -PrefixHint 'sk-... (project key sk-proj-... funker også)' `
    -AcquireUrl 'https://platform.openai.com/api-keys' `
    -Validate {
        param($k)
        try {
            $null = Invoke-RestMethod -Uri 'https://api.openai.com/v1/models' -Headers @{ 'Authorization' = "Bearer $k" } -Method GET -ErrorAction Stop
            return $true
        } catch { return $false }
    }

Set-LlmKey -Label 'Perplexity' -GhSecret 'PERPLEXITY_API_KEY' -KvSecret 'Perplexity-Api-Key' `
    -PrefixHint 'pplx-...' `
    -AcquireUrl 'https://www.perplexity.ai/settings/api' `
    -Validate {
        param($k)
        try {
            $h = @{ 'Authorization' = "Bearer $k"; 'Content-Type' = 'application/json' }
            $b = '{"model":"sonar","messages":[{"role":"user","content":"hi"}]}'
            $null = Invoke-RestMethod -Uri 'https://api.perplexity.ai/chat/completions' -Headers $h -Method POST -Body $b -ErrorAction Stop
            return $true
        } catch { return $false }
    }

Set-LlmKey -Label 'Gemini' -GhSecret 'GEMINI_API_KEY' -KvSecret 'Gemini-Api-Key' `
    -PrefixHint 'AIzaSy...' `
    -AcquireUrl 'https://aistudio.google.com/apikey' `
    -Validate {
        param($k)
        try {
            $b = '{"contents":[{"parts":[{"text":"hi"}]}]}'
            $null = Invoke-RestMethod -Uri "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$k" -Headers @{ 'Content-Type' = 'application/json' } -Method POST -Body $b -ErrorAction Stop
            return $true
        } catch { return $false }
    }

Write-Host ''
Write-Host '=== Ferdig ===' -ForegroundColor Green
Write-Host 'For å trigge AI-sync umiddelbart:'
Write-Host '  gh workflow run dashboard-sync.yml -f jobs=ai'
Write-Host ''
