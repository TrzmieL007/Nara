/**
 * Created by Peter on 9/15/2016.
 */
var electron = require('electron');
var app = electron.app;
var packageJSON = require('./package.json');
const path = require('path');
const fs = require('fs');
var firstRun;

// console.log(app.getAppPath());
// console.log(app.getVersion());

var errorLogging = function(error,logname,callback) {
    var logsDir = path.join(app.getAppPath(),"logs");
    fs.stat(logsDir,function(e,s){
        if(e || !s.isDirectory()) fs.mkdirSync(logsDir);
        logname = logname || "squirrelCommands.log";
        fs.appendFile(path.join(logsDir,logname),(new Date().toISOString().replace(/(^[^T]+)(T)([^\.]+)(\.[0-9]{1,3}Z$)/g,"$1 $3"))+" - "+error+"\n");
        return typeof callback == 'function' ? callback() : null;
    });
};

var handleStartupEvent = function() {
    if(process.platform !== 'win32') {
        return false;
    }
    var squirrelCommand = process.argv[1];
    const spawn = require('child_process').exec;
    const linkName = packageJSON.productName+'.lnk';
    var updateDotExe = path.resolve(path.dirname(process.execPath), '..', 'update.exe');
    errorLogging(squirrelCommand);
    var target = path.basename(process.execPath);
    var saveDataLoc = function(locfile){
        var dataLoc = path.join(__dirname,'data');
        errorLogging("newDataLoc "+dataLoc,'log.txt');
        fs.writeFileSync(locfile,dataLoc,'utf8');
    };
    var removeShortcuts = function(onClose){
        var childUninstall = spawn(updateDotExe, ["--removeShortcut="+target], { detached: true });
        childUninstall.on('close', function(code){
            var home = path.resolve(process.env.HOME || process.env.USERPROFILE);
            var desktop = path.resolve(home,'Desktop');
            var appdata = path.resolve(process.env.APPDATA);
            var menuStart = path.resolve(appdata,'Microsoft','Windows','Start Menu','Programs');
            fs.stat(path.resolve(desktop,linkName),function(error,stats){
                if(!error){
                    fs.unlinkSync(path.resolve(desktop,linkName));
                }
                fs.stat(path.resolve(menuStart,linkName),function(error1,stats1){
                    if(!error1){
                        fs.unlinkSync(path.resolve(menuStart,linkName));
                    }
                    if(typeof onClose == 'function') onClose();
                    else app.quit();
                });
            });
        });
    };
    var createShortcuts = function(onClose){
        const ws = require('windows-shortcuts');
        var childInstall = spawn(updateDotExe, ["--createShortcut="+target,'--shortcut-locations=Desktop'], { detached: true });
        childInstall.on('close', function(code){
            var home = path.resolve(process.env.HOME || process.env.USERPROFILE);
            var desktop = path.resolve(home,'Desktop');
            var appdata = path.resolve(process.env.APPDATA);
            var menuStart = path.resolve(appdata,'Microsoft','Windows','Start Menu','Programs');
            var callback = function(){
                fs.stat(path.resolve(menuStart,'Electron.lnk'),function(error,stats){
                    errorLogging(error+"\n"+JSON.stringify(stats,null,4),'log.txt');
                    if(error){
                        ws.create(path.join(menuStart,linkName),{
                            target: updateDotExe,
                            args: "--processStart "+require('../package.json').productName+".exe",
                            workingDir: path.dirname(process.execPath),
                            desc: packageJSON.description
                        }, function(err){
                            if(err) errorLogging(err,"error.log");
                            if(typeof onClose == 'function') onClose();
                            else app.quit();
                        });
                    }else{
                        fs.rename(path.resolve(menuStart,'Electron.lnk'),path.join(menuStart,linkName),function(err){
                            if(err) errorLogging(err,"error.log");
                            errorLogging("renaming\n"+JSON.stringify(err,null,4),'log.txt');
                            callback();
                        });
                    }
                });
            };
            errorLogging('searching for shortcuts: '+path.resolve(desktop,'Electron.lnk'),'log.txt');
            fs.stat(path.resolve(desktop,'Electron.lnk'),function(error,stats){
                errorLogging(error+"\n"+JSON.stringify(stats,null,4),'log.txt');
                if(error){
                    ws.create(path.join(desktop,linkName),{
                        target: updateDotExe,
                        args: "--processStart "+require('../package.json').productName+".exe",
                        workingDir: path.dirname(process.execPath),
                        desc: packageJSON.description
                    }, function(err){
                        if(err) errorLogging(err,"error.log");
                        errorLogging(linkName,'log.txt');
                        callback();
                    });
                }else{
                    fs.rename(path.resolve(desktop,'Electron.lnk'),path.join(desktop,linkName),function(err){
                        if(err) errorLogging(err,"error.log");
                        errorLogging("renaming\n"+JSON.stringify(err,null,4),'log.txt');
                        callback();
                    });
                }
            });
        });
    };
    switch(squirrelCommand){
        case '--squirrel-install':
            // Optionally do things such as:
            //
            // - Install desktop and start menu shortcuts
            // - Add your .exe to the PATH
            // - Write to the registry for things like file associations and
            //   explorer context menus
            createShortcuts();
            return true;
        case '--squirrel-updated':
            // After update is done
            removeShortcuts(createShortcuts);
            return true;
        case '--squirrel-uninstall':
            // Undo anything you did in the --squirrel-install and
            // --squirrel-updated handlers
            var p = path.dirname(process.execPath).split('\\');
            p.pop();
            try {
                var del = spawn('DEL', ['/F', '/S', '/Q', p.map(function (part) {
                    return (part == 'Local' ? 'Roaming' : part)
                }).join(path.sep)], {detached: true});
                del.on('close', function (code) {
                    spawn('RD', ['/S', '/Q'], {detached: true});
                    removeShortcuts();
                });
            }catch(e){
                removeShortcuts();
            }
            return true;
        case '--squirrel-obsolete':
            // This is called on the outgoing version of your app before
            // we update to the new version - it's the opposite of
            // --squirrel-updated
            return true;
        case '--squirrel-firstrun':
            firstRun = true;
            return false;
    }
};

