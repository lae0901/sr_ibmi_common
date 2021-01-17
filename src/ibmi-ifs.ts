// /src/ibmi-ifs.ts

import { file_readFile, object_toQueryString, path_joinUnix } from 'sr_core_ts';
import axios from 'axios';
import { iConnectSettings, sqlTimestamp_toJavascriptDate } from './ibmi-common';
import * as FormData from 'form-data';
import * as path from 'path' ;
import { connectionSettings_toProductConnectLibl, form_getLength } from './common_core';
import { base64Builder_append, base64Builder_final, base64Builder_new } from 'sr_base64';

// ----------------------------------- iIfsItem -----------------------------------
export interface iIfsItem
{
  itemName: string,
  crtDate: Date,
  chgDate: Date,
  mtime: number,
  size: number,
  ccsid: number,
  itemType: '*DIR'|'*STMF'|'',
  errmsg: string
}

// --------------------- ibmi_ifs_getItems -----------------------
// options:{filterItemName:string, filterItemType:string, joblog:'N'}
export async function ibmi_ifs_getItems( 
  dirPath: string, connectSettings: iConnectSettings,
  options?:{filterItemName?:string, filterItemType?:string, joblog?:'Y'|'N', debug?:'Y'|'N'} )
{
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/common/json_getRows_noLogin.php`;
  const sql = 'select    a.itemName, a.crtTs, a.chgTs, a.mtime, a.size, ' + 
    '                    a.ccsid, a.itemType, a.errmsg ' +
    'from      table(ktl8022_ifsItems(?,?,?)) a ' +
    'order by  a.itemName ';

  options = options || {} ;
  const filterItemName = options.filterItemName || '' ;
  const filterItemType = options.filterItemType || '' ;
  const joblog = options.joblog || 'N' ;
  const debug = options.debug || 'N' ;

  const params =
  {
    libl, sql,
    parm1: dirPath, parm2: filterItemName, parm3: filterItemType, 
    debug, joblog
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'json'
  });

  let errmsg = '' ;
  let rows = await response.data;

  if ( typeof rows == 'string')
  {
    errmsg = rows as string ;
    rows = [] ;
  }
  else
  {
    // convert create and change timestamps to javascript date fields.
    rows = rows.map((item:any) =>
    {
      const { ITEMNAME:itemName, MTIME:mtime, SIZE:size, CCSID:ccsid, 
              ITEMTYPE:itemType, ERRMSG:errmsg } = item ;
      const chgDate = sqlTimestamp_toJavascriptDate(item.CHGTS) ;
      const crtDate = sqlTimestamp_toJavascriptDate(item.CRTTS) ;
      return { itemName, chgDate, crtDate, mtime, size, ccsid, itemType, errmsg };
    });
  }

  return { rows, errmsg };
}

// ---------------------------- iGetFileContents_options ----------------------------
interface iGetFileContents_options 
{
  returnType?: string;
  getMethod?: 'IFS' | 'PHP' | '' ;
}

// ----------------------- ibmi_ifs_getFileContents ----------------------------
// returnType: buf, text
// options: { returnType, getMethod?: 'IFS' | 'PHP' | '' }
export async function ibmi_ifs_getFileContents( filePath:string, 
            connectSettings: iConnectSettings, 
            options?: iGetFileContents_options )
{
  let ifsFilePath = filePath ;
  options = options || {} ;
  const getMethod = options.getMethod || '' ;
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}` + 
              `/php/ifs-file-get-contents-base64.php`;
  const params =
  {
    libl, fromIfsPath:ifsFilePath, getMethod,
    debug: 'N', joblog: 'N'
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'blob'
  });

  const buf = Buffer.from(response.data, 'base64');

  // check if return data is an errmsg.
  let errmsg = '' ;
  if ( buf.length <= 2000 )
  {
    const text = buf.toString( ) ;
    if ((text.length >= 50) && ( text.substr(0,12) == 'error. open '))
      errmsg = text ;
  }

  return {buf,errmsg};
}

