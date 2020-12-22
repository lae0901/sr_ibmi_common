// media/ibmi_common.ts

import { date_fromISO, date_toEpoch, 
  object_toQueryString, string_assignSubstr } from 'sr_core_ts';
import axios from 'axios';
import {  iIfsItem, ibmi_ifs_getItems, ibmi_ifs_getFileContents, ibmi_ifs_unlink,
          ibmi_ifs_deleteDir, ibmi_ifs_ensureDir, ibmi_ifs_checkDir } from './ibmi-ifs';
import { connectionSettings_toProductConnectLibl, form_getLength } from './common_core';
import { iQualSrcmbr } from './ibmi-interfaces';
import * as FormData from 'form-data';

export { iQualSrcmbr } ;
export { iIfsItem, ibmi_ifs_getItems, ibmi_ifs_getFileContents, ibmi_ifs_unlink, 
        ibmi_ifs_deleteDir, ibmi_ifs_ensureDir, ibmi_ifs_checkDir } ;
export { form_getLength } ;

export * from './common-typedef';
export * from './rpg-typedef';

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
  DATADEFN: string;
  WHFLDT: string;
  WHFLDB: number;
  WHFLDD: number;
  WHFLDP: number;
  WHFTXT: string;
  WHCHD1: string;
  WHCHD2: string;
  WHCHD3: string;
  WHFOBO: number;
  WHIBO: number;
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

// ------------------------------- iConnectSettings -------------------------------
/**
 * connect to ibm i settings. system library name. Then, once user is logged in, 
 * the login user name, current library ( in which new objects are created ), and
 * user library list ( where to find database files and source code of the logged
 * in user. )
 */
export interface iConnectSettings
{
  /**
   * url of ibm i server.
   */
  serverUrl: string;

  /**
   * ibm i library that contains autocoder product programs. For example, see ibmi_ifs_getItems
   * function. That function calls an sql table function on ibm i that returns items from
   * ifs folder. That sql table function is found in the autocoder product library.
   */
  ibmi_autocoder_lib?: string;
  ibmi_autocoder_product_lib: string;

  /**
   * ibm i ifs folder use by autocoder web services. This ifs_folder path is joined to 
   * serverUrl to form root URL of the autocoder product web service.
   */
  autocoder_ifs_folder?: string;
  autocoder_ifs_product_folder: string;

  ibmi_connect_curlib: string;

  ibmi_connect_libl: string;
}

