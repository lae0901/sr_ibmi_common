import { system_downloadsFolder, object_toQueryString, string_rtrim, 
        string_matchGeneric, file_writeNew, string_assignSubstr, string_replaceAll, dir_mkdir, dir_ensureExists, file_writeText, dir_rmdir } from 'sr_core_ts';
import axios from 'axios';
import { as400_compile, as400_addpfm, as400_rmvm, as400_srcmbrLines, as400_srcmbrList, 
        as400_chgpfm, iServerOptions, as400_dspffd, 
        iConnectSettings, iSrcmbrLine, as400_uploadLinesToSrcmbr, iIfsMirrorJson, ibmi_documentRoot } from '../ibmi-common';
import { testResults_append,testResults_consoleLog,testResults_new,iTestResultItem } from 'sr_test_framework';
import { ibmi_ifs_getItems, ibmi_ifs_getFileContents, iIfsItem, ibmi_ifs_unlink, ibmi_ifs_checkDir, ibmi_ifs_ensureDir, ibmi_ifs_deleteDir, ibmi_ifs_uploadFile, ibmi_ifs_uploadTextToFile } from '../ibmi-ifs';
import path = require('path');
import * as fs from 'fs' ;
import * as os from 'os' ;
import { iQualSrcmbr } from '../ibmi-interfaces';
import { mirrorSettings_readJson } from '../mirror-common';

// run main function that is declared as async. 
async_main();

// ------------------------------- async_main ---------------------------------
async function async_main()
{
  const results = testResults_new();

  {
    const res = await as400_compile_test();
    results.push(...res) ;
  }

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

  // common web services tests
  {
    const res = await commonWebServices_test();
    results.push(...res);
  }

  // mirror json tests
  {
    const res = await mirrorJson_test();
    results.push(...res);
  }

  testResults_consoleLog(results);
  return;
}

// --------------------------- test_connectSettings_new ---------------------------
function test_connectSettings_new( )
{
  const connectSettings: iConnectSettings = {
    serverUrl: 'http://173.54.20.170:10080', connectName:'office',
    ibmi_autocoder_product_lib: 'autocoder', autocoder_ifs_product_folder: 'srichter/autocoder',
    ibmi_connect_curlib: 'glide', ibmi_connect_libl: 'glide'
  };
  return connectSettings;
}

// ------------------------------ as400_compile_test ------------------------------
/**
 * test compile of object on ibm i
 */
async function as400_compile_test()
{
  const results = testResults_new();
  const connectSettings = test_connectSettings_new() ;
  const srcfName = 'QRPGLESRC' ;
  const srcfLib = 'GLIDE' ;
  const srcmbr = 'GLID0033GR' ;

  {
    const method = 'as400_compile' ;
    const rv = await as400_compile(srcfName, srcfLib, srcmbr, connectSettings ) ;
    const actual = rv.compMsg ;
    const expected = `RPGLE pgm created ${srcmbr}`;

    console.log(rv.compMsg);
    for (let ix = 0; ix < rv.compile.length && ix < 25; ++ix)
    {
      const line = rv.compile[ix];
      console.log(line.LINE);
    }
    testResults_append(results, {method, actual, expected });
  }

  return results ;
}

