# sr_ibmi_common - functions used to access ibm i from vscode.

## source file functions
* as400_srcfList(objName: string, libName: string) : Promise<{}[]>

## publish instructions
* increment version number in package.json
* npm run build
* git add, commit, push to repo
* npm publish
* npm update in projects which use this package

## testing 
* press F5 to run task "launch hello.ts"
* this task runs npm build. then calls src/tester.ts
* see the outfiles property to see that lib/tester.js is actually run
