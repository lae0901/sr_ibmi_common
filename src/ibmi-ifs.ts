// /src/ibmi-ifs.ts

import { object_toQueryString, string_rtrim, string_matchGeneric } from 'sr_core_ts';
import axios from 'axios';
import * as querystring from 'querystring';

// ----------------------------------- iIfsItem -----------------------------------
export interface iIfsItem
{
  itemName: string,
  crtTs: Date,
  chgTs: Date,
  size: number,
  ccsid: number,
  itemType: '*DIR'|'*STMF'|''
}

// --------------------- ibmi_ifs_getItems -----------------------
export async function ibmi_ifs_getItems( dirPath: string, itemName: string, itemType: string)
  : Promise<iIfsItem[]>
{
  const promise = new Promise<iIfsItem[]>(async (resolve, reject) =>
  {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
    const sql = 'select    a.itemName, a.crtTs, a.chgTs, a.size, a.ccsid, a.itemType ' +
      'from      table(utl8022_ifsItems(?,?,?)) a ' +
      'order by  a.itemName ';

    const params =
    {
      libl, sql,
      parm1: dirPath, parm2: itemName, parm3: itemType, debug: 'N', joblog: 'N'
    };

    const query = object_toQueryString(params);
    const url_query = url + '?' + query;

    const response = await axios({
      method: 'get', url: url_query, responseType: 'json'
    });

    let rows = await response.data;
    if (typeof rows == 'string')
    {
      // const { jsonText, errText } = respText_extractErrorText(rows) ;
      // const data = JSON.parse(jsonText) ;
      // const ch1 = '1' ;
    }

    resolve(rows);
  });
  return promise;
}

// ----------------------- ibmi_ifs_getFileContents ----------------------------
// returnType: buf, text
export async function ibmi_ifs_getFileContents( filePath:string, returnType = 'buf') :
Promise<string|any>
{
  let ifsFilePath = filePath ;
  const promise = new Promise<string|any>(async (resolve, reject) =>
  {
    // ifsFilePath = encodeURIComponent( ifsFilePath );

    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/php/ifs-file-get-contents-nologin.php';

    const params =
    {
      libl, fromIfsPath:ifsFilePath,
      debug: 'N', joblog: 'N'
    };

    const query = object_toQueryString(params);
    const url_query = url + '?' + query;

    const response = await axios({
      method: 'get', url: url_query, responseType: 'text'
    });

    if (returnType == 'buf')
    {
      // const buf = await (response as any).arrayBuffer();
      const buf = response.data ;
      resolve(buf);
    }
    else
    {
      const text = await (response as any).text();
      resolve(text);
    }
  });
  return promise;
}
