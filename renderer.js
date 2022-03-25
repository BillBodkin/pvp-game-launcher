// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

function UpdateDownloadBar(downloadProgress){
    ctx.clearRect(0, 0, 300, 300);
    ctx.strokeStyle = "#ffdc67";
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(150, 150, 140, -Math.PI / 2, (downloadProgress * 2 * Math.PI) - Math.PI / 2);
    //ctx.arc(150, 150, 140, 0, downloadProgress * 2 * Math.PI);
    ctx.stroke();
}

UpdateDownloadBar(0);

let ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.on("downloadProgress", function(event, message) {
    UpdateDownloadBar(message);
});
