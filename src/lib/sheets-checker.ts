
'use server';
// La URL de descarga directa que construimos.
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/17cIybY-8CfyV3Hg1JD0_EGDMU-R6mpWNDQgCDfGjRyU/gviz/tq?tqx=out:csv&gid=0';

/**
 * Verifica si se puede establecer una conexión con la hoja de Google Sheets.
 * @returns Una promesa que se resuelve a `true` si la conexión es exitosa.
 */
export async function obtenerDatosDeLaHoja(): Promise<boolean> {
  try {
    // 1. Intenta descargar el contenido de la URL.
    const response = await fetch(SHEET_URL, { cache: 'no-store' }); // 'no-store' para evitar caché
    
    // 2. Si la respuesta no es OK (ej. 404, 500), lanza un error.
    if (!response.ok) {
      throw new Error(`Error al obtener los datos de Google Sheets. Estado: ${response.status} ${response.statusText}`);
    }
    
    // 3. Si la respuesta es exitosa, retorna true.
    return true;

  } catch (error: any) {
    console.error("Fallo la función obtenerDatosDeLaHoja:", error);
    // Propaga el error para que el componente que llama pueda manejarlo.
    throw new Error(`No se pudo conectar con la base de datos de Google Sheets. ${error.message}`);
  }
}
