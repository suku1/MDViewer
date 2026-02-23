import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { marked } from 'marked';

let mainWindow: BrowserWindow | null = null;
let currentTheme: string = 'light';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'MDViewer',
    icon: path.join(__dirname, '../public/icon.png')
  });

  mainWindow.loadFile(path.join(__dirname, '../public/index.html'));

  // 開発モードの時のみ開発者ツールを有効化
  if (!app.isPackaged) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        mainWindow?.webContents.toggleDevTools();
        event.preventDefault();
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // カスタムメニューを使用するため、ネイティブメニューは削除
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ファイルをダブルクリックで開いた時の処理 (Windows/Linux)
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  
  if (mainWindow) {
    mainWindow.webContents.send('file-opened', filePath);
  } else {
    // ウィンドウがまだ作成されていない場合、作成後に開く
    app.whenReady().then(() => {
      if (mainWindow) {
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow!.webContents.send('file-opened', filePath);
        });
      }
    });
  }
});

// Windows用: コマンドライン引数からファイルを開く
if (process.platform === 'win32' && process.argv.length >= 2) {
  const filePath = process.argv[1];
  if (filePath && filePath.endsWith('.md')) {
    app.whenReady().then(() => {
      if (mainWindow) {
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow!.webContents.send('file-opened', filePath);
        });
      }
    });
  }
}

// ファイル選択ダイアログを開く
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Markdown Files', extensions: ['md'] }
    ]
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

// Markdownファイルを読み込んでHTMLに変換
ipcMain.handle('read-markdown-file', async (event, filePath: string) => {
  try {
    // ファイルの存在確認
    if (!fs.existsSync(filePath)) {
      throw new Error('ファイルが見つかりません');
    }

    // .md拡張子のチェック
    if (path.extname(filePath) !== '.md') {
      throw new Error('対応していない拡張子です。.mdファイルを選択してください。');
    }

    // Markdownファイルを読み込み
    const markdownContent = fs.readFileSync(filePath, 'utf-8');
    
    // MarkdownをHTMLに変換（HTMLタグを許可）
    const htmlContent = await marked.parse(markdownContent, {
      breaks: true,
      gfm: true,
      async: false
    }) as string;

    return {
      success: true,
      html: htmlContent,
      fileName: path.basename(filePath),
      filePath: filePath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ファイルの読み込みに失敗しました'
    };
  }
});

// レンダラーから現在のテーマを受け取る
ipcMain.on('set-theme', (event, theme: string) => {
  currentTheme = theme;
});

// エクスプローラーでファイルを表示
ipcMain.handle('show-in-explorer', async (event, filePath: string) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to show in explorer' };
  }
});
