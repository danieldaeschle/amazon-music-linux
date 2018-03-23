import { app, BrowserWindow, session, globalShortcut, ipcMain } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'
import DBus from 'dbus'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.162 Safari/537.36';

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1400,
    height: 800,
    icon: path.join(__dirname, 'resources/img/icon.png')
  });
  // Url filters
  var filters = {
    urls: ['https://*.amazon.com/*', 'https://*.amazon.de/*']
  };
  // Set windows user agent to prevent using flash
  session.defaultSession.webRequest.onBeforeSendHeaders(filters, (details, callback) => {
    details.requestHeaders['User-Agent'] = userAgent
    callback({cancel: false, requestHeaders: details.requestHeaders})
  });

  // and load the index.html of the app.

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  window.loadURL('https://music.amazon.de', {userAgent: userAgent});

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
  registerShortcuts()
})

function registerShortcuts() {
  // MediaNextTrack, MediaPreviousTrack, MediaStop und MediaPlayPause
  try {
    const dbus = new DBus();
    const session = dbus.getBus('session');
  
    registerBindings('gnome', session);
    registerBindings('mate', session);
  } catch (e) { }
  globalShortcut.register('MediaNextTrack', () => {
    nextTrack()
  })
  globalShortcut.register('MediaPreviousTrack', () => {
    nextTrack()
  })
  globalShortcut.register('MediaStop', () => {
    stopMusic()
  })
  globalShortcut.register('MediaPlayPause', () => {
    startStopMusic()
  })
}

// fix for gnome and mate
function registerBindings(desktopEnv, session) {
  session.getInterface(`org.${desktopEnv}.SettingsDaemon`,
  `/org/${desktopEnv}/SettingsDaemon/MediaKeys`,
  `org.${desktopEnv}.SettingsDaemon.MediaKeys`, (err, iface) => {
    if (!err) {
      iface.on('MediaPlayerKeyPressed', (n, keyName) => {
        switch (keyName) {
          case 'Next': nextTrack(); return;
          case 'Previous': previousTrack(); return;
          case 'Play': startStopMusic(); return;
          case 'Stop': stopMusic(); return;
          default: return;
        }
      });
      iface.GrabMediaPlayerKeys(0, `org.${desktopEnv}.SettingsDaemon.MediaKeys`); // eslint-disable-line
    }
  });
}

function nextTrack() {
  const clickEvent = `
    var clickEvent = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false
    });`
  const next = `
    ${clickEvent}
    var element = document.getElementsByClassName('nextButton')[0];
    element.dispatchEvent(clickEvent);`
  mainWindow.webContents.executeJavaScript(next)
}

function stopMusic() {
  const clickEvent = `
    var clickEvent = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false
    });`
  const next = `
    ${clickEvent}
    var element = document.getElementsByClassName('playButton')[0];
    var classes = element.classList;
    if (classes.contains('playerIconPause')) {
      element.dispatchEvent(clickEvent);
    }`
  mainWindow.webContents.executeJavaScript(next)
}

function startStopMusic() {
  const clickEvent = `
    var clickEvent = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false
    });`
  const next = `
    ${clickEvent}
    var element = document.getElementsByClassName('playButton')[0];
    element.dispatchEvent(clickEvent);`
  mainWindow.webContents.executeJavaScript(next)
}

function previousTrack() {
  const clickEvent = `
    var clickEvent = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false
    });`
  const next = `
    ${clickEvent}
    var element = document.getElementsByClassName('previousButton')[0];
    element.dispatchEvent(clickEvent);`
  mainWindow.webContents.executeJavaScript(next)
}
