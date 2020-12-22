
// #region parse RPG types

import { iDiagnosticMessage, iPositionedString } from "./common-typedef";
import { iDspffd } from "./ibmi-common";

// --------------------------------- RPG_stmtType ---------------------------------
export type RPG_stmtType = 'fspec' | 'free' | 'hspec' | 'comment' | 'other' | 'empty'
  | '' | 'cspec' | 'dspec' | 'ispec' | 'pspec';

// --------------------------------- RPG_specType ---------------------------------
// spec type of the dspec statement.
// data struct, standalone, const, data struct subfld.				
export type RPG_specType = 'ds' | 's' | 'c' | 'pr' | 'pi' | 'b' | 'e' | '';

// ----------------------------------- RPG_dtyp -----------------------------------
// s - zoned decimal  p - packed  a - character  i - int   u - unsigned int.
// z - timestamp
// d - iso date
export type RPG_dtyp = 'a' | 'p' | 'i' | 'u' | 's' | 'ds' | 'z' | 'd';

// -------------------------------- RPG_symbolType --------------------------------
// each symbolType can have an interface which define info about the symbol type.
// rcdfmt - iRPG_symbolRcdfmt { fileName, rcdnam, fldArr }
// proc -  iRPG_symbolProc { procName, extProc, defineSourceFile }
export type RPG_symbolType = 'file' | 'rcdfmt' | 'pgm' | 'proc' | 'subrtn' |
  'struct' |
  'fld';  // also 'sql' for sql object.  Then have RPG_sqlSymbolType
// which defines 'table', 'proc', 'func', 'view'
// #endregion

// --------------------------------- iRPG_dataDefn ---------------------------------
export interface iRPG_dataDefn
{
  dtyp: RPG_dtyp;
  dlen: number;
  dprc: number;
}

// ----------------------------------- iStmtLine -----------------------------------
export interface iStmtLine
{
  line: string;
  linn: number;
  lineType: RPG_stmtType;
}

// ---------------------------------- iRPG_fspec ----------------------------------
// fspec statement. 
export interface iRPG_fspec
{
  fileName: iPositionedString;
  media: string;
  rename?: iRPG_fspec_rename;
  ffdArr?: iDspffd[];  // dspffd info of the file.
}

// ------------------------------ iRPG_fspec_rename ------------------------------
export interface iRPG_fspec_rename
{
  rcdName: string;
  to_rcdName: string;
}

// ---------------------------------- iRPG_dspec ----------------------------------
export interface iRPG_dspec
{
  itemName: iPositionedString;
  // specType: the 1 or 2 char code that specifies the type of field the dspec is
  // declaring. ds - data struct  s - standalone field  c - const
  specType: RPG_specType;

  dlen: number;
  dtyp: string;
  dprc: number;

  optionText?: string;

  extProc?: string;
  constVlu?: string;
  overlay?: iRPG_dspec_overlay;
}

// ------------------------------ iRPG_dspec_overlay ------------------------------
export interface iRPG_dspec_overlay
{
  based: string;
  pos?: number;
}

// ---------------------------------- iRPG_pspec ----------------------------------
export interface iRPG_pspec
{
  itemName: iPositionedString;
  // specType: the 1 or 2 char code that specifies the type of field the dspec is
  // declaring. ds - data struct  s - standalone field  c - const
  specType: RPG_specType;

  isExport: boolean;

  optionText?: string;
}

// ----------------------------------- iRPG_stmt -----------------------------------
// RPG document is parsed into array of iRPG_stmt. 
export interface iRPG_stmt
{
  stmtType: RPG_stmtType;
  linn: number;
  stmtLines: iStmtLine[];
  fspec?: iRPG_fspec;
  dspec?: iRPG_dspec;
  pspec?: iRPG_pspec;
}

// ----------------------------------- iRPG_symbolFld -----------------------------------
export interface iRPG_symbolFld
{
  stmt: iRPG_stmt;  // stmt where symbol is defined.
  fldName: string;
  dataDefn: iRPG_dataDefn;
  rcdfmt?: iRPG_symbolRcdfmt;  // rcdfmt the field is member of.
}

// ----------------------------------- iRPG_symbolStruct -----------------------------------
export interface iRPG_symbolStruct
{
  stmt: iRPG_stmt;  // stmt where symbol is defined.
  structName: string;
  likedsName?: string;
}

// ----------------------------------- iRPG_symbolFile -----------------------------------
export interface iRPG_symbolFile
{
  stmt: iRPG_stmt;  // stmt where symbol is defined.
  fileName: string;
  rcdfmtArr: iRPG_symbolRcdfmt[];
}

// ----------------------------------- iRPG_symbolProc -----------------------------------
export interface iRPG_symbolProc
{
  stmt: iRPG_stmt;  // stmt where symbol is defined.
  procName: string;
  isExport?: boolean;

  // the proc begin, dspec pi and dspec pr statments that define this proc.
  b_stmt?: iRPG_stmt;
  pi_stmt?: iRPG_stmt;
  pr_stmt?: iRPG_stmt;
}

// ------------------------------- iRPG_symbolRcdfmt -------------------------------
export interface iRPG_symbolRcdfmt
{
  stmt: iRPG_stmt;  // stmt where symbol is defined.
  recordName: string;  // record name used in program. if Rename, this is rename name.

  // actual record name of file. Will contain value when rcdfmt is renamed in pgm.
  fileRecordName?: string;

  symbolFile: iRPG_symbolFile;
  fieldArr: iRPG_symbol[];
}

// ---------------------------------- iRPG_symbol ----------------------------------
export interface iRPG_symbol
{
  symbolName: string;
  positionedSymbol?: iPositionedString;

  symbolType: RPG_symbolType;
  stmt: iRPG_stmt;  // stmt where symbol is defined.

  // info parser gathers about errors on the stmt. Info includes text of item on the
  // stmt that is in error, and the position of that item.
  diagMessage?: iDiagnosticMessage;

  onSelected?: (symbol: iRPG_symbol) => Promise<void>;

  symbolFld?: iRPG_symbolFld;
  symbolFile?: iRPG_symbolFile;
  symbolRcdfmt?: iRPG_symbolRcdfmt;
  symbolProc?: iRPG_symbolProc;
  symbolStruct?: iRPG_symbolStruct;
}
