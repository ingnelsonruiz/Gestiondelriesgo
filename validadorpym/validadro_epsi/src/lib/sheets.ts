// Importa la librería para parsear CSV. Asegúrate de que esté en tu package.json.
import Papa, { type ParseResult } from 'papaparse';

// La URL de descarga directa que construimos.
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/17cIybY-8CfyV3Hg1JD0_EGDMU-R6mpWNDQgCDfGjRyU/gviz/tq?tqx=out:csv&gid=0';

// Define una interfaz para la estructura de tus datos, basándote en las columnas de la hoja.
export interface MiFilaDeDatos {
  Nombre: string;
  // Agrega aquí otras columnas si existen.
  [key: string]: any; 
}

/**
 * Descarga y parsea los datos de la hoja de Google Sheets.
 * @returns Una promesa que se resuelve con un array de objetos, donde cada objeto es una fila.
 */
export async function obtenerDatosDeLaHoja(): Promise<MiFilaDeDatos[]> {
  try {
    // 1. Descarga el contenido de la URL como texto.
    const response = await fetch(SHEET_URL, { cache: 'no-store' }); // 'no-store' para evitar caché
    if (!response.ok) {
      throw new Error(`Error al obtener los datos de Google Sheets: ${response.statusText}`);
    }
    const csvText = await response.text();

    // 2. Parsea el texto CSV usando Papaparse.
    return new Promise((resolve, reject) => {
      Papa.parse<MiFilaDeDatos>(csvText, {
        header: true, // ¡Muy importante! Usa la primera fila como cabecera.
        skipEmptyLines: true, // Ignora líneas vacías.
        // **CORRECCIÓN CLAVE:** No especificamos un delimitador.
        // Dejamos que Papaparse lo detecte automáticamente.
        complete: (results: ParseResult<MiFilaDeDatos>) => {
          if (results.errors.length) {
            console.error("Errores de parseo:", results.errors);
            reject(new Error("Error al procesar el formato del archivo CSV."));
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
