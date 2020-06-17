# sr_ibmi_common - functions used to access ibm i from vscode.

## source file functions
* as400_srcfList(objName: string, libName: string) : Promise<{}[]>
* as400_compile( srcfName:string, srcfLib:string, srcmbr:string, iOptions) :
      Promise<{compMsg:string, compile:iCompileLine[], joblog:string[]}>

## interfaces
```
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

interface iCompileLine
{
  SKIPBFR: string,
  SPACEB: string,
  LINE: string
}
```      

## publish instructions
* increment version number in package.json
* npm run build
* git add, commit, push to repo
* npm publish
* npm update in projects which use this package

## testing 
* npm run test
