
export interface iTesterResults
{
  completion_arr: string[],
  errmsg_arr: string[]
};


type PassFail = 'pass' | 'fail' ;

export interface iTesterResultItem
{
  passFail : PassFail,
  text: string
}

// ----------------------------- testerResults_append -----------------------------
export function testerResults_append(testerResults: iTesterResults,
  completion_arr: string[], errmsg_arr: string[])
{
  testerResults.completion_arr.push(...completion_arr);
  testerResults.errmsg_arr.push(...errmsg_arr);
}

// --------------------------- testerResults_consoleLog ---------------------------
export function testerResults_consoleLog(testerResults: iTesterResults)
{
  const { errmsg_arr, completion_arr } = testerResults;
  for (const line of completion_arr)
  {
    console.log(line);
  }

  for (const line of errmsg_arr)
  {
    console.error(line);
  }
}

// ------------------------------- testerResults_new -------------------------------
export function testerResults_new(): iTesterResults
{
  const errmsg_arr: string[] = [];
  const completion_arr: string[] = [];
  return { completion_arr, errmsg_arr };
}
