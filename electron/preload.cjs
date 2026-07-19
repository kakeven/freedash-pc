const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('freedash', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial) => ipcRenderer.invoke('settings:set', partial),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  pickExecutable: () => ipcRenderer.invoke('dialog:pickExecutable'),
  pickBackground: () => ipcRenderer.invoke('dialog:pickBackground'),
  scanGames: () => ipcRenderer.invoke('games:scan'),
  readCover: (coverPath) => ipcRenderer.invoke('games:readCover', coverPath),
  listXzpImages: (xzpPath) => ipcRenderer.invoke('xzp:listImages', xzpPath),
  readXzpEntry: (xzpPath, entryName) => ipcRenderer.invoke('xzp:readEntry', { xzpPath, entryName }),
  launchGame: (filePath) => ipcRenderer.invoke('games:launch', filePath)
})
