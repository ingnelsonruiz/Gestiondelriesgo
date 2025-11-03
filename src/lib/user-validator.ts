
'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';

const AFILIADOS_FILE_PATH = path.join(process.cwd(), 'public', 'RCV', 'Afiliados.csv');

let afiliadosIdSet: Set<string> | null = null;
let lastModifiedTime: number | null = null;

async function loadAfiliados(): Promise<Set<string>> {
    try {
        const stats = await fs.stat(AFILIADOS_FILE_PATH);
        // Si el set ya existe y el archivo no ha sido modificado, lo reutilizamos.
        if (afiliadosIdSet && lastModifiedTime === stats.mtimeMs) {
            return afiliadosIdSet;
        }

        console.log('Recargando la base de datos de afiliados en memoria...');
        const csvText = await fs.readFile(AFILIADOS_FILE_PATH, 'utf8');
        
        return new Promise((resolve, reject) => {
            let tempSet = new Set<string>();
            Papa.parse<any>(csvText, {
                header: true,
                skipEmptyLines: true,
                chunk: (results) => {
                    results.data.forEach((row: any) => {
                        const idKey = Object.keys(row).find(k => k.toLowerCase().replace(/\s+/g, '_').includes('numero_identificacion') || k.toLowerCase().includes('no_de_identificación'));
                        if (idKey && row[idKey]) {
                            tempSet.add(String(row[idKey]).trim());
                        }
                    });
                },
                complete: () => {
                    afiliadosIdSet = tempSet;
                    lastModifiedTime = stats.mtimeMs;
                    console.log(`Carga de afiliados completa. ${afiliadosIdSet.size} IDs en memoria.`);
                    resolve(afiliadosIdSet);
                },
                error: (error: Error) => {
                    console.error("Error al parsear el archivo de afiliados:", error);
                    reject(error);
                }
            });
        });

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`Advertencia: El archivo de afiliados no se encontró en '${AFILIADOS_FILE_PATH}'. Se procederá sin la validación de afiliados.`);
            afiliadosIdSet = new Set<string>();
            return afiliadosIdSet;
        }
        console.error("Fallo la carga de afiliados:", error);
        throw new Error(`No se pudo leer el archivo de afiliados. ${error.message}`);
    }
}

export async function getAfiliadosIdSet(): Promise<Set<string>> {
    // Si el set no está inicializado, o si el archivo ha cambiado, lo cargamos/recargamos.
    if (!afiliadosIdSet) {
        return await loadAfiliados();
    }
    
    // Verificación rápida para cambios sin bloquear siempre con stat
    const stats = await fs.stat(AFILIADOS_FILE_PATH).catch(() => null);
    if (!stats || stats.mtimeMs !== lastModifiedTime) {
        return await loadAfiliados();
    }
    
    return afiliadosIdSet;
}
