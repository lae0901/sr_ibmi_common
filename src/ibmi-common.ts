// media/ibmi_common.ts

import { date_fromISO, date_toEpoch, 
  object_toQueryString, string_rtrim, string_matchGeneric, string_assignSubstr } from 'sr_core_ts';
import axios from 'axios';
import * as querystring from 'querystring';
import {  iIfsItem, ibmi_ifs_getItems, ibmi_ifs_getFileContents } from './ibmi-ifs';

export { iIfsItem, ibmi_ifs_getItems, ibmi_ifs_getFileContents} ;

export interface iDspfd_mbrlist
{
  FILENAME: string,
  LIBNAME: string,
  MBRNAME: string,
  NUMRCDS: number,
  CRTDATE: string,
  CHGDATE: string,
  CHGTIME: string,
  MBRTEXT: string,
  SRCTYPE: string,
  mtime: number  // CHGDATE, CHGTIME converted to unix epoch ( seconds since 1970 )
};

// ------------------------------------ iDspffd ------------------------------------
export interface iDspffd
{
  WHFILE: string;
  WHLIB: string;
  WHFTYP: string;
  WHCNT: number;
  WHNAME: string;
  WHSEQ: string;
  WHTEXT: string;
  WHFLDN: number;
  WHRLEN: number;
  FLDNAME: string;
  WHFOBO: number;
  WHIBO: number;
  WHFLDB: number;
  WHFLDD: number;
  WHFLDP: number;
  WHFTXT: string;
  WHCHD1: string;
  WHCHD2: string;
  WHCHD3: string;
  WHFLDT: string;
  WHFIOB: string;
};

// -------------------------- iServerOptions -------------------------
// options passed to server REST API.
// serverUrl: url of the server.  http://192.168.1.170:10080
// numRows: max number of rows to return
// libl: library list when api runs on server
export interface iServerOptions
{
  serverUrl?: string,
  numRows?: number,
  libl?: string,
  curlib?: string,
  joblog?: 'Y' | 'N'
}

export interface iCompileLine
{
  SKIPBFR: string,
  SPACEB: string,
  LINE: string
}

export interface iSrcmbrLine
{
  SEQNBR: string,
  CHGDATE: string,
  TEXT: string
}

// ---------------------------------- iSrcmbrXref ----------------------------------
export interface iSrcmbrXref
{
  ibmi_url?: string
  library: string;
  srcFiles: string[];
  srcTypes?: string[];
  members?: string[];

  mirror_hold?: boolean;

  // source file is the master. Files in the srcmbr folder are
  // removed if they do not exist as srcmbr in source file.
  srcf_is_master?: boolean;
}

// ---------------------------------- iSrcfMirror ---------------------------------
// structure of .srcf-mirror.json file.
export interface iSrcfMirror
{
  ibmi_url?: string
  library: string;
  srcFiles: string[];
  srcTypes?: string[];
  members?: string[];

  mirror_hold?: boolean;

  // source file is the master. Files in the srcmbr folder are
  // removed if they do not exist as srcmbr in source file.
  srcf_is_master?: boolean;
}

// --------------------- as400_addpfm -----------------------
export async function as400_addpfm(
  fileName: string, libName: string, mbrName: string, 
  textDesc: string, srcType: string, options: iServerOptions):
  Promise<{ errmsg: string }>
{
  const promise = new Promise<{ errmsg: string }>
    (async (resolve, reject) =>
    {
      fileName = fileName || '';
      libName = libName || '';
      mbrName = mbrName || '';
      const libl = options.libl || 'QGPL QTEMP';
      const curlib = options.curlib || '';
      const serverUrl = options.serverUrl || '';
      let errmsg = '';

      const url = `${serverUrl}/coder/common/json_runSqlReturnEmpty.php`;
      const params =
      {
        libl, proc: 'system_addpfm',
        outParm1: errmsg, parm2: fileName,
        parm3: libName, parm4: mbrName, parm5: textDesc, parm6: srcType
      }
      const query = object_toQueryString(params);
      const url_query = url + '?' + query;

      const response = await axios({
        method: 'get', url: url_query, responseType: 'json'
      });

      let data = await response.data;
      errmsg = data.outParm1.trim( );
      resolve({ errmsg });
    });

  return promise;
}

// --------------------- as400_chgpfm -----------------------
export async function as400_chgpfm(
  fileName: string, libName: string, mbrName: string,
  textDesc: string, srcType: string, options: iServerOptions):
  Promise<{ errmsg: string }>
{
  const promise = new Promise<{ errmsg: string }>
    (async (resolve, reject) =>
    {
      fileName = fileName || '';
      libName = libName || '';
      mbrName = mbrName || '';
      const libl = options.libl || 'QGPL QTEMP';
      const curlib = options.curlib || '';
      const serverUrl = options.serverUrl || '';
      const joblog = options.joblog || 'N' ;
      let errmsg = '';

      const url = `${serverUrl}/coder/common/json_runSqlReturnEmpty.php`;
      const params =
      {
        libl, proc: 'system_chgpfm', joblog,
        outParm1: errmsg, parm2: fileName,
        parm3: libName, parm4: mbrName, parm5: textDesc, parm6: srcType
      }
      const query = object_toQueryString(params);
      const url_query = url + '?' + query;

      const response = await axios({
        method: 'get', url: url_query, responseType: 'json'
      });

      let data = await response.data;
      errmsg = data.outParm1.trim();
      resolve({ errmsg });
    });

  return promise;
}

