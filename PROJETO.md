# Projeto: audiobook "Distribuição Eletrônica — O diagrama de Pauling"

> Documento de contexto para um assistente (Claude) entender o projeto antes de ajudar.
> Estado descrito: **versão 0.88** (novembro de 2026). Repositório: `amyjr007/audiobook-diagrama-pauling` (GitHub, branch `main`).

## 1. O que é

Um **audiobook interativo** de Química, em português, para alunos do ensino médio. Um professor narra (arquivos MP3) e, enquanto a narração toca, a tela mostra animações sincronizadas: átomo em 3D, modelo de Rutherford, modelo de Bohr, gráfico de níveis de energia, e atividades em que o aluno **arrasta cartões** (s², p⁶, d¹⁰, f¹⁴) para montar a distribuição eletrônica.

- Roda no navegador e é instalável como app (PWA). Funciona offline depois da primeira visita.
- Público-alvo de telas: **celular em pé** (retrato, ex.: 384×783) e **Chromebook/PC** (tela deitada). As duas orientações têm ajustes próprios.
- Autor/dono do conteúdo: Prof. Amauri Junior. Ele escreve o roteiro e grava os áudios; o código é feito com o Claude Code.

## 2. Arquivos

| Arquivo | O que tem |
|---|---|
| `index.html` | **O app inteiro** (~5.500 linhas): HTML, CSS e JavaScript num só arquivo. |
| `sw.js` | Service worker: guarda em cache os arquivos e os áudios (offline) e atende pedidos de trecho de áudio. |
| `manifest.webmanifest`, `icones/` | O que torna o app instalável. |
| `three.min.js` | Three.js r150 (global `THREE`), usado nas cenas 3D. |
| `audio/audio_distribuição_N.mp3` | Narrações, uma por trecho do roteiro (0, 1, 2 … 8.4, 8.5, 8.5A, 8.7). |
| `audio/vfx/*.mp3` | Efeitos sonoros (`right`, `error`, `applause`, `funfare`, `typing sound`, `flip`, `electron_jumping`…). |
| `imagens/`, `fontes/` | Fotos (Pauling, Bohr, autor), imagem dos postulados de Bohr, fontes (Space Grotesk, IBM Plex). |

## 3. Telas

- **Capa** (`#capa`): toca `audio_distribuição_0`, mostra o diagrama de Pauling animado e os botões **Aprender** e **Treinar**.
- **Aprender** (`#pagina1`): o audiobook. Botão de play grande, barra de progresso, **Sumário** (lista de capítulos). A troca de tela é uma animação de cubo girando.
- **Treinar** (`#treinar`): seção separada (exercícios).

## 4. Como o roteiro funciona (o mais importante)

### 4.1 Sequência de áudios
`SEQUENCIA` é a lista, em ordem, dos áudios do Aprender. Atual:
`1, 2, 3, 4, 5, 5.1, 5.2, 6, 7, 7.1, 7.2, 7.3, 7.4, 8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.5A, 8.7`.
Ao terminar um áudio, o play chama o próximo. Alguns avanços são especiais:

- **automáticos**: 8.1 → 8.2;
- **por um botão "Ok"/"Próximo"**: a função `botaoOk(true, 'próximo áudio', 'texto')`;
- **só quando o aluno faz a atividade**: 7.3 → 7.4 depois de 3 saltos quânticos; 8.3 → 8.4 quando encaixa o 1s²; 8.5 → 8.5A quando completa o 2º nível. Se o aluno termina antes do áudio acabar, o próximo espera o fim (variáveis `pendente7_4`, `pendente8_4`, `pendente8_6`).

### 4.2 Eventos com tempo
`EVENTOS['audio_distribuição_X'] = [ { t: segundos, acao: () => … }, … ]`.
Cada ação roda quando a narração passa daquele segundo. `t: 'fim'` roda quando o áudio acaba.
**É aqui que entram as instruções do professor**, que chegam no formato *"no áudio 8.5, em 12 s aumenta o 2p⁶; em 15 s pulsa o 2s²…"*.

### 4.3 Relógio do roteiro
As animações usam um relógio próprio que **congela quando a narração pausa**:

- `anima(ms, k => …, fim, curva)`: interpolação de 0 a 1;
- `agenda(ms, fn)`: atraso.

Não use `setTimeout` para coisas do roteiro (a exceção é a repetição da mãozinha-guia).

