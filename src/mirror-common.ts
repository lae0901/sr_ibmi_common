import { iIfsMirrorJson, iSrcfMirror } from "./ibmi-common";
import * as path from 'path' ;
import { file_exists, file_readText } from "sr_core_ts";

export type MirrorType = 'ifs' | 'srcf' ;

// ----------------------------- mirrorSettings_readJson -----------------------------
/**
 * read the settings .json file from the specified directory. 
 * Either .srcf-mirror.json or .ifs-mirror.json.
 * Return the settings as a parsed JSON object.
 * @param dirPath 
 * @param mirrorType 
 */
export async function mirrorSettings_readJson(dirPath: string, mirrorType:MirrorType )
{
  let json: iIfsMirrorJson | iSrcfMirror | undefined ;
  const jsonFileName = mirrorType == 'ifs' ? '.ifs-mirror.json' : '.srcf-mirror.json' ;
  const jsonFilePath = path.join(dirPath, jsonFileName );

  // check that json file exists. if so, return undefined.
  const exists = await file_exists(jsonFilePath);
  if (!exists)
  {
    return null;
  }

  const { text: jsonText, errmsg } = await file_readText(jsonFilePath);

  if ( mirrorType == 'ifs')
  {
    json = JSON.parse(jsonText) as iIfsMirrorJson;
  }
  else if ( mirrorType == 'srcf')
  {
    json = JSON.parse(jsonText) as iSrcfMirror;
  }

  return json;
}
