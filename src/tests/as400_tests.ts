import { object_toQueryString, string_rtrim, string_matchGeneric } from 'sr_core_ts';
import axios from 'axios';
import { as400_compile, as400_addpfm, as400_rmvm, as400_srcmbrLines } from '../ibmi-common';
import { iTesterResults, testerResults_append, testerResults_consoleLog, testerResults_new } from '../tester-core';
import { testResults_append,testResults_consoleLog,testResults_new,iTestResultItem } from 'sr_test_framework';
import { ibmi_ifs_getItems } from '../ibmi-ifs';

// run main function that is declared as async. 
async_main();

// ------------------------------- async_main ---------------------------------
async function async_main()
{
  const results = testResults_new();
  await as400_compile_test();

  // addpfm, rmvm
  {
    const {results:res} = await as400_member_test();
    results.push(...res);
  }

  // srcmbr tests
  {
    const {results:res} = await as400_srcmbr_test() ;
    results.push(...res);
  }

  // IFS tests
  {
    const {results:res} = await ifs_ibmi_test();
    results.push(...res);
  }

  testResults_consoleLog(results);

  return;
}

// ------------------------------ as400_compile_test ------------------------------
async function as400_compile_test()
{
  const options = {serverUrl:'http://173.54.20.170:10080', curlib:'couri7', 
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
async function as400_member_test(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();
  let method = '';
  let fileName = 'QRPGLESRC' ;
  let libName = 'COURI7' ;
  let mbrName = 'STEVETEST' ;
  let textDesc = 'test member' ;
  let srcType = 'TXT' ;
  const libl = 'COURI7 APLUSB1FCC QTEMP' ;
  const serverUrl = 'http://173.54.20.170:10080' ;

  const options = { libl, serverUrl } ;

  // addpfm 
  {
    method = 'system_addpfm';
    let passText = '';
    const { errmsg } = await as400_addpfm( fileName, libName, mbrName, textDesc, srcType, options );
    if ( !errmsg )
    {
      passText = 'addpfm successful.';
    }
    testResults_append(results, passText, errmsg, method);
  }

  // rmvm
  {
    let passText = '';
    method = 'system_rmvm';
    const { errmsg } = await as400_rmvm(fileName, libName, mbrName, options);
    if (!errmsg)
    {
      passText = `rmvpfm from file ${fileName} member {mbrName}.`;
    }
    testResults_append(results, passText, errmsg, method);
  }

  return { results }
}

// ---------------------------------- as400_srcmbr_test ----------------------------------
// add and remove member from file.
async function as400_srcmbr_test(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();

  let method = '';
  let fileName = 'QRPGLESRC';
  let libName = 'COURI7';
  let mbrName = 'ACOM0011R';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  const options = { libl, serverUrl };

  // as400_srcmbrLines 
  {
    let passText = '';
    let errmsg = '' ;
    method = 'as400_srcmbrLines';
    const lines = await as400_srcmbrLines( libName, fileName, mbrName);
    if ( typeof lines == 'string')
    {
      errmsg = `error reading srcmbr lines from ${mbrName}`;
    }
    else
    {
      passText = `read srcmbr lines from ${mbrName}`;
    }
    testResults_append(results, passText, errmsg, method);
  }

  return {results} ;
}

// ---------------------------------- ifs_ibmi_test ----------------------------------
// add and remove member from file.
async function ifs_ibmi_test(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();
  let method = '';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  // ibmi_ifs_getItems
  {
    method = 'ibmi_ifs_getItems';
    let passText = '';
    let errmsg = '' ;
    const dirPath = '/home/srichter' ;
    const itemName = '' ;
    const itemType = '' ;
    const items = await ibmi_ifs_getItems(dirPath, itemName, itemType);
    if (items.length > 0)
    {
      passText = `read ifs items from folder ${dirPath}.`;
    }
    else
      errmsg = `error reading items from folder ${dirPath}`;

    testResults_append(results, passText, errmsg, method);
  }

  return { results }
}
