/**
 * Created by Peter on 9/15/2016.
 */

module.exports = function(grunt) {
    const package = require('./package.json');
    const path = require('path');
    var windowsArch = 'ia32';
    var files = [];
    var getFilesStruct = function(arch){
        return {
            expand: true,
            cwd: './app/js',
            src: [ '**/*.js', '!**/*.min.js', '!**/*-min.js' ],
            dest: package.directories.packages + '/' + package.productName + '-'+arch + '/' + (arch == 'darwin-x64' ? package.productName + '.app/Contents/Resources' : 'resources') + '/app/app/js'
        };
    };
    if(!process.env.OS || !process.env.OS.toLowerCase().match(/windows/i)) files.push(getFilesStruct('darwin-x64'));
    if(windowsArch.match(/(x64)|(all)/)) files.push(getFilesStruct('win32-x64'));
    if(windowsArch.match(/(ia32)|(all)/)) files.push(getFilesStruct('win32-ia32'));
    var initConfig = {
        electron: {
            osxBuild: {
                options: {
                    name: package.productName,
                    dir: '.',
                    out: package.directories.packages,
                    version: package.devDependencies.electronPrebuilt,
                    platform: 'darwin',
                    arch: 'x64',
                    appVersion: package.version,
                    ignore: package.ignore,
                    asar: false,
                    overwrite : true,
                    icon: "./build/icon.icns"
                }
            },
            winBuild: {
                options: {
                    name: package.productName,
                    dir: '.',
                    out: package.directories.packages,
                    version: package.devDependencies.electronPrebuilt,
                    platform: 'win32',
                    arch: windowsArch,
                    appVersion: package.version,
                    ignore: package.ignore,
                    asar: false,
                    overwrite: true,
                    icon: "./build/icon.ico",
                    versionString: {
                        CompanyName: package.author,
                        LegalCopyright: 'Copyright (C) '+package.author,
                        FileDescription: package.description,
                        OriginalFilename: package.productName+'.exe',
                        InternalName: package.productName,
                        ProductName: package.productName,
                        ProductVersion: package.version
                    }
                }
            }
        },
        'create-windows-installer' : {}
    };
    if(windowsArch.match(/(x64)|(all)/)){
        initConfig['create-windows-installer'].x64 = {
            appDirectory: package.directories.packages + '/' + package.productName + '-win32-x64',
            outputDirectory: package.directories.installers + '/x64',
            name: package.productName,
            description: package.description,
            authors: package.author,
            exe: package.productName + '.exe',
            setup: package.productName + '_x64_v' + package.version + '.exe',
            loadingGif: './build/load.gif',
            asar: false,
            iconUrl: "https://doitcdn.azureedge.net/shared/icon.ico",
            setupIcon: "./build/icon.ico",
            noMsi: true,
            compression: 'maximum',
            certificateFile: path.resolve(__dirname, 'build', 'OS201311288523.pfx'),
            certificatePassword: 'pr0f1l3r1234'
        };
    }
    if(windowsArch.match(/(ia32)|(all)/)){
        initConfig['create-windows-installer'].ia32 = {
            appDirectory: package.directories.packages+'/'+package.productName+'-win32-ia32',
            outputDirectory: package.directories.installers + '/ia32',
            name: package.productName,
            description: package.description,
            authors: package.author,
            exe: package.productName+'.exe',
            setup: package.productName+'_ia32_v'+package.version+'.exe',
            loadingGif: './build/load.gif',
            asar: false,
            iconUrl: "https://doitcdn.azureedge.net/shared/icon.ico",
            setupIcon: "./build/icon.ico",
            noMsi: true,
            compression: 'maximum',
            certificateFile: path.resolve(__dirname,'build','OS201311288523.pfx'),
            certificatePassword: 'pr0f1l3r1234'
        };
    }
    if(false && files.length){
        initConfig.uglify = {
            options: {
                mangle: {toplevel: false, eval: true},
                compress: {
                    sequences: true,
                    properties: true,
                    dead_code: true,
                    drop_debugger: true,
                    unsafe: false,
                    conditionals: true,
                    comparisons: true,
                    evaluate: false,
                    booleans: false,
                    loops: false,
                    unused: true,
                    hoist_funs: false,
                    hoist_vars: false,
                    if_return: true,
                    join_vars: true,
                    cascade: true,
                    collapse_vars: true,
                    drop_console: true
                },
                preserveComments: false
            },
            my_target: {files: files}
        }
    }
    grunt.initConfig(initConfig);

    grunt.loadNpmTasks('grunt-electron');
    //grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-electron-installer');
    grunt.registerTask('default', ['electron',/*'uglify',*/'create-windows-installer']);
};
