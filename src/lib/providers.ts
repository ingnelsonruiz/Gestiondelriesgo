
'use server';

import Papa from 'papaparse';
import * as fs from 'fs/promises';
import * as path from 'path';

const PROVIDERS_FILE_PATH = path.join(process.cwd(), 'public', 'RCV', 'Prestadores.csv');

export interface Provider {
  nit: string;
  razonSocial: string;
  departamento: string;
}

export async function getProviders(): Promise<Provider[]> {
  try {
    const csvText = await fs.readFile(PROVIDERS_FILE_PATH, 'utf8');

    return new Promise((resolve, reject) => {
      Papa.parse<any>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ''),
        complete: (results) => {
          if (results.errors.length) {
            console.error("Errores de parseo en prestadores.csv:", results.errors);
            reject(new Error("Error al procesar el formato del archivo local de prestadores."));
            return;
          }
          
          const providers: Provider[] = results.data.map(row => ({
            nit: row.nit,
            razonSocial: row.razonsocial,
            departamento: row.departamento
          })).filter(p => p.nit && p.razonSocial && p.departamento);

          resolve(providers);
        },
        error: (error: Error) => {
          console.error("Error en PapaParse para prestadores.csv:", error);
          reject(error);
        }
      });
    });

  } catch (error: any) {
    if (error.code === 'ENOENT') {
        console.error(`No se encontró el archivo de prestadores en: ${PROVIDERS_FILE_PATH}`);
        throw new Error(`No se encontró el archivo 'public/RCV/Prestadores.csv'. Por favor, asegúrese de que el archivo exista.`);
    }
    console.error("Fallo la función getProviders:", error);
    throw new Error(`No se pudo leer el archivo de prestadores local. ${error.message}`);
  }
}
