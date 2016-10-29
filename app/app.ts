"use strict";

const {app, BrowserWindow} = require('electron');
const chromecasts = require('chromecasts');
// import chromecasts from 'chromecasts';

let win;

function createWindow() {
    win = new BrowserWindow({ width: 800, height: 600 });

    win.loadURL(`file://${__dirname}/index.html`);

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
