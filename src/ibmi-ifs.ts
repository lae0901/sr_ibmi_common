// /src/ibmi-ifs.ts

import { object_toQueryString, string_rtrim, string_matchGeneric, string_assignSubstr } from 'sr_core_ts';
import axios from 'axios';
import * as querystring from 'querystring';
import { sqlTimestamp_toJavascriptDate } from './ibmi-common';

// ----------------------------------- iIfsItem -----------------------------------
export interface iIfsItem
{
  itemName: string,
  crtDate: Date,
  chgDate: Date,
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

    // convert create and change timestamps to javascript date fields.
    rows = rows.map((item:any) =>
    {
      const {ITEMNAME:itemName, SIZE:size, CCSID:ccsid, ITEMTYPE:itemType } = item ;
      const chgDate = sqlTimestamp_toJavascriptDate(item.CHGTS) ;
      const crtDate = sqlTimestamp_toJavascriptDate(item.CRTTS) ;
      return { itemName, chgDate, crtDate, size, ccsid, itemType };
    });

    resolve(rows);
  });
  return promise;
}

// ----------------------- ibmi_ifs_getFileContents ----------------------------
// returnType: buf, text
export async function ibmi_ifs_getFileContents( filePath:string, returnType = 'buf') :
          Promise<Buffer>
{
  let ifsFilePath = filePath ;
  const promise = new Promise<Buffer>(async (resolve, reject) =>
  {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/php/ifs-file-get-contents-base64.php';

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
    resolve(buf);
  });
  return promise;
}
