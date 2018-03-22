'use strict'

import { app, BrowserWindow, session } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'

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
})
