// TypeScript型定義
interface ElectronAPI {
  openFileDialog: () => Promise<string | null>;
  readMarkdownFile: (filePath: string) => Promise<{
    success: boolean;
    html?: string;
    fileName?: string;
    filePath?: string;
    error?: string;
  }>;
  showInExplorer: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  onFileOpened: (callback: (filePath: string) => void) => void;
  onThemeChange: (callback: (theme: string) => void) => void;
  setTheme: (theme: string) => void;
}

// windowオブジェクトの拡張
interface Window {
  electronAPI: ElectronAPI;
}

interface OpenFile {
  filePath: string;
  fileName: string;
  html: string;
}

const welcomeMessage = document.getElementById('welcomeMessage') as HTMLDivElement;
const markdownContent = document.getElementById('markdownContent') as HTMLDivElement;
const openFilesList = document.getElementById('openFilesList') as HTMLUListElement;
const favoritesList = document.getElementById('favoritesList') as HTMLUListElement;
const historyList = document.getElementById('historyList') as HTMLUListElement;
const collapseOpen = document.getElementById('collapseOpen') as HTMLButtonElement;
const collapseFavorites = document.getElementById('collapseFavorites') as HTMLButtonElement;
const collapseHistory = document.getElementById('collapseHistory') as HTMLButtonElement;
const toggleSidebarBtn = document.getElementById('toggleSidebar') as HTMLButtonElement;
const sidebar = document.querySelector('.sidebar') as HTMLElement;
const contextMenu = document.getElementById('contextMenu') as HTMLElement;

let openFiles: OpenFile[] = [];
let currentFileIndex: number = -1;
let fileHistory: string[] = [];
let favorites: string[] = [];

// LocalStorageから履歴を読み込み
function loadHistory() {
  const saved = localStorage.getItem('fileHistory');
  if (saved) {
    try {
      fileHistory = JSON.parse(saved);
      updateHistoryList();
    } catch (e) {
      fileHistory = [];
    }
  }
}

// 履歴を保存
function saveHistory() {
  localStorage.setItem('fileHistory', JSON.stringify(fileHistory.slice(0, 20))); // 最大20件
}

// LocalStorageからお気に入りを読み込み
function loadFavorites() {
  const saved = localStorage.getItem('favorites');
  if (saved) {
    try {
      favorites = JSON.parse(saved);
      updateFavoritesList();
    } catch (e) {
      favorites = [];
    }
  }
}

// お気に入りを保存
function saveFavorites() {
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

// お気に入りに追加
function addToFavorites(filePath: string) {
  if (!favorites.includes(filePath)) {
    favorites.push(filePath);
    saveFavorites();
    updateFavoritesList();
    
    // 新しく追加されたアイテムにアニメーションを適用
    setTimeout(() => {
      const listItems = favoritesList.querySelectorAll('li');
      const newItem = listItems[listItems.length - 1];
      if (newItem) {
        newItem.classList.add('slide-in');
        setTimeout(() => {
          newItem.classList.remove('slide-in');
        }, 300);
      }
    }, 10);
  }
}

// お気に入りから削除
function removeFromFavorites(filePath: string) {
  const index = favorites.indexOf(filePath);
  if (index !== -1) {
    // アニメーションを適用
    const listItems = favoritesList.querySelectorAll('li');
    if (listItems[index]) {
      listItems[index].classList.add('slide-out');
    }
    
    setTimeout(() => {
      favorites.splice(index, 1);
      saveFavorites();
      updateFavoritesList();
    }, 300);
  }
}

// お気に入りリストを更新
function updateFavoritesList() {
  favoritesList.innerHTML = '';
  
  favorites.forEach((filePath) => {
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    const fileName = filePath.split(/[\\\/]/).pop() || filePath;
    span.textContent = fileName;
    span.className = 'file-name';
    span.title = filePath;
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'close-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromFavorites(filePath);
    });
    
    li.appendChild(span);
    li.appendChild(removeBtn);
    li.addEventListener('click', async () => {
      await loadMarkdownFile(filePath);
    });
    addContextMenuToListItem(li, filePath);
    favoritesList.appendChild(li);
  });
  
  // ファイル数を更新
  const favoritesCount = document.getElementById('favoritesCount');
  if (favoritesCount) {
    favoritesCount.textContent = `(${favorites.length})`;
  }
}

// 履歴に追加
function addToHistory(filePath: string) {
  // 既存のエントリを削除
  fileHistory = fileHistory.filter(f => f !== filePath);
  // 先頭に追加
  fileHistory.unshift(filePath);
  // 最大20件に制限
  fileHistory = fileHistory.slice(0, 20);
  saveHistory();
  updateHistoryList();
}

