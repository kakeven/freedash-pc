const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('freedash', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (partial) => ipcRenderer.invoke('settings:set', partial),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  pickExecutable: () => ipcRenderer.invoke('dialog:pickExecutable'),
  scanGames: () => ipcRenderer.invoke('games:scan'),
  readCover: (coverPath) => ipcRenderer.invoke('games:readCover', coverPath),
  launchGame: (filePath) => ipcRenderer.invoke('games:launch', filePath)
})
