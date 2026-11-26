# Projeto: audiobook "Distribuição Eletrônica — O diagrama de Pauling"

> Documento de contexto para um assistente (Claude) entender o projeto antes de ajudar.
> Estado descrito: **versão 1.77** (25/11/2026). Repositório: `amyjr007/audiobook-diagrama-pauling` (GitHub, branch `main`).

## 1. O que é

Um **audiobook interativo** de Química, em português, para alunos do ensino médio. Um professor narra (MP3) e, enquanto a narração toca, a tela mostra animações sincronizadas: átomo em 3D, Rutherford, Bohr, o gráfico de energia e atividades em que o aluno **arrasta cartões** (s², p⁶, d¹⁰, f¹⁴) para os degraus do gráfico.

- Roda no navegador e é instalável (PWA), funciona offline.
- Telas: **celular em pé** (ex.: 384×783) e **Chromebook/PC** (deitada). As duas têm ajustes próprios.
- Autor: Prof. Amauri Junior. Ele escreve o roteiro (`App_distribuição eletrônica.docx`, na pasta, fora do GitHub) e dá os tempos dos eventos; o código é feito com o Claude Code.

## 2. Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | **O app inteiro** (~5.900 linhas): HTML, CSS e JavaScript. |
| `sw.js` | Service worker: cache dos arquivos e dos áudios (lista de áudios lá dentro). |
| `legendas.js` | Texto das legendas por áudio (`LEGENDAS`). **Ainda vazio** (ver seção 9). |
| `three.min.js` | Three.js r150 (global `THREE`). |
| `audio/audio_distribuição_N.mp3` | Narrações. `audio/vfx/*.mp3`: efeitos sonoros. |
| `ferramentas/gera-audio.ps1` + `elevenlabs.json` | Gera narrações pela ElevenLabs (seção 8). |
| `ferramentas/tempos/N.json` | Tempo de cada letra das narrações geradas pela ElevenLabs (e das `{marcas}`). |
| `ferramentas/gera-legendas.mjs` | Gerador de legendas com Whisper (trazido do app da Tabela Periódica; precisa de ffmpeg/Node, que não estão instalados). |

## 3. Como o roteiro funciona

- `SEQUENCIA`: ordem dos áudios do Aprender. Atual: `1, 2, 3, 4, 5, 5.1, 5.2, 6, 7, 7.1, 7.2, 7.3, 7.4, 8, 8.1, 8.2, 8.3, 8.3A, 8.4, 8.5, 8.5A, 8.6, 8.6A, 8.7, 8.8, 8.9, 8.95, 9, 9.0, 9.1, 9.2, 9.3, 9.4, 9.4A, 9.4B, 9.5, 9.5A, 9.5B, 9.5C, 9.5D, 9.6`.
- `EVENTOS['audio_distribuição_X'] = [{ t: segundos, acao }]`; `t: 'fim'` roda no fim do áudio. **É aqui que entram os tempos que o professor passa.**
- Avanço entre áudios: `botaoOk(true, 'próximo', 'Ok'|'Próximo')` (play verde piscando; o toque faz o botão espocar como balão — `Espoca`, o mesmo do app da ligação molecular — e só depois segue), `mostraToque(true, 'próximo' ou função)` ("Toque na tela"), `tocaDepois(ms, nome)`, ou a atividade (ex.: completar uma camada).
- `pausaRoteiro(ms)`: pausa a narração e volta sozinha. `CORTES`: áudio que termina antes do fim do arquivo (hoje vazio).
- Relógio do roteiro: `anima(ms, fn, fim, curva)` e `agenda(ms, fn)` — congelam com a narração pausada e aceleram com a velocidade da fala.
- `INICIO['audio_X']`: monta a cena como o áudio anterior terminou (para **Retomar** ao recarregar). Todo áudio novo precisa de entrada aqui. Ajudante: `nivelPronto(n)`.
- `CAPITULOS`: itens do Sumário (17 itens; o 6 é "Os postulados de Bohr" → 7.1; o 11 "O diagrama de energia" → 9; o 12 "O diagrama e a ordem crescente de energia" → 9.0, com o gráfico pronto e sem cartões; o 13 "A eletrosfera do ₁₁Na" → 9.2, com o gráfico em ordem de energia; o 14 "A eletrosfera do ₁₉K" → 9.5, idem; o 15 "A eletrosfera do ₂₆Fe" → 9.5C e o 16 "A eletrosfera do ₃₅Br" → 9.5D, com `cenaJoguinho()`: rótulos apagados e o Joãozinho no chão; o 17 "O Diagrama de Pauling" → 9.6).

## 4. O gráfico de energia (áudios 8.x e 9)