// 履歴リストを更新
function updateHistoryList() {
  historyList.innerHTML = '';
  fileHistory.forEach(filePath => {
    const li = document.createElement('li');
    const fileName = filePath.split(/[/\\]/).pop() || filePath;
    const span = document.createElement('span');
    span.className = 'file-name';
    span.textContent = fileName;
    span.title = filePath;
    li.appendChild(span);
    li.addEventListener('click', () => {
      loadMarkdownFile(filePath);
    });
    addContextMenuToListItem(li, filePath);
    historyList.appendChild(li);
  });
  
  // ファイル数を更新
  const historyCount = document.getElementById('historyCount');
  if (historyCount) {
    historyCount.textContent = `(${fileHistory.length})`;
  }
}

// 開いているファイルリストを更新
function updateOpenFilesList() {
  openFilesList.innerHTML = '';
  
  openFiles.forEach((file, index) => {
    const li = document.createElement('li');
    if (index === currentFileIndex) {
      li.classList.add('active');
    }
    
    const favoriteBtn = document.createElement('button');
    favoriteBtn.className = 'file-favorite-btn';
    favoriteBtn.textContent = favorites.includes(file.filePath) ? '★' : '☆';
    favoriteBtn.title = favorites.includes(file.filePath) ? 'お気に入りから削除' : 'お気に入りに追加';
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (favorites.includes(file.filePath)) {
        removeFromFavorites(file.filePath);
      } else {
        addToFavorites(file.filePath);
      }
      updateOpenFilesList();
    });
    
    const span = document.createElement('span');
    span.textContent = file.fileName;
    span.className = 'file-name';
    span.title = file.filePath;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeFile(index);
    });
    
    li.appendChild(favoriteBtn);
    li.appendChild(span);
    li.appendChild(closeBtn);
    li.addEventListener('click', () => {
      switchToFile(index);
    });
    addContextMenuToListItem(li, file.filePath);
    openFilesList.appendChild(li);
  });
  
  // ファイル数を更新
  const openFilesCount = document.getElementById('openFilesCount');
  if (openFilesCount) {
    openFilesCount.textContent = `(${openFiles.length})`;
  }
}

// ファイルを閉じる
function closeFile(index: number) {
  // アニメーションを追加
  const listItems = openFilesList.querySelectorAll('li');
  if (listItems[index]) {
    listItems[index].classList.add('slide-out');
  }
  
  setTimeout(() => {
    openFiles.splice(index, 1);
    
    if (openFiles.length === 0) {
      currentFileIndex = -1;
      showWelcome();
    } else {
      if (index === currentFileIndex) {
        // 閉じたファイルがアクティブだった場合
        currentFileIndex = Math.min(index, openFiles.length - 1);
        displayCurrentFile();
      } else if (index < currentFileIndex) {
        // 閉じたファイルがアクティブより前にあった場合
        currentFileIndex--;
      }
    }
    
    updateOpenFilesList();
  }, 300);
}

// ファイルを切り替え
async function switchToFile(index: number) {
  currentFileIndex = index;
  // ファイルを再読み込み
  if (currentFileIndex >= 0 && currentFileIndex < openFiles.length) {
    const file = openFiles[currentFileIndex];
    const result = await window.electronAPI.readMarkdownFile(file.filePath);
    
    if (result.success && result.html) {
      // 最新の内容で更新
      openFiles[currentFileIndex].html = result.html;
      displayCurrentFile();
    }
  }
  updateOpenFilesList();
}

// 現在のファイルを表示
function displayCurrentFile() {
  if (currentFileIndex >= 0 && currentFileIndex < openFiles.length) {
    const file = openFiles[currentFileIndex];
    welcomeMessage.style.display = 'none';
    markdownContent.innerHTML = file.html;
    markdownContent.style.display = 'block';
    addCopyButtonsToCodeBlocks();
  }
}

