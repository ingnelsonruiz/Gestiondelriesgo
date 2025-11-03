
'use server';

import * as fs from 'fs/promises';
import * as path from 'path';
import Papa from 'papaparse';
import { logAdminAction } from '../actions';

const AFILIADOS_FILE_PATH = path.join(process.cwd(), 'public', 'BASES DE DATOS', 'Data_usuarios.csv');

export interface Afiliado {
  tipo_identificacion: string;
  numero_identificacion: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  fecha_nacimiento: string;
  sexo: string;
}

// --- Afiliado Management (CRUD) ---

async function readAfiliados(): Promise<Afiliado[]> {
    try {
        await fs.access(AFILIADOS_FILE_PATH);
        const csvText = await fs.readFile(AFILIADOS_FILE_PATH, 'utf8');
        return new Promise((resolve, reject) => {
            Papa.parse<any>(csvText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_'),
                complete: (results) => {
                    if (results.errors.length) {
                        return reject(new Error("Error al procesar el archivo de afiliados."));
                    }
                    // Mapeo flexible para los nombres de las columnas
                    const afiliados: Afiliado[] = results.data.map(row => ({
                        tipo_identificacion: row.tipo_identificacion || row.tipo_id || '',
                        numero_identificacion: row.numero_identificacion || row.no_de_identificación || '',
                        primer_nombre: row.primer_nombre || '',
                        segundo_nombre: row.segundo_nombre || '',
                        primer_apellido: row.primer_apellido || '',
                        segundo_apellido: row.segundo_apellido || '',
                        fecha_nacimiento: row.fecha_nacimiento || '',
                        sexo: row.sexo || '',
                    })).filter(a => a.numero_identificacion); // Filtrar filas sin ID
                    resolve(afiliados);
                },
                error: (error: Error) => reject(error),
            });
        });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            await fs.writeFile(AFILIADOS_FILE_PATH, '', 'utf8');
            return [];
        }
        throw new Error(`No se pudo leer el archivo de afiliados: ${error.message}`);
    }
}

async function writeAfiliados(afiliados: Afiliado[]): Promise<void> {
    // Usar los nombres de columna originales/esperados para la escritura
    const dataToUnparse = afiliados.map(a => ({
        'tipo_identificacion': a.tipo_identificacion,
        'numero_identificacion': a.numero_identificacion,
        'primer_nombre': a.primer_nombre,
        'segundo_nombre': a.segundo_nombre,
        'primer_apellido': a.primer_apellido,
        'segundo_apellido': a.segundo_apellido,
        'fecha_nacimiento': a.fecha_nacimiento,
        'sexo': a.sexo
    }));

    const csvData = Papa.unparse(dataToUnparse, {
        header: true,
        columns: ['tipo_identificacion', 'numero_identificacion', 'primer_nombre', 'segundo_nombre', 'primer_apellido', 'segundo_apellido', 'fecha_nacimiento', 'sexo']
    });
    await fs.writeFile(AFILIADOS_FILE_PATH, csvData, 'utf8');
}


export async function getAfiliadosCount(): Promise<number> {
    try {
        const afiliados = await readAfiliados();
        return afiliados.length;
    } catch (error) {
        console.error("Error contando afiliados:", error);
        return 0;
    }
}


export async function searchAfiliados(query: string): Promise<Afiliado[]> {
    const lowerCaseQuery = query.toLowerCase();
    const allAfiliados = await readAfiliados();
    
    if (!query) {
        // Devuelve una porción si no hay búsqueda para evitar sobrecargar
        return allAfiliados.slice(0, 50);
    }
    
    return allAfiliados.filter(afiliado =>
        afiliado.numero_identificacion.includes(lowerCaseQuery) ||
        `${afiliado.primer_nombre} ${afiliado.segundo_nombre} ${afiliado.primer_apellido} ${afiliado.segundo_apellido}`.toLowerCase().includes(lowerCaseQuery)
    ).slice(0, 100); // Limita los resultados de la búsqueda también
}

export async function addAfiliado(newAfiliado: Afiliado): Promise<{ success: boolean; error?: string }> {
    try {
        const afiliados = await readAfiliados();
        if (afiliados.some(a => a.numero_identificacion === newAfiliado.numero_identificacion)) {
            return { success: false, error: 'Ya existe un afiliado con el mismo número de identificación.' };
        }
        afiliados.push(newAfiliado);
        await writeAfiliados(afiliados);
        await logAdminAction('Añadir Afiliado', `Añadido ${newAfiliado.primer_nombre} ${newAfiliado.primer_apellido} (${newAfiliado.numero_identificacion})`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateAfiliado(updatedAfiliado: Afiliado): Promise<{ success: boolean; error?: string }> {
    try {
        let afiliados = await readAfiliados();
        const index = afiliados.findIndex(a => a.numero_identificacion === updatedAfiliado.numero_identificacion);
        if (index === -1) {
            return { success: false, error: 'Afiliado no encontrado para actualizar.' };
        }
        afiliados[index] = updatedAfiliado;
        await writeAfiliados(afiliados);
        await logAdminAction('Actualizar Afiliado', `Actualizado ${updatedAfiliado.primer_nombre} ${updatedAfiliado.primer_apellido} (${updatedAfiliado.numero_identificacion})`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteAfiliado(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        let afiliados = await readAfiliados();
        const initialLength = afiliados.length;
        afiliados = afiliados.filter(a => a.numero_identificacion !== id);
        if (afiliados.length === initialLength) {
            return { success: false, error: 'Afiliado no encontrado para eliminar.' };
        }
        await writeAfiliados(afiliados);
        await logAdminAction('Eliminar Afiliado', `Eliminado afiliado con ID ${id}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

    