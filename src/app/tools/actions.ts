
'use server';

import { obtenerDatosDeLaHoja } from '@/lib/sheets-checker';

export async function checkGoogleSheetConnection() {
    try {
        const data = await obtenerDatosDeLaHoja();
        // Si la función se resuelve sin errores y devuelve datos, la conexión y el parseo son exitosos.
        return { success: true, count: data.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
