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

$Texto = $Texto.Trim()
<# MARCAS: {nome} no texto não é falado — marca um ponto da fala; o script diz em que segundo ele cai.
   (o tempo de cada letra vem da própria ElevenLabs, junto com o áudio) #>
$marcas = [ordered]@{}
while ($Texto -match '\{([^{}]+)\}'){
  $i = $Texto.IndexOf($Matches[0]); $marcas[$Matches[1]] = $i
  $Texto = $Texto.Remove($i, $Matches[0].Length)
}
$corpo = @{
  text = $Texto
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
<# com os tempos: o áudio vem em base64 e, junto, o início e o fim de cada letra (sem custo a mais) #>
$r = Invoke-RestMethod -Uri ("https://api.elevenlabs.io/v1/text-to-speech/$Voz/with-timestamps" + '?output_format=mp3_44100_128') -Method Post -Headers $cab `
  -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($corpo))
[IO.File]::WriteAllBytes($saida, [Convert]::FromBase64String($r.audio_base64))
$al = $r.alignment
$pastaT = Join-Path $PSScriptRoot 'tempos'; if (-not (Test-Path $pastaT)){ New-Item -ItemType Directory $pastaT | Out-Null }
$tempos = [ordered]@{ texto = $Texto; voz = $Voz; modelo = $cfg.modelo; letras = ($al.characters -join ''); inicio = $al.character_start_times_seconds; fim = $al.character_end_times_seconds; marcas = [ordered]@{} }
foreach ($k in $marcas.Keys){ $i = [math]::Min($marcas[$k], $al.character_start_times_seconds.Count - 1); $tempos.marcas[$k] = [math]::Round($al.character_start_times_seconds[$i], 2) }
[IO.File]::WriteAllText((Join-Path $pastaT ($Nome + '.json')), ($tempos | ConvertTo-Json -Depth 4 -Compress), (New-Object Text.UTF8Encoding($false)))
"gravado: $saida  ($([math]::Round((Get-Item $saida).Length / 1kb)) KB, $([math]::Round($al.character_end_times_seconds[-1], 2)) s)"
foreach ($k in $tempos.marcas.Keys){ "  {$k} -> $($tempos.marcas[$k]) s" }
