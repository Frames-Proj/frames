

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

// const {app, BrowserWindow} = require('electron');

import Config from "./global-config";
const CONFIG: Config = Config.getInstance();

import startupHook from "./startup-hooks";

import { SafeClient } from "safe-launcher-client";

let win;

async function createWindow(): Promise<void> {

    let display: any = electron.screen.getPrimaryDisplay().workAreaSize;
    win = new BrowserWindow({ width: display.width, height: display.height });

    // make sure all the right directories and whatnot are there
    await startupHook();

    console.log(`${__dirname}`);
    win.loadURL(`file://${__dirname}/../../index.html`);

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
