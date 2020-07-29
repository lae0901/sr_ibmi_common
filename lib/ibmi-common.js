"use strict";
// media/ibmi_common.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.as400_tablesAndViews_select = exports.as400_srcmbrList = exports.as400_srcmbrLines = exports.as400_routines = exports.as400_srcfList = exports.as400_rmvm = exports.as400_compile = exports.as400_addpfm = exports.ibmi_ifs_getFileContents = exports.ibmi_ifs_getItems = void 0;
const sr_core_ts_1 = require("sr_core_ts");
const axios_1 = require("axios");
const ibmi_ifs_1 = require("./ibmi-ifs");
Object.defineProperty(exports, "ibmi_ifs_getItems", { enumerable: true, get: function () { return ibmi_ifs_1.ibmi_ifs_getItems; } });
Object.defineProperty(exports, "ibmi_ifs_getFileContents", { enumerable: true, get: function () { return ibmi_ifs_1.ibmi_ifs_getFileContents; } });
;
// --------------------- as400_addpfm -----------------------
async function as400_addpfm(fileName, libName, mbrName, textDesc, srcType, options) {
    const promise = new Promise(async (resolve, reject) => {
        fileName = fileName || '';
        libName = libName || '';
        mbrName = mbrName || '';
        const libl = options.libl || 'QGPL QTEMP';
        const curlib = options.curlib || '';
        const serverUrl = options.serverUrl || '';
        let errmsg = '';
        const url = `${serverUrl}/coder/common/json_runSqlReturnEmpty.php`;
        const params = {
            libl, proc: 'system_addpfm',
            outParm1: errmsg, parm2: fileName,
            parm3: libName, parm4: mbrName, parm5: textDesc, parm6: srcType
        };
        const query = sr_core_ts_1.object_toQueryString(params);
        const url_query = url + '?' + query;
        const response = await axios_1.default({
            method: 'get', url: url_query, responseType: 'json'
        });
        let data = await response.data;
        errmsg = data.outParm1.trim();
        resolve({ errmsg });
    });
    return promise;
}
exports.as400_addpfm = as400_addpfm;
// --------------------- as400_compile -----------------------
async function as400_compile(srcfName, srcfLib, srcmbr, options) {
    const promise = new Promise(async (resolve, reject) => {
        srcfName = srcfName || '';
        srcfLib = srcfLib || '';
        srcmbr = srcmbr || '';
        const libl = options.libl || 'QGPL QTEMP';
        const curlib = options.curlib || '';
        const serverUrl = options.serverUrl || '';
        let compMsg = '';
        let compile = [];
        let joblog = [];
        const url = `${serverUrl}/coder/common/json_getManyRows.php`;
        const params = {
            libl, proc: 'utl7960_compile',
            outParm1: compMsg, parm2: srcfName,
            parm3: srcfLib, parm4: srcmbr, parm5: curlib
        };
        const query = sr_core_ts_1.object_toQueryString(params);
        const url_query = url + '?' + query;
        const response = await axios_1.default({
            method: 'get', url: url_query, responseType: 'json'
        });
        let data = await response.data;
        let outSet = data.outSet;
        compMsg = outSet.outParm1;
        compile = data.set1 || [];
        joblog = data.set2 || [];
        resolve({ compMsg, compile, joblog });
    });
    return promise;
}
exports.as400_compile = as400_compile;
// --------------------- as400_rmvm -----------------------
async function as400_rmvm(fileName, libName, mbrName, options) {
    const promise = new Promise(async (resolve, reject) => {
        fileName = fileName || '';
        libName = libName || '';
        mbrName = mbrName || '';
        const libl = options.libl || 'QGPL QTEMP';
        const curlib = options.curlib || '';
        const serverUrl = options.serverUrl || '';
        let errmsg = '';
        const url = `${serverUrl}/coder/common/json_runSqlReturnEmpty.php`;
        const params = {
            libl, proc: 'system_rmvm',
            outParm1: errmsg, parm2: fileName,
            parm3: libName, parm4: mbrName
        };
        const query = sr_core_ts_1.object_toQueryString(params);
        const url_query = url + '?' + query;
        const response = await axios_1.default({
            method: 'get', url: url_query, responseType: 'json'
        });
        let data = await response.data;
        errmsg = data.outParm1.trim();
        resolve({ errmsg });
    });
    return promise;
}
exports.as400_rmvm = as400_rmvm;
// --------------------- as400_srcfList -----------------------
function as400_srcfList(objName, libName, options) {
    const promise = new Promise(async (resolve, reject) => {
        options = options || {};
        const serverUrl = options.serverUrl || 'http://173.54.20.170:10080';
        const libl = options.libl || 'couri7 aplusb1fcc qtemp';
        const url = `${serverUrl}/coder/common/json_getManyRows.php`;
        const params = {
            libl, proc: 'utl8020_srcfList',
            parm1: objName, parm2: libName, debug: 'N'
        };
        const response = await axios_1.default({
            method: 'get', url, data: params, responseType: 'json'
        });
        const respText = await response.data;
        const rows = JSON.parse(respText);
        resolve(rows);
    });
    return promise;
}
exports.as400_srcfList = as400_srcfList;
// --------------------- as400_routines -----------------------
function as400_routines(libName, routineName) {
    const promise = new Promise(async (resolve, reject) => {
        const libl = 'couri7 aplusb1fcc qtemp';
        const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
        const params = {
            libl, proc: 'utl8020_routines',
            parm1: libName, parm2: routineName, debug: 'N'
        };
        const response = await axios_1.default({
            method: 'get', url, data: params, responseType: 'json'
        });
        const respText = await response.data;
        const rows = JSON.parse(respText);
        resolve(rows);
    });
    return promise;
}
exports.as400_routines = as400_routines;
// --------------------- as400_srcmbrLines -----------------------
async function as400_srcmbrLines(libName, fileName, mbrName) {
    const promise = new Promise(async (resolve, reject) => {
        const libl = 'couri7 aplusb1fcc qtemp';
        const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
        const sql = 'select    a.seqnbr, char(a.chgdate,iso) chgdate, a.text ' +
            'from      table(system_srcmbr_lines(?,?,?)) a ' +
            'order by  a.seqnbr ';
        const params = {
            libl, sql,
            parm1: fileName, parm2: libName, parm3: mbrName, debug: 'N', joblog: 'N'
        };
        const query = sr_core_ts_1.object_toQueryString(params);
        const url_query = url + '?' + query;
        const response = await axios_1.default({
            method: 'get', url: url_query, responseType: 'json'
        });
        let rows = await response.data;
        if (typeof rows == 'string') {
            // const { jsonText, errText } = respText_extractErrorText(rows) ;
            // const data = JSON.parse(jsonText) ;
            // const ch1 = '1' ;
        }
        resolve(rows);
    });
    return promise;
}
exports.as400_srcmbrLines = as400_srcmbrLines;
// ------------------- respText_extractErrorText ---------------------------
function respText_extractErrorText(respText) {
    let errText = '';
    let jsonText = '';
    if ((respText) && (respText.length > 0) && (respText.substr(0, 1) == '<')) {
        const lines = respText.split('\n');
        for (let ix = 0; ix < lines.length; ++ix) {
            const line = lines[ix];
            if (line.substr(0, 1) == '<')
                errText += line;
            else
                jsonText = line;
        }
    }
    else {
        jsonText = respText;
    }
    return { jsonText, errText };
}
// --------------------- as400_srcmbrList -----------------------
// return array of srcmbrs of a srcfile.
async function as400_srcmbrList(libName, fileName, mbrName = '', options) {
    const promise = new Promise(async (resolve, reject) => {
        options = options || {};
        const serverUrl = options.serverUrl || 'http://173.54.20.170:10080';
        const libl = options.libl || 'couri7 aplusb1fcc qtemp';
        const url = `${serverUrl}/coder/common/json_getManyRows.php`;
        const sql = 'select    a.* ' +
            'from      table(system_dspfd_mbrlist(?,?)) a ' +
            'order by  a.mbrname ';
        const params = {
            libl, sql,
            parm1: fileName, parm2: libName, debug: 'N'
        };
        const query = sr_core_ts_1.object_toQueryString(params);
        const url_query = url + '?' + query;
        const response = await axios_1.default({
            method: 'get', url: url_query, responseType: 'json'
        });
        let rows = await response.data;
        // filter on member name.
        if (mbrName) {
            // mbrName as generic name.
            rows = rows.filter((item) => {
                const item_mbrName = item.MBRNAME.trimRight();
                if (mbrName.endsWith('*')) {
                    return sr_core_ts_1.string_matchGeneric(item_mbrName, mbrName);
                }
                else {
                    return (sr_core_ts_1.string_rtrim(item.MBRNAME).indexOf(mbrName) >= 0);
                }
            });
        }
        resolve(rows);
    });
    return promise;
}
exports.as400_srcmbrList = as400_srcmbrList;
// --------------------- as400_tablesAndViews_select -----------------------
async function as400_tablesAndViews_select(schema, collName, maxRows = 500) {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
    const sql = 'call    system_tablesAndViews_select(?,?,?) ';
    const params = {
        libl, sql,
        parm1: schema, parm2: collName, parm3: maxRows, debug: 'N'
    };
    const query = sr_core_ts_1.object_toQueryString(params);
    const url_query = url + '?' + query;
    const response = await axios_1.default({
        method: 'get', url: url_query, responseType: 'json'
    });
    const rows = await response.data;
    return rows;
}
exports.as400_tablesAndViews_select = as400_tablesAndViews_select;
//# sourceMappingURL=ibmi-common.js.map