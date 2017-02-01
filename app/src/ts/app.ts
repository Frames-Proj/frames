

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

// const {app, BrowserWindow} = require('electron');

import Config from "./global-config";
const CONFIG : Config = Config.getInstance();

let win;

function createWindow(): void {
    win = new BrowserWindow({ width: 800, height: 600 });

    console.log(`${__dirname}`);
    win.loadURL(`file://${__dirname}/index.html`);

    win.webContents.openDevTools();

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