- 7 camadas; cada uma com degraus (um por subnível): `SUBS = [1,2,3,4,4,3,2]`. As letras K…Q viram os textos **"1ª camada" … "7ª camada"** (no 8.1). Embaixo de cada camada, o total de elétrons (2e⁻, 8e⁻, 18e⁻, 32e⁻…), que **diminui a cada encaixe**.
- 8.1: o átomo de Bohr vira o gráfico (a barra "Energia" vira o eixo vertical e o "E" de "Energia" vira o "E" do eixo); depois volta ao átomo e vira o gráfico de novo.
- Montar uma camada: `Atomo.montaNivel(n, total, aoCompletar)` (1ª camada: `arrasteBloco`). Arrastar **corta a narração** e esconde o play. O áudio cortado conta como terminado (`cortado`): o roteiro não congela (antes, arrastar no meio do áudio travava o encaixe e o rótulo não aparecia). Camada completa: pulso verde, aplausos, "yes", confetes (`comemoraNivel`) e o próximo áudio.
- Destaques dos rótulos (1s², 2p⁶…): `realcaParte`, `realcaPartes`, `rotuloDestaque`, `pulsaRotulo`. **Cada peça puxa junto:** o número da frente → o texto "Nª camada"; a letra → o cartão colorido; o expoente → só o número de cima do cartão.
- Foco: `focoNivel([1,2])` escurece as outras camadas. Realce de uma camada: `realceNivel(n, on, brilha)`.
- Áudio 9: totais, "118 e⁻ no total", o gráfico vira o **átomo 118** (núcleo grande e 118 elétrons nas 7 camadas, `voltaAtomo`); 9.0: volta ao gráfico (`voltaGrafico`); "Ok" → **ordem de energia** (`ordemEnergia`: degraus vão para a ordem 1s, 2s, 2p, 3s… com a seta mais alta) (com o som `transition_cube`) → 9.1 (regravado pela ElevenLabs: 4s e 3d aumentam, pausa de 1,5 s; no fim "toque na tela pra ver um exemplo") → 9.2 (sódio: "₁₁Na"; nas duas vezes que fala "11", o 11 aumenta por 2 s (`realcaSub`); só em "assim" a tela escurece, "Eletrosfera errada" e o Na com os 11 e⁻ amontoados (`atomoNa('errada')`); "toque pra ver a eletrosfera correta" → cada elétron viaja até 2, 8, 1, som "yes" e "Eletrosfera correta") → 9.3 (as 3 camadas aumentam (`naCamadasAumentam`); K 2e⁻, L 8e⁻, M 1e⁻ em sequência (`naRotulo`); em "zoom", zoom fundo na camada 2 (calculado pela tela para K e M ficarem fora; núcleo, K e M somem), que se abre nas sublinhas 2s e 2p (`naZoom`), e "2s²"/"2p⁶" (`naSubRotulos`)) → 9.4 (em "sódio": zoom out (`naZoomVolta`) e as camadas se desenrolam nos degraus do gráfico, cada elétron vai para o seu (`naViraGrafico`); o gráfico fica só com 1s², 2s², 2p⁶, 3s¹ e "1ª/2ª/3ª camada" na altura do degrau s (`cenaSodioGrafico`); destaques `textoCamada` e `parteRealce`) → 9.4A (no fim, `distribuiSodio`: "₁₁Na:" e cada subnível aumenta no gráfico e é digitado na linha `dist` — embaixo no celular, à direita na tela deitada; pronta, a linha brilha (`brilhaLinha`), "yes" e confetes) → 9.4B (regravado: cada parte da linha pulsa quando é lida e o degrau dela acende junto, `pulsaDist`) → 9.5 (potássio: `cenaPotassioInicio` — some o sódio, todos os subníveis preenchidos e escurecidos; "₁₉K" no alto; em "Joãozinho", `joaozinho()` desenha o chão embaixo do 1s e o boneco de palitos (SVG; vai andar e pular pelos degraus com física simples no joguinho); no fim, play verde "Vamos") → 9.5A: no fim, `jogoPotassio` — o aluno toca nos degraus (1s, 2s, 2p, 3s, 3p, 4s¹); certo: o Joãozinho anda e pula (física balística, agacha/estica/amassa), o subnível acende (`acendeSubnivel`, rótulos 80% apagados via `L.apag`), "right" + "próximo" e o subnível é digitado embaixo, depois de "₁₉K:"; alto demais: tenta e cai de volta; no fim: confetes, funfare e pulos de alegria, junto com o 9.5B (pausa de 1 s; no fim, play "Ok") → 9.5C (`novoJogo`: rótulos apagam de novo e o Joãozinho volta ao chão; "₂₆Fe:" embaixo em "ferro", o 26 aumenta em "26"; no fim, `jogoFerro`: 1s 2s 2p 3s 3p 4s 3d⁶; a comemoração toca o 9.5D) → 9.5D ("Vamos fazer…": `novoJogo`; "₃₅Br:" em "bromo", o 35 aumenta em "35"; no fim, `jogoBromo`: até 4p⁵; a comemoração toca o 9.6) → 9.6 (`historiaVaiPara`: o gráfico sai e a câmera vai aos cavaletes do Madelung — novo, 3º — e do Pauling — agora o 4º; `livroPauling`: capa e página do livro; `historiaVoltaGrafico`; `graficoViraTabela`: os degraus voltam às camadas e viram linhas, a 1ª em cima (`L.tab`); tabela formada → `diagramaPauling`: o MESMO diagrama da capa (`desenhaPauling`) aparece por cima; 'setas': desenhadas uma a uma; 'acende': título "Diagrama de Pauling" e os subníveis acendendo em loop, como na capa). No 9.5B, o 3d e o 4s aumentam juntos em "não foi pro três dê. Foi pro quatro éssi". O joguinho é `jogoDistribuicao(meta, expoente do último, aoComemorar)`; `jogoPronto` monta o fim na hora (Retomar). `digita` aceita `sup` (sobrescrito). `mostraToque(on, próximo, texto)` aceita texto próprio. `cenaLitio` (lítio) ficou sem uso.

