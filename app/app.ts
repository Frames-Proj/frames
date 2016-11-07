
/// <reference path="typings/index.d.ts" />

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

// const {app, BrowserWindow} = require('electron');

import Config from './src/ts/global-config';
const CONFIG : Config = Config.getInstance();

import { Auth } from './src/ts/auth';

let win;

function createWindow():void {
    win = new BrowserWindow({ width: 800, height: 600 });

    win.loadURL(`file://${__dirname}/index.html`);

    win.webContents.openDevTools();

    Auth.getInstance().token.then( (tok) => {
        console.log(`TOKEN: ${tok}`);
    });

    // window.console.log("hello world");

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