// コードブロックにコピーボタンを追加
function addCopyButtonsToCodeBlocks() {
  const codeBlocks = markdownContent.querySelectorAll('pre');
  
  codeBlocks.forEach((pre) => {
    // 既にボタンがある場合はスキップ
    if (pre.querySelector('.copy-code-btn')) return;
    
    // preをラップするコンテナを作成
    const container = document.createElement('div');
    container.className = 'code-block-container';
    
    // コピーボタンを作成
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-code-btn';
    copyBtn.textContent = 'コピー';
    copyBtn.title = 'コードをコピー';
    
    copyBtn.addEventListener('click', async () => {
      const code = pre.querySelector('code');
      if (code) {
        try {
          await navigator.clipboard.writeText(code.textContent || '');
          copyBtn.textContent = 'コピーしました!';
          copyBtn.classList.add('copied');
          
          setTimeout(() => {
            copyBtn.textContent = 'コピー';
            copyBtn.classList.remove('copied');
          }, 2000);
        } catch (err) {
          console.error('コピーに失敗:', err);
          copyBtn.textContent = '失敗';
          setTimeout(() => {
            copyBtn.textContent = 'コピー';
          }, 2000);
        }
      }
    });
    
    // preの親要素を取得
    const parent = pre.parentNode;
    if (parent) {
      // preをコンテナで置き換え
      parent.replaceChild(container, pre);
      container.appendChild(copyBtn);
      container.appendChild(pre);
    }
  });
}

// ウェルカムメッセージを表示
function showWelcome() {
  welcomeMessage.style.display = 'block';
  markdownContent.style.display = 'none';
}

// ファイルを読み込んで表示する関数
async function loadMarkdownFile(filePath: string) {
  try {
    const result = await window.electronAPI.readMarkdownFile(filePath);
    
    if (result.success && result.html && result.fileName) {
      // 既に開いているか確認
      const existingIndex = openFiles.findIndex(f => f.filePath === filePath);
      
      if (existingIndex >= 0) {
        // 既に開いている場合は切り替え
        switchToFile(existingIndex);
      } else {
        // 新しく開く
        openFiles.push({
          filePath: filePath,
          fileName: result.fileName,
          html: result.html
        });
        currentFileIndex = openFiles.length - 1;
        displayCurrentFile();
        updateOpenFilesList();
        
        // 新しく追加されたタブにアニメーションを適用
        setTimeout(() => {
          const listItems = openFilesList.querySelectorAll('li');
          const newItem = listItems[listItems.length - 1];
          if (newItem) {
            newItem.classList.add('slide-in');
            setTimeout(() => {
              newItem.classList.remove('slide-in');
            }, 300);
          }
        }, 10);
      }
      
      // 履歴に追加
      addToHistory(filePath);
    } else {
      alert(`エラー: ${result.error || 'ファイルの読み込みに失敗しました'}`);
    }
  } catch (error) {
    console.error('ファイルを読み込む際にエラーが発生しました:', error);
    alert('ファイルを読み込む際にエラーが発生しました');
  }
}

// メニューからファイルが開かれたときのイベントリスナー
window.electronAPI.onFileOpened((filePath: string) => {
  loadMarkdownFile(filePath);
});

// ドラッグ&ドロップのイベントリスナー
const body = document.body;

// ドラッグオーバー時の処理
body.addEventListener('dragover', (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
});

// ドラッグが離れたときの処理
body.addEventListener('dragleave', (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();
});

// ドロップ時の処理
body.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  e.stopPropagation();

  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files[0];
    const filePath = (file as any).path; // Electronでは file.path でパスが取得できる
    
    // .md拡張子のチェック
    if (filePath && filePath.endsWith('.md')) {
      loadMarkdownFile(filePath);
    } else {
      alert('対応していない拡張子です。.mdファイルをドロップしてください。');
    }
  }
});

// テーマ変更のイベントリスナー
window.electronAPI.onThemeChange((theme: string) => {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
});

// 保存されたテーマを読み込み
const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);
// メインプロセスに現在のテーマを通知
window.electronAPI.setTheme(savedTheme);

// サイドバーの折りたたみ
collapseOpen.addEventListener('click', () => {
  const section = collapseOpen.closest('.sidebar-section');
  section?.classList.toggle('collapsed');
});

collapseFavorites.addEventListener('click', () => {
  const section = collapseFavorites.closest('.sidebar-section');
  section?.classList.toggle('collapsed');
});

collapseHistory.addEventListener('click', () => {
  const section = collapseHistory.closest('.sidebar-section');
  section?.classList.toggle('collapsed');
});

// サイドバー全体の表示/非表示トグル
// サイドバー幅をCSS変数に設定
function updateSidebarWidth() {
  const contentArea = document.querySelector('.content-area') as HTMLElement;
  const sidebarWidth = sidebar.classList.contains('hidden') ? 0 : sidebar.offsetWidth;
  contentArea.style.setProperty('--sidebar-width', `${sidebarWidth}px`);
  console.log('Sidebar width updated:', sidebarWidth);
}

