export declare function as400_srcfList(objName: string, libName: string): Promise<{}[]>;
export declare function as400_routines(libName: string, routineName: string): Promise<{}[]>;
export declare function as400_srcmbrLines(libName: string, fileName: string, mbrName: string): Promise<[{
    SEQNBR: string;
    CHGDATE: string;
    TEXT: string;
}]>;
export declare function as400_srcmbrList(libName: string, fileName: string, mbrName?: string): Promise<[{}]>;
export declare function as400_tablesAndViews_select(schema: string, collName: string, maxRows?: number): Promise<[{
    SCHEMA: string;
    COLLNAME: string;
    COLLTYPE: string;
}]>;