## 5. Sumário: velocidade e legendas

- Botão **Velocidade da fala** (1× → 1,1× → 1,2×) e chave **Legendas**, no alto do sumário (mesmo sistema do app da Tabela Periódica). Guardados no aparelho.

## 6. Modo edição (ferramenta do professor)

Toque longo na versão (canto inferior esquerdo) ou tecla **G**. Arrastar/pinça em textos, camadas, gráfico, eixos, letras, degraus e cartões. Gera o relatório **"ALTERAÇÕES DO MODO EDIÇÃO"**; os valores viram padrão no código (por orientação: `deitada`/`retrato`).

## 7. Regras de trabalho combinadas

1. **Toda mudança vai para o GitHub sem pedir**: subir `APP_VERSAO` (index.html) **e** `CACHE` (sw.js) juntos (1.77 → `pauling-v177`), commit e push na `main`.
2. Git nesta pasta (OneDrive): `-c windows.appendAtomically=false` no commit e no fetch; identidade com `-c user.name=… -c user.email=…`; usar o Bash (Git Bash).
3. Áudio novo/regravado: MP3 em `audio/`, nome na lista do `sw.js`, em `SEQUENCIA`, `EVENTOS` e `INICIO`; commit do MP3.
4. Termos do professor: "aumenta" = cresce e brilha; "pulsa" = cresce e volta; "onda" = um depois do outro; "card" = cartão; "degrau" = barra de um subnível.
5. Faltando um detalhe, escolher um padrão razoável e avisar qual foi.

## 8. Narrações pela ElevenLabs

- `.\ferramentas\gera-audio.ps1 -Nome 9.2 -Texto "…"` grava `audio/audio_distribuição_9.2.mp3` (PowerShell, nada para instalar). `-Voz` troca a voz; `-Vozes` lista.
- Chave só na variável do Windows `ELEVENLABS_API_KEY` (usuário) — nunca em arquivo/GitHub. Modelo `eleven_v4`, voz padrão **Lendário** (`4za2kOXGgUd57HRSQ1fn`); o 7.1 usa `4XmhZ74tBbUVCXIYNMMo`.
- **Marcas**: `{nome}` no texto não é falada; o script diz em que segundo ela cai → eventos presos à palavra. Tags como `[short pause]` viram pausa (não são lidas).
- O `.ps1` precisa ficar em UTF-8 **com BOM**.

## 9. Testes sem o professor

Edge sem janela (`--headless=new --use-angle=swiftshader`), cópia temporária do index com um script injetado. **O navegador sem janela não fica mais estreito que ~518 px e o PC também distorce**: abrir o app dentro de um `<iframe>` (384×783 celular, 1100×620 deitada). O teste não toca áudio. **No modo sem janela o `requestAnimationFrame` não roda**: na cópia de teste, trocar por `setTimeout(…, 33)`. Para montar uma cena, gravar no `sessionStorage` (`pauling-onde-parou`) o áudio e o segundo e deixar o Retomar montar. **Desde 26/11 o Edge devolve o controle antes de salvar a foto**: esperar o arquivo aparecer antes de apagar os arquivos de teste. **Verificar a sintaxe sem navegador**: `ELECTRON_RUN_AS_NODE=1 "C:/Users/amyjr/AppData/Local/Programs/Microsoft VS Code/Code.exe" checa.js index.html` (um script com `vm.Script` em cada `<script>`).

## 10. Pendências

- **Legendas**: esperar o texto final. Para áudios gerados pela ElevenLabs, os tempos de `ferramentas/tempos/*.json` já dão as legendas sem o Whisper.
- 8.2 regravado: as etiquetas "n = 1…7", o destaque do nível 1, a seta subindo e a pausa saíram (caíam antes do início do áudio novo).
- Depois do 9.1: o professor quer um **zoom para mostrar os subníveis como trilhas menores dentro de cada camada**.
- Tela deitada estreita (~900 px): cartões encostam no gráfico.
- Arquivos soltos na pasta, fora do app: `audio_distribuição_8.10.mp3` (substituído pelo 8.95) e `audio_distribuição_teste_voz.mp3`.
