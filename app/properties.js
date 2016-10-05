/**
 * Created by Me on 10/4/2016.
 */

const fs = require('fs');
const path = require('path');
var params;
var paramsFile;

function init() {
    params = [
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
            label: "JAVA_HOME",
            description: "Chose the home directory for your java JRE",
            name: "JAVA_HOME",
            type: "selectDir",
            title: "Chose JAVA_HOME",
            placeholder: "C:\\Program Files\\Java\\jre#.#.#_###",
            buttonLabel: "Chose folder",
            defaultPath: process.env.JAVA_HOME || process.env.ProgramFiles
        }
    ];
    /*params.push({
        label: "Sample option with checkbox",
        name: "chkbox",
        type: "checkbox",
        default: false
    });
    params.push({
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
    });*/
    var reg = new RegExp('^(.+)(\\'+path.sep+'resources\\'+path.sep+'.*)','i');
    paramsFile = path.resolve(__dirname.match(reg) ? __dirname.replace(reg,"$1") : __dirname,'..','properties.json');
    // console.log(paramsFile);
    readParams();
}
function readParams(){
    try {
        var values = JSON.parse(fs.readFileSync(paramsFile, 'utf8'));
        params.map(function (e) {
            if (values.hasOwnProperty(e.name)) e.value = values[e.name];
            return e;
        });
    } catch (e) {
        //console.log(e);
    }
}

module.exports = function(){
    init();
    return {
        // returns whole params array
        params: params,
        // get specified param object by name, undefined if not spefified
        getParamObject: function(paramName){
            var retValue;
            params.some(function(param){
                return (param.name == paramName) ? (retValue = param, true) : false;
            });
            return retValue;
        },
        // gets specified params value
        getParam: function(paramName){
            var retValue;
            params.some(function(param){
                return (param.name == paramName) ? (retValue = typeof param.value !== 'undefined' ? param.value : param.default, true) : false;
            });
            return retValue;
        },
        // returns true if param successfully set, false otherwise
        setParam: function(paramName, value){
            return params.some(function(param,index){
                return (param.name == paramName) ? (params[index].value = value, true) : false;
            });
        },
        // reads all params from file and returns corrected params array
        rereadParams: function(){
            readParams();
            return params;
        },
        // saves params to file
        saveParams: function(params,sender){
            if(params){
                Object.keys(params).forEach(function(paramName){
                    this.setParam(paramName,params[paramName]);
                },this);
            }else{
                params = this.params.map(function(param){
                    return typeof param.value === 'undefined' ? param.default : param.value;
                });
            }
            fs.writeFile(paramsFile,JSON.stringify(params,null,4),'utf8',function(error){
                if(error)
                    return sender ? sender.send('errorSavingPrefs',error) : console.log('errorSavingPrefs',error);
                return sender ? sender.send('successSavingPrefs') : null;
            });
        },
        // deletes params file restoring defaults at the same time
        restoreDefaults: function(sender){
            fs.unlink(paramsFile,function(error){
                if(error)
                    return sender ? sender.send('errorRestoringPrefs',error) : console.log('errorRestoringPrefs',error);
                init();
                return sender ? sender.send('successRestoringPrefs') : null;
            });
        }
    }
};