// ----------------------- ibmi_ifs_getFileContents_gccDirect ----------------------------
export async function ibmi_ifs_getFileContents_gccDirect(filePath: string,
  connectSettings: iConnectSettings )
{
  let errmsg = '' ;
  let ifsFilePath = filePath;
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}` +
    `/gcc/ifs-file-get-contents`;
  const params =
  {
    fromIfsPath: ifsFilePath, debug: 'N', joblog: 'N'
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'blob'
  });

  const text = response.data ;

  return { text , errmsg };
}

// ----------------------- ibmi_ifs_uploadFile ----------------------------
// returnType: buf, text
export async function ibmi_ifs_uploadFile(filePath: string, ifsFilePath:string,
                            connectSettings: iConnectSettings)
{
  let afterUpload_mtime = 0 ;
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/upload-to-ifs.php`;

  // read entire contents of file to upload.
  const { data } = await file_readFile(filePath);

  // convert data Buffer to base64
  const builder = base64Builder_new();
  base64Builder_append(builder, data);
  const base64_text = base64Builder_final(builder);

  const form = new FormData();
  form.append('field', base64_text, path.basename(ifsFilePath));
  form.append('folder', path.dirname(ifsFilePath));

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);

  const result = await axios.post(
    url, form,
    { headers, });
  const { mtime, size } = result.data as { mtime: number, size:number };
  afterUpload_mtime = mtime ;

  return { mtime:afterUpload_mtime, size } ;
}

// ----------------------- ibmi_ifs_uploadTextToFile ----------------------------
// returnType: buf, text
export async function ibmi_ifs_uploadTextToFile( text: string, ifsFilePath:string,
                            connectSettings: iConnectSettings)
{
  let afterUpload_mtime = 0;
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/upload-to-ifs.php`;

  // convert data Buffer to base64
  const builder = base64Builder_new();
  base64Builder_append(builder, text);
  const base64_text = base64Builder_final(builder);

  const form = new FormData();
  form.append('field', base64_text, path.basename(ifsFilePath));
  form.append('folder', path.dirname(ifsFilePath));

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);

  const result = await axios.post(
    url, form,
    { headers, });
  const { mtime, size, errmsg } = result.data as { errmsg:string, mtime: number, size: number };
  afterUpload_mtime = mtime;

  return { errmsg, mtime: afterUpload_mtime, size };
}

// -------------------------------- ibmi_ifs_unlink --------------------------------
/**
 * delete file from directory on IFS
 * @param serverUrl server url
 * @param ifsFilePath path of file on IFS to delete
 */
export async function ibmi_ifs_unlink(ifsFilePath: string, connectSettings: iConnectSettings )
{
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/delete-ifs.php`;
  const params = {ifsFilePath} ;
  const query = object_toQueryString(params);
  let message = '' ;

  // post to delete-ifs.php on ibm i server to delete the file.
  const form = new FormData();
  form.append('filePath', ifsFilePath);

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);
  {
    const result = await axios.post( url, form,
      { headers });
    message = result.data ;
  }

  return message ;
}

// -------------------------------- ibmi_ifs_deleteDir --------------------------------
/**
 * delete IBM i IFS directory.
 * @param serverUrl server url
 * @param ifsDirPath path of IFS directory to delete
 */
export async function ibmi_ifs_deleteDir(ifsDirPath: string, connectSettings: iConnectSettings)
{
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/ifs-action.php`;
  // const url = `${connectSettings.serverUrl}/site/common/ifs-action.php`;
  let message = '';
  const action = 'deleteDir' ;

  // post to delete-ifs-dir.php on ibm i server to delete the directory.
  const form = new FormData();
  form.append('dirPath', ifsDirPath);
  form.append('action', action);

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);
  {
    const result = await axios.post(url, form,
      { headers });
    message = result.data;
  }

  return message;
}

// -------------------------------- ibmi_ifs_ensureDir --------------------------------
/**
 * ensure directory exists in IBM I IFS. 
 * @param serverUrl server url
 * @param ifsDirPath path of IFS directory to ensure exists
 */
export async function ibmi_ifs_ensureDir(ifsDirPath: string, connectSettings:iConnectSettings)
{
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/ifs-action.php`;
  let message = '';
  const action = 'ensureDir';

  // post to ensure-ifs-dir.php on ibm i server to make sure directory exists.
  const form = new FormData();
  form.append('action', action );
  form.append('dirPath', ifsDirPath);

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);
  {
    const result = await axios.post(url, form,
      { headers });
    message = result.data;
  }

  return message;
}

// -------------------------------- ibmi_ifs_checkDir --------------------------------
/**
 * check that directory exists in IBM I IFS. 
 * @param serverUrl server url
 * @param ifsDirPath path of IFS directory to ensure exists
 * @returns exists or not_exists
 */
export async function ibmi_ifs_checkDir(ifsDirPath: string, connectSettings: iConnectSettings )
{
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/ifs-action.php`;
  let message = '';
  const action = 'checkDir';

  // post to ensure-ifs-dir.php on ibm i server to make sure directory exists.
  const form = new FormData();
  form.append('action', action);
  form.append('dirPath', ifsDirPath);

  const headers = form.getHeaders();
  headers['Content-length'] = await form_getLength(form);
  {
    const result = await axios.post(url, form,
      { headers });
    message = result.data;
  }

  return message;
}

