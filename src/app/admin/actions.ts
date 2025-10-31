
'use server';

import { getLocalProviders, Provider } from '@/lib/providers-local';
import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';
import JSZip from 'jszip';

const PROVIDERS_FILE_PATH = path.join(process.cwd(), 'public', 'RCV', 'Prestadores.csv');
const ACTIVITY_LOG_PATH = path.join(process.cwd(), 'public', 'activity-log.json');
const VALIDATED_FILES_BASE_PATH = path.join(process.cwd(), 'public');

export interface ProviderForAdmin {
  nit: string;
  razonSocial: string;
  departamento: string;
  clave: string;
}

export interface ActivityLogEntry {
  timestamp: string;
  provider: string;
  action: string;
  details: string;
}

export interface UploadedFile {
    path: string; // Relative to `public` folder
    module: 'Gestantes' | 'RCV';
    provider: string;
    year: string;
    month: string;
    fileName: string;
    timestamp: string; // ISO string for the upload date
}


// --- User Management (CRUD) ---

async function writeProviders(providers: Provider[]): Promise<void> {
    // Ordenar alfabéticamente por razón social, excepto 'ADMIN' que va primero.
    providers.sort((a, b) => {
        if (a.razonSocial.toUpperCase() === 'ADMIN') return -1;
        if (b.razonSocial.toUpperCase() === 'ADMIN') return 1;
        return a.razonSocial.localeCompare(b.razonSocial);
    });

    const csvData = Papa.unparse(providers.map(p => ({
        nit: p.nit,
        razonsocial: p.razonSocial,
        departamento: p.departamento,
        clave: p.clave
    })), {
        header: true,
        quotes: false,
    });
    
    await fs.writeFile(PROVIDERS_FILE_PATH, csvData, 'utf8');
}


export async function getUsers(): Promise<ProviderForAdmin[]> {
  try {
    const providers = await getLocalProviders();
    return providers.map(p => ({ 
        nit: p.nit, 
        razonSocial: p.razonSocial,
        departamento: p.departamento,
        clave: p.clave // Se devuelve la clave para que el admin pueda verla/editarla
    }));
  } catch (error: any) {
    console.error('Error al obtener la lista de usuarios:', error);
    throw new Error('No se pudo cargar la lista de prestadores desde el archivo.');
  }
}

export async function addProvider(newProvider: ProviderForAdmin): Promise<{ success: boolean; error?: string }> {
    try {
        const providers = await getLocalProviders();
        
        if (providers.some(p => p.nit === newProvider.nit)) {
            return { success: false, error: 'Ya existe un prestador con el mismo NIT.' };
        }

        providers.push(newProvider);
        await writeProviders(providers);
        await writeActivityLog({ action: 'Admin: Añadir Usuario', provider: 'ADMIN', details: `Añadido ${newProvider.razonSocial}` });
        
        return { success: true };
    } catch (error: any) {
        console.error('Error al añadir prestador:', error);
        return { success: false, error: error.message };
    }
}

export async function updateProvider(updatedProvider: ProviderForAdmin): Promise<{ success: boolean; error?: string }> {
    try {
        let providers = await getLocalProviders();
        const userIndex = providers.findIndex(p => p.nit === updatedProvider.nit);

        if (userIndex === -1) {
            return { success: false, error: 'Usuario no encontrado para actualizar.' };
        }

        // Actualizar los datos
        providers[userIndex] = { ...providers[userIndex], ...updatedProvider };
        await writeProviders(providers);
        await writeActivityLog({ action: 'Admin: Actualizar Usuario', provider: 'ADMIN', details: `Actualizado ${updatedProvider.razonSocial}` });

        return { success: true };
    } catch (error: any) {
        console.error('Error al actualizar prestador:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteProvider(nit: string): Promise<{ success: boolean; error?: string }> {
    try {
        let providers = await getLocalProviders();
        const userToDelete = providers.find(p => p.nit === nit);
        
        if (!userToDelete) {
             return { success: false, error: 'Usuario no encontrado para eliminar.' };
        }
        if (userToDelete.razonSocial.toUpperCase() === 'ADMIN') {
            return { success: false, error: 'No se puede eliminar al usuario administrador.' };
        }

        providers = providers.filter(p => p.nit !== nit);
        await writeProviders(providers);
        await writeActivityLog({ action: 'Admin: Eliminar Usuario', provider: 'ADMIN', details: `Eliminado prestador con NIT ${nit}` });

        return { success: true };
    } catch (error: any) {
        console.error('Error al eliminar prestador:', error);
        return { success: false, error: error.message };
    }
}


// --- Activity Log ---

export async function getActivityLog(): Promise<ActivityLogEntry[]> {
    try {
        await fs.access(ACTIVITY_LOG_PATH);
        const logContent = await fs.readFile(ACTIVITY_LOG_PATH, 'utf8');
        return JSON.parse(logContent) as ActivityLogEntry[];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify([]), 'utf8');
            return [];
        }
        console.error('Error al leer el registro de actividad:', error);
        throw new Error('No se pudo cargar el registro de actividad.');
    }
}

