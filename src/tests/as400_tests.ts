import { system_downloadsFolder, object_toQueryString, string_rtrim, 
        string_matchGeneric, file_writeNew, string_assignSubstr, string_replaceAll } from 'sr_core_ts';
import axios from 'axios';
import { as400_compile, as400_addpfm, as400_rmvm, as400_srcmbrLines, as400_srcmbrList, as400_chgpfm, iServerOptions, as400_dspffd } from '../ibmi-common';
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

  // dspffd tests
  {
    const { results: res } = await as400_dspffd_test();
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

  const options :iServerOptions = { libl, serverUrl, joblog:'N' } ;

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
  let fileName = 'STEVESRC';
  let libName = 'COURI7';
  let mbrName = 'BATLABR';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  const options : iServerOptions = { libl, serverUrl };

  // as400_srcmbrLines 
  {
    method = 'as400_srcmbrLines';
    const desc = `read srcmbr lines from ${mbrName}`;
    const expected = 235;
    const lines = await as400_srcmbrLines( libName, fileName, mbrName);
    const testResult = typeof lines == 'string' ? lines : lines.length ;

    testResults_append(results, { desc, method, expected, testResult });
  }

  // as400_srcmbrList  
  {
    let fileName = 'steveSRC' ;
    let mbrName = 'bom*' ;
    const mbrList = await as400_srcmbrList(libName, fileName, mbrName);
    method = 'as400_srcmbrList';

    {
      const desc = `read generic list of members ${mbrName} source file ${fileName}`;
      let aspect = 'generic member list' ;
      const expected = 4 ;
      const testResult = mbrList.length ;
      testResults_append(results, {method, aspect, desc, expected, testResult }) ;
    }

    {
      const desc = `calc member list item mtime`;
      let aspect = 'calc mtime';
      const member_item = mbrList[0] ;
      const expected = 1601921828;
      const testResult = member_item.mtime;
      testResults_append(results, { method, aspect, desc, expected, testResult });
    }

    {
      const desc = `member list mtime back to CHGDATE`;
      let aspect = 'mtime to CHGDATE';
      const member_item = mbrList[0];
      const {mtime} = member_item;
      const chgdate = new Date(mtime * 1000) ;
      const chgdate_str = chgdate.toString( ) ;
      const expected = member_item.CHGTIME;
      const testResult = string_replaceAll(chgdate_str.substr(16,8),':','.') ;
      testResults_append(results, { method, aspect, desc, expected, testResult });
    }    
  }

  // get srctype and text desc of srcmbr.
  let orig_srcType = '' ;
  let orig_mbrText = '' ;
  {
    const mbrList = await as400_srcmbrList(libName, fileName, mbrName);
    orig_srcType = mbrList[0].SRCTYPE;
    orig_mbrText = mbrList[0].MBRTEXT;
  }

  // change source type and member text desc
  const chg_mbrText = 'update text desc';
  const chg_srcType = 'CLLE';
  {
    method = 'as400_chgpfm';
    const desc = `change srctype and text description of ${mbrName}`;
    const expected = 'successful';
    const {errmsg} = await as400_chgpfm(fileName, libName, mbrName, chg_mbrText, chg_srcType, options);
    const testResult = errmsg ? errmsg : 'successful';
    testResults_append(results, { desc, method, expected, testResult });
  }

  // get srctype and text desc of srcmbr after change.
  let cur_srcType = '';
  let cur_mbrText = '';
  {
    const mbrList = await as400_srcmbrList(libName, fileName, mbrName);
    cur_srcType = mbrList[0].SRCTYPE;
    cur_mbrText = mbrList[0].MBRTEXT;
  }

  // check that srctype and mbrText changed correctly.
  {
    method = 'as400_chgpfm';
    const aspect = 'check srctype' ;
    const expected = chg_srcType + chg_mbrText;
    const testResult = cur_srcType + cur_mbrText ;
    testResults_append(results, { aspect, method, expected, testResult });
  }

  // change source type and member text desc back to original values.
  {
    method = 'as400_chgpfm';
    const aspect = 'restore srctype' ;
    const desc = 'change srctype and mbrText back to original values' ;
    const expected = orig_srcType + orig_mbrText;
    const { errmsg } = await as400_chgpfm(fileName, libName, mbrName, orig_mbrText, orig_srcType, options);
    const testResult = errmsg ? errmsg : orig_srcType + orig_mbrText;
    testResults_append(results, { desc, method, expected, testResult });
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
      dirPath, serverUrl, {});
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
      dirPath, serverUrl, { joblog:'N'});
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
    const {buf, errmsg:errText } = await ibmi_ifs_getFileContents( filePath, serverUrl );
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
    const { buf, errmsg: errText } = await ibmi_ifs_getFileContents(filePath, serverUrl);
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

// ---------------------------------- as400_dspffd_test ----------------------------------
// add and remove member from file.
async function as400_dspffd_test(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();

  let method = '';
  let fileName = 'ITMST';
  let libName = 'APLUSB1FCC';
  const libl = 'COURI7 APLUSB1FCC QTEMP';
  const serverUrl = 'http://173.54.20.170:10080';

  const options: iServerOptions = { libl, serverUrl };

  // as400_dspffd 
  {
    method = 'as400_dspffd';
    const desc = `read fields from ${fileName}`;
    const expected = 94;
    const flds = await as400_dspffd(libName, fileName, options);
    const actual = flds.length ;

    testResults_append(results, { desc, method, expected, actual });
  }

  return { results };
}
