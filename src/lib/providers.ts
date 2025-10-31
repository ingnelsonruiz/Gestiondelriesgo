
'use server';

import { getLocalProviders, type Provider } from '@/lib/providers-local';

// Esta función ahora actúa como un envoltorio para la función que lee el archivo local.
// De esta manera, si en el futuro decidimos cambiar a una base de datos,
// solo tendremos que cambiar el origen en `getLocalProviders`.
export async function getProviders(): Promise<Provider[]> {
  return await getLocalProviders();
}
