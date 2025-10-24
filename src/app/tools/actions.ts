
'use server';

import { obtenerDatosDeLaHoja } from '@/lib/sheets-checker';

export async function checkGoogleSheetConnection() {
    try {
        const success = await obtenerDatosDeLaHoja();
        return { success };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
