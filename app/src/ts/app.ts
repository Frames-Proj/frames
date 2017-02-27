

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

import Config from "./global-config";
const CONFIG : Config = Config.getInstance();

let win;

function createWindow(): void {
    win = new BrowserWindow({ width: 1200, height: 800 });

    console.log(`asdfasdf${__dirname}`);

    // Load Index, I did this to accomadate reorganizing the js dir
    win.loadURL('file://' + __dirname + '/../../../index.html');

    // Open up dev tools
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