async function writeActivityLog(entry: Omit<ActivityLogEntry, 'timestamp'>) {
    try {
        const currentLog = await getActivityLog();
        const newEntry: ActivityLogEntry = {
            ...entry,
            timestamp: new Date().toISOString(),
        };
        currentLog.unshift(newEntry);
        await fs.writeFile(ACTIVITY_LOG_PATH, JSON.stringify(currentLog, null, 2), 'utf8');
    } catch (error) {
        console.error('Error al escribir en el registro de actividad:', error);
    }
}

export async function logFileUpload(providerName: string, module: 'Fenix' | 'Gestantes' | 'RCV', fileName: string) {
    await writeActivityLog({
        provider: providerName,
        action: `Subida de archivo: ${module}`,
        details: `Archivo: ${fileName}`,
    });
}


// --- File Management ---

async function scanDirectory(startPath: string, module: 'Gestantes' | 'RCV'): Promise<UploadedFile[]> {
    let results: UploadedFile[] = [];
    try {
        const departmentFolders = await fs.readdir(startPath, { withFileTypes: true });
        for (const dpto of departmentFolders) {
            if (!dpto.isDirectory()) continue;
            const providerFolders = await fs.readdir(path.join(startPath, dpto.name), { withFileTypes: true });
            for (const provider of providerFolders) {
                if (!provider.isDirectory()) continue;
                const yearFolders = await fs.readdir(path.join(startPath, dpto.name, provider.name), { withFileTypes: true });
                for (const year of yearFolders) {
                    if (!year.isDirectory()) continue;
                    const monthFiles = await fs.readdir(path.join(startPath, dpto.name, provider.name, year.name), { withFileTypes: true });
                    for (const month of monthFiles) {
                        if (month.isFile() && month.name.toLowerCase().endsWith('.xlsx')) {
                            const fullPath = path.join(startPath, dpto.name, provider.name, year.name, month.name);
                            const stats = await fs.stat(fullPath);
                            results.push({
                                module: module,
                                provider: provider.name,
                                year: year.name,
                                month: month.name.replace('.xlsx', ''),
                                fileName: month.name,
                                path: path.join(startPath.replace(VALIDATED_FILES_BASE_PATH, ''), dpto.name, provider.name, year.name, month.name).replace(/\\/g, '/'),
                                timestamp: stats.mtime.toISOString(),
                            });
                        }
                    }
                }
            }
        }
    } catch (error: any) {
        if (error.code !== 'ENOENT') console.error(`Error escaneando ${startPath}:`, error);
    }
    return results;
}


export async function listFilesForAdmin(): Promise<UploadedFile[]> {
    const gestantesPath = path.join(VALIDATED_FILES_BASE_PATH, 'Validacion_Gestantes');
    const rcvPath = path.join(VALIDATED_FILES_BASE_PATH, 'Validacion_Rcv');
    
    const gestantesFiles = await scanDirectory(gestantesPath, 'Gestantes');
    const rcvFiles = await scanDirectory(rcvPath, 'RCV');

    return [...gestantesFiles, ...rcvFiles].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function downloadFilesAsZip(filesToZip: { path: string, name: string }[]): Promise<string> {
    const zip = new JSZip();
    for (const file of filesToZip) {
        try {
            const filePath = path.join(VALIDATED_FILES_BASE_PATH, file.path);
            const fileContent = await fs.readFile(filePath);
            zip.file(file.name, fileContent);
        } catch (error) {
            console.error(`No se pudo añadir el archivo ${file.path} al ZIP:`, error);
        }
    }
    const zipAsBase64 = await zip.generateAsync({ type: "base64" });
    return zipAsBase64;
}

export async function deleteFileForAdmin(filePath: string): Promise<{ success: boolean, error?: string }> {
    try {
        const fullPath = path.join(VALIDATED_FILES_BASE_PATH, filePath);
        await fs.unlink(fullPath);
        await writeActivityLog({ action: 'Admin: Eliminar Archivo', provider: 'ADMIN', details: `Archivo eliminado: ${filePath}` });
        return { success: true };
    } catch (error: any) {
        console.error(`Error al eliminar archivo ${filePath}:`, error);
        return { success: false, error: error.message };
    }
}
