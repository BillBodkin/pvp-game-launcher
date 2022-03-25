// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');
const rimraf = require("rimraf");
const unzipper = require("unzipper");
const child_process = require("child_process");
const os = require('os');

let mainWindow = null;

let latestVersion = null;
let haveLatestVersion = false;

let gameType = "Linux";
let exeName = "PVP_Game.x86_64";


function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        transparent: true,
        frame: false,
        width: 300,
        height: 300,
        webPreferences: {
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // and load the index.html of the app.
    mainWindow.loadFile('index.html');
    mainWindow.removeMenu();

    // Open the DevTools.
    //mainWindow.webContents.openDevTools();
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow();
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0){
            createWindow();
        }
    });

    if(os.platform().toString() != "linux"){
        gameType = "Windows";
        exeName = "PVP_Game.exe";
    }

    mainWindow.webContents.on('did-finish-load', ()=>{
        console.log("Game Type: " + gameType);
        CheckVersion(function(){
            if(haveLatestVersion){
                LaunchGame();
            }else{
                DownloadGame(function(){
                    LaunchGame();
                });
            }
        });
    });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin'){
        app.quit();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function DownloadGame(callback = function(){ console.log("Download complete"); }){
    if(latestVersion == null){
        console.log("Could not download, do not know latest version");
        return;
    }
    console.log("Downloading game...");
    fs.writeFileSync(app.getPath('userData') + "/gameVersion.txt", "downloading");
    //rimraf.sync(app.getPath('userData') + "/gameFiles/");
    fs.rmdirSync(app.getPath('userData') + "/gameFiles/", { recursive: true });
    fs.mkdir(app.getPath('userData') + "/gameFiles/", 0777, function(){
        //const file = fs.createWriteStream(app.getPath('userData') + "/gameFiles/game.zip");
        https.get("https://cablepost.co.uk/PVPGame/" + latestVersion + "/PVP_Game_" + gameType + "_Player_" + latestVersion + ".zip", function(response){
            //response.pipe(file);
            let downloadTotalSize = parseInt(response.headers['content-length'], 10);
            let downloadProgressSize = 0;
            response.on("data", function(chunk) {
                downloadProgressSize += chunk.length;
                //console.log(downloadProgressSize.toString() + " / " + downloadTotalSize.toString());
                mainWindow.setProgressBar(downloadProgressSize / downloadTotalSize);
                mainWindow.webContents.send('downloadProgress', downloadProgressSize / downloadTotalSize);
            });
            response.pipe(unzipper.Extract({ path: app.getPath('userData') + "/gameFiles/" })).on('finish', function(){
                setTimeout(function(){
                    fs.chmod(app.getPath('userData') + "/gameFiles/" + exeName, 0777, function(){
                        fs.writeFileSync(app.getPath('userData') + "/gameVersion.txt", latestVersion);
                        callback();
                    });
                }, 2000);
            });
        });
    });
}

function CheckVersion(callback = function(){}){
    let verFile = app.getPath('userData') + "/gameVersion.txt";
    https.get("https://cablepost.co.uk/PVPGame/version.txt", function(response){
        response.on('data', (d) => {
            latestVersion = d;
            console.log("Latest version is: " + latestVersion);
            if(!fs.existsSync(verFile)){
                console.log("No Current version set");
                haveLatestVersion = false;
                callback();
            }else{
                fs.readFile(verFile, 'utf8', function(err, data) {
                    if (err){
                        throw err;
                        haveLatestVersion = false;
                        callback();
                    }else{
                        console.log("Current version is: " + data);
                        haveLatestVersion = data == latestVersion;
                        callback();
                    }
                });
            }
        });
    });
}

function LaunchGame(){
    let gameExe = app.getPath('userData') + "/gameFiles/" + exeName;
    gameExe = gameExe.split(" ").join("\ ");
    console.log("Launching game: " + gameExe);
    //if(gameType == "Linux"){
    //    child_process.execFile(gameExe);//.unref(); //execSync
    //}else{
        //child_process.exec(gameExe);
        console.log("Spawning game process.");
        var child = child_process.spawn(gameExe, [], { detached: true });
        child.unref();
    //}
    setTimeout(function(){
        process.exit(0);
    }, 1000);
}