// --------------------- as400_compile -----------------------
export async function as400_compile( 
      srcfName:string, srcfLib:string, 
      srcmbr:string, options:iServerOptions ) :
      Promise<{compMsg:string, compile:iCompileLine[], joblog:string[]}>
{
  const promise = new Promise<{ compMsg: string, compile: iCompileLine[], joblog: string[] }> 
    ( async (resolve, reject) =>
  {
    srcfName = srcfName || '';
    srcfLib = srcfLib || '';
    srcmbr = srcmbr || '';
    const libl = options.libl || 'QGPL QTEMP';
    const curlib = options.curlib || '';
    const serverUrl = options.serverUrl || '' ;
    let compMsg = '';
    let compile:iCompileLine[] = [] ;
    let joblog:string[] = [] ;

    const url = `${serverUrl}/coder/common/json_getManyRows.php`;
    const params = 
    {
      libl, proc: 'utl7960_compile', 
      outParm1: compMsg, parm2: srcfName,
      parm3: srcfLib, parm4: srcmbr, parm5: curlib
    }
    const query = object_toQueryString(params) ;
    const url_query = url + '?' + query ;

    const response = await axios({
      method: 'get', url: url_query, responseType: 'json'
    });

    let data = await response.data;
    compMsg = data.outParm1;
    compile = data.set1 || [] ;
    joblog  = data.set2 || [] ;
    resolve( { compMsg, compile, joblog });
  });

  return promise;
}
// --------------------- as400_dspffd -----------------------
// return array of srcmbrs of a srcfile.
export async function as400_dspffd(libName: string, fileName: string,
  options?: iServerOptions)
  : Promise<iDspffd[] | undefined>
{
  const promise = new Promise<iDspffd[] | undefined>(async (resolve, reject) =>
  {
    options = options || {};
    const serverUrl = options.serverUrl || 'http://173.54.20.170:10080';
    const libl = options.libl || 'couri7 aplusb1fcc qtemp';
    const url = `${serverUrl}/coder/common/json_getManyRows.php`;

    const sql = 'select    a.* ' +
      'from      table(system_dspffd(?,?)) a ' ;
    const params =
    {
      libl, sql,
      parm1: libName, parm2: fileName, debug: 'N'
    };

    const query = object_toQueryString(params);
    const url_query = url + '?' + query;

    const response = await axios({
      method: 'get', url: url_query, responseType: 'json'
    });

    let data = await response.data;
    let rows = data.set1 as iDspffd[] | undefined;
    if ( rows && rows.length == 0 )
      rows = undefined ;

    resolve(rows);
  });
  return promise;
}

// --------------------- as400_rmvm -----------------------
export async function as400_rmvm(
  fileName: string, libName: string, mbrName: string, options: iServerOptions):
  Promise<{ errmsg: string }>
{
  const promise = new Promise<{ errmsg: string }>
    (async (resolve, reject) =>
    {
      fileName = fileName || '';
      libName = libName || '';
      mbrName = mbrName || '';
      const libl = options.libl || 'QGPL QTEMP';
      const curlib = options.curlib || '';
      const serverUrl = options.serverUrl || '';
      let errmsg = '';

      const url = `${serverUrl}/coder/common/json_runSqlReturnEmpty.php`;
      const params =
      {
        libl, proc: 'system_rmvm',
        outParm1: errmsg, parm2: fileName,
        parm3: libName, parm4: mbrName
      }
      const query = object_toQueryString(params);
      const url_query = url + '?' + query;

      const response = await axios({
        method: 'get', url: url_query, responseType: 'json'
      });

      let data = await response.data;
      errmsg = data.outParm1.trim( );
      resolve({ errmsg });
    });

  return promise;
}

// --------------------- as400_srcfList -----------------------
export function as400_srcfList(objName: string, libName: string, options?: iServerOptions) : Promise<{}[]>
{
  const promise = new Promise<{}[]> (async (resolve, reject) =>
  {
    options = options || {} ;
    const serverUrl = options.serverUrl || 'http://173.54.20.170:10080' ;
    const libl = options.libl || 'couri7 aplusb1fcc qtemp';
    const url = `${serverUrl}/coder/common/json_getManyRows.php`;
    const params =
    {
      libl, proc: 'utl8020_srcfList',
      parm1: objName, parm2: libName, debug: 'N'
    };

    const response = await axios({
      method: 'get', url, data: params, responseType: 'json'
    });

    const respText = await response.data;
    const rows = JSON.parse(respText);

    resolve(rows.set1);
  });

  return promise;
}

