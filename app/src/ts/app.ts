

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

// const {app, BrowserWindow} = require('electron');

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

import startupHook from "./startup-hooks";

let win;

async function createWindow(): Promise<void> {
    win = new BrowserWindow({ width: 800, height: 600 });

    // make sure all the right directories and whatnot are there
    await startupHook();

    // Load Index, I did this to accomadate reorganizing the js dir
    win.loadURL('file://' + __dirname + '/../index.html');

    // Open up dev tools
    win.webContents.openDevTools();

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
