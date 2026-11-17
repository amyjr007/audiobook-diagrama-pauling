# Distribuição Eletrônica — O diagrama de Pauling

Audiobook interativo para celular, tablet e Chromebook.

**Prof. Amauri Junior**

## Como usar

Abra o link e, no celular ou tablet, escolha "Instalar app" ou "Adicionar à tela inicial".

## Estrutura

- `index.html`: o app inteiro (capa, página do audiobook, sumário). Os capítulos ficam em `CAPITULOS` e os eventos de cada diálogo ficam em `EVENTOS`.
- `audio/dialogoN.mp3`: as narrações. `audio/vfx/`: os efeitos sonoros.
- `sw.js` e `manifest.webmanifest`: o que torna o app instalável e utilizável offline.
