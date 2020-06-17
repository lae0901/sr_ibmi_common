// media/ibmi_common.ts

import { object_toQueryString, string_rtrim, string_matchGeneric } from 'sr_core_ts';
import axios from 'axios';

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
  SRCTYPE: string
};

// -------------------------- iOptions -------------------------
// options passed to server REST API.
// serverUrl: url of the server.  http://192.168.1.170:10080
// numRows: max number of rows to return
// libl: library list when api runs on server
interface iOptions
{
  serverUrl?: string,
  numRows?: number,
  libl?: string,
  curlib?: string
}

export interface iCompileLine
{
  SKIPBFR: string,
  SPACEB: string,
  LINE: string
}

// --------------------- as400_compile -----------------------
export async function as400_compile( 
      srcfName:string, srcfLib:string, 
      srcmbr:string, options:iOptions ) :
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
    let outSet = data.outSet;
    compMsg = outSet.outParm1;
    compile = data.set1 || [] ;
    joblog  = data.set2 || [] ;
    resolve( { compMsg, compile, joblog });
  });

  return promise;
}

// --------------------- as400_srcfList -----------------------
export function as400_srcfList(objName: string, libName: string, options?: iOptions) : Promise<{}[]>
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

    resolve(rows);
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

    resolve(rows);
  });

  return promise;
}

// --------------------- as400_srcmbrLines -----------------------
export async function as400_srcmbrLines(libName: string, fileName: string, mbrName: string)
  : Promise<{ SEQNBR: string, CHGDATE: string, TEXT: string }[]>
{
  const promise = new Promise < { SEQNBR: string, CHGDATE: string, TEXT: string }[] >(async (resolve, reject) =>
  {

  const libl = 'couri7 aplusb1fcc qtemp';
  const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
  const sql = 'select    a.seqnbr, char(a.chgdate,iso) chgdate, a.text ' +
    'from      table(system_srcmbr_lines(?,?,?)) a ' +
    'order by  a.seqnbr ';

  const params =
  {
    libl, sql,
    parm1: fileName, parm2: libName, parm3: mbrName, debug: 'N'
  };

  const query = object_toQueryString(params);
  const url_query = url + '?' + query;

  const response = await axios({
    method: 'get', url: url_query, responseType: 'json'
  });

  const rows = await response.data;

  resolve(rows);
}) ;
return promise ;
}

// --------------------- as400_srcmbrList -----------------------
// return array of srcmbrs of a srcfile.
export async function as400_srcmbrList(libName: string, fileName: string, mbrName: string = '', 
        options?: iOptions )
  : Promise<iDspfd_mbrlist[]>
{
  const promise = new Promise< iDspfd_mbrlist[]>(async (resolve, reject) =>
  {
    options = options || {};
    const serverUrl = options.serverUrl || 'http://173.54.20.170:10080';
    const libl = options.libl || 'couri7 aplusb1fcc qtemp';
    const url = `${serverUrl}/coder/common/json_getManyRows.php`;

    const sql = 'select    a.* ' +
      'from      table(system_dspfd_mbrlist(?,?)) a ' +
      'order by  a.mbrname ';
    const params =
    {
      libl, sql,
      parm1: fileName, parm2: libName, debug: 'N'
    };

    const query = object_toQueryString(params);
    const url_query = url + '?' + query;

    const response = await axios({
      method: 'get', url: url_query, responseType: 'json'
    });

    let rows = await response.data;

    // filter on member name.
    if (mbrName)
    {
      // mbrName as generic name.

      rows = rows.filter((item: any) =>
      {
        const item_mbrName = item.MBRNAME.trimRight();
        if (mbrName.endsWith('*'))
        {
          return string_matchGeneric(item_mbrName, mbrName);
        }
        else
        {
          return (string_rtrim(item.MBRNAME).indexOf(mbrName) >= 0);
        }
      });
    }
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

  return rows;
}
