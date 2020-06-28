import { object_toQueryString, string_rtrim, string_matchGeneric } from 'sr_core_ts';
import axios from 'axios';
import { as400_compile, as400_addpfm, as400_rmvm, as400_srcmbrLines } from '../ibmi-common';
import { iTesterResults, testerResults_append, testerResults_consoleLog, testerResults_new } from '../tester-core';
import { testResults_append,testResults_consoleLog,testResults_new,iTestResultItem } from 'sr_test_framework';

// run main function that is declared as async. 
async_main();

// ------------------------------- async_main ---------------------------------
async function async_main()
{
  await as400_compile_test();

  // addpfm, rmvm
  {
    const results = await as400_member_test();
    testerResults_consoleLog( results ) ;
  }

  // srcmbr tests
  {
    const results = await as400_srcmbr_test() ;
    testResults_consoleLog(results) ;
  }

  return;
}

// ------------------------------ as400_compile_test ------------------------------
async function as400_compile_test()
{
  const options = {serverUrl:'http://192.168.1.170:10080', curlib:'couri7', 
                    libl:'couri7 qgpl'};
  const srcfName = 'QRPGLESRC' ;
  const srcfLib = 'COURI7' ;
  const srcmbr = 'UTL7140R' ;
  const rv = await as400_compile(srcfName, srcfLib, srcmbr, options ) ;

  console.log(rv.compMsg);
  for (let ix = 0; ix < rv.compile.length && ix < 25; ++ix)
  {
    const line = rv.compile[ix];
    console.log(line.LINE);
  }
}

// ---------------------------------- as400_member_test ----------------------------------
// add and remove member from file.
async function as400_member_test(): Promise<iTesterResults>
{
  const errmsg_arr: string[] = [];
  const completion_arr: string[] = [];
  let method = '';
  let fileName = 'QRPGLESRC' ;
  let libName = 'COURI7' ;
  let mbrName = 'STEVETEST' ;
  let textDesc = 'test member' ;
  let srcType = 'TXT' ;
  const libl = 'COURI7 APLUSB1FCC QTEMP' ;
  const serverUrl = 'http://192.168.1.170:10080' ;

  const options = { libl, serverUrl } ;

  // addpfm 
  {
    method = 'system_addpfm';
    const { errmsg } = await as400_addpfm( fileName, libName, mbrName, textDesc, srcType, options );
    if ( errmsg )
    {
      errmsg_arr.push(`${method} test failed. ${errmsg}`);
    }
    else
      completion_arr.push(`${method}. passed.`)
  }

  // rmvm
  {
    method = 'system_rmvm';
    const { errmsg } = await as400_rmvm(fileName, libName, mbrName, options);
    if (errmsg)
    {
      errmsg_arr.push(`${method} test failed. ${errmsg}`);
    }
    else
      completion_arr.push(`${method}. passed.`)
  }

  // // rmvm
  // {
  //   method = 'system_rmvm';
  //   const { errmsg } = await as400_rmvm(fileName, libName, mbrName, options);
  //   if (errmsg)
  //   {
  //     testResults_append(results, '', `remove member failed. ${errmsg}`, method);
  //   }
  //   else
  //     testResults_append(results, `remove member ${errmsg}`, '', method);
  // }


  return { completion_arr, errmsg_arr }
}

// ---------------------------------- as400_srcmbr_test ----------------------------------
// add and remove member from file.
async function as400_srcmbr_test(): Promise<iTestResultItem[]>
{
  const results = testResults_new( ) ;

  let method = '';
  let fileName = 'QRPGLESRC';
  let libName = 'COURI7';
  let mbrName = 'ACOM0011R';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://192.168.1.170:10080';

  const options = { libl, serverUrl };

  // as400_srcmbrLines 
  {
    method = 'as400_srcmbrLines';
    const lines = await as400_srcmbrLines( libName, fileName, mbrName);
    if ( typeof lines == 'string')
    {
      testResults_append(results, '', `error reading srcmbr lines from ${mbrName}`, method);
    }
    else
    {
      testResults_append(results, `read srcmbr lines from ${mbrName}`, '', method);
    }
  }

  return results ;
}
