
'use server';

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logFileUpload } from '../admin/actions';
import { getAfiliadosIdSet } from '@/lib/user-validator';

const VALID_MUNICIPIOS_GESTANTE = [
    "CODAZZI", "BECERRIL", "VALLEDUPAR", "LA PAZ", "CHIMICHAGUA", "SANTA MARTA",
    "ARACATACA", "FUNDACION", "CIENAGA", "PUEBLO BELLO", "SABANAS DE SAN ANGEL",
    "DIBULLA", "MAICAO", "MANAURE", "RIOHACHA", "HATONUEVO", "SAN JUAN DEL CESAR",
    "BARRANCAS", "FONSECA", "ALBANIA", "DISTRACCION", "URIBIA"
];

async function validateGestanteFileContent(rows: any[][]): Promise<ValidationError[]> {
  const afiliadosSet = await getAfiliadosIdSet();
  if (!afiliadosSet) {
    throw new Error("No se pudo cargar la base de datos de afiliados para la validación.");
  }

  let dataStartIndex = rows.findIndex(row => row && /^\d+$/.test(String(row[0])));
  if (dataStartIndex === -1) dataStartIndex = 3; 
  
  const dataRows = rows.slice(dataStartIndex);
  const affiliateErrors: ValidationError[] = [];

  // --- PRIMER MOMENTO: Validación de Afiliados ---
  dataRows.forEach((columns, rowIndex) => {
    if (!columns || columns.every(col => col === null || col === '')) return;

    const idAfiliado = columns[2]?.toString().trim();
    if (idAfiliado && !afiliadosSet.has(idAfiliado)) {
        affiliateErrors.push({
            location: `Fila ${rowIndex + dataStartIndex + 1}, Col 3`,
            type: 'Afiliado no encontrado',
            description: `El usuario con identificación "${idAfiliado}" no se encontró en la base de datos de afiliados.`,
        });
    }
  });

  // Si hay errores de afiliación, se detiene y se devuelven solo esos errores.
  if (affiliateErrors.length > 0) {
      return affiliateErrors;
  }

  // --- SEGUNDO MOMENTO: Malla Validadora Completa (si no hay errores de afiliación) ---
  const errors: ValidationError[] = [];
  dataRows.forEach((columns, rowIndex) => {
    const i = rowIndex + dataStartIndex + 1;
    if (!columns || columns.every(col => col === null || col === '')) return;

    const NORM = (s: any) => (s || '').toString().trim().toUpperCase();

    const validateOptions = (colIdx: number, validOptions: string[], colName: string, allowBlank = false) => {
        const value = NORM(columns[colIdx - 1]);
        if (value && value !== 'SIN DATOS' && value !== 'NO APLICA' && !validOptions.map(opt => NORM(opt)).includes(value)) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no válido',
                description: `"${columns[colIdx - 1]}" no es una opción válida para ${colName}. Opciones válidas: ${validOptions.join(', ')}`,
            });
        }
        if (!allowBlank && !value) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Campo requerido',
                description: `El campo ${colName} no puede estar vacío.`,
            });
        }
    };
    
    const validateDate = (colIdx: number, colName: string, required = false) => {
        const value = columns[colIdx - 1];
        if (!value || NORM(value) === 'SIN DATOS' || NORM(value) === 'NO APLICA') {
            if (required) {
                errors.push({ location: `Fila ${i}, Col ${colIdx}`, type: 'Campo requerido', description: `La fecha para ${colName} es obligatoria.` });
            }
            return null;
        }
        
        if (!/^\d{4}\/\d{2}\/\d{1,2}$/.test(String(value))) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Formato de fecha incorrecto',
                description: `El formato para ${colName} debe ser AAAA/MM/DD. Se encontró "${value}".`,
            });
            return null;
        }
        const [year, month, day] = String(value).split('/').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
             errors.push({ location: `Fila ${i}, Col ${colIdx}`, type: 'Fecha inválida', description: `La fecha "${value}" para ${colName} no es una fecha calendario válida.` });
             return null;
        }
        return date;
    };

    validateOptions(2, ["CC", "MS", "TI", "PA", "CD", "AS", "CE", "PE"], "Tipo de documento");
    if (NORM(columns[1]) === 'RC') {
        errors.push({ location: `Fila ${i}, Col 2`, type: 'Valor no permitido', description: 'El tipo de documento "RC" no está permitido.' });
    }
    validateOptions(10, ["FEMENINO"], "Sexo");
    validateOptions(11, ["S", "C"], "Régimen Afiliación");
    validateOptions(12, ["INDÍGENA", "ROM (GITANO)", "RAIZAL DEL ARCHIPIELAGO", "NEGRO (A), MULATO, AFROAMERICANO", "MESTIZO", "NINGUNAS DE LAS ANTERIORES"], "Pertenencia Étnica");
    const municipio = NORM(columns[14]);
    if (municipio && !VALID_MUNICIPIOS_GESTANTE.includes(municipio)) {
         errors.push({ location: `Fila ${i}, Col 15`, type: 'Valor no válido', description: `El municipio "${columns[14]}" no es válido.` });
    }
    validateOptions(16, ["RURAL", "URBANA"], "Zona");
    const etnia = NORM(columns[16]);
    const pertenencia = NORM(columns[11]);
    const etniasValidas = ["WAYUU", "ARHUACO", "WIWA", "YUKPA", "KOGUI", "INGA", "KANKUAMO", "CHIMILA", "ZENU"];
    if (pertenencia === 'INDÍGENA' && etnia === 'SIN ETNIA') {
        errors.push({ location: `Fila ${i}, Col 17`, type: 'Inconsistencia', description: 'Si la pertenencia es Indígena, la Etnia no puede ser "Sin Etnia".' });
    }
    if ((pertenencia === 'NINGUNAS DE LAS ANTERIORES' || pertenencia === 'MESTIZO') && etniasValidas.includes(etnia)) {
        errors.push({ location: `Fila ${i}, Col 17`, type: 'Inconsistencia', description: `Si la pertenencia no es Indígena, no puede seleccionar una Etnia específica.` });
    }
    const fum = validateDate(32, "FUM");
    const fechaDiag = validateDate(30, "Fecha de diagnostico del embarazo");
    const fechaIngreso = validateDate(31, "Fecha de Ingreso al Control Prenatal");
    if (fechaDiag && fum && fechaDiag < fum) {
        errors.push({ location: `Fila ${i}, Col 30`, type: 'Inconsistencia de Fechas', description: 'La fecha de diagnóstico no puede ser anterior a la FUM.' });
    }
    if (fechaIngreso && fechaDiag && fechaIngreso < fechaDiag) {
        errors.push({ location: `Fila ${i}, Col 31`, type: 'Inconsistencia de Fechas', description: 'La fecha de ingreso al control no puede ser anterior a la fecha de diagnóstico.' });
    }
    validateOptions(63, ["ALTO RIESGO OBSTETRICO", "BAJO RIESGO OBSTETRICO"], "Clasificación del riesgo");
    const clasificacionRiesgo = NORM(columns[62]);
    const causasARO = NORM(columns[63]);
    if (clasificacionRiesgo === 'ALTO RIESGO OBSTETRICO' && (!causasARO || causasARO === 'NINGUNO')) {
         errors.push({ location: `Fila ${i}, Col 64`, type: 'Campo requerido', description: 'Si el riesgo es alto, debe especificar la causa.' });
    }
    validateDate(70, "Fecha Toma Prueba VIH Primer Tamizaje");
    validateOptions(71, ["POSITIVO", "NEGATIVO"], "Resultado Primer Tamizaje prueba de VIH", true);
    validateDate(79, "Fecha Primera Prueba Treponemica Rapida Sifilis");
    validateOptions(80, ["POSITIVO", "NEGATIVO"], "Resultado Primera Prueba Treponemica Rápida Sífilis", true);
    const fechaUrocultivo = validateDate(96, "Fecha de Toma de Urocultivo");
    const resultadoUrocultivo = NORM(columns[96]);
    if(fechaUrocultivo && !resultadoUrocultivo) {
        errors.push({ location: `Fila ${i}, Col 97`, type: 'Campo requerido', description: 'Si hay fecha de urocultivo, debe haber un resultado.' });
    }
  });

  return errors;
}


