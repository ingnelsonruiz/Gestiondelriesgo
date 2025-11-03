
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
  nombre_completo: string; // New field
  fecha_nacimiento: string;
  sexo: string;
}

// --- Afiliado Management (CRUD) ---
const NORM = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

async function readAfiliados(): Promise<Afiliado[]> {
    try {
        await fs.access(AFILIADOS_FILE_PATH);
        const csvText = await fs.readFile(AFILIADOS_FILE_PATH, 'utf8');
        
        return new Promise((resolve, reject) => {
            Papa.parse<any>(csvText, {
                header: true,
                skipEmptyLines: true,
                delimiter: ';', // Set delimiter to semicolon
                transformHeader: (header) => NORM(header),
                complete: (results) => {
                    if (results.errors.length) {
                        console.error("Errores de parseo en Afiliados:", results.errors);
                        return reject(new Error("Error al procesar el archivo de afiliados."));
                    }
                    
                    const afiliados: Afiliado[] = results.data.map(row => {
                        const idTypeKey = Object.keys(row).find(k => k.includes('tipo_documento'));
                        const idNumKey = Object.keys(row).find(k => k.includes('numero_identificacion'));
                        const fullNameKey = Object.keys(row).find(k => k.includes('nombre_completo'));
                        const firstNameKey = Object.keys(row).find(k => k.includes('primer_nombre'));
                        const secondNameKey = Object.keys(row).find(k => k.includes('segundo_nombre'));
                        const firstLastNameKey = Object.keys(row).find(k => k.includes('primer_apellido'));
                        const secondLastNameKey = Object.keys(row).find(k => k.includes('segundo_apellido'));
                        const birthDateKey = Object.keys(row).find(k => k.includes('fecha_nacimiento'));
                        const sexKey = Object.keys(row).find(k => k.includes('genero') || k.includes('sexo'));

                        const primer_nombre = firstNameKey ? row[firstNameKey] || '' : '';
                        const segundo_nombre = secondNameKey ? row[secondNameKey] || '' : '';
                        const primer_apellido = firstLastNameKey ? row[firstLastNameKey] || '' : '';
                        const segundo_apellido = secondLastNameKey ? row[secondLastNameKey] || '' : '';
                        
                        let nombre_completo = fullNameKey ? row[fullNameKey] || '' : '';
                        if (!nombre_completo) {
                           nombre_completo = `${primer_nombre} ${segundo_nombre} ${primer_apellido} ${segundo_apellido}`.replace(/\s+/g, ' ').trim();
                        }

                        return {
                            tipo_identificacion: idTypeKey ? row[idTypeKey] || '' : '',
                            numero_identificacion: idNumKey ? row[idNumKey] || '' : '',
                            primer_nombre,
                            segundo_nombre,
                            primer_apellido,
                            segundo_apellido,
                            nombre_completo,
                            fecha_nacimiento: birthDateKey ? row[birthDateKey] || '' : '',
                            sexo: sexKey ? row[sexKey] || '' : '',
                        };
                    }).filter(a => a.numero_identificacion);

                    resolve(afiliados);
                },
                error: (error: Error) => reject(error),
            });
        });
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`Advertencia: El archivo de afiliados no se encontró en '${AFILIADOS_FILE_PATH}'. Se creará uno vacío.`);
            const headers = "tipo_documento;numero_identificacion;Nombre_completo;fecha_nacimiento;genero;codigo_departamento;codigo_municipio;municipio;estado;direccion;barrio;celular;telefono_1;etnia;grupo_poblacional;grupo_etnico;resguardo;asentamiento;zonificacion";
            await fs.writeFile(AFILIADOS_FILE_PATH, headers + '\n', 'utf8');
            return [];
        }
        throw new Error(`No se pudo leer el archivo de afiliados: ${error.message}`);
    }
}


async function writeAfiliados(afiliados: Afiliado[]): Promise<void> {
    const dataToUnparse = afiliados.map(a => ({
        'tipo_documento': a.tipo_identificacion,
        'numero_identificacion': a.numero_identificacion,
        'Nombre_completo': a.nombre_completo,
        'fecha_nacimiento': a.fecha_nacimiento,
        'genero': a.sexo,
        // Add other fields if necessary for writing back, or keep it simple
    }));

    const csvData = Papa.unparse(dataToUnparse, {
        header: true,
        delimiter: ';',
        columns: ['tipo_documento', 'numero_identificacion', 'Nombre_completo', 'fecha_nacimiento', 'genero']
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
        afiliado.numero_identificacion.includes(query) ||
        afiliado.nombre_completo.toLowerCase().includes(lowerCaseQuery)
    ).slice(0, 100);
}

export async function addAfiliado(newAfiliado: Omit<Afiliado, 'nombre_completo'>): Promise<{ success: boolean; error?: string }> {
    try {
        const afiliados = await readAfiliados();
        if (afiliados.some(a => a.numero_identificacion === newAfiliado.numero_identificacion)) {
            return { success: false, error: 'Ya existe un afiliado con el mismo número de identificación.' };
        }
        const nombre_completo = `${newAfiliado.primer_nombre} ${newAfiliado.segundo_nombre} ${newAfiliado.primer_apellido} ${newAfiliado.segundo_apellido}`.replace(/\s+/g, ' ').trim();
        const afiliadoCompleto = { ...newAfiliado, nombre_completo };

        afiliados.push(afiliadoCompleto);
        await writeAfiliados(afiliados);
        await logAdminAction('Añadir Afiliado', `Añadido ${afiliadoCompleto.nombre_completo} (${afiliadoCompleto.numero_identificacion})`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateAfiliado(updatedAfiliado: Omit<Afiliado, 'nombre_completo'>): Promise<{ success: boolean; error?: string }> {
    try {
        let afiliados = await readAfiliados();
        const index = afiliados.findIndex(a => a.numero_identificacion === updatedAfiliado.numero_identificacion);
        if (index === -1) {
            return { success: false, error: 'Afiliado no encontrado para actualizar.' };
        }
        const nombre_completo = `${updatedAfiliado.primer_nombre} ${updatedAfiliado.segundo_nombre} ${updatedAfiliado.primer_apellido} ${updatedAfiliado.segundo_apellido}`.replace(/\s+/g, ' ').trim();
        afiliados[index] = { ...updatedAfiliado, nombre_completo };

        await writeAfiliados(afiliados);
        await logAdminAction('Actualizar Afiliado', `Actualizado ${nombre_completo} (${updatedAfiliado.numero_identificacion})`);
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