// --------------------------------- iCompileLine ---------------------------------
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
  textDesc: string, srcType: string, 
  connectSettings: iConnectSettings, options?: iServerOptions )
{
  fileName = fileName || '';
  libName = libName || '';
  mbrName = mbrName || '';
  const libl = connectionSettings_toProductConnectLibl( connectSettings ) ;
  const serverUrl = connectSettings.serverUrl ;
  options = options || {};
  const joblog = options.joblog || 'N';
  let errmsg = '';

  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_runSqlReturnEmpty.php`;
  const params =
  {
    libl, proc: 'kystem_addpfm', joblog,
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
  return { errmsg } ;
}

// --------------------- as400_chgpfm -----------------------
export async function as400_chgpfm(
  fileName: string, libName: string, mbrName: string,
  textDesc: string, srcType: string, 
  connectSettings: iConnectSettings, options?: iServerOptions )
{
  fileName = fileName || '';
  libName = libName || '';
  mbrName = mbrName || '';
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {} ;
  const joblog = options.joblog || 'N' ;
  let errmsg = '';

  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_runSqlReturnEmpty.php`;
  const params =
  {
    libl, proc: 'kystem_chgpfm', joblog,
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
  return { errmsg } ;
}

// --------------------- as400_compile -----------------------
export async function as400_compile( srcfName:string, srcfLib:string, 
            srcmbr:string, 
            connectSettings: iConnectSettings, options?: iServerOptions)
{
  srcfName = srcfName || '';
  srcfLib = srcfLib || '';
  srcmbr = srcmbr || '';
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const curlib = options.curlib ? options.curlib : connectSettings.ibmi_connect_curlib;
  let compMsg = '';
  let compile:iCompileLine[] = [] ;

  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;
  const params = 
  {
    libl, proc: 'ktl7960_compile', 
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
  const compile_joblog  = data.set2 || [] ;
  return { compMsg, compile, joblog:compile_joblog };
}

// --------------------- as400_dspffd -----------------------
// return array of srcmbrs of a srcfile.
export async function as400_dspffd(libName: string, fileName: string,
  connectSettings: iConnectSettings, options?: iServerOptions)
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;

  const sql = 'select    a.* ' +
    'from      table(kystem_dspffd(?,?)) a ' ;
  const params =
  {
    libl, sql, joblog,
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

  return rows ;
}

// --------------------- as400_rmvm -----------------------
export async function as400_rmvm(
  fileName: string, libName: string, mbrName: string,
  connectSettings: iConnectSettings, options ?: iServerOptions)
{
  fileName = fileName || '';
  libName = libName || '';
  mbrName = mbrName || '';

  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_runSqlReturnEmpty.php`;
  let errmsg = '';
  const params =
  {
    libl, proc: 'kystem_rmvm', joblog,
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
  return { errmsg } ;
}

// --------------------- as400_srcfList -----------------------
export async function as400_srcfList(objName: string, libName: string,  
                connectSettings: iConnectSettings, options ?: iServerOptions)
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;
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
  return rows.set1 as {}[] ;
}

// --------------------- as400_routines -----------------------
export async function as400_routines(libName: string, routineName: string, 
                connectSettings: iConnectSettings, options ?: iServerOptions)
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;
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

  return rows.set1 as {}[] ;
}

// --------------------- as400_srcmbrLines -----------------------
export async function as400_srcmbrLines(libName: string, fileName: string, 
                  mbrName: string,
                  connectSettings: iConnectSettings, options ?: iServerOptions)
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;

  const sql = 'select    a.seqnbr, char(a.chgdate,iso) chgdate, a.text ' +
    'from      table(kystem_srcmbr_lines(?,?,?)) a ' +
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

  return rows.set1 as iSrcmbrLine[] ;
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
export async function as400_srcmbrList(libName: string, fileName: string, mbrName: string, 
  connectSettings: iConnectSettings, options?: iServerOptions)
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;

  const sql = 'select    a.* ' +
    'from      table(kystem_dspfd_mbrlist(?,?,?)) a ' +
    'order by  a.mbrname ';
  const params =
  {
    libl, sql, joblog,
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

  return rows ;
}

// --------------------- as400_tablesAndViews_select -----------------------
export async function as400_tablesAndViews_select(schema: string, collName: string, 
                connectSettings: iConnectSettings, options?: iServerOptions)
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  options = options || {};
  const joblog = options.joblog || 'N';
  const maxRows = options.numRows ? options.numRows : 500 ;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getManyRows.php`;
  const sql = 'call    system_tablesAndViews_select(?,?,?) ';

  const params =
  {
    libl, sql, joblog,
    parm1: schema, parm2: collName, parm3: maxRows, debug: 'N'
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'json'
  });

  const rows = await response.data;

  return rows.set1 as { SCHEMA: string, COLLNAME: string, COLLTYPE: string }[] ;
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

// ----------------------------- as400_uploadLinesToSrcmbr -----------------------------
/**
 * upload an array of `iSrcmbrLine` lines to a srcmbr on the ibm i. If the srcmbr does
 * not exist, it will be added to the source file. If the srcmbr does exist, its contents
 * will be cleared and replaced with the uploaded lines.
 * @param connectSettings 
 * @param srcmbr_lines 
 * @param uploadFileName name of that contains the srcmbr_lines. This is for info 
 * purposes only. Can be set to an empty string.
 * @param toSrcmbr 
 * @param srcType 
 * @param textDesc 
 */
export async function as400_uploadLinesToSrcmbr(connectSettings: iConnectSettings,
  srcmbr_lines: iSrcmbrLine[], uploadFileName: string,
  toSrcmbr: iQualSrcmbr, srcType:string, textDesc:string )
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;

  // convert from array of lines to array of srcmbr formatted lines.
  // ( formatted such that text stream first contains name, srcfName, srcType,
  //   textdesc. Then contains source lines. )
  const uploadStream_lines = [];
  uploadStream_lines.push(`srcfName:${toSrcmbr.srcfName}`);
  uploadStream_lines.push(`srcfLib:${toSrcmbr.srcfLib}`);
  uploadStream_lines.push(`mbrName:${toSrcmbr.mbrName}`);
  uploadStream_lines.push(`srcType:${srcType}`);
  uploadStream_lines.push(`textDesc:${textDesc}`);
  uploadStream_lines.push(`lines:`);
  const formattedLines = srcmbr_lines.map((item) =>
  {
    const textLine = `${item.CHGDATE || '0000-00-00'},${item.SEQNBR},${item.TEXT}`;
    return textLine;
  });
  uploadStream_lines.push(...formattedLines);
  const sourceLines_text = uploadStream_lines.join('\n') + '\n';

  const encoder = new TextEncoder();
  const uint8array = encoder.encode(sourceLines_text);
  const data = Buffer.from(uint8array);

  const form = new FormData();
  // Second argument  can take Buffer or Stream (lazily read during the request) too.
  // Third argument is filename if you want to simulate a file upload. Otherwise omit.
  form.append('field', data, uploadFileName || toSrcmbr.mbrName );
  form.append('mbrName', toSrcmbr.mbrName);
  form.append('srcfName', toSrcmbr.srcfName);
  form.append('srcfLib', toSrcmbr.srcfLib);
  form.append('libl', libl );

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);

  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_uploadSrcmbr.php`;
  const result = await axios.post( url, form, { headers });
  return result.data as string ;
}
