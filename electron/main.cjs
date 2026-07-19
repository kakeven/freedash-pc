const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { spawn } = require('node:child_process')
const Store = require('electron-store')

const store = new Store({
  defaults: {
    gamesFolder: '',
    xeniaDataFolder: '',
    xeniaPath: ''
  }
})

const COVER_NAMES = ['cover.jpg', 'cover.jpeg', 'cover.png', 'boxart.jpg', 'boxart.png']
const GAME_EXTENSIONS = ['.iso', '.xex', '.zar']
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp']

// Normaliza nomes pra comparar "X-Men Origins - Wolverine" com variações de pontuação/caixa
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Procura a pasta correspondente em xeniaDataFolder e retorna a primeira imagem em Artwork/
function findXeniaArtwork(xeniaDataFolder, gameTitle) {
  if (!xeniaDataFolder || !fs.existsSync(xeniaDataFolder)) return null

  let dataEntries
  try {
    dataEntries = fs.readdirSync(xeniaDataFolder, { withFileTypes: true }).filter((e) => e.isDirectory())
  } catch {
    return null
  }

  const target = normalizeName(gameTitle)
  const match =
    dataEntries.find((e) => normalizeName(e.name) === target) ||
    dataEntries.find((e) => normalizeName(e.name).includes(target) || target.includes(normalizeName(e.name)))

  if (!match) return null

  const artworkDir = path.join(xeniaDataFolder, match.name, 'Artwork')
  if (!fs.existsSync(artworkDir)) return null

  try {
    const images = fs
      .readdirSync(artworkDir)
      .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    if (!images.length) return null

    const boxart = images.find((f) => f.toLowerCase().includes('boxart'))
    return path.join(artworkDir, boxart || images[0])
  } catch {
    return null
  }
}

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#0a0d0a',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

// --- Settings ---
ipcMain.handle('settings:get', () => {
  return {
    gamesFolder: store.get('gamesFolder'),
    xeniaDataFolder: store.get('xeniaDataFolder'),
    xeniaPath: store.get('xeniaPath')
  }
})

ipcMain.handle('settings:set', (_event, partial) => {
  if (typeof partial.gamesFolder === 'string') store.set('gamesFolder', partial.gamesFolder)
  if (typeof partial.xeniaDataFolder === 'string') store.set('xeniaDataFolder', partial.xeniaDataFolder)
  if (typeof partial.xeniaPath === 'string') store.set('xeniaPath', partial.xeniaPath)
  return {
    gamesFolder: store.get('gamesFolder'),
    xeniaDataFolder: store.get('xeniaDataFolder'),
    xeniaPath: store.get('xeniaPath')
  }
})

// --- Diálogos de escolha de pasta/arquivo ---
ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

ipcMain.handle('dialog:pickExecutable', async () => {
  const filters =
    process.platform === 'win32' ? [{ name: 'Executável', extensions: ['exe'] }] : undefined
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters })
  if (result.canceled || result.filePaths.length === 0) return null
  return result.filePaths[0]
})

// --- Scan da pasta de jogos ---
// Estrutura esperada: gamesFolder/NomeDoJogo/{jogo.iso|.xex, cover.jpg}
ipcMain.handle('games:scan', () => {
  const gamesFolder = store.get('gamesFolder')
  const xeniaDataFolder = store.get('xeniaDataFolder')

  if (!gamesFolder || !fs.existsSync(gamesFolder)) {
    return { error: 'folder-not-set', games: [] }
  }

  let entries
  try {
    entries = fs.readdirSync(gamesFolder, { withFileTypes: true })
  } catch (err) {
    return { error: 'read-failed', games: [] }
  }

  const games = []

  for (const entry of entries) {
    const entryPath = path.join(gamesFolder, entry.name)

    if (entry.isDirectory()) {
      const files = fs.readdirSync(entryPath)
      const gameFile = files.find((f) => GAME_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      const coverFile = files.find((f) => COVER_NAMES.includes(f.toLowerCase()))

      if (gameFile) {
        const title = entry.name
        const coverPath =
          (coverFile ? path.join(entryPath, coverFile) : null) || findXeniaArtwork(xeniaDataFolder, title)

        games.push({
          id: entry.name,
          title,
          filePath: path.join(entryPath, gameFile),
          coverPath
        })
      }
    } else if (GAME_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      // Jogo solto direto na pasta raiz, sem subpasta/capa local
      const title = path.basename(entry.name, path.extname(entry.name))
      games.push({
        id: entry.name,
        title,
        filePath: entryPath,
        coverPath: findXeniaArtwork(xeniaDataFolder, title)
      })
    }
  }

  games.sort((a, b) => a.title.localeCompare(b.title))
  return { error: null, games }
})

// Serve arquivos de capa locais pro renderer como base64 (evita configurar protocol handler)
ipcMain.handle('games:readCover', (_event, coverPath) => {
  try {
    const data = fs.readFileSync(coverPath)
    const ext = path.extname(coverPath).slice(1)
    return `data:image/${ext};base64,${data.toString('base64')}`
  } catch {
    return null
  }
})

// --- Lançar jogo via Xenia ---
ipcMain.handle('games:launch', (_event, filePath) => {
  const xeniaPath = store.get('xeniaPath')
  if (!xeniaPath || !fs.existsSync(xeniaPath)) {
    return { error: 'no-xenia-path' }
  }
  if (!fs.existsSync(filePath)) {
    return { error: 'game-not-found' }
  }

  let child
  try {
    child = spawn(xeniaPath, [filePath], { cwd: path.dirname(xeniaPath) })
  } catch {
    return { error: 'spawn-failed' }
  }

  mainWindow?.minimize()

  child.on('exit', () => {
    if (mainWindow) {
      mainWindow.restore()
      mainWindow.focus()
    }
  })

  child.on('error', () => {
    if (mainWindow) {
      mainWindow.restore()
      mainWindow.focus()
    }
  })

  return { error: null }
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
