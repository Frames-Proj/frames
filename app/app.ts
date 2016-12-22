

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

// const {app, BrowserWindow} = require('electron');

import Config from './src/ts/global-config';
const CONFIG : Config = Config.getInstance();

import { SafeClient } from 'safe-launcher-client';

let win;

function createWindow(): void {
    win = new BrowserWindow({ width: 800, height: 600 });

    win.loadURL(`file://${__dirname}/../client/index.html`);

    win.webContents.openDevTools();

    let safeClient : SafeClient = new SafeClient(CONFIG.makeAuthPayload(), CONFIG.SAFE_LAUNCHER_ENDPOINT);

    console.log(CONFIG.APP_HOME_DIR);

    win.on('closed', () => {
        win = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