// ---------------------------------- as400_member_test ----------------------------------
// add and remove member from file.
async function as400_member_test(): Promise<{ results: iTestResultItem[] }>
{
  const connectSettings = test_connectSettings_new();
  const results = testResults_new();
  let method = '';
  let fileName = 'QRPGLESRC' ;
  let libName = 'glide' ;
  let mbrName = 'STEVETEST' ;
  let textDesc = 'test member' ;
  let srcType = 'TXT' ;

  // addpfm 
  {
    method = 'as400_addpfm';
    let passText = '';
    const { errmsg } = await as400_addpfm( fileName, libName, mbrName, textDesc, srcType, connectSettings );
    if ( !errmsg )
    {
      passText = 'addpfm successful.';
    }
    testResults_append(results, passText, errmsg, method);
  }

  // rmvm
  {
    let passText = '';
    method = 'as400_rmvm';
    const { errmsg } = await as400_rmvm(fileName, libName, mbrName, connectSettings);
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
async function as400_srcmbr_test()
{
  const results = testResults_new();
  const connectSettings = test_connectSettings_new();

  let method = '';
  let srcfName = 'STEVESRC';
  let srcfLib = 'glide';
  let mbrName = 'BATLABR';
  let batlabr_lines: iSrcmbrLine[] = [] ;

  // as400_srcmbrLines 
  {
    method = 'as400_srcmbrLines';
    const desc = `read srcmbr lines from ${mbrName}`;
    const expected = 235;
    const lines = await as400_srcmbrLines( srcfLib, srcfName, mbrName, connectSettings);
    const testResult = typeof lines == 'string' ? lines : lines.length ;
    batlabr_lines = lines ;

    testResults_append(results, { desc, method, expected, testResult });
  }

  // as400_uploadLinesToSrcmbr
  {
    method = 'as400_uploadLinesToSrcmbr' ;
    const uploadFileName = 'batlabr' ;
    const toMbrName = 'TOBATLABR' ;
    const qualSrcmbr : iQualSrcmbr = {srcfName, srcfLib, mbrName: toMbrName } ;
    const srcType = 'RPGLE' ;
    const textDesc = 'print labels' ;
    const expected = `file ${uploadFileName} received and moved to mbrName ${toMbrName} fileType:`;
    const full_actual = await as400_uploadLinesToSrcmbr( 
          connectSettings, batlabr_lines, uploadFileName, qualSrcmbr, 
          srcType, textDesc );
    const actual = full_actual.substr(0, expected.length) ;
    testResults_append(results, { method, expected, actual });
  }

  // as400_srcmbrList  
  {
    let srcfName = 'steveSRC' ;
    let mbrName = 'bom*' ;
    const mbrList = await as400_srcmbrList(srcfLib, srcfName, mbrName, connectSettings);
    method = 'as400_srcmbrList';

    {
      const desc = `read generic list of members ${mbrName} source file ${srcfName}`;
      let aspect = 'generic member list' ;
      const expected = 4 ;
      const testResult = mbrList.length ;
      testResults_append(results, {method, aspect, desc, expected, testResult }) ;
    }

    {
      const desc = `calc member list item mtime`;
      let aspect = 'calc mtime';
      const member_item = mbrList[0] ;
      const expected = 1608315956;
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
    const mbrList = await as400_srcmbrList(srcfLib, srcfName, mbrName, connectSettings);
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
    const {errmsg} = await as400_chgpfm(srcfName, srcfLib, mbrName, chg_mbrText, chg_srcType,
                  connectSettings);
    const testResult = errmsg ? errmsg : 'successful';
    testResults_append(results, { desc, method, expected, testResult });
  }

  // get srctype and text desc of srcmbr after change.
  let cur_srcType = '';
  let cur_mbrText = '';
  {
    const mbrList = await as400_srcmbrList(srcfLib, srcfName, mbrName, connectSettings);
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
    const { errmsg } = await as400_chgpfm(srcfName, srcfLib, mbrName, orig_mbrText, orig_srcType, 
                            connectSettings );
    const testResult = errmsg ? errmsg : orig_srcType + orig_mbrText;
    testResults_append(results, { desc, method, expected, testResult });
  }

  return {results} ;
}

// -------------------------------- commonWebServices_test --------------------------------
async function commonWebServices_test()
{
  const results = testResults_new();
  const connectSettings = test_connectSettings_new();
  const dirPath = '.\\src\\tests';

  {
    const method = 'ibmi_documentRoot';
    const rv = await ibmi_documentRoot( connectSettings );
    const actual = rv.documentRoot;
    const expected = `/www/zendphp7/htdocs`;
    testResults_append(results, { method, actual, expected });
  }

  return results;
}

// ---------------------------------- ifs_ibmi_test ----------------------------------
// add and remove member from file.
async function ifs_ibmi_test() 
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

  // test_ifs_getFileContents
  {
    const { results: res } = await test_ifs_getFileContents();
    results.push(...res);
  }

  // ifs_ibmi_getFileContents_notFound
  {
    const { results: res } = await ifs_ibmi_getFileContents_notFound();
    results.push(...res);
  }

  // ibmi_ifs_unlink
  {
    const res = await test_ifs_unlink( ) ;
    results.push(...res);
  }

  // test ifs directory functions.
  {
    const res = await test_ifs_dir();
    results.push(...res);
  }

  // test_ifs_upload
  {
    const { results: res } = await test_ifs_upload();
    results.push(...res);
  }

  // test_ifs_uploadText
  {
    const { results: res } = await test_ifs_uploadText();
    results.push(...res);
  }

  return { results }
}

// ---------------------------------- test_ifs_getItems ----------------------------------
// add and remove member from file.
async function test_ifs_getItems() 
{
  const results = testResults_new();
  let method = '';
  const connectSettings = test_connectSettings_new();
  let ifsItems : iIfsItem[] = [] ;

  // ibmi_ifs_getItems
  {
    method = 'ibmi_ifs_getItems'; 
    let passText = '';
    let errmsg = '';
    const dirPath = '/home/srichter';
    const { rows, errmsg:errText} = await ibmi_ifs_getItems(
      dirPath, connectSettings, {});
    ifsItems = rows ;
    const actual = { numRows:rows.length, errText } ;
    const expected = { numRows: 67, errText:''} ;
    const desc = `get items from folder ${dirPath}`;
    testResults_append(results, { method, desc, expected, actual });
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
  const connectSettings = test_connectSettings_new();

  // ibmi_ifs_getItems
  {
    method = 'ibmi_ifs_getItems';
    let passText = '';
    let errmsg = '';
    const dirPath = '/home/srichter/.config';
    const { rows, errmsg: errText } = await ibmi_ifs_getItems(
      dirPath, connectSettings, { joblog:'N'});
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

// ------------------------------ test_ifs_getFileContents --------------------
// add and remove member from file.
async function test_ifs_getFileContents()  
{
  const results = testResults_new();
  let method = '';
  const connectSettings = test_connectSettings_new();

  // ibmi_ifs_getFileContents
  {
    method = 'ibmi_ifs_getFileContents';
    let errmsg = '';
    const expected = {bufLgth:252};
    const filePath = '/home/srichter/abc.pdf';
    const {buf, errmsg:errText } = await ibmi_ifs_getFileContents( filePath, connectSettings );
    const actual = {bufLgth: buf ? buf.length : undefined } ;
    const desc = `read contents of ${filePath}`;
    if ( errText )
      errmsg = `file ${filePath} read error ${errText}`;

    testResults_append(results, { method, errmsg, actual, expected, desc } );
  }

  return { results }
}

// ------------------------------ ifs_ibmi_getFileContents_notFound --------------------
// add and remove member from file.
async function ifs_ibmi_getFileContents_notFound()  
{
  const results = testResults_new();
  let method = '';
  const connectSettings = test_connectSettings_new();

  // ibmi_ifs_getFileContents
  {
    method = 'ibmi_ifs_getFileContents';
    const aspect = 'file not found' ;
    const filePath = '/home/srichter/abc xyz.pdf';  // file is not found.
    const expected = `correctly detected file not found. file ${filePath}.`;
    const { buf, errmsg } = await ibmi_ifs_getFileContents(filePath, connectSettings );
    const actual = errmsg 
                    ? `correctly detected file not found. file ${filePath}.`
                    : `did not detect file not found error. File ${filePath}` ;

    testResults_append(results, { method, aspect, actual, expected }) ;
  }

  return { results }
}

// -------------------------------- mirrorJson_test --------------------------------
async function mirrorJson_test()
{
  const results = testResults_new();
  const dirPath = '.\\src\\tests' ;

  {
    const method = 'mirrorSettings_readJson';
    const mirror_json =  await mirrorSettings_readJson(dirPath, 'ifs' ) as iIfsMirrorJson ;
    const actual = mirror_json.connectName ;
    const expected = `office`;
    testResults_append(results, { method, actual, expected });
  }

  return results;
}

// ------------------------------ test_ifs_dir --------------------
// add and remove member from file.
async function test_ifs_dir() 
{
  const results = testResults_new();
  let method = '';
  const connectSettings = test_connectSettings_new();

  // make sure directory exists.       
  {
    method = 'ibmi_ifs_ensureDir';
    const ifsDirPath = '/home/srichter/folder2/steve';
    const actual = await ibmi_ifs_ensureDir(ifsDirPath, connectSettings );
    const expected = '';
    testResults_append(results, { method, actual, expected });
  }

  // check that directory exists.       
  {
    method = 'ibmi_ifs_checkDir';
    const ifsDirPath = '/home/srichter/folder2/steve';
    const actual = await ibmi_ifs_checkDir(ifsDirPath, connectSettings);
    const expected = 'exists\n';
    testResults_append(results, { method, actual, expected });
  }

  // delete directory.       
  {
    method = 'ibmi_ifs_deleteDir';
    const ifsDirPath = '/home/srichter/folder2/steve';
    const actual = await ibmi_ifs_deleteDir(ifsDirPath, connectSettings );
    const expected = '';
    testResults_append(results, { method, actual, expected });
  }

  return results;
}

// ------------------------------ test_ifs_unlink --------------------
// add and remove member from file.
async function test_ifs_unlink() 
{
  let tempFilePath = '';
  let tempTestDir = '';
  const ifsFilePath = '/home/srichter/steve26.txt';
  const textData = `added 1 package from 1 contributor and audited 16 packages in 0.778s`;
  const results = testResults_new();
  let method = '';
  const connectSettings = test_connectSettings_new();

  // create a temporary file. write 
  {
    tempTestDir = path.join(os.tmpdir(), 'sr_ibmi_common');
    const { created, errmsg } = await dir_ensureExists(tempTestDir);

    tempFilePath = path.join(tempTestDir, 'steve25.txt');
    await file_writeNew(tempFilePath, textData);
  }

  // upload temporary text file to IFS.
  {
    await ibmi_ifs_uploadFile(tempFilePath, ifsFilePath, connectSettings);
  }

  // ibmi_ifs_unlink
  {
    method = 'ibmi_ifs_unlink';
    const actual = await ibmi_ifs_unlink(ifsFilePath, connectSettings);
    const expected = `file ${ifsFilePath} deleted\n` ;
    testResults_append(results, {method, actual, expected });
  }

  // delete the temporary dir and its contents.
  {
    // await dir_rmdir(tempTestDir, { recursive: true });
    await xir_rmdir(tempTestDir, { recursive: true });
  }

  return results;
}


// bgnTemp
// ----------------------------------- xir_rmdir ------------------------------
// remove directory. use recursive option to also remove contents.
export function xir_rmdir(dirPath: string, options?: { recursive?: boolean }): Promise<{ errmsg: string }>
{
  options = options || {};
  const recursive = options.recursive || false;
  const promise = new Promise<{ errmsg: string }>(async (resolve, reject) =>
  {
    let errmsg = '';

    try
    {
      const opt : fs.RmDirOptions = { recursive } ;
      fs.rmdir(dirPath, opt, (err) =>
      {
        if (err)
        {
          errmsg = err.message;
        }
        resolve({ errmsg });
      });
    }
    catch( err )
    {
      errmsg = err.message ;
      resolve({ errmsg });
    }
  });
  return promise;
}
// endTemp



// ------------------------------ test_ifs_upload --------------------
// upload file from PC to IFS.
async function test_ifs_upload()  
{
  const results = testResults_new();
  const connectSettings = test_connectSettings_new();
  let tempFilePath = '' ;
  let tempTestDir = '' ;
  const textData = `added 1 package from 1 contributor and audited 16 packages in 0.778s`;

  // create a temporary file. write 
  {
    tempTestDir = path.join(os.tmpdir(), 'sr_ibmi_common');
    const { created, errmsg } = await dir_ensureExists(tempTestDir);

    tempFilePath = path.join( tempTestDir, 'steve25.txt') ;
    await file_writeNew( tempFilePath, textData ) ;
  }

  // ibmi_ifs_uploadFile
  {
    const method = 'ibmi_ifs_uploadFile';
    let passText = '';
    let errmsg = '';
    const ifsFilePath = '/home/srichter/steve25.txt';
    const { mtime, size } = await ibmi_ifs_uploadFile( tempFilePath, ifsFilePath, connectSettings);
    const actual = size ;
    const expected = textData.length ;

    testResults_append(results, { method, actual, expected });
  }

  // delete the temporary dir and its contents.
  {
    await dir_rmdir( tempTestDir, {recursive:true}) ;
  }

  return { results }
}

// ------------------------------ test_ifs_uploadText --------------------
// upload file from PC to IFS.
async function test_ifs_uploadText()  
{
  const results = testResults_new();
  const connectSettings = test_connectSettings_new();
  let tempFilePath = '';
  let tempTestDir = '';

  const { documentRoot } = await ibmi_documentRoot( connectSettings ) ;

  // path to dummy-data.txt file in autocoder product folder within htdocs of zend server.
  const productFolder = path.join( documentRoot, connectSettings.autocoder_ifs_product_folder ) ;
  const testFolder = path.join( productFolder, 'php/test');
  const testFile = path.join( testFolder, 'dummy-data.txt');
  let textData = '' ;

  // read contents of dummy text file.
  {
    const { buf, errmsg } = await ibmi_ifs_getFileContents( testFile, connectSettings, {getMethod:'IFS'});
    textData = buf.toString( ) ;
  }

  // ibmi_ifs_uploadTextToFile
  {
    const method = 'ibmi_ifs_uploadTextToFile';
    textData += 'htdocs of zend server \n';
    const { mtime, size, errmsg } = await ibmi_ifs_uploadTextToFile( 
                    textData, testFile, connectSettings);
    const actual = size;
    const expected = textData.length;

    testResults_append(results, { method, actual, expected });
  }

  return { results }
}

// ---------------------------------- as400_dspffd_test ----------------------------------
// add and remove member from file.
async function as400_dspffd_test(): Promise<{ results: iTestResultItem[] }>
{
  const results = testResults_new();
  const connectSettings = test_connectSettings_new();

  let method = '';
  let fileName = 'ITMST';
  let libName = 'APLUSB1FCC';

  // as400_dspffd 
  {
    method = 'as400_dspffd';
    const desc = `read fields from ${fileName}`;
    const expected = 94;
    const flds = await as400_dspffd(libName, fileName, connectSettings);
    const actual = flds ? flds.length : 0 ;

    testResults_append(results, { desc, method, expected, actual });
  }

  return { results };
}
