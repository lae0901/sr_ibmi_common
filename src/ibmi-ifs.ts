// /src/ibmi-ifs.ts

import { object_toQueryString, path_joinUnix } from 'sr_core_ts';
import axios from 'axios';
import { iConnectSettings, sqlTimestamp_toJavascriptDate } from './ibmi-common';
import * as FormData from 'form-data';
import { connectionSettings_toProductConnectLibl, form_getLength } from './common_core';

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

// ----------------------- ibmi_ifs_getFileContents ----------------------------
// returnType: buf, text
export async function ibmi_ifs_getFileContents( filePath:string, 
            connectSettings: iConnectSettings, returnType = 'buf')
{
  let ifsFilePath = filePath ;
  const libl = connectionSettings_toProductConnectLibl(connectSettings);
  const serverUrl = connectSettings.serverUrl;
  const url = `${serverUrl}/${connectSettings.autocoder_ifs_product_folder}/php/ifs-file-get-contents-base64.php`;
  const params =
  {
    libl, fromIfsPath:ifsFilePath,
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

