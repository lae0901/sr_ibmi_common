import * as FormData from 'form-data';
import { stringArr_toDistinct } from 'sr_core_ts';
import { iConnectSetting } from './ibmi-common';

// -------------------------------- form_getLength --------------------------------
export function form_getLength(form: FormData)
{
  return new Promise((resolve, reject) =>
  {
    form.getLength((err, length) =>
    {
      resolve(length);
    });
  });
}

// -------------------- connectionSettings_toProductConnectLibl --------------------
/**
 * build library list from product_lib and connect libraries from connectSettings.
 * @param connectSettings 
 */
export function connectionSettings_toProductConnectLibl(connectSettings: iConnectSetting)
{
  const { ibmi_autocoder_product_lib, ibmi_connect_curlib, ibmi_connect_libl } = connectSettings;
  const libl = `${ibmi_autocoder_product_lib} ${ibmi_connect_curlib} ${ibmi_connect_libl}`;
  const arr = libl.split(/\s+/);
  const libl_arr = stringArr_toDistinct(arr);
  return libl_arr.join(' ');
}