if(handleStartupEvent()){
    return;
}

var IanApp = path.resolve(__dirname,'R','IanApp');

var BrowserWindow = electron.BrowserWindow;
var ipc = electron.ipcMain;

var config = {
    browserWindowConfig: Object.assign({ icon: path.join(__dirname, 'icon.png') }, packageJSON.browserWindowConfig),
    dev: Object.keys(process.env).some(function(k){
        return k.match(/^npm_/);
    }) && !process.env.PROD
};

electron.crashReporter.start({
    productName : packageJSON.productName,
    companyName : packageJSON.author,
    submitURL   : packageJSON.updateServerHost+'/crashReporter',
    autoSubmit  : true,
    extra       : { _productName: packageJSON.productName, _version: packageJSON.version, _companyName: packageJSON.author }
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is GCed.
var mainWindow = null;

if(process.platform == 'darwin'){
    app.dock.setIcon(path.resolve(__dirname,'icon.png'));
}else if(process.platform == 'win32'){
    app.setAppUserModelId(packageJSON.productName);
}
const properties = require('./properties')();

const shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory){
    // Someone tried to run a second instance, we should focus our window.
    if(mainWindow){
        if(mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});
if(shouldQuit){
    app.quit()
}
var Rprocess = require('child_process').spawn(
    path.join(__dirname,'R','bin','R.exe'),
    ['--vanilla'],
    {
        shell: true,
        env: { JAVA_HOME : properties.getParam('JAVA_HOME') }
    }
    );
Rprocess.stdin.setEncoding('utf-8');
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function(){
    // Create the browser window.
    mainWindow = new BrowserWindow(Object.assign(
        {},
        config.browserWindowConfig,
        {
            icon: path.resolve(__dirname, "icon.png"),
            show: false
        }
    ));

    var openPreferences = function() {
        var mainBounds = mainWindow.getBounds();
        var prefWindow = new BrowserWindow({
            width: mainBounds.width - 64,
            height: mainBounds.height - 96,
            x: mainBounds.x + 32,
            y: mainBounds.y + 64,
            icon: path.resolve(__dirname, "icon.png"),
            center: true,
            title: "Preferences",
            show: false,
            parent: mainWindow,
            modal: true,
            frame: false
        });
        prefWindow.loadURL("file://" + __dirname + "/views/preferences.html");
        prefWindow.once('ready-to-show', function () {
            prefWindow.show();
            prefWindow.webContents.executeJavaScript("initialize(" + JSON.stringify(properties.params) + ");");
        });
        prefWindow.on('closed', function () {
            console.log(JSON.stringify(arguments,null,4));
            prefWindow = null;
        });
        // prefWindow.webContents.openDevTools({ detach : true });
    };
    // and load the index.html of the app.
    mainWindow.loadURL('file://'+__dirname+'/views/loading.html');
    var shinyServer;
    var port = 6111;
    var checkThePort = function checkThePort(){
        shinyServer = require('net').createServer();
        shinyServer.listen(port,'localhost',function(err){
            if(!err){
                shinyServer.once('close', function () {
                    console.log(port);
                    var toWrite = "shiny::runApp(\""+IanApp.replace(new RegExp("([^\\"+path.sep+"]+)(\\"+path.sep+")","g"),"$1"+path.sep+"$2")+"\",port="+port+")\n";
                    Rprocess.stdin.write(toWrite);
                    setTimeout(function(){
                        mainWindow.loadURL('http://localhost:'+port+'/');
                        mainWindow.webContents.once('did-finish-load',function(){
                            mainWindow.webContents.once('found-in-page',function(event,result){
                                if(result.matches){
                                    if(electron.dialog.showMessageBox(mainWindow,{
                                        type: 'error',
                                        buttons: ["Ok","Open preferences"],
                                        defaultId: 0,
                                        title: 'Java error',
                                        message: 'Could not load package rJava, it might be caused by invalid or not set JAVA_HOME environment wariable. Please set it in your system or in the preferences panel (File -> Preferences).'
                                    }) == 1){
                                        return openPreferences();
                                    }
                                    return 0;
                                }
                            });
                            mainWindow.webContents.findInPage("ERROR: package 'rJava' could not be loaded");
                        });
                        mainWindow.webContents.once('did-get-response-details',function(){
                            console.log('did-get-response-details',arguments[4]);
                        });
                        // mainWindow.webContents.once('dom-ready',function(){ });
                    }, 2048);
                });
                shinyServer.close();
            }
        });
        shinyServer.on('error',function(err){
            if(err.code == 'EADDRINUSE'){
                console.log('Address in use, retrying...');
                shinyServer.once('close', function () {
                    ++port;
                    checkThePort();
                });
                shinyServer.close();
            }
        });
    };

    if(config.dev){
        // Open the devtools.
        mainWindow.webContents.openDevTools({ detach : true });
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', function(){
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    mainWindow.once('ready-to-show', function(){
        mainWindow.show();
        checkThePort();
    });

    var autoUpdater = electron.autoUpdater;

    ipc.on('getVersionInfo', function(event){
        var platform = process.platform;
        event.returnValue = {
            platform: platform,
            version: require('../package.json').version,
            arch: process.arch
        };
    });

    ipc.on('updateApp',function(event,url){
        if(process.platform == 'darwin'){
            url = packageJSON.updateServerHost+'/updates/' + 'latest?v='+require('../package.json').version;
        }
        console.log(url);
        if(process.platform !== 'darwin') {
            autoUpdater.setFeedURL(url);
            event.sender.send('askingForUpdate');
            autoUpdater.checkForUpdates();
        }
    });

    ipc.on('savePreferences',function(event,prefs){
        properties.saveParams(prefs,event.sender,function(no){
            if(!electron.dialog.showMessageBox(mainWindow,{
                    type: 'question',
                    buttons: ["Yes","No"],
                    defaultId: 0,
                    title: 'Restart required',
                    message: (no || "Some")+" of the changes, you've made, require the app to restart.\nDo you want to restart the app now?"
                })){
                return app.relaunch(),app.quit();
            }
        });
    });
    ipc.on('restoreDefaultPreferences',function(event){
        properties.restoreDefaults(event.sender);
    });
    var updatePref = parseInt(properties.getParam('autoUpdate'));   // 0 - auto, 1 - semi, 2 - manual

    autoUpdater.on('error',function(error){
        errorLogging("UPDATING ERROR: "+error,"updateErrors.log");
    });
    // autoUpdater.on('checking-for-update',function(){ });
    if(updatePref < 2 && !firstRun){
        var updateAddress = encodeURI(require('./package.json').updateServerHost // http://desktopupdateserver.doitprofiler.net
            +"/updates/latest?v="+require('../package.json').version
            +"&a="+process.arch+"&p="+process.platform+"&pn="+packageJSON.productName);
        console.log(updateAddress);
        (updateAddress.match(/^https/) ? require('https') : require('http')).get(updateAddress, function(res){
            console.log('statusCode:',res.statusCode);
            if(res.statusCode !== 200) return;
            var myBuff = '';
            var charset = res.headers['content-type'].match(/(^.*charset=)(.+$)/) ? (res.headers['content-type'].replace(/(^.*charset=)(.+$)/, "$2") || 'utf-8').replace('-', '') : 'utf8';
            res.setEncoding(charset).on('data', function(d){ myBuff += d; });
            res.on('end', function(){
                var resultObject;
                try{
                    resultObject = JSON.parse(myBuff);
                }catch(e){
                    resultObject = myBuff;
                }
                if(resultObject.url && updatePref == 1) {
                    var qWindow = new BrowserWindow({
                        icon: path.resolve(__dirname, "icon.png"),
                        width: 512,
                        height: 256,
                        center: true,
                        title: "Update",
                        show: false,
                        parent: mainWindow,
                        modal: true,
                        frame: false
                    });
                    qWindow.loadURL("file://" + __dirname + "/views/update.html");
                    qWindow.once('ready-to-show', function () {
                        qWindow.show();
                        qWindow.webContents.executeJavaScript("renderQuestion('" + resultObject.url + "');");
                    });
                    qWindow.on('closed', function () {
                        qWindow = null;
                    });
                    return;
                }
                if(resultObject.url && updatePref == 0){
                    // return console.log('automatic update fired on url: ',resultObject.url);
                    autoUpdater.setFeedURL(resultObject.url);
                    return autoUpdater.checkForUpdates();
                }
                if(resultObject.message){
                    return require('electron').dialog.showMessageBox(mainWindow,{
                        type: 'info',
                        buttons: ["Ok"],
                        defaultId: 0,
                        title: resultObject.message.title,
                        message: resultObject.message.body
                    });
                }
            });
        }).on('error', function (e) {
            console.log(e.message);
        });
    }

    autoUpdater.on('update-downloaded',function(){
        return autoUpdater.quitAndInstall();
    });

    var Menu = electron.Menu;
    var MenuItem = electron.MenuItem;
    var menu = Menu.getApplicationMenu() || Menu.buildFromTemplate([{
            label: 'File',
            submenu: [{ role: 'quit' }]
        }]);
    menu.append(new MenuItem({
        click: function(){
            var qWindow = new BrowserWindow({
                icon: path.resolve(__dirname, "icon.png"),
                width: 512,
                height: 256,
                center: true,
                title: "Update",
                show: false,
                parent: mainWindow,
                modal: true,
                frame: false
            });
            qWindow.loadURL("file://" + __dirname + "/views/update.html");
            qWindow.once('ready-to-show', function(){
                qWindow.show();
                var params = {
                    p : process.platform,
                    v : require('../package.json').version,
                    a : process.arch,
                    pn: packageJSON.productName
                };
                qWindow.webContents.executeJavaScript("getUpdate("+JSON.stringify(params)+");");
            });
            qWindow.on('closed', function(){ qWindow = null; });
            // qWindow.webContents.openDevTools({ detach : true });
        },
        label: 'Update'
    }));
    menu.items[0].submenu.insert(0,new MenuItem({
        label : "Preferences",
        click : openPreferences
    }));
    Menu.setApplicationMenu(menu);
});
// app.on('before-quit',function(e){ console.log('quitting',e); });
app.once('before-quit',function(e){
    // console.log('killer @ work');
    e.preventDefault ? e.preventDefault() : null;
    e.stopPropagation ? e.stopPropagation() : null;
    var killer = require('child_process').spawn("taskkill", ["/pid", Rprocess.pid, "/f", "/t"],{detached:true});
    killer.on('close',function(code){
        errorLogging('killer returned code: '+code,'kill.txt');
        app.quit();
    });
});

ipc.on('close-main-window',function(){
    app.quit();
});
