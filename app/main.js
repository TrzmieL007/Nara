/**
 * Created by Peter on 9/15/2016.
 */
var electron = require('electron');
var app = electron.app;
var packageJSON = require('./package.json');
const path = require('path');
const fs = require('fs');

// console.log(app.getAppPath());
// console.log(app.getVersion());

var errorLogging = function(error,logname,callback) {
    var logsDir = path.join("C:","logs");
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
                fs.stat(path.resolve(mencuStart,'Electron.lnk'),function(error,stats){
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
                        fs.rename(path.resolve(mencuStart,'Electron.lnk'),path.join(mencuStart,linkName),function(err){
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
            createShortcuts(function() {
                //saveDataLoc(path.join(path.dirname(updateDotExe),'data.txt'));
                try {
                    var checkForR = spawn('r', ["/?"]);
                    errorLogging('r /?','r.txt');
                    checkForR.stdout.on('data', function (data) {
                        errorLogging('r /? returned stdout: ' + data,'r.txt');
                    });
                    checkForR.stderr.on('data', function (data) {
                        errorLogging('r /? returned stderr: ' + data,'r.txt');
                    });
                    checkForR.on('close', function (code) {
                        errorLogging('r /? returned code: ' + code,'r.txt');
                        app.quit();
                    });
                }catch (e) {
                    errorLogging("Excellent! No R detected\n"+JSON.stringify(e,null,4),'r.txt');
                    app.quit();
                }
            });
            return true;
        case '--squirrel-updated':
            // After update is done
            // var filename = path.resolve(path.dirname(updateDotExe),'data.txt');
            // errorLogging("filename for source filename = "+filename,'log.txt');
            // var destination = path.resolve(__dirname,'data');
            // errorLogging("destination = "+destination,'log.txt');
            // fs.mkdirSync(destination);
            // fs.stat(filename,function(err,stats){
            //     if(err){
            //         errorLogging("Error finding data folder - "+err,"error.log");
            //         removeShortcuts(createShortcuts);
            //     }
            //     fs.readFile(filename,'utf8','r',function(error,source){
            //         if(error)
            //             errorLogging(error,"error.log",app.quit);
            //         else {
            //             source = source.split("\n").reverse()[0].trim();
            //             errorLogging("source = "+source,'log.txt');
            //             var execCommand = 'xcopy '+source+' '+destination+' /c /e /s /k /r /h /y';
            //             errorLogging(execCommand,'log.txt',function(){
            //                 var copyProcess = spawn('xcopy', [source,destination,'/c','/e','/s','/k','/r','/h','/y'], { detached: true });
            //                 saveDataLoc(filename);
            //                 removeShortcuts(createShortcuts);
            //                 copyProcess.stdout.on('data',function(data){
            //                     errorLogging('stdout from xcopy: '+data,'copy.log');
            //                 });
            //                 copyProcess.stderr.on('data',function(data){
            //                     errorLogging('stderr from xcopy: '+data,'copy.log');
            //                 });
            //                 copyProcess.on('close',function(code) {
            //                     errorLogging('xcopy exit code: '+code,'copy.log');
            //                 });
            //             });
            //         }
            //     });
            // });
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
                // require('rimraf')(p.map(function(part) {
                //     return (part == 'Local' ? 'Roaming' : part)
                // }).join('\\'), function(e){ return e; });
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
            errorLogging('First run action');
            try {
                var checkForR = spawn('r', ["/?"]);
                errorLogging('firstrun r /?','r.txt');
                checkForR.stdout.on('data', function (data) {
                    errorLogging('firstrun r /? returned stdout: ' + data,'r.txt');
                });
                checkForR.stderr.on('data', function (data) {
                    errorLogging('firstrun r /? returned stderr: ' + data,'r.txt');
                });
                checkForR.on('close', function (code) {
                    errorLogging('firstrun r /? returned code: ' + code,'r.txt');
                    app.quit();
                });
            }catch (e) {
                errorLogging("firstrun Excellent! No R detected\n"+JSON.stringify(e,null,4),'r.txt');
                app.quit();
            }
            return false;
    }
};

if(handleStartupEvent()){
    return;
}

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

    // and load the index.html of the app.
    mainWindow.loadURL('http://localhost:8888/');

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
    mainWindow.once('ready-to-show', function(){ mainWindow.show(); });

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
        fs.writeFile('properties.json',JSON.stringify(prefs,null,4),'utf8',function(error){
            if(error){
                event.sender.send('errorSavingPrefs',error);
            }else{
                event.sender.send('successSavingPrefs');
            }
        });
    });
    ipc.on('restoreDefaultPreferences',function(event){
        fs.unlink('properties.json',function(error){
            if(error){
                event.sender.send('errorRestoringPrefs',error);
            }else{
                event.sender.send('successRestoringPrefs');
            }
        });
    });

    autoUpdater.on('error',function(error){
        errorLogging("UPDATING ERROR: "+error,"updateErrors.log");
    });
    // autoUpdater.on('checking-for-update',function(){ });
    // autoUpdater.on('update-available',function(){ });
    // autoUpdater.on('update-not-available',function(){ });
    autoUpdater.on('update-downloaded',function(){
        process.log(JSON.stringify(autoUpdater,null,4));
        autoUpdater.quitAndInstall();
    });

    var Menu = electron.Menu;
    var MenuItem = electron.MenuItem;
    var menu = Menu.getApplicationMenu();
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
                    a : process.arch
                };
                qWindow.webContents.executeJavaScript("getUpdate("+JSON.stringify(params)+");");
            });
            qWindow.on('closed', function(){ qWindow = null; });
        },
        label: 'Update'
    }));
    menu.items[0].submenu.insert(0,new MenuItem({
        label : "Preferences",
        click : function() {
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
                var params = [
                    {
                        label: "Auto update",
                        name: "autoUpdate",
                        type: "radio",
                        options: [
                            "<b>Automatic update</b> - check for update on app start, and update if available,",
                            "<b>Semi automatic update</b> - check for update on app start, but let me chose if I want to update,",
                            "<b>Manual</b> - do not check for updates on app start."
                        ],
                        default: 2
                    },
                    {
                        label: "Sample option with checkbox",
                        name: "chkbox",
                        type: "checkbox",
                        default: false
                    },
                    {
                        label: "Sample option with selectbox",
                        name: "selectOpt",
                        type: "select",
                        options: [
                            "Option 1",
                            "Option 2",
                            "Option 3",
                            "Option 4"
                        ],
                        default: 2
                    }
                ];
                try{
                    var values = JSON.parse(fs.readFileSync('properties.json','utf8'));
                    params.map(function(e){
                        if(values.hasOwnProperty(e.name)) e.value = values[e.name];
                        return e;
                    });
                }catch(e){
                    console.log(e);
                }
                prefWindow.webContents.executeJavaScript("initialize(" + JSON.stringify(params) + ");");
            });
            prefWindow.on('closed', function () {
                prefWindow = null;
            });
            prefWindow.webContents.openDevTools({detach:true});
        }
    }));
    Menu.setApplicationMenu(menu);
});

ipc.on('close-main-window',function(){ app.quit(); });
