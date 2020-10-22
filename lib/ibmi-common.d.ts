import { iIfsItem, ibmi_ifs_getItems, ibmi_ifs_getFileContents } from './ibmi-ifs';
export { iIfsItem, ibmi_ifs_getItems, ibmi_ifs_getFileContents };
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
    mtime: number;
}
export interface iDspffd {
    WHFILE: string;
    WHLIB: string;
    WHFTYP: string;
    WHCNT: number;
    WHNAME: string;
    WHSEQ: string;
    WHTEXT: string;
    WHFLDN: number;
    WHRLEN: number;
    FLDNAME: string;
    WHFOBO: number;
    WHIBO: number;
    WHFLDB: number;
    WHFLDD: number;
    WHFLDP: number;
    WHFTXT: string;
    WHCHD1: string;
    WHCHD2: string;
    WHCHD3: string;
    WHFLDT: string;
    WHFIOB: string;
}
export interface iServerOptions {
    serverUrl?: string;
    numRows?: number;
    libl?: string;
    curlib?: string;
    joblog?: 'Y' | 'N';
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
export interface iSrcmbrXref {
    ibmi_url?: string;
    library: string;
    srcFiles: string[];
    srcTypes?: string[];
    members?: string[];
    mirror_hold?: boolean;
    srcf_is_master?: boolean;
}
export interface iSrcfMirror {
    ibmi_url?: string;
    library: string;
    srcFiles: string[];
    srcTypes?: string[];
    members?: string[];
    mirror_hold?: boolean;
    srcf_is_master?: boolean;
}
export declare function as400_addpfm(fileName: string, libName: string, mbrName: string, textDesc: string, srcType: string, options: iServerOptions): Promise<{
    errmsg: string;
}>;
export declare function as400_chgpfm(fileName: string, libName: string, mbrName: string, textDesc: string, srcType: string, options: iServerOptions): Promise<{
    errmsg: string;
}>;
export declare function as400_compile(srcfName: string, srcfLib: string, srcmbr: string, options: iServerOptions): Promise<{
    compMsg: string;
    compile: iCompileLine[];
    joblog: string[];
}>;
export declare function as400_dspffd(libName: string, fileName: string, options?: iServerOptions): Promise<iDspffd[] | undefined>;
export declare function as400_rmvm(fileName: string, libName: string, mbrName: string, options: iServerOptions): Promise<{
    errmsg: string;
}>;
export declare function as400_srcfList(objName: string, libName: string, options?: iServerOptions): Promise<{}[]>;
export declare function as400_routines(libName: string, routineName: string): Promise<{}[]>;
export declare function as400_srcmbrLines(libName: string, fileName: string, mbrName: string): Promise<iSrcmbrLine[]>;
export declare function as400_srcmbrList(libName: string, fileName: string, mbrName?: string, options?: iServerOptions): Promise<iDspfd_mbrlist[]>;
export declare function as400_tablesAndViews_select(schema: string, collName: string, maxRows?: number): Promise<[{
    SCHEMA: string;
    COLLNAME: string;
    COLLTYPE: string;
}]>;
export declare function sqlTimestamp_toJavascriptDate(sql_ts: string): Date;
