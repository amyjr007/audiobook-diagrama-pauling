<#
  GERA UMA NARRAÇÃO COM A ELEVENLABS
  Escreve audio/audio_distribuição_<Nome>.mp3 a partir de um texto.

  A chave fica no Windows (variável ELEVENLABS_API_KEY do usuário) — nunca neste arquivo nem no GitHub.

  Exemplos (no PowerShell, na pasta do projeto):
    .\ferramentas\gera-audio.ps1 -Nome 9.2 -Texto "Agora vamos ver o lítio..."
    .\ferramentas\gera-audio.ps1 -Nome 9.2 -Arquivo roteiro_9.2.txt
    .\ferramentas\gera-audio.ps1 -Nome teste -Texto "Olá!" -Voz CwhRBWXzGAHq8TQ4Fs17
    .\ferramentas\gera-audio.ps1 -Vozes            (lista as vozes da conta)

  A voz e os ajustes padrão ficam em ferramentas/elevenlabs.json.
#>
param(
  [string]$Nome,
  [string]$Texto,
  [string]$Arquivo,
  [string]$Voz,
  [switch]$Vozes
)
$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot
$chave = $env:ELEVENLABS_API_KEY
if (-not $chave){ $chave = [Environment]::GetEnvironmentVariable('ELEVENLABS_API_KEY', 'User') }
if (-not $chave){ throw 'Falta a chave: defina a variável ELEVENLABS_API_KEY (veja o topo deste arquivo).' }
$cab = @{ 'xi-api-key' = $chave }

if ($Vozes){
  (Invoke-RestMethod -Uri 'https://api.elevenlabs.io/v1/voices' -Headers $cab).voices |
    Select-Object name, voice_id, category | Format-Table -AutoSize | Out-String -Width 200
  return
}

$cfg = Get-Content -Raw -Encoding utf8 (Join-Path $PSScriptRoot 'elevenlabs.json') | ConvertFrom-Json
if (-not $Voz){ $Voz = $cfg.voz }
if ($Arquivo){ $Texto = Get-Content -Raw -Encoding utf8 $Arquivo }
if (-not $Nome -or -not $Texto){ throw 'Diga o -Nome do áudio (ex.: 9.2) e o -Texto (ou -Arquivo).' }

$corpo = @{
  text = $Texto.Trim()
  model_id = $cfg.modelo
  language_code = 'pt'
  voice_settings = @{
    stability = $cfg.estabilidade
    similarity_boost = $cfg.similaridade
    style = $cfg.estilo
    use_speaker_boost = $true
    speed = $cfg.velocidade
  }
} | ConvertTo-Json -Depth 4
$saida = Join-Path $raiz ('audio\audio_distribuição_' + $Nome + '.mp3')
Invoke-RestMethod -Uri ("https://api.elevenlabs.io/v1/text-to-speech/$Voz" + '?output_format=mp3_44100_128') -Method Post -Headers $cab `
  -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($corpo)) -OutFile $saida
"gravado: $saida  ($([math]::Round((Get-Item $saida).Length / 1kb)) KB)"
