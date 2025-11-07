
'use server';

import * as XLSX from 'xlsx';
import Papa from 'papaparse';
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
        
        if (!/^\d{4}\/\d{2}\/\d{2}$/.test(String(value))) {
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


async function validateRcvFileContent(rows: string[][]): Promise<ValidationError[]> {
  const afiliadosSet = await getAfiliadosIdSet();
   if (!afiliadosSet) {
    throw new Error("No se pudo cargar la base de datos de afiliados para la validación.");
  }
  
  let dataStartIndex = 0;
  while(dataStartIndex < rows.length && !/^\d+$/.test(rows[dataStartIndex][0])) {
      dataStartIndex++;
  }

  const dataRows = rows.slice(dataStartIndex);
  const affiliateErrors: ValidationError[] = [];

  // --- PRIMER MOMENTO: Validación de Afiliados ---
  dataRows.forEach((columns, rowIndex) => {
    if (!columns || columns.length < 7 || columns.every(col => col === null || col === '')) return;
    
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
    if (!columns || columns.length === 0 || columns.every(col => col === null || col === '')) return;

    const NORM = (s: any) => (s || '').toString().trim().toUpperCase();

    const validateOptions = (colIdx: number, validOptions: string[], colName: string, allowBlank = false) => {
        if (colIdx > columns.length) return; // Skip if column does not exist
        const value = NORM(columns[colIdx - 1]);
        if (allowBlank && !value) return;
        if (value && !validOptions.map(opt => NORM(opt)).includes(value)) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no válido',
                description: `"${columns[colIdx - 1]}" no es una opción válida para ${colName}. Opciones: ${validOptions.join(', ')}`,
            });
        }
    };
    
    const validateDate = (colIdx: number, colName: string, allowBlank = false) => {
        if (colIdx > columns.length) return;
        const value = columns[colIdx - 1];
        if (allowBlank && (!value || String(value).trim() === '')) return;
        if (value && !/^\d{4}\/\d{2}\/\d{2}$/.test(String(value)) && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Formato de fecha incorrecto',
                description: `El formato para ${colName} debe ser AAAA/MM/DD. Se encontró "${value}".`,
            });
        }
    };

    const validateNumber = (colIdx: number, colName: string, allowBlank = false) => {
      if (colIdx > columns.length) return;
      const value = columns[colIdx-1];
       if (allowBlank && (!value || String(value).trim() === '')) return;
       if (value && isNaN(Number(String(value).replace(',','.')))) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no numérico',
                description: `El campo ${colName} debe ser un número. Se encontró "${value}".`,
            });
       }
    };

    // --- Applying rules based on the 125-column structure ---

    if (!/^\d+$/.test(String(columns[0]))) errors.push({ location: `Fila ${i}, Col 1`, type: 'Inválido', description: 'El consecutivo (N°) debe ser un número entero.' });

    // Columns 2-5: Names (text, no specific validation)
    validateOptions(6, ["CC", "MS", "RC", "TI", "PA", "CD", "AS", "PT"], "TI IDENTIFICIÓN");
    // Column 7: ID (validated in first pass)
    validateDate(8, "FECHA DE NACIMIENTO");
    // Columns 9-10: Calculated fields
    validateOptions(11, ["FEMENINO", "MASCULINO"], "SEXO");
    validateOptions(12, ["S", "C"], "RÉGIMEN DE AFILACIÓN");
    validateOptions(13, ["INDÍGENA", "ROM (GITANO)", "RAIZAL DEL ARCHIPIELAGO", "NEGRO (A), MULATO, AFROAMERICANO", "MESTIZO", "NINGUNAS DE LAS ANTERIORES"], "PERTENENCIA ÉTNICA");
    // Column 14: GRUPO POBLACIONAL (text, no specific options)
    validateOptions(15, ["WAYUU", "ARHUACO", "WIWA", "YUKPA", "KOGUI", "INGA", "KANKUAMO", "CHIMILA", "ZENU", "SIN ETNIA"], "ETNIA");
    // Columns 16-23: Location and IPS info (text)
    validateDate(24, "FECHA INSCRIPCION PROGRAMA DE HTA - DM");
    validateOptions(25, ["SI", "NO"], "FUMA");
    validateOptions(26, ["SI", "NO"], "CONSUMO DE ALCOHOL");
    validateOptions(27, ["SI", "NO"], "DX CONFIRMADO HTA");
    validateDate(28, "FECHA DX HTA", true);
    validateOptions(29, ["SI", "NO"], "DX CONFIRMADO DM");
    validateDate(30, "FECHA DX DM", true);
    validateOptions(31, ["TIPO 1 INSULINODEPENDIENTE", "TIPO 2 NO INSULINODEPENDIENTE", "NO APLICA"], "TIPO DE DM");
    validateOptions(32, ["HTA O DM", "AUTOINMUNE", "NEFROPATÍA OBSTRUCTIVA", "ENFERMEDAD POLIQUISTICA", "NO TIENE ERC", "OTRAS"], "Etiología de la ERC");
    validateNumber(33, "TENSIÓN ARTERIAL SISTÓLICA AL INGRESO A BASE");
    validateNumber(34, "TENSIÓN ARTERIAL DIASTÓLICA AL INGRESO A BASE");
    // Column 35: Calculated
    validateOptions(36, ["SI", "NO"], "HTA CONTROLADA");
    validateNumber(37, "ÚLTIMO PESO");
    validateNumber(38, "TALLA");
    // Columns 39-40: Calculated
    validateNumber(41, "ÚLTIMA MEDICIÓN DE PERIMETRO ABDOMINAL");
    // Column 42: Calculated
    validateOptions(43, ["RIESGO ALTO", "RIESGO BAJO", "RIESGO MODERADO", "NO SE CLASIFICO"], "CLASIFICACION DEL RCV ACTUAL AL INGRESO A BASE");
    validateDate(44, "FECHA DE CLASIFICACIÓN DE RCV AL INGRESO A BASE");
    // Column 45: Calculated
    validateDate(46, "FECHA DE CLASIFICACIÓN DE RCV", true);
    validateNumber(47, "HEMOGRAMA", true);
    validateDate(48, "FECHA DEL HEMOGRAMA", true);
    validateNumber(49, "GLICEMIA BASAL", true);
    validateDate(50, "FECHA DE GLICEMIA BASAL", true);
    validateOptions(51, ["NORMAL", "PROTEINURA", "HEMATURIA", "OTRA"], "PARCIAL DE ORINA", true);
    validateDate(52, "FECHA PARCIAL DE ORINA", true);
    validateNumber(53, "CREATININA SANGRE (mg/dl)", true);
    validateDate(54, "FECHA CREATININA SANGRE", true);
    // PERFIL LIPIDICO
    validateNumber(55, "COLESTEROL TOTAL", true);
    validateNumber(56, "HDL", true);
    validateNumber(57, "LDL", true);
    validateNumber(58, "TRIGLICERIDOS", true);
    validateDate(59, "FECHA PERFIL LIPIDICO", true);

    validateDate(60, "FECHA DE SOLICITUD DE HEMOGLOBINA GLICOSILADA", true);
    validateNumber(61, "REPORTE DE HEMOGLOBINA GLICOSILADA", true);
    validateDate(62, "FECHA DE REPORTE DE HEMOGLOBINA GLICOSILADA", true);
    validateOptions(63, ["SI", "NO"], "DM CONTROLADA", true);
    validateNumber(64, "ALBUMINURIA", true);
    validateDate(65, "FECHA ALBUMINURIA", true);
    validateOptions(66, ["NORMAL", "ENF. CORONARIA", "TRANS. RITMO", "HIPERTROFIA VENTRICULAR", "HIPERTROFIA AURICULAR", "OTRO"], "REPORTE DE EKG", true);
    validateDate(67, "FECHA DE EKG", true);
    validateOptions(68, ["SI", "NO"], "Resultado Ecocardiograma", true);
    validateDate(69, "FECHA DE REPORTE DEL ECOCARDIOGRAMA", true);

    // Columns 70-80 are ignored as requested

    // Monthly controls (columns 81 to 104)
    for (let j = 0; j < 12; j++) {
        const baseCol = 81 + (j * 2);
        validateDate(baseCol, `Fecha Control ${j + 1}`, true);
        validateOptions(baseCol + 1, ["MEDICO", "ENFERMERA", "AUX. ENFERMERIA", "MEDICO GRAL", "MEDICO Y ENFERMERA"], `Profesional Control ${j + 1}`, true);
    }
    
    validateDate(105, "FECHA DE PROXIMO CONTROL", true);
    validateNumber(106, "ÚLTIMA TENSIÓN ARTERIAL SISTÓLICA");
    validateNumber(107, "ÚLTIMA TENSIÓN ARTERIAL DIASTÓLICA");
    // Columns 108-110: Calculated
    
    // Columns 111-117: Medications (text)
    validateOptions(118, ["SI", "NO"], "ADHERENCIA AL TRATAMIENTO FARMACOLOGICO", true);
    // Column 119: Remitido a (text)
    validateDate(120, "FECHA DE REMISION", true);
    // Column 121-122: Complicaciones, Novedades (text)
    // Column 123: Causa de muerte (text)
    validateDate(124, "FECHA DE MUERTE", true);
    // Column 125: Observaciones (text)
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
        if (validatorType === 'rcv') {
            const text = await file.text();
            return new Promise((resolve) => {
                Papa.parse<string[]>(text, {
                    delimiter: ';',
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const validationErrors = await validateRcvFileContent(results.data);
                        resolve({ errors: validationErrors });
                    },
                    error: (error: Error) => {
                        console.error('Error procesando el archivo CSV:', error);
                        resolve({ errors: [], message: error.message || 'Ocurrió un error al procesar el archivo CSV.' });
                    }
                });
            });
        } else { // 'gestante'
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array', cellDates: false, dateNF: 'yyyy/mm/dd' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            // Using `header: 1` converts the sheet to an array of arrays.
            // `defval: null` ensures empty cells are null, not omitted.
            const rowsAsArray: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, raw: false, dateNF: 'yyyy/mm/dd' });
            const validationErrors = await validateGestanteFileContent(rowsAsArray);
            return { errors: validationErrors };
        }
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
    // The file extension is now always .csv for RCV. Gestantes remains .xlsx.
    const fileExtension = module === 'RCV' ? '.csv' : '.xlsx';

    const baseDir = path.join(process.cwd(), 'public', baseFolderName);
    const dptoDir = path.join(baseDir, NORM(provider.departamento));
    const providerDir = path.join(dptoDir, NORM(provider.razonSocial));
    const yearDir = path.join(providerDir, year);

    const fileName = `${NORM(month)}${fileExtension}`;
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

    