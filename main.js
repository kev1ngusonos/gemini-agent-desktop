const { app, BrowserWindow, shell } = require('electron');

// ========= 配置区 =========
const APP_URL =
  'https://vertexaisearch.cloud.google.com/home/cid/c88c0952-31e9-4a89-b0ce-05bf91a469d8?hl=en_US';

// 这些域名的弹窗/跳转留在 app 内（登录流程必须共享 app 的会话），
// 如果公司用 Okta / Azure AD 等 IdP，把对应域名加进来。
const IN_APP_HOSTS = [
  'google.com',
  'googleusercontent.com',
  'gstatic.com',
  'googleapis.com',
  'okta.com',
  'microsoftonline.com',
  'onelogin.com',
  'pingidentity.com',
  'duosecurity.com',
];
// ==========================

// 关键：把 UA 里的 "Electron/x.y" 和应用名去掉，
// 否则 Google 登录会报 "This browser or app may not be secure"。
const KEEP_TOKENS = new Set(['mozilla', 'applewebkit', 'chrome', 'safari']);
app.userAgentFallback = app.userAgentFallback
  .split(' ')
  .filter((token) => {
    const m = token.match(/^([a-z0-9._-]+)\//i);
    return !m || KEEP_TOKENS.has(m[1].toLowerCase());
  })
  .join(' ');

function isInAppUrl(url) {
  try {
    const host = new URL(url).hostname;
    return IN_APP_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  } catch {
    return false;
  }
}

function attachWindowHandlers(contents) {
  contents.setWindowOpenHandler(({ url }) => {
    if (isInAppUrl(url)) {
      // 登录弹窗等留在 app 内，共享同一个会话
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: { partition: 'persist:main' },
        },
      };
    }
    // 其它外链交给系统默认浏览器
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    autoHideMenuBar: true,
    title: 'Gemini Agent Platform',
    webPreferences: {
      partition: 'persist:main', // 持久化 cookie，登录一次长期有效
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  attachWindowHandlers(win.webContents);
  win.loadURL(APP_URL);
  return win;
}

// 子窗口（登录弹窗）也要挂同样的外链处理
app.on('web-contents-created', (_event, contents) => {
  if (contents.getType() === 'window') {
    attachWindowHandlers(contents);
  }
});

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