### 4.4 Retomar e Sumário
- **Retomar**: ao recarregar a página, o app volta ao mesmo áudio e segundo (guardado em `sessionStorage`). Para isso existe `INICIO['audio_X']`, uma função que **monta a cena como ela estava no começo daquele áudio** (ou seja, como o áudio anterior terminou). Depois, os eventos até o segundo salvo são executados de novo, em silêncio. **Todo áudio novo precisa da sua entrada em `INICIO`.**
- **Sumário**: `CAPITULOS` lista os itens. Cada um tem `titulo`, `audio`, `inicio` e um `prepara()` que monta a cena. A numeração dos títulos é automática. Itens atuais:
  1. A Estrutura atômica básica
  2. Número atômico (Z)
  3. Quiz do H
  4. Quiz do C
  5. O princípio da neutralidade do átomo
  6. Os níveis de energia (7.1)
  7. O modelo de Bohr e o salto quântico (7.3)
  8. O gráfico de energia (8.1)
  9. Os subníveis atômicos (8.2)
  10. O princípio da construção (8.3)

## 5. Módulos principais dentro do `index.html`

| Módulo | Papel |
|---|---|
| `Atomo` (grande, ~3.000 linhas) | Toda a cena 3D e as atividades: átomo e construção, Rutherford, Bohr (elétron que salta ao toque), letras K…Q, **gráfico de níveis** (`grafico`), cartões e arrastos. Expõe funções chamadas pelos EVENTOS (`Atomo.xxx()`). |
| `Quiz` | Perguntas com acerto/erro, confete e aplausos (`Quiz.comemora()`). |
| `Equacoes`, `Postulado` | Textos e imagens que aparecem sobre a cena (conceitos, postulados de Bohr). |
| `Intro` | Abertura do Aprender antes do primeiro play. |
| `Retomar` | Salvar e restaurar a posição. |
| `Edicao` | **Modo edição** (ver seção 7). |
| `ModoCamera` | Mover a câmera livremente (ferramenta de autoria). |

Outros pontos:
- **Narração**: `pausaNarracao()` marca a pausa como intencional. Pausas causadas pelo sistema do celular são retomadas sozinhas.
- **Sons**: `sfx('nome')` toca `audio/vfx/nome.mp3`.

## 6. O gráfico de energia (áudios 8.x): estado atual

### 6.1 Como o gráfico é desenhado
- Eixo vertical com seta "E" e uma linha de base.
- 7 níveis (1º a 7º; antes, letras K, L, M, N, O, P, Q).
- Cada nível tem **degraus**, um por subnível: `SUBS = [1, 2, 3, 4, 4, 3, 2]` (K só tem s; L tem s e p; M tem s, p e d; e assim por diante).
- **Cores**: cada nível tem a sua cor. Quando o bloco é encaixado, o degrau ganha a cor do subnível (s ciano, p rosa, d amarelo, f verde).
- **Rótulo do degrau**: "1s²", "2p⁶"… em 3 peças (número do nível, letra, expoente). Cada peça pode ser destacada sozinha. O rótulo aparece quando o bloco é encaixado.
- **"Nº nível"**: no áudio 8.3, as letras K…Q são apagadas e no lugar é digitado "1º nível" … "7º nível". Embaixo de cada um aparece o **total de elétrons do nível** (2e⁻, 8e⁻, 18e⁻, 32e⁻, 32e⁻, 18e⁻, 8e⁻).
- **Cartões** (`#cartoes`, HTML, embaixo da tela): s², p⁶, d¹⁰, f¹⁴.

### 6.2 Montar um nível
Função `Atomo.montaNivel(n, total, aoCompletar)`.
- O aluno arrasta **qualquer** cartão. Só encaixa (com som "right") um subnível que existe naquele nível e ainda não foi colocado. Soltar perto do nível um cartão errado toca "error" e o cartão volta.
- O cartão usado **fica vazio** até o nível inteiro ficar completo; aí todos voltam.
- Com o nível completo, os degraus ficam no lugar, com a cor e o rótulo, e o total embaixo do "Nº nível" some.

### 6.3 Funções do gráfico mais usadas no roteiro

