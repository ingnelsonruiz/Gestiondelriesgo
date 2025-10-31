
'use server';

import { writeFile, readdir, readFile, stat, rm, access, mkdir } from 'fs/promises';
import { join } from 'path';
import * as XLSX from 'xlsx';
import { obtenerDatosDePrestadores } from '@/services/prestadores-service';

const VALID_MUNICIPIOS_GESTANTE = [
    "CODAZZI", "BECERRIL", "VALLEDUPAR", "LA PAZ", "CHIMICHAGUA", "SANTA MARTA",
    "ARACATACA", "FUNDACION", "CIENAGA", "PUEBLO BELLO", "SABANAS DE SAN ANGEL",
    "DIBULLA", "MAICAO", "MANAURE", "RIOHACHA", "HATONUEVO", "SAN JUAN DEL CESAR",
    "BARRANCAS", "FONSECA", "ALBANIA", "DISTRACCION", "URIBIA"
];


export async function getIpsList(): Promise<string[]> {
    try {
        const data = await obtenerDatosDePrestadores();
        const ipsList = data.map(row => row.Nombre).filter(Boolean);
        return ipsList;
    } catch (error) {
        console.error("Error al obtener la lista de IPS desde Google Sheets:", error);
        throw error;
    }
}

export async function checkGoogleSheetConnection() {
    try {
        const data = await obtenerDatosDePrestadores();
        return { success: true, data: data.slice(0, 5), count: data.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


function validateGestanteFileContent(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const rows = content.split(/\r?\n/);

  const dataRows = rows.slice(1);

  dataRows.forEach((row, rowIndex) => {
    if (row.trim() === '') return;

    let columns = row.split(/\t/);
    
    const tipoDoc = columns[1];
    const validTiposDoc = ["CC", "MS", "RC", "TI", "PA", "CD", "AS", "PT"];
    if (tipoDoc && !validTiposDoc.includes(tipoDoc)) {
      errors.push({
        location: `Fila ${rowIndex + 2}, Columna 2`,
        type: 'Valor no válido',
        description: `El tipo de documento "${tipoDoc}" no es válido. Valores esperados: ${validTiposDoc.join(', ')}.`,
      });
    }

    const sexo = columns[9];
    if (sexo && sexo.trim().toUpperCase() !== 'FEMENINO') {
        errors.push({
            location: `Fila ${rowIndex + 2}, Columna 10`,
            type: 'Valor no válido',
            description: `El valor para Sexo debe ser "Femenino". Se encontró "${sexo}".`,
        });
    }

    const fechaNacimiento = columns[7];
    const dateRegex = /^\d{1,2}\/\d{2}\/\d{4}$/; // D/MM/YYYY or DD/MM/YYYY
    if (fechaNacimiento && !dateRegex.test(fechaNacimiento)) {
        errors.push({
            location: `Fila ${rowIndex + 2}, Columna 8`,
            type: 'Formato incorrecto',
            description: `El formato de fecha debe ser DD/MM/YYYY. Se encontró "${fechaNacimiento}".`,
        });
    }

    const municipioResidencia = columns[14];
    if (municipioResidencia && !VALID_MUNICIPIOS_GESTANTE.includes(municipioResidencia.trim().toUpperCase())) {
        errors.push({
            location: `Fila ${rowIndex + 2}, Columna 15`,
            type: 'Valor no válido',
            description: `El municipio "${municipioResidencia}" no es válido.`,
        });
    }
  });

  return errors;
}

function validateRcvFileContent(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const rows = content.split(/\r?\n/);

  const dataRows = rows.slice(3); 

  dataRows.forEach((row, rowIndex) => {
    if (row.trim() === '') return;

    let columns = row.split(/\t/);

    const tipoDoc = columns[5];
    const validTiposDoc = ["CC", "MS", "RC", "TI", "PA", "CD", "AS", "PT"];
    if (tipoDoc && !validTiposDoc.includes(tipoDoc)) {
      errors.push({
        location: `Fila ${rowIndex + 4}, Columna 6`,
        type: 'Valor no válido',
        description: `El tipo de documento "${tipoDoc}" no es válido. Valores esperados: ${validTiposDoc.join(', ')}.`,
      });
    }
    
    const fechaNacimiento = columns[7];
    const dateRegex = /^\d{4}\/\d{2}\/\d{1,2}$/; // YYYY/MM/D or YYYY/MM/DD
    if (fechaNacimiento && !dateRegex.test(fechaNacimiento)) {
        errors.push({
            location: `Fila ${rowIndex + 4}, Columna 8`,
            type: 'Formato incorrecto',
            description: `El formato de fecha debe ser AAAA/MM/DD. Se encontró "${fechaNacimiento}".`,
        });
    }
  });


  return errors;
}


export interface ValidationError {
  location: string;
  type: string;
  description: string;
}

export async function validateFile(file: File, validatorType: 'gestante' | 'rcv') {
    try {
        const data = await file.arrayBuffer();
        let fileContentForValidation: string;
        
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true, dateNF: 'dd/mm/yyyy' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (validatorType === 'rcv') {
            fileContentForValidation = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t", dateNF: 'yyyy/mm/dd' });
        } else {
             fileContentForValidation = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t", dateNF: 'dd/mm/yyyy' });
        }
        
        const validationErrors = validatorType === 'gestante' 
            ? validateGestanteFileContent(fileContentForValidation)
            : validateRcvFileContent(fileContentForValidation);

        return { errors: validationErrors };

    } catch (error: any) {
        console.error('Error procesando el archivo:', error);
        return { errors: [], message: error.message || 'Ocurrió un error al procesar el archivo.' };
    }
}

async function consolidateFiles(year: string, month: string, validatorType: 'gestante' | 'rcv') {
    const monthDir = join(process.cwd(), 'public', 'uploads', validatorType, year, month);
    const consolidatedDir = join(process.cwd(), 'public', 'Mes consolidado', validatorType, year, month);
    
    await mkdir(consolidatedDir, { recursive: true });

    const consolidatedFileName = `consolidated-${month}-${year}.csv`;
    const consolidatedFilePath = join(consolidatedDir, consolidatedFileName);
    
    try {
        await access(consolidatedFilePath);
        await rm(consolidatedFilePath);
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            console.error('Error removing old consolidated file:', error);
        }
    }

    let filesToConsolidate: string[] = [];
    try {
        const itemsInMonthDir = await readdir(monthDir, { withFileTypes: true });
        filesToConsolidate = itemsInMonthDir
            .filter(item => item.isFile() && (item.name.endsWith('.csv') || item.name.endsWith('.txt')))
            .map(item => item.name);
    } catch(e) {
        return;
    }
    
    if(filesToConsolidate.length === 0) return;

    let consolidatedContent = '';
    let isFirstFile = true;

    for (const fileName of filesToConsolidate) {
        const filePath = join(monthDir, fileName);
        const fileContent = await readFile(filePath, 'utf-8');
        
        const rows = fileContent.split(/\r?\n/).filter(row => row.trim() !== '');
        
        if (isFirstFile) {
            consolidatedContent += rows.join('\n');
            isFirstFile = false;
        } else {
            consolidatedContent += '\n' + rows.slice(1).join('\n');
        }
    }

    if (consolidatedContent.startsWith('\uFEFF')) {
        consolidatedContent = consolidatedContent.substring(1);
    }
    
    const BOM = '\uFEFF';
    await writeFile(consolidatedFilePath, BOM + consolidatedContent, 'utf-8');

    console.log(`Consolidated file created at: ${consolidatedFilePath}`);
}

export async function checkForExistingFile(year: string, month: string, validatorType: 'gestante' | 'rcv'): Promise<string | null> {
    if (!year || !month) {
        return null;
    }

    const targetDir = join(process.cwd(), 'public', 'uploads', validatorType, year, month);

    try {
        await access(targetDir);
        const filesInDir = await readdir(targetDir);
        // This is a simplified check. It assumes any existing file for that month/year should be prompted for overwrite.
        return filesInDir.length > 0 ? filesInDir[0] : null;
    } catch (error) {
        return null;
    }
}


export async function uploadFile(formData: FormData) {
  const file = formData.get('file') as File;
  const year = formData.get('year') as string;
  const month = formData.get('month') as string;
  const fileToOverwrite = formData.get('fileToOverwrite') as string | null;
  const validatorType = formData.get('validatorType') as 'gestante' | 'rcv';

  if (!file) {
    return { success: false, error: 'No file provided.' };
  }
  if (!year || !month) {
    return { success: false, error: 'Year or month not provided.' };
  }
   if (!validatorType) {
    return { success: false, error: 'Validator type not provided.' };
  }


  const targetDir = join(process.cwd(), 'public', 'uploads', validatorType, year, month);
  await mkdir(targetDir, { recursive: true });
  
  try {
     if (fileToOverwrite) {
        const oldFilePath = join(targetDir, fileToOverwrite);
        try {
            await rm(oldFilePath);
            console.log(`Overwritten file: ${oldFilePath}`);
        } catch (rmError: any) {
            if (rmError.code !== 'ENOENT') {
                console.error(`Could not delete file to be overwritten: ${rmError.message}`);
            }
        }
    }
    const bytes = await file.arrayBuffer();
    
    let buffer: Buffer;
    let intermediateFileName: string;

    const BOM = '\uFEFF';

    
    const workbook = XLSX.read(bytes, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    let csvContent;
    if (validatorType === 'rcv') {
        csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t", dateNF: 'yyyy/mm/dd' });
    } else {
        csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t", dateNF: 'dd/mm/yyyy' });
    }

    buffer = Buffer.from(BOM + csvContent, 'utf-8');
    intermediateFileName = `${file.name.replace(/\.[^/.]+$/, "")}.csv`;


    const finalFileName = `${intermediateFileName}`;
    
    const path = join(targetDir, finalFileName);
    await writeFile(path, buffer);
    
    await consolidateFiles(year, month, validatorType);

    const publicPath = `/uploads/${validatorType}/${year}/${month}/${finalFileName}`;

    return { success: true, filePath: publicPath };
  } catch (error: any) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
}

function formatValidatorType(type: string): string {
    if (type.toLowerCase() === 'rcv') {
        return 'RCV';
    }
    return type.charAt(0).toUpperCase() + type.slice(1);
}

export async function readDirectory(): Promise<any[]> {
    const baseDir = join(process.cwd(), 'public', 'Mes consolidado');
    const allFiles: any[] = [];
    
    try {
        await access(baseDir);
        const validatorTypes = await readdir(baseDir);
        for (const validatorType of validatorTypes) {
            const validatorTypePath = join(baseDir, validatorType);
            const validatorTypeStat = await stat(validatorTypePath);

            if (validatorTypeStat.isDirectory()) {
                const years = await readdir(validatorTypePath);
                for (const year of years) {
                    const yearPath = join(validatorTypePath, year);
                    const yearStat = await stat(yearPath);

                    if (yearStat.isDirectory()) {
                        const months = await readdir(yearPath);
                        for (const month of months) {
                            const monthPath = join(yearPath, month);
                            const monthStat = await stat(monthPath);
                            if (monthStat.isDirectory()) {
                                const files = await readdir(monthPath);
                                for (const file of files) {
                                    const filePath = join(monthPath, file);
                                    const fileStat = await stat(filePath);
                                    if (fileStat.isFile()) {
                                        allFiles.push({
                                            name: file,
                                            path: `/Mes consolidado/${validatorType}/${year}/${month}/${file}`,
                                            size: fileStat.size,
                                            lastModified: fileStat.mtime.toLocaleString(),
                                            year,
                                            month,
                                            type: formatValidatorType(validatorType)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.log(`Directory ${baseDir} does not exist. Skipping.`);
        } else {
            console.error(`Could not read the directory 'Mes consolidado':`, error);
            throw error;
        }
    }
    
    return allFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
}


export async function readIndividualUploads(): Promise<any[]> {
    const baseDir = join(process.cwd(), 'public', 'uploads');
    const allFiles: any[] = [];

    try {
        const validatorTypes = await readdir(baseDir);
        for (const validatorType of validatorTypes) {
             const validatorTypePath = join(baseDir, validatorType);
            const validatorTypeStat = await stat(validatorTypePath);
            if(validatorTypeStat.isDirectory()){
                const years = await readdir(validatorTypePath);
                for (const year of years) {
                    const yearPath = join(validatorTypePath, year);
                    const yearStat = await stat(yearPath);

                    if (yearStat.isDirectory()) {
                        const months = await readdir(yearPath);
                        for (const month of months) {
                            const monthPath = join(yearPath, month);
                            const monthStat = await stat(monthPath);
                            if (monthStat.isDirectory()) {
                                const files = await readdir(monthPath);
                                for (const file of files) {
                                    const filePath = join(monthPath, file);
                                    const fileStat = await stat(filePath);
                                    if (fileStat.isFile()) {
                                        const [ips, ...rest] = file.split('-');
                                        const originalName = rest.join('-');
                                        allFiles.push({
                                            name: originalName,
                                            ips,
                                            path: `/uploads/${validatorType}/${year}/${month}/${file}`,
                                            size: fileStat.size,
                                            lastModified: fileStat.mtime.toLocaleString(),
                                            year,
                                            month,
                                            type: formatValidatorType(validatorType)
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            console.log(`Directory ${baseDir} does not exist. Skipping.`);
        } else {
            console.error(`Could not read the directory 'uploads':`, error);
        }
    }
    return allFiles.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
}
