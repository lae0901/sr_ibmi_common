import { system_downloadsFolder, object_toQueryString, string_rtrim, 
        string_matchGeneric, file_writeNew, string_assignSubstr } from 'sr_core_ts';
import axios from 'axios';
import { as400_compile, as400_addpfm, as400_rmvm, as400_srcmbrLines } from '../ibmi-common';
import { iTesterResults, testerResults_append, testerResults_consoleLog, testerResults_new } from '../tester-core';
import { testResults_append,testResults_consoleLog,testResults_new,iTestResultItem } from 'sr_test_framework';
import { ibmi_ifs_getItems, ibmi_ifs_getFileContents, iIfsItem } from '../ibmi-ifs';
import path = require('path');
import * as fs from 'fs' ;

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

  // test_ifs_getItems
  {
    const {results:res} = await test_ifs_getItems() ;
    results.push(...res);
  }

  // ifs_ibmi_getItems_err
  {
    const { results: res } = await ifs_ibmi_getItems_err();
    results.push(...res);
  }

  // ifs_ibmi_getFileContents
  {
    const { results: res } = await ifs_ibmi_getFileContents();
    results.push(...res);
  }

  // ifs_ibmi_getFileContents_notFound
  {
    const { results: res } = await ifs_ibmi_getFileContents_notFound();
    results.push(...res);
  }

  return { results }
}

// ---------------------------------- test_ifs_getItems ----------------------------------
// add and remove member from file.
async function test_ifs_getItems(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();
  let method = '';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';
  let ifsItems : iIfsItem[] = [] ;

  // ibmi_ifs_getItems
  {
    method = 'ibmi_ifs_getItems'; 
    let passText = '';
    let errmsg = '';
    const dirPath = '/home/srichter';
    const { rows, errmsg:errText} = await ibmi_ifs_getItems(
      dirPath, {});
    ifsItems = rows ;
    if (errText)
      errmsg = `get items from folder ${dirPath} error ${errText}`;
    else if (ifsItems.length > 0)
    {
      passText = `read ifs items from folder ${dirPath}.`;
    }
    else
      errmsg = `no items returned from folder ${dirPath}`;

    testResults_append(results, passText, errmsg, method);
  }

  // test that a specific item was returned in the list of ifs items.
  {
    for( const item of ifsItems)
    {
      const mtime = item.mtime;
      const itemName = item.itemName;
    }
  }

  return { results }
}

// ---------------------------------- ifs_ibmi_getItems_err ----------------------------------
// add and remove member from file.
async function ifs_ibmi_getItems_err(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();
  let method = '';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  // ibmi_ifs_getItems
  {
    method = 'ibmi_ifs_getItems';
    let passText = '';
    let errmsg = '';
    const dirPath = '/home/srichter/.config';
    const { rows, errmsg: errText } = await ibmi_ifs_getItems(
      dirPath, { joblog:'N'});
    if (errText)
      errmsg = `get items from folder ${dirPath} error ${errText}`;
    else if (rows.length > 0)
    {
      passText = `read ifs items from folder ${dirPath}.`;
    }
    else
      errmsg = `error reading items from folder ${dirPath}`;

    testResults_append(results, passText, errmsg, method);
  }

  return { results }
}

// ------------------------------ ifs_ibmi_getFileContents --------------------
// add and remove member from file.
async function ifs_ibmi_getFileContents(): Promise<{results: iTestResultItem[] }>
{
  const results = testResults_new();
  let method = '';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  // ibmi_ifs_getFileContents
  {
    method = 'ibmi_ifs_getFileContents';
    let passText = '';
    let errmsg = '';
    const filePath = '/home/srichter/abc.pdf';
    const itemName = '';
    const itemType = '';
    const {buf, errmsg:errText } = await ibmi_ifs_getFileContents( filePath );
    if ( errText )
      errmsg = `file ${filePath} read error ${errText}`;
    else if (buf.length > 0)
    {
      passText = `read file contents from ifs file ${filePath}.`;

      const toPath = system_downloadsFolder() ;
      const fileName = path.parse(filePath).base;
      const toFilePath = path.join(toPath, fileName) ;
    }
    else
    {
      errmsg = `error reading file contents from folder ${filePath}`;
    }

    testResults_append(results, passText, errmsg, method);
  }

  return { results }
}

// ------------------------------ ifs_ibmi_getFileContents_notFound --------------------
// add and remove member from file.
async function ifs_ibmi_getFileContents_notFound(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();
  let method = '';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  // ibmi_ifs_getFileContents
  {
    method = 'ibmi_ifs_getFileContents';
    let passText = '';
    let errmsg = '';
    const filePath = '/home/srichter/abc xyz.pdf';  // file is not found.
    const itemName = '';
    const itemType = '';
    const { buf, errmsg: errText } = await ibmi_ifs_getFileContents(filePath);
    if (errText)
    {
      passText = `correctly detected file not found. file ${filePath}.`;
    }
    else
    {
      errmsg = `did not detect file not found error. File ${filePath}`;
    }

    testResults_append(results, passText, errmsg, method);
  }

  return { results }
}
