
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
                transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
                complete: (results) => {
                    if (results.errors.length) {
                        console.error("Errores de parseo en Afiliados:", results.errors);
                        return reject(new Error("Error al procesar el archivo de afiliados."));
                    }
                    
                    const afiliados: Afiliado[] = results.data.map(row => {
                         // Find keys dynamically, accommodating variations
                        const idTypeKey = Object.keys(row).find(k => k.includes('tipo_identificacion') || k.includes('tipo_id'));
                        const idNumKey = Object.keys(row).find(k => k.includes('numero_identificacion') || k.includes('no_de_identificacion'));
                        const firstNameKey = Object.keys(row).find(k => k.includes('primer_nombre'));
                        const secondNameKey = Object.keys(row).find(k => k.includes('segundo_nombre'));
                        const firstLastNameKey = Object.keys(row).find(k => k.includes('primer_apellido'));
                        const secondLastNameKey = Object.keys(row).find(k => k.includes('segundo_apellido'));
                        const birthDateKey = Object.keys(row).find(k => k.includes('fecha_nacimiento'));
                        const sexKey = Object.keys(row).find(k => k.includes('sexo'));

                        return {
                            tipo_identificacion: idTypeKey ? row[idTypeKey] || '' : '',
                            numero_identificacion: idNumKey ? row[idNumKey] || '' : '',
                            primer_nombre: firstNameKey ? row[firstNameKey] || '' : '',
                            segundo_nombre: secondNameKey ? row[secondNameKey] || '' : '',
                            primer_apellido: firstLastNameKey ? row[firstLastNameKey] || '' : '',
                            segundo_apellido: secondLastNameKey ? row[secondLastNameKey] || '' : '',
                            fecha_nacimiento: birthDateKey ? row[birthDateKey] || '' : '',
                            sexo: sexKey ? row[sexKey] || '' : '',
                        };
                    }).filter(a => a.numero_identificacion); // Filter out rows without an ID

                    resolve(afiliados);
                },
                error: (error: Error) => reject(error),
            });
        });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`Advertencia: El archivo de afiliados no se encontró en '${AFILIADOS_FILE_PATH}'. Se creará uno vacío.`);
            await fs.writeFile(AFILIADOS_FILE_PATH, 'tipo_identificacion,numero_identificacion,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,fecha_nacimiento,sexo\n', 'utf8');
            return [];
        }
        throw new Error(`No se pudo leer el archivo de afiliados: ${error.message}`);
    }
}

async function writeAfiliados(afiliados: Afiliado[]): Promise<void> {
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
        return allAfiliados.slice(0, 50);
    }
    
    return allAfiliados.filter(afiliado =>
        afiliado.numero_identificacion.includes(lowerCaseQuery) ||
        `${afiliado.primer_nombre} ${afiliado.segundo_nombre} ${afiliado.primer_apellido} ${afiliado.segundo_apellido}`.toLowerCase().includes(lowerCaseQuery)
    ).slice(0, 100);
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
