// media/ibmi_common.ts

import { object_toQueryString, string_rtrim } from 'sr_core_ts';
import axios from 'axios';

// --------------------- as400_srcfList -----------------------
export function as400_srcfList(objName: string, libName: string) : Promise<{}[]>
{
  const promise = new Promise<{}[]> (async (resolve, reject) =>
  {
    const libl = 'couri7 aplusb1fcc qtemp';
    const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
    const params =
    {
      libl, proc: 'utl8020_srcfList',
      parm1: objName, parm2: libName, debug: 'N'
    };
    // const query = object_toQueryString(params);
    // const url_query = url + '?' + query;

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
  : Promise<[{ SEQNBR: string, CHGDATE: string, TEXT: string }]>
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

  return rows;
}

// --------------------- as400_srcmbrList -----------------------
// return array of srcmbrs of a srcfile.
export async function as400_srcmbrList(libName: string, fileName: string, mbrName: string = ''): Promise<[{}]>
{
  const libl = 'couri7 aplusb1fcc qtemp';
  const url = 'http://173.54.20.170:10080/coder/common/json_getManyRows.php';
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
    rows = rows.filter((item: any) =>
    {
      return (string_rtrim(item.MBRNAME).indexOf(mbrName) >= 0);
    });
  }

  return rows;
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