// --------------------- as400_routines -----------------------
export function as400_routines(libName: string, routineName: string): Promise<{}[]>
{
  const promise = new Promise<{}[]>(async (resolve, reject) =>
  {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
    const params =
    {
      libl, proc: 'utl8020_routines',
      parm1: libName, parm2: routineName, debug: 'N'
    };

    const response = await axios({
      method: 'get', url, data: params, responseType: 'json'
    });

    const respText = await response.data;
    const rows = JSON.parse(respText);

    resolve(rows.set1);
  });

  return promise;
}

// --------------------- as400_srcmbrLines -----------------------
export async function as400_srcmbrLines(libName: string, fileName: string, mbrName: string)
  : Promise<iSrcmbrLine[]>
{
  const promise = new Promise<iSrcmbrLine[]>(async (resolve, reject) =>
  {

  const libl = 'couri7 aplusb1fcc qtemp';
  const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
  const sql = 'select    a.seqnbr, char(a.chgdate,iso) chgdate, a.text ' +
    'from      table(system_srcmbr_lines(?,?,?)) a ' +
    'order by  a.seqnbr ';

  const params =
  {
    libl, sql,
    parm1: fileName, parm2: libName, parm3: mbrName, debug: 'N', joblog:'N'
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'json'
  });

  let rows = await response.data;
  if ( typeof rows == 'string')
  {
    // const { jsonText, errText } = respText_extractErrorText(rows) ;
    // const data = JSON.parse(jsonText) ;
    // const ch1 = '1' ;
  }

  resolve(rows.set1);
}) ;
return promise ;
}

// ------------------- respText_extractErrorText ---------------------------
function respText_extractErrorText(respText:string)
{
  let errText = '';
  let jsonText = '';
  if ((respText) && (respText.length > 0) && (respText.substr(0, 1) == '<'))
  {
    const lines = respText.split('\n');
    for (let ix = 0; ix < lines.length; ++ix)
    {
      const line = lines[ix];
      if (line.substr(0, 1) == '<')
        errText += line;
      else
        jsonText = line;
    }
  }
  else
  {
    jsonText = respText;
  }
  return { jsonText, errText };
}

// --------------------- as400_srcmbrList -----------------------
// return array of srcmbrs of a srcfile.
export async function as400_srcmbrList(libName: string, fileName: string, mbrName: string = '', 
        options?: iServerOptions )
  : Promise<iDspfd_mbrlist[]>
{
  const promise = new Promise< iDspfd_mbrlist[]>(async (resolve, reject) =>
  {
    options = options || {};
    const serverUrl = options.serverUrl || 'http://173.54.20.170:10080';
    const libl = options.libl || 'couri7 aplusb1fcc qtemp';
    const url = `${serverUrl}/coder/common/json_getManyRows.php`;

    const sql = 'select    a.* ' +
      'from      table(system_dspfd_mbrlist(?,?,?)) a ' +
      'order by  a.mbrname ';
    const params =
    {
      libl, sql,
      parm1: fileName, parm2: libName, parm3:mbrName, debug: 'N'
    };

    const query = object_toQueryString(params);
    const url_query = url + '?' + query;

    const response = await axios({
      method: 'get', url: url_query, responseType: 'json'
    });

    let data = await response.data;
    let rows = data.set1 as iDspfd_mbrlist[];

    // calc mtime and add to the member info object.
    rows = rows.map((item) =>
    {
      const { CHGDATE, CHGTIME } = item ;
      const dt = date_fromISO(CHGDATE, CHGTIME) ;
      const mtime = date_toEpoch(dt) ;
      return {...item, mtime } ;
    });

    resolve(rows) ;
  }) ;
  return promise ;
}

// --------------------- as400_tablesAndViews_select -----------------------
export async function as400_tablesAndViews_select(schema: string, collName: string, maxRows: number = 500)
  : Promise<[{ SCHEMA: string, COLLNAME: string, COLLTYPE: string }]>
{
  const libl = 'couri7 aplusb1fcc qtemp';
  const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
  const sql = 'call    system_tablesAndViews_select(?,?,?) ';

  const params =
  {
    libl, sql,
    parm1: schema, parm2: collName, parm3: maxRows, debug: 'N'
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'json'
  });

  const rows = await response.data;

  return rows.set1;
}

// ------------------------- sqlTimestamp_toJavascriptDate -------------------------
// first, convert SQL timestamp to ISO timestamp
// 2011-10-05.  2011-10-05T14:48:00.000Z
// then create a javascript Date from the ISO timestamp.
export function sqlTimestamp_toJavascriptDate( sql_ts:string ) : Date
{
  let iso_ts = string_assignSubstr( sql_ts, 10, 1, 'T');
  iso_ts = iso_ts.replace(/\./g, ':');
  iso_ts = string_assignSubstr(iso_ts, 19, -1, '.000Z');
  const dt = new Date(iso_ts);
  return dt ;
}
