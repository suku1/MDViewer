import { contextBridge, ipcRenderer } from 'electron';

// セキュアなAPIをレンダラープロセスに公開
contextBridge.exposeInMainWorld('electronAPI', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  readMarkdownFile: (filePath: string) => ipcRenderer.invoke('read-markdown-file', filePath),
  showInExplorer: (filePath: string) => ipcRenderer.invoke('show-in-explorer', filePath),
  onFileOpened: (callback: (filePath: string) => void) => {
    ipcRenderer.on('file-opened', (_event, filePath) => callback(filePath));
  },
  onThemeChange: (callback: (theme: string) => void) => {
    ipcRenderer.on('change-theme', (_event, theme) => callback(theme));
  },
  setTheme: (theme: string) => {
    ipcRenderer.send('set-theme', theme);
  }
});