| Função | O que faz |
|---|---|
| `Atomo.focoNivel([1, 2])` | Deixa acesos só os níveis da lista; os outros escurecem. `focoNivel(0)` acende tudo. |
| `Atomo.ondaCartoes`, `Atomo.ondaDegraus`, `Atomo.cartaoDestaque('s')`, `Atomo.cartoesAumentam(ms)` | Ondas e destaques nos cartões e degraus. |
| `Atomo.textoNivel(n)`, `Atomo.destacaTextoNivel(n, ms)` | Digita o "Nº nível" (ou só o destaca, se ele já estiver na tela). |
| `Atomo.totaisNiveis()`, `Atomo.destacaTotais(ms)`, `Atomo.seguraTotal(n)` | Totais de elétrons embaixo dos níveis. |
| `Atomo.realcaParte(k, n, j, segura)`, `Atomo.realcaPartes(n, [[j, k], …], segura)` | Destacam peças do rótulo do degrau. j = subnível (0 s, 1 p…); k = peça (0 número, 1 letra, 2 expoente). |
| `Atomo.rotuloDestaque(n, j, on)`, `Atomo.pulsaRotulo(n, j)` | Destaque do rótulo inteiro; o degrau aumenta junto. |
| `Atomo.circuloContador(n, true, ateEncaixar)` | Círculo amarelo desenhado em volta do total. |
| `Atomo.demoEncaixe('s', 1, 0)`, `Atomo.arrasteBloco(..., { semGuia: true })`, `Atomo.guiaArraste(ms)` | Mãozinha que demonstra e ensina o arrasto. |
| `Atomo.reorganizaNiveis()` | **Já existe, mas ainda não é usada.** Sobe todos os níveis completos de uma vez para a altura de energia (ordem de Aufbau/Madelung: 1s, 2s, 2p, 3s, 3p, 4s, 3d…). O professor decidiu que o aluno primeiro monta nível por nível, e a reorganização acontece só no final, quando ele indicar. |

### 6.4 Roteiro dos áudios 8.3 a 8.7

**8.3** — "O princípio da construção"

| Tempo | O que acontece |
|---|---|
| 0,5–2,5 s | Onda nos cartões, ida e volta. |
| 5–8,5 s | Onda nos degraus, de baixo para cima. |
| 15–19 s | As letras viram "Nº nível". |
| 22,5–28 s | Aparecem os totais de elétrons. |
| 24,9 s | Demonstração do encaixe do s². |
| 30 s | Os totais aumentam. |
| 36 s | Os cartões aumentam. |
| 38–43,4 s | Onda nos cartões. |
| 45 s | Foco no 1º nível: os outros escurecem. |
| 47,8 / 49 s | Destaques do "1º nível" e do "2e⁻"; o "2e⁻" fica aumentado. |
| 52 s | O aluno já pode arrastar o s². |
| 55 s | A mãozinha aparece; aos 55,5 s finge arrastar, e repete a cada 3 s. |

Quando o 1s² é encaixado, começa o 8.4.

**8.4** — Destaques das peças do "1s²" e do "1º nível". No fim, o botão "Próximo" leva ao 8.5.

**8.5** — Montar o 2º nível (`montaNivel(2, 8)`).

| Tempo | O que acontece |
|---|---|
| 1 s | Foco nos níveis 1–2. |
| 6 s | O "8e⁻" aumenta e fica aumentado. |
| 8,5–10 s | Onda nos cartões. |
| 17,5–19 s | Círculo em volta do "8e⁻". |
| 21 s | Os degraus do 2º nível brilham. |

Quando o nível fica completo, começa o 8.5A.

**8.5A**

| Tempo | O que acontece |
|---|---|
| 12 s | O 2p⁶ aumenta (o degrau junto). |
| 15 s | O 2s² pulsa. |
| 16,5 s | O 2p⁶ volta ao normal. |
| 17,5 s | O 2p⁶ pulsa. |
| 20 s | O 2s² pulsa. |

No fim, o botão "Próximo" leva ao 8.7.

**8.7** — Montar o 3º nível (`montaNivel(3, 18)`).

| Tempo | O que acontece |
|---|---|
| 0 s | Foco nos níveis 1–3. |
| 1,9 s | O "3º nível" aumenta. |
| 5,5 s | O "18e⁻" aumenta. |
| 8–9 s | Onda nos cartões. |
| 13 s | Círculo em volta do "18e⁻"; some no 1º encaixe. |

**Ainda não definido:** o que acontece quando o 3º nível fica completo, e os próximos áudios.

