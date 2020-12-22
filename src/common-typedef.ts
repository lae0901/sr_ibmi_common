
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
