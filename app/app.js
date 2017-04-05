

const electron = require('electron');
const BrowserWindow = electron.BrowserWindow;
const app = electron.app;

let win;
async function createWindow() {
    let display = electron.screen.getPrimaryDisplay().workAreaSize;
    win = new BrowserWindow({ width: display.width, height: display.height });

    win.loadURL(`file://${__dirname}/index.html`);

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