async function validateRcvFileContent(rows: any[][]): Promise<ValidationError[]> {
  const afiliadosSet = await getAfiliadosIdSet();
   if (!afiliadosSet) {
    throw new Error("No se pudo cargar la base de datos de afiliados para la validación.");
  }

  let dataStartIndex = rows.findIndex(row => row && /^\d+$/.test(String(row[0])));
  if (dataStartIndex === -1) dataStartIndex = 3; 

  const dataRows = rows.slice(dataStartIndex); 
  const affiliateErrors: ValidationError[] = [];

  // --- PRIMER MOMENTO: Validación de Afiliados ---
  dataRows.forEach((columns, rowIndex) => {
    if (!columns || columns.every(col => col === null || col === '')) return;
    
    const idAfiliado = columns[6]?.toString().trim();
    if (idAfiliado && !afiliadosSet.has(idAfiliado)) {
        affiliateErrors.push({
            location: `Fila ${rowIndex + dataStartIndex + 1}, Col 7`,
            type: 'Afiliado no encontrado',
            description: `El usuario con identificación "${idAfiliado}" no se encontró en la base de datos de afiliados.`,
        });
    }
  });

  if (affiliateErrors.length > 0) {
      return affiliateErrors;
  }
  
  // --- SEGUNDO MOMENTO: Malla Validadora Completa ---
  const errors: ValidationError[] = [];
  dataRows.forEach((columns, rowIndex) => {
    const i = rowIndex + dataStartIndex + 1;
    if (!columns || columns.every(col => col === null || col === '')) return;

    const validateOptions = (colIdx: number, validOptions: string[], colName: string) => {
        const value = columns[colIdx - 1]?.toString().trim().toUpperCase();
        if (value && !validOptions.map(opt => opt.toUpperCase()).includes(value)) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no válido',
                description: `"${value}" no es una opción válida para ${colName}. Opciones: ${validOptions.join(', ')}`,
            });
        }
    };
    
    const validateDate = (colIdx: number, colName: string) => {
        const value = columns[colIdx - 1];
        if (value && !/^\d{4}\/\d{2}\/\d{1,2}$/.test(String(value))) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Formato de fecha incorrecto',
                description: `El formato para ${colName} debe ser AAAA/MM/DD. Se encontró "${value}".`,
            });
        }
    };

    const validateNumber = (colIdx: number, colName: string) => {
      const value = columns[colIdx-1];
       if (value && isNaN(Number(String(value).replace(',','.')))) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no numérico',
                description: `El campo ${colName} debe ser un número. Se encontró "${value}".`,
            });
       }
    };

    if (!/^\d+$/.test(String(columns[0]))) errors.push({ location: `Fila ${i}, Col 1`, type: 'Inválido', description: 'El consecutivo debe ser un número entero.' });

    validateOptions(6, ["CC", "MS", "RC", "TI", "PA", "CD", "AS", "PT"], "Tipo de documento");
    validateDate(8, "Fecha de Nacimiento");
    validateOptions(11, ["Femenino", "Masculino"], "Sexo");
    validateOptions(12, ["S", "C"], "Regimen Afiliacion");
    validateOptions(13, ["Indígena", "ROM (Gitano)", "Raizal del Archipielago", "Negro (a), Mulato, Afroamericano", "Mestizo", "Ningunas de las Anteriores"], "Pertenencia Etnica");
    validateOptions(15, ["Wayuu", "Arhuaco", "Wiwa", "Yukpa", "Kogui", "Inga", "Kankuamo", "Chimila", "Zenu", "Sin Etnia"], "Etnia");
    validateOptions(19, ["Rural", "Urbana"], "Zona");
    validateDate(24, "Fecha Ingreso al programa");
    validateOptions(25, ["Si", "No"], "DX HTA");
    validateOptions(26, ["Si", "No"], "DX DM");
    validateOptions(27, ["Si", "No"], "DX ERC");
    validateDate(28, "Fecha Diagnóstico ERC");
    validateOptions(29, ["Si", "No"], "DX Obesidad");
    validateDate(30, "Fecha Diagnóstico Obesidad");
    validateOptions(31, ["Tipo 1 Insulinodependiente", "Tipo 2 No Insulinodependiente", "No Aplica"], "Tipo DM");
    validateOptions(32, ["HTA o DM", "Autoinmune", "Nefropatía Obstructiva", "Enfermedad Poliquistica", "No tiene ERC", "Otras"], "Causa ERC");
    validateNumber(33, "TAS");
    validateNumber(34, "TAD");
    validateOptions(36, ["Si", "No"], "Fumador");
    validateNumber(37, "Peso");
    validateNumber(38, "Talla");
    validateNumber(41, "Perimetro Abdominal");
    validateOptions(43, ["Riesgo Alto", "Riesgo Bajo", "Riesgo Moderado", "No se Clasifico"], "Clasificación Riesgo Cardio.");
    validateDate(44, "Fecha Clasificacion RCV");
    validateDate(46, "Fecha Creatinina");
    validateNumber(47, "Resultado Creatinina");
    validateDate(48, "Fecha Microalbuminuria");
    validateNumber(49, "Resultado Microalbuminuria");
    validateDate(50, "Fecha Uroanalisis");
    validateOptions(51, ["Normal", "Proteinura", "Hematuria", "Otra"], "Resultado Uroanalisis");
    validateDate(52, "Fecha Col Total");
    validateNumber(53, "Resultado Col Total");
    validateDate(54, "Fecha Col LDL");
    validateNumber(55, "Resultado Col LDL");
    validateNumber(56, "Resultado Col HDL");
    validateNumber(57, "Resultado Trigliceridos");
    validateNumber(58, "No de Controles RCV");
    validateDate(59, "Fecha Glicemia Basal");
    validateDate(60, "Fecha Hemoglobina Glicosilada");
    validateNumber(61, "Resultado Hemoglobina Glicosilada");
    validateDate(62, "Fecha Prueba de Ojo");
    validateOptions(63, ["Si", "No"], "Resultados Prueba Ojo");
    validateNumber(64, "Dosis Insulina");
    validateDate(65, "Fecha Electrocardiograma");
    validateOptions(66, ["Normal", "Enf. Coronaria", "Trans. Ritmo", "Hipertrofia Ventricular", "Hipertrofia Auricular", "Otro"], "Resultado Electrocardiograma");
    validateDate(67, "Fecha Ecocardiograma");
    validateOptions(68, ["Si", "No"], "Resultado Ecocardiograma");
    validateDate(69, "Fecha Holter");

    for (let j = 0; j < 12; j++) {
        validateDate(75 + j * 2, `Fecha Control ${j + 1}`);
        validateOptions(76 + j * 2, ["Medico", "Enfermera", "Aux. Enfermeria"], `Profesional Control ${j + 1}`);
    }
    
    validateDate(99, "Fecha Ultima Toma TA");
    validateNumber(100, "TAS Ultima Toma");
    validateNumber(101, "TAD Ultima Toma");
    validateOptions(112, ["Si", "No"], "Remisión");
    validateDate(114, "Fecha Hospitalización");
    validateDate(118, "Fecha de Muerte");
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
        
        const workbook = XLSX.read(data, { type: 'array', cellDates: true, dateNF: 'yyyy/mm/dd' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rowsAsArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
        
        const validationErrors = validatorType === 'gestante' 
            ? await validateGestanteFileContent(rowsAsArray)
            : await validateRcvFileContent(rowsAsArray);

        return { errors: validationErrors };

    } catch (error: any) {
        console.error('Error procesando el archivo:', error);
        return { errors: [], message: error.message || 'Ocurrió un error al procesar el archivo.' };
    }
}

