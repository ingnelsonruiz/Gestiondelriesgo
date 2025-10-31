'use server';

import { getLocalProviders } from '@/lib/providers-local';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const PROVIDERS_FILE_PATH = path.join(process.cwd(), 'public', 'RCV', 'Prestadores.csv');

export interface ProviderForAdmin {
  nit: string;
  razonSocial: string;
}

export async function getUsers(): Promise<ProviderForAdmin[]> {
  try {
    const providers = await getLocalProviders();
    // Excluir al administrador de la lista
    return providers
      .filter(p => p.razonSocial.toUpperCase() !== 'ADMIN')
      .map(p => ({ nit: p.nit, razonSocial: p.razonSocial }));
  } catch (error: any) {
    console.error('Error al obtener la lista de usuarios:', error);
    throw new Error('No se pudo cargar la lista de prestadores desde el archivo.');
  }
}

export async function updateUserPassword(nit: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const providers = await getLocalProviders();
    const userIndex = providers.findIndex(p => p.nit === nit);

    if (userIndex === -1) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    // Actualizar la clave en la lista
    providers[userIndex].clave = newPassword;

    // Convertir la lista actualizada de nuevo a formato CSV
    // Asegurarse de que los encabezados coincidan con el archivo original
    const updatedCsv = Papa.unparse(providers.map(p => ({
        nit: p.nit,
        razonsocial: p.razonSocial,
        departamento: p.departamento,
        clave: p.clave
    })), {
        header: true,
        quotes: false,
    });
    
    // Reescribir el archivo CSV
    await fs.writeFile(PROVIDERS_FILE_PATH, updatedCsv, 'utf8');

    return { success: true };
  } catch (error: any) {
    console.error('Error al actualizar la clave:', error);
    return { success: false, error: 'Ocurrió un error en el servidor al intentar guardar la nueva clave.' };
  }
}
