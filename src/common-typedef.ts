import { RPG_symbolType } from "./rpg-typedef";

// ------------------------------- iPositionedString -------------------------------
export interface iPositionedString
{
  text: string;
  linn: number;
  coln: number;
}

// ------------------------------ iDiagnosticMessage ------------------------------
export interface iDiagnosticMessage
{
  textItem: iPositionedString;
  message: string;
}

// ------------------------------ iDefinedSymbolName ------------------------------
export interface iDefinedSymbolName
{
  symbolName: string;
  symbolType: RPG_symbolType;
}