export interface SaveValidatedFilePayload {
    file: File;
    provider: {
        nit: string;
        razonSocial: string;
        departamento: string;
    };
    year: string;
    month: string;
    module: 'RCV' | 'Gestantes';
}

export async function saveValidatedFile(payload: SaveValidatedFilePayload) {
    const { file, provider, year, month, module } = payload;
    
    const NORM = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

    const baseFolderName = module === 'RCV' ? 'Validacion_Rcv' : 'Validacion_Gestantes';

    const baseDir = path.join(process.cwd(), 'public', baseFolderName);
    const dptoDir = path.join(baseDir, NORM(provider.departamento));
    const providerDir = path.join(dptoDir, NORM(provider.razonSocial));
    const yearDir = path.join(providerDir, year);

    const fileName = `${NORM(month)}.xlsx`;
    const filePath = path.join(yearDir, fileName);

    try {
        await fs.mkdir(yearDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());

        await fs.writeFile(filePath, buffer);
        
        await logFileUpload(provider.razonSocial, module, `${year}/${fileName}`);

        return { success: true, path: filePath };
    } catch (error: any) {
        console.error(`Error al guardar el archivo validado: ${error.message}`);
        throw new Error(`No se pudo guardar el archivo en el servidor. Detalles: ${error.message}`);
    }
}
