
'use server';

import Papa from 'papaparse';

const PROVIDERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1iVLBIHGQt_kWlFGvbtxAR80YEkG4cGIWBU_nlpeSgF4/gviz/tq?tqx=out:csv&gid=0';

export interface Provider {
  nit: string;
  razonSocial: string;
  departamento: string;
}

export async function getProviders(): Promise<Provider[]> {
  try {
    const response = await fetch(PROVIDERS_SHEET_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error al obtener la lista de prestadores: ${response.statusText}`);
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse<any>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, ''),
        complete: (results) => {
          if (results.errors.length) {
            console.error("Errores de parseo en prestadores:", results.errors);
            reject(new Error("Error al procesar el formato del archivo de prestadores."));
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
          console.error("Error en PapaParse para prestadores:", error);
          reject(error);
        }
      });
    });

  } catch (error: any) {
    console.error("Fallo la función getProviders:", error);
    throw new Error(`No se pudo conectar con la base de datos de prestadores. ${error.message}`);
  }
}

    