toggleSidebarBtn.addEventListener('click', () => {
  const isHidden = sidebar.classList.toggle('hidden');
  if (isHidden) {
    sidebar.style.marginLeft = `-${sidebar.offsetWidth}px`;
    sidebar.style.width = '0';
    // 非表示時は即座に0を設定
    const contentArea = document.querySelector('.content-area') as HTMLElement;
    contentArea.style.setProperty('--sidebar-width', '0px');
    console.log('Sidebar width updated:', 0);
  } else {
    sidebar.style.marginLeft = '';
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      sidebar.style.width = savedWidth;
    } else {
      sidebar.style.width = '250px';
    }
    setTimeout(updateSidebarWidth, 50);
  }
  localStorage.setItem('sidebarHidden', isHidden ? 'true' : 'false');
});

// サイドバーのリサイズ機能
const resizeHandle = document.querySelector('.resize-handle') as HTMLElement;
let isResizing = false;
let startX = 0;
let startWidth = 0;

resizeHandle.addEventListener('mousedown', (e: MouseEvent) => {
  isResizing = true;
  startX = e.clientX;
  startWidth = sidebar.offsetWidth;
  document.body.style.cursor = 'ew-resize';
  document.body.style.userSelect = 'none';
  e.preventDefault();
});

document.addEventListener('mousemove', (e: MouseEvent) => {
  if (!isResizing) return;
  
  const width = startWidth + (e.clientX - startX);
  if (width >= 200 && width <= 600) {
    sidebar.style.width = width + 'px';
  }
});

document.addEventListener('mouseup', () => {
  if (isResizing) {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('sidebarWidth', sidebar.style.width);
    updateSidebarWidth();
  }
});

// 初期化
loadHistory();
loadFavorites();

// 初期設定: サイドバーは表示、幅300px
sidebar.classList.remove('hidden');
const savedWidth = localStorage.getItem('sidebarWidth') || '300px';
sidebar.style.width = savedWidth;
localStorage.setItem('sidebarWidth', savedWidth);

// 初期設定: ファイル表示は中央揃え
if (!localStorage.getItem('contentAlignment')) {
  localStorage.setItem('contentAlignment', 'center');
}

// コンテキストメニューの処理
let contextMenuFilePath: string | null = null;

// コンテキストメニューを表示
function showContextMenu(x: number, y: number, filePath: string) {
  contextMenuFilePath = filePath;
  
  // ファイルが開いているかチェック
  const isOpen = openFiles.some(f => f.filePath === filePath);
  
  // 「開く」と「閉じる」メニューの表示/非表示
  const openItem = contextMenu.querySelector('[data-action="open"]') as HTMLElement;
  const closeItem = contextMenu.querySelector('[data-action="close"]') as HTMLElement;
  if (openItem && closeItem) {
    openItem.style.display = isOpen ? 'none' : 'block';
    closeItem.style.display = isOpen ? 'block' : 'none';
  }
  
  // お気に入り状態に応じてメニューテキストを変更
  const toggleFavoriteItem = contextMenu.querySelector('[data-action="toggle-favorite"]');
  if (toggleFavoriteItem) {
    const isFavorite = favorites.includes(filePath);
    toggleFavoriteItem.textContent = isFavorite ? 'お気に入りから削除' : 'お気に入りに追加';
  }
  
  contextMenu.style.display = 'block';
  contextMenu.style.left = x + 'px';
  contextMenu.style.top = y + 'px';
}

// コンテキストメニューを非表示
function hideContextMenu() {
  contextMenu.style.display = 'none';
  contextMenuFilePath = null;
}

// ドキュメント全体のクリックでメニューを閉じる
document.addEventListener('click', (e) => {
  if (!contextMenu.contains(e.target as Node)) {
    hideContextMenu();
  }
});

// コンテキストメニューのアイテムクリック
contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
  item.addEventListener('click', async () => {
    const action = item.getAttribute('data-action');
    
    if (!contextMenuFilePath) return;
    
    switch (action) {
      case 'open':
        await loadMarkdownFile(contextMenuFilePath);
        break;
      case 'close':
        const fileIndex = openFiles.findIndex(f => f.filePath === contextMenuFilePath);
        if (fileIndex !== -1) {
          closeFile(fileIndex);
        }
        break;
      case 'show-in-explorer':
        await window.electronAPI.showInExplorer(contextMenuFilePath);
        break;
      case 'toggle-favorite':
        if (favorites.includes(contextMenuFilePath)) {
          removeFromFavorites(contextMenuFilePath);
        } else {
          addToFavorites(contextMenuFilePath);
        }
        updateOpenFilesList();
        break;
    }
    
    hideContextMenu();
  });
});

// ファイルリストアイテムに右クリックイベントを追加
function addContextMenuToListItem(li: HTMLElement, filePath: string) {
  li.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showContextMenu(e.pageX, e.pageY, filePath);
  });
}

