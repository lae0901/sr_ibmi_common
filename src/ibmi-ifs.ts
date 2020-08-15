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
  mtime: number,
  size: number,
  ccsid: number,
  itemType: '*DIR'|'*STMF'|'',
  errmsg: string
}

// --------------------- ibmi_ifs_getItems -----------------------
// options:{filterItemName:string, filterItemType:string, joblog:'N'}
export async function ibmi_ifs_getItems( 
  dirPath: string,
  options?:{filterItemName?:string, filterItemType?:string, joblog?:'Y'|'N'} )
  : Promise<{rows:iIfsItem[],errmsg:string}>
{
  const promise = new Promise<{rows:iIfsItem[],errmsg:string}>(async (resolve, reject) =>
  {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
    const sql = 'select    a.itemName, a.crtTs, a.chgTs, a.mtime, a.size, ' + 
      '                    a.ccsid, a.itemType, a.errmsg ' +
      'from      table(utl8022_ifsItems(?,?,?)) a ' +
      'order by  a.itemName ';

    options = options || {} ;
    const filterItemName = options.filterItemName || '' ;
    const filterItemType = options.filterItemType || '' ;
    const joblog = options.joblog || 'N' ;

    const params =
    {
      libl, sql,
      parm1: dirPath, parm2: filterItemName, parm3: filterItemType, 
      debug: 'N', joblog
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

    resolve({rows,errmsg});
  });
  return promise;
}

// ----------------------- ibmi_ifs_getFileContents ----------------------------
// returnType: buf, text
export async function ibmi_ifs_getFileContents( filePath:string, returnType = 'buf') :
          Promise<{buf:Buffer,errmsg:string}>
{
  let ifsFilePath = filePath ;
  const promise = new Promise<{ buf: Buffer, errmsg: string }>(async (resolve, reject) =>
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

    // check if return data is an errmsg.
    let errmsg = '' ;
    if ( buf.length <= 2000 )
    {
      const text = buf.toString( ) ;
      if ((text.length >= 50) && ( text.substr(0,12) == 'error. open '))
        errmsg = text ;
    }

    resolve({buf,errmsg});
  });
  return promise;
}
