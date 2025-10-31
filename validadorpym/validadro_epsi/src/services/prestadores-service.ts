// Importa la librería para parsear CSV.
import Papa, { type ParseResult } from 'papaparse';

// La URL de descarga directa que construimos.
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/17cIybY-8CfyV3Hg1JD0_EGDMU-R6mpWNDQgCDfGjRyU/gviz/tq?tqx=out:csv&gid=0';

// Define una interfaz para la estructura de tus datos.
export interface PrestadorData {
  Nombre: string;
  [key: string]: any;
}

/**
 * Descarga y parsea los datos de la hoja de Google Sheets.
 * @returns Una promesa que se resuelve con un array de objetos.
 */
export async function obtenerDatosDePrestadores(): Promise<PrestadorData[]> {
  try {
    // 1. Descarga el contenido como texto. La opción `no-store` es clave para evitar caché.
    const response = await fetch(SHEET_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Error al obtener los datos de Google Sheets: ${response.statusText}`);
    }
    let csvText = await response.text();

    // 2. **LIMPIEZA DEL TEXTO (¡ESTE ES EL PASO CRÍTICO!)**
    // Se elimina el "Byte Order Mark" (BOM), un carácter invisible al inicio
    // de algunos archivos que puede romper el parseo del CSV.
    if (csvText.charCodeAt(0) === 0xFEFF) {
      csvText = csvText.slice(1);
    }
    
    // 3. Parsea el texto CSV ya limpio usando Papaparse.
    return new Promise((resolve, reject) => {
      Papa.parse<PrestadorData>(csvText, {
        header: true,         // Usa la primera fila como cabecera.
        skipEmptyLines: true, // Ignora líneas vacías.
        // No se especifica un delimitador para que lo detecte automáticamente.
        complete: (results: ParseResult<PrestadorData>) => {
          if (results.errors.length) {
            console.error("Errores de parseo:", results.errors);
            if (results.data.length === 0) {
              reject(new Error("Error al procesar el formato del archivo CSV. Verifique la publicación y el formato."));
              return;
            }
          }
          if (results.data.length === 0) {
             reject(new Error("El archivo CSV está vacío o no contiene datos después de la cabecera."));
             return;
          }
          resolve(results.data);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });

  } catch (error: any) {
    console.error("Fallo la función obtenerDatosDePrestadores:", error);
    throw new Error(`No se pudo conectar con la base de datos de Google Sheets. ${error.message}`);
  }
}
