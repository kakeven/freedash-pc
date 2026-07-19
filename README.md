# FreeDash

Launcher frontend para o emulador Xenia (Xbox 360), inspirado visualmente no Freestyle Dash.

## Stack
Vue 3 + Vite + Electron.

## Rodando em dev

```bash
npm install
npm run electron:dev
```

Isso sobe o Vite em `localhost:5173` e abre a janela do Electron apontando pra ele.

## Build de produção

```bash
npm run build
npm run electron:build
```

## O que já está pronto (escopo de hoje)
- Janela Electron com Vue montado.
- Tela de configurações: escolher pasta de jogos, pasta GameData do Xenia e executável do Xenia (paths salvos via `electron-store` em disco, persistem entre sessões).
- Scan da pasta de jogos (`games:scan` no main process): espera subpastas com `.iso`/`.xex`/`.zar` + `cover.jpg`/`cover.png` opcional, ou arquivos soltos na raiz.
- Capa com dois caminhos: primeiro tenta `cover.jpg`/`boxart.jpg` na própria pasta do jogo; se não achar, cai pra `GameData/<NomeDoJogo>/Artwork/<primeira imagem>` (pasta do Xenia Manager), casando o nome normalizado (ignora maiúsculas/pontuação).
- Grid horizontal estilo "blade" com navegação por teclado (setas ←/→) e clique.

## O que falta (pra você integrar)
- **Lançar o jogo via Xenia**: hoje `xeniaPath` só é salvo, não é usado. Em `electron/main.cjs` dá pra adicionar um handler `games:launch` usando `child_process.spawn(xeniaPath, [game.filePath])`.
- Validação de paths (checar se o executável do Xenia existe de fato, se é `.exe` no Windows).
- Tratamento de erro mais fino no scan (hoje qualquer falha de leitura vira `read-failed` genérico).
- Ajustar `GAME_EXTENSIONS` e `COVER_NAMES` em `main.cjs` se sua estrutura de pastas for diferente da assumida.

## Estrutura de pastas esperada pelo scan

```
gamesFolder/
  Halo 3/
    halo3.iso
    cover.jpg
  Gears of War/
    gears.xex
    cover.png
  jogo_solto.iso
```
