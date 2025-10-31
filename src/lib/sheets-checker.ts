
'use server';

import Papa, { type ParseResult } from 'papaparse';

// La URL de descarga directa que construimos.
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/17cIybY-8CfyV3Hg1JD0_EGDMU-R6mpWNDQgCDfGjRyU/gviz/tq?tqx=out:csv&gid=0';

/**
 * Descarga y parsea los datos de la hoja de Google Sheets para verificar la conexión y el formato.
 * @returns Una promesa que se resuelve con un array de objetos si es exitoso.
 */
export async function obtenerDatosDeLaHoja<T>(): Promise<T[]> {
  try {
    // 1. Descarga el contenido de la URL como texto.
    const response = await fetch(SHEET_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error al obtener los datos de Google Sheets: ${response.statusText}`);
    }
    let csvText = await response.text();

    // 2. Limpiar el Byte Order Mark (BOM) si está presente.
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.slice(1);
    }

    // 3. Parsea el texto CSV usando Papaparse.
    return new Promise((resolve, reject) => {
      Papa.parse<T>(csvText, {
        header: true, // ¡Muy importante! Usa la primera fila como cabecera.
        skipEmptyLines: true, // Ignora líneas vacías.
        complete: (results: ParseResult<T>) => {
          if (results.errors.length) {
            console.error("Errores de parseo:", results.errors);
            reject(new Error("Error al procesar el formato del archivo CSV. Verifique las columnas y el formato."));
            return;
          }
          resolve(results.data);
        },
        error: (error: Error) => {
          console.error("Error en PapaParse:", error);
          reject(error);
        }
      });
    });

  } catch (error: any) {
    console.error("Fallo la función obtenerDatosDeLaHoja:", error);
    // Propaga el error para que el componente que llama pueda manejarlo.
    throw new Error(`No se pudo conectar con la base de datos de Google Sheets. ${error.message}`);
  }
}