### 6.5 Antes do 8.x (resumo)
- **1–5.2**: estrutura do átomo, número atômico, quizzes do H e do C, neutralidade, com o átomo 3D sendo construído.
- **6**: construção do átomo e o modelo de Rutherford.
- **7–7.4**: postulados de Bohr (imagem; placas com datas 1911/1913), conceitos de níveis de energia, passagem de Rutherford para Bohr com camadas e barra de energia. No átomo de Bohr de 1 próton, o aluno toca para o elétron dar o "salto quântico"; depois de 3 saltos vem o 7.4.
- **8–8.2**: as letras K…Q encaixam nas camadas; o átomo vira o gráfico de níveis (8.1); a seta, os degraus e os cartões dos subníveis aparecem (8.2).

## 7. Modo edição (ferramenta do professor)

- **Como abrir**: toque longo no número da versão (canto inferior esquerdo) ou tecla **G**.
- **O que dá para fazer**: arrastar e mudar tamanho (pinça ou roda do mouse) de textos, camadas, gráfico, eixos, cada letra, os degraus de cada nível e a fileira de cartões.
- **Relatório**: o modo gera um texto **"ALTERAÇÕES DO MODO EDIÇÃO · v0.xx · tela L×A"** com os valores. O professor manda esse relatório e o assistente grava os valores como padrão no código, separados por orientação (`deitada` = PC/Chromebook, `retrato` = celular). Tabelas de padrão: `ESCALA_CAMADAS`, `ESCALA_GRAFICO`, `POS_GRAFICO`, `POS_EIXOS`, `AJUSTE_LETRAS`, `AJUSTE_DEGRAUS`, e o CSS `.cartoes.retrato`.

## 8. Regras de trabalho combinadas

1. **Toda mudança vai para o GitHub**, sem o professor precisar pedir:
   - subir `APP_VERSAO` no `index.html` **e**, junto, `CACHE` no `sw.js` (0.88 → `pauling-v88`), para os aparelhos receberem a versão nova;
   - commit e push na branch `main`.
2. **Áudio novo**: colocar em `audio/`, acrescentar o nome na lista de áudios do `sw.js`, em `SEQUENCIA` (se for do caminho principal), em `EVENTOS` e em `INICIO`, e fazer o commit do MP3.
3. **Git** (a pasta está no OneDrive):
   - usar `-c windows.appendAtomically=false` no commit e no fetch;
   - informar a identidade com `-c user.name=… -c user.email=…` em cada commit;
   - o git funciona no Bash (Git Bash), não no PowerShell.
4. **Celular e PC podem ter tamanhos diferentes.** Quando o professor diz "só no Chromebook", a regra vale só para a tela deitada.
5. **Termos que o professor usa**:
   - "aumenta" = cresce e brilha;
   - "pulsa" = cresce e volta;
   - "onda" = um depois do outro (o próximo aumenta, o anterior volta);
   - "escurece" = foco em outro nível;
   - "card" = cartão;
   - "degrau" = barra de um subnível no gráfico;
   - "2e⁻" = total ou contador de elétrons.
6. Quando faltar um detalhe (por exemplo, por quanto tempo algo fica aumentado), escolher um padrão razoável e **avisar ao professor** qual foi.

## 9. Como testar sem o professor

- Navegador Edge sem janela (headless, com `--use-angle=swiftshader`). Uma cópia temporária do `index.html` com um script injetado chama funções como `cenaGraficoCartoes()`, `Atomo.xxx()` e `Atomo.avancaTudo()` (que termina as animações na hora) e tira uma captura de tela.
- **Atenção**: o navegador sem janela não fica mais estreito que ~518 px. Para simular o celular de 384 px, abra o app dentro de um `<iframe>` de 384×783.
- O teste não toca áudio. Por isso os tempos do roteiro e a passagem de um áudio para o outro só são confirmados no aparelho real.
- Arquivos temporários de teste (`_teste_*.html`) são apagados depois.

## 10. Pendências conhecidas

- Definir o que acontece ao completar o 3º nível (8.7) e os áudios seguintes.
- Definir quando usar `reorganizaNiveis()` e o que acontece com os textos "Nº nível" nesse momento.
- Os valores do modo edição para o PC (letras, degraus, eixos) ainda não foram enviados. Os do celular já estão no código.
- Uma correção para a narração que parava sozinha no celular, no áudio 7.3, ainda não foi confirmada no aparelho.