// カスタムメニューの処理
const menuItems = document.querySelectorAll('.menu-item');
const menuButtons = document.querySelectorAll('.menu-btn');

// メニューのクリックでドロップダウンを開閉
menuButtons.forEach((btn, index) => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const menuItem = menuItems[index];
    const wasActive = menuItem.classList.contains('active');
    
    // 他のメニューを閉じる
    menuItems.forEach(item => item.classList.remove('active'));
    
    // クリックしたメニューをトグル
    if (!wasActive) {
      menuItem.classList.add('active');
    }
  });
});

// メニュー外をクリックしたら閉じる
document.addEventListener('click', () => {
  menuItems.forEach(item => item.classList.remove('active'));
});

// ドロップダウンアイテムのクリック処理
document.querySelectorAll('.dropdown-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.stopPropagation();
    const action = (e.target as HTMLElement).getAttribute('data-action');
    
    // メニューを閉じる
    menuItems.forEach(m => m.classList.remove('active'));
    
    // アクションを実行
    handleMenuAction(action);
  });
});

// メニューアクションの処理
async function handleMenuAction(action: string | null) {
  if (!action) return;
  
  switch (action) {
    case 'open':
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        loadMarkdownFile(filePath);
      }
      break;
    case 'quit':
      window.close();
      break;
    case 'align-left':
      setContentAlignment('left');
      break;
    case 'align-center':
      setContentAlignment('center');
      break;
    case 'align-right':
      setContentAlignment('right');
      break;
    case 'theme-light':
      window.electronAPI.setTheme('light');
      document.body.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      updateThemeCheckmarks();
      break;
    case 'theme-dark':
      window.electronAPI.setTheme('dark');
      document.body.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      updateThemeCheckmarks();
      break;
    // その他のアクションは後で実装可能
    default:
      console.log('Action:', action);
  }
}

// コンテンツの表示位置を設定
function setContentAlignment(align: 'left' | 'center' | 'right') {
  const contentArea = document.querySelector('.content-area') as HTMLElement;
  contentArea.classList.remove('align-left', 'align-center', 'align-right');
  contentArea.classList.add(`align-${align}`);
  localStorage.setItem('contentAlignment', align);
  updateAlignmentCheckmarks();
}

// 表示位置のチェックマークを更新
function updateAlignmentCheckmarks() {
  const currentAlign = localStorage.getItem('contentAlignment') || 'center';
  document.querySelectorAll('[data-action^="align-"]').forEach(item => {
    const action = item.getAttribute('data-action');
    const isActive = action === `align-${currentAlign}`;
    
    // 既存のチョックマークを削除
    const existingCheck = item.querySelector('.checkmark');
    if (existingCheck) {
      existingCheck.remove();
    }
    
    // アクティブな場合はチェックマークを右端に追加
    if (isActive) {
      const checkmark = document.createElement('span');
      checkmark.className = 'checkmark';
      checkmark.textContent = '✓';
      item.appendChild(checkmark);
    }
  });
}

// テーマのチェックマークを更新
function updateThemeCheckmarks() {
  const currentTheme = document.body.getAttribute('data-theme');
  document.querySelectorAll('[data-action^="theme-"]').forEach(item => {
    const action = item.getAttribute('data-action');
    const isActive = action === `theme-${currentTheme}`;
    
    // 既存のチェックマークを削除
    const existingCheck = item.querySelector('.checkmark');
    if (existingCheck) {
      existingCheck.remove();
    }
    
    // アクティブな場合はチェックマークを右端に追加
    if (isActive) {
      const checkmark = document.createElement('span');
      checkmark.className = 'checkmark';
      checkmark.textContent = '✓';
      item.appendChild(checkmark);
    }
  });
}

// 初期テーマのチェックマークを設定
updateThemeCheckmarks();

// 初期表示位置を設定
const savedAlignment = localStorage.getItem('contentAlignment') || 'center';
setContentAlignment(savedAlignment as 'left' | 'center' | 'right');

// 初期サイドバー幅を設定（サイドバーの描画完了を待つ）
setTimeout(() => {
  updateSidebarWidth();
  console.log('Initial sidebar width set');
}, 100);

// キーボードショートカットの実装
document.addEventListener('keydown', (e) => {
  // Ctrl+O: ファイルを開く
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault();
    handleMenuAction('open');
  }
  // Ctrl+Q: 終了
  else if (e.ctrlKey && e.key === 'q') {
    e.preventDefault();
    handleMenuAction('quit');
  }
  // Esc: サイドバーの開閉
  else if (e.key === 'Escape') {
    e.preventDefault();
    toggleSidebarBtn.click();
  }
});
