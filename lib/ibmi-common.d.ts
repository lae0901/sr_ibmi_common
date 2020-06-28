export interface iDspfd_mbrlist {
    FILENAME: string;
    LIBNAME: string;
    MBRNAME: string;
    NUMRCDS: number;
    CRTDATE: string;
    CHGDATE: string;
    CHGTIME: string;
    MBRTEXT: string;
    SRCTYPE: string;
}
interface iOptions {
    serverUrl?: string;
    numRows?: number;
    libl?: string;
    curlib?: string;
}
export interface iCompileLine {
    SKIPBFR: string;
    SPACEB: string;
    LINE: string;
}
export interface iSrcmbrLine {
    SEQNBR: string;
    CHGDATE: string;
    TEXT: string;
}
export declare function as400_addpfm(fileName: string, libName: string, mbrName: string, textDesc: string, srcType: string, options: iOptions): Promise<{
    errmsg: string;
}>;
export declare function as400_compile(srcfName: string, srcfLib: string, srcmbr: string, options: iOptions): Promise<{
    compMsg: string;
    compile: iCompileLine[];
    joblog: string[];
}>;
export declare function as400_rmvm(fileName: string, libName: string, mbrName: string, options: iOptions): Promise<{
    errmsg: string;
}>;
export declare function as400_srcfList(objName: string, libName: string, options?: iOptions): Promise<{}[]>;
export declare function as400_routines(libName: string, routineName: string): Promise<{}[]>;
export declare function as400_srcmbrLines(libName: string, fileName: string, mbrName: string): Promise<iSrcmbrLine[]>;
export declare function as400_srcmbrList(libName: string, fileName: string, mbrName?: string, options?: iOptions): Promise<iDspfd_mbrlist[]>;
export declare function as400_tablesAndViews_select(schema: string, collName: string, maxRows?: number): Promise<[{
    SCHEMA: string;
    COLLNAME: string;
    COLLTYPE: string;
}]>;
export {};
