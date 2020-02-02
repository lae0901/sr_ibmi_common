"use strict";
// media/ibmi_common.ts
Object.defineProperty(exports, "__esModule", { value: true });
const sr_core_ts_1 = require("sr_core_ts");
const axios_1 = require("axios");
// --------------------- as400_srcfList -----------------------
function as400_srcfList(objName, libName) {
    const promise = new Promise(async (resolve, reject) => {
        const libl = 'couri7 aplusb1fcc qtemp';
        const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
        const params = {
            libl, proc: 'utl8020_srcfList',
            parm1: objName, parm2: libName, debug: 'N'
        };
        // const query = object_toQueryString(params);
        // const url_query = url + '?' + query;
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
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
    const sql = 'select    a.seqnbr, char(a.chgdate,iso) chgdate, a.text ' +
        'from      table(system_srcmbr_lines(?,?,?)) a ' +
        'order by  a.seqnbr ';
    const params = {
        libl, sql,
        parm1: fileName, parm2: libName, parm3: mbrName, debug: 'N'
    };
    const query = sr_core_ts_1.object_toQueryString(params);
    const url_query = url + '?' + query;
    const response = await axios_1.default({
        method: 'get', url: url_query, responseType: 'json'
    });
    const rows = await response.data;
    return rows;
}
exports.as400_srcmbrLines = as400_srcmbrLines;
// --------------------- as400_srcmbrList -----------------------
// return array of srcmbrs of a srcfile.
async function as400_srcmbrList(libName, fileName, mbrName = '') {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
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
        rows = rows.filter((item) => {
            return (sr_core_ts_1.string_rtrim(item.MBRNAME).indexOf(mbrName) >= 0);
        });
    }
    return rows;
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
