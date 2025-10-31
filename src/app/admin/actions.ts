'use server';

import { getLocalProviders } from '@/lib/providers-local';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const PROVIDERS_FILE_PATH = path.join(process.cwd(), 'public', 'RCV', 'Prestadores.csv');
const ACTIVITY_LOG_PATH = path.join(process.cwd(), 'public', 'activity-log.json');


export interface ProviderForAdmin {
  nit: string;
  razonSocial: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  provider: string;
  action: string;
  details: string;
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


export async function getActivityLog(): Promise<ActivityLogEntry[]> {
    try {
        await fs.access(ACTIVITY_LOG_PATH);
        const logContent = await fs.readFile(ACTIVITY_LOG_PATH, 'utf8');
        return JSON.parse(logContent) as ActivityLogEntry[];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            // Si el archivo no existe, lo creamos vacío y devolvemos un array vacío.
            await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify([]), 'utf8');
            return [];
        }
        console.error('Error al leer el registro de actividad:', error);
        throw new Error('No se pudo cargar el registro de actividad.');
    }
}

async function writeActivityLog(entry: Omit<ActivityLogEntry, 'timestamp'>) {
    try {
        const currentLog = await getActivityLog(); // Reutilizamos para leer y manejar creación
        const newEntry: ActivityLogEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };
        // Añadir la nueva entrada al principio del array para que aparezca primero
        currentLog.unshift(newEntry);
        await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(currentLog, null, 2), 'utf8');
    } catch (error) {
        console.error('Error al escribir en el registro de actividad:', error);
        // No lanzamos error para no interrumpir la operación principal del usuario
    }
}


export async function logFileUpload(providerName: string, module: 'Fenix' | 'Gestantes' | 'RCV', fileName: string) {
    await writeActivityLog({
        provider: providerName,
        action: `Subida de archivo: ${module}`,
        details: `Archivo: ${fileName}`,
    });
}
