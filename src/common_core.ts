import * as FormData from 'form-data';

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
