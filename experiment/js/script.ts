const {remote} = require('electron');

remote.dialog.showOpenDialog({
    title: "f",
    properties: ['openFile']
}, (file) => {
    console.log(file);
});
