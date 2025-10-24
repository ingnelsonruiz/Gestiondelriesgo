
'use server';

import { obtenerDatosDeLaHoja } from '@/lib/sheets-checker';

export async function checkGoogleSheetConnection() {
    try {
        const data = await obtenerDatosDeLaHoja();
        return { success: true, data: data.slice(0, 5), count: data.length }; // Devuelve las primeras 5 filas para verificación
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
