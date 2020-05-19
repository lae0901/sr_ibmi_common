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
export declare function as400_compile(config: {
    CURLIB: string;
    LIBL: string;
}, srcfName: string, srcfLib: string, srcmbr: string): Promise<{
    compMsg: string;
    compile: string[];
    joblog: string[];
}>;
export declare function as400_srcfList(objName: string, libName: string): Promise<{}[]>;
export declare function as400_routines(libName: string, routineName: string): Promise<{}[]>;
export declare function as400_srcmbrLines(libName: string, fileName: string, mbrName: string): Promise<{
    SEQNBR: string;
    CHGDATE: string;
    TEXT: string;
}[]>;
export declare function as400_srcmbrList(libName: string, fileName: string, mbrName?: string): Promise<iDspfd_mbrlist[]>;
export declare function as400_tablesAndViews_select(schema: string, collName: string, maxRows?: number): Promise<[{
    SCHEMA: string;
    COLLNAME: string;
    COLLTYPE: string;
}]>;
