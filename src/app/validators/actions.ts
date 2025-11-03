'use server';

import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logFileUpload } from '../admin/actions';

const VALID_MUNICIPIOS_GESTANTE = [
    "CODAZZI", "BECERRIL", "VALLEDUPAR", "LA PAZ", "CHIMICHAGUA", "SANTA MARTA",
    "ARACATACA", "FUNDACION", "CIENAGA", "PUEBLO BELLO", "SABANAS DE SAN ANGEL",
    "DIBULLA", "MAICAO", "MANAURE", "RIOHACHA", "HATONUEVO", "SAN JUAN DEL CESAR",
    "BARRANCAS", "FONSECA", "ALBANIA", "DISTRACCION", "URIBIA"
];

function validateGestanteFileContent(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const rows = content.split(/\r?\n/);

  // Asumimos que los encabezados están en las primeras 3 filas y los datos empiezan desde la 4ta.
  const dataRows = rows.slice(3); 

  dataRows.forEach((row, rowIndex) => {
    const i = rowIndex + 4; // Fila real en el excel
    if (row.trim() === '') return;

    let columns = row.split(/\t/);
    
    // Función para normalizar texto para comparación
    const NORM = (s: string) => (s || '').trim().toUpperCase();

    const validateOptions = (colIdx: number, validOptions: string[], colName: string) => {
        const value = NORM(columns[colIdx - 1]);
        if (value && value !== 'SIN DATOS' && value !== 'NO APLICA' && !validOptions.map(opt => NORM(opt)).includes(value)) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no válido',
                description: `"${value}" no es una opción válida para ${colName}. Opciones: ${validOptions.join(', ')}`,
            });
        }
    };
    
    const validateDate = (colIdx: number, colName: string) => {
        const value = columns[colIdx - 1];
        // Permite "sin datos", "no aplica" o celdas vacías, pero si hay algo, debe ser fecha.
        if (value && NORM(value) !== 'SIN DATOS' && NORM(value) !== 'NO APLICA' && !/^\d{4}\/\d{2}\/\d{1,2}$/.test(value)) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Formato de fecha incorrecto',
                description: `El formato para ${colName} debe ser AAAA/MM/DD. Se encontró "${value}".`,
            });
        }
    };

    // --- Aplicando reglas basadas en la estructura ---

    // Col 2: Tipo de documento
    validateOptions(2, ["CC", "MS", "TI", "PA", "CD", "AS", "CE", "PE"], "Tipo de documento");
    if (NORM(columns[1]) === 'RC') {
        errors.push({ location: `Fila ${i}, Col 2`, type: 'Inválido', description: 'El tipo de documento "RC" no está permitido.' });
    }

    // Col 10: Sexo
    validateOptions(10, ["FEMENINO"], "Sexo");

    // Col 11: Régimen
    validateOptions(11, ["S", "C"], "Régimen Afiliación");

    // Col 12: Pertenencia Étnica
    validateOptions(12, ["INDÍGENA", "ROM (GITANO)", "RAIZAL DEL ARCHIPIELAGO", "NEGRO (A), MULATO, AFROAMERICANO", "MESTIZO", "NINGUNAS DE LAS ANTERIORES"], "Pertenencia Étnica");

    // Col 15: Municipio de Residencia
    const municipio = NORM(columns[14]);
    if (municipio && !VALID_MUNICIPIOS_GESTANTE.includes(municipio)) {
         errors.push({ location: `Fila ${i}, Col 15`, type: 'Valor no válido', description: `El municipio "${columns[14]}" no es válido.` });
    }
    
    // Col 16: Zona
    validateOptions(16, ["RURAL", "URBANA"], "Zona");

    // Col 17: Etnia
    const etnia = NORM(columns[16]);
    const pertenencia = NORM(columns[11]);
    const etniasValidas = ["WAYUU", "ARHUACO", "WIWA", "YUKPA", "KOGUI", "INGA", "KANKUAMO", "CHIMILA", "ZENU"];
    if (pertenencia === 'INDÍGENA' && etnia === 'SIN ETNIA') {
        errors.push({ location: `Fila ${i}, Col 17`, type: 'Inconsistencia', description: 'Si la pertenencia es Indígena, la Etnia no puede ser "Sin Etnia".' });
    }
    if ((pertenencia === 'NINGUNAS DE LAS ANTERIORES' || pertenencia === 'MESTIZO') && etniasValidas.includes(etnia)) {
        errors.push({ location: `Fila ${i}, Col 17`, type: 'Inconsistencia', description: `Si la pertenencia no es Indígena, no puede seleccionar una Etnia específica.` });
    }

    // Fechas (Ejemplos)
    validateDate(8, "Fecha de Nacimiento");
    validateDate(29, "Fecha de diagnostico del embarazo");
    validateDate(30, "Fecha de Ingreso al Control Prenatal");
    validateDate(31, "FUM");

    // Lógica de fechas dependientes
    const fum = new Date(columns[30]);
    const fechaDiag = new Date(columns[28]);
    const fechaIngreso = new Date(columns[29]);
    if (fechaDiag < fum) {
        errors.push({ location: `Fila ${i}, Col 29`, type: 'Inconsistencia', description: 'La fecha de diagnóstico no puede ser anterior a la FUM.' });
    }
    if (fechaIngreso < fechaDiag) {
        errors.push({ location: `Fila ${i}, Col 30`, type: 'Inconsistencia', description: 'La fecha de ingreso al control no puede ser anterior a la fecha de diagnóstico.' });
    }

    // Col 62: Clasificación del riesgo
    if (!columns[61] || NORM(columns[61]) === '') {
       errors.push({ location: `Fila ${i}, Col 62`, type: 'Campo requerido', description: 'La clasificación del riesgo no puede estar vacía.' });
    }
    
    // Col 81-82: Pruebas VIH
    validateDate(81, "Fecha Toma Prueba VIH Primer Tamizaje");
    validateOptions(82, ["POSITIVO", "NEGATIVO"], "Resultado Primer Tamizaje prueba de VIH");

    // Col 87-88: Pruebas Sífilis
    validateDate(87, "Fecha Primera Prueba Treponemica Rapida Sifilis");
    validateOptions(88, ["POSITIVO", "NEGATIVO"], "Resultado Primera Prueba Treponemica Rápida Sífilis");

    // Col 107: Urocultivo
    validateDate(106, "Fecha de Toma de Urocultivo");
    if(columns[105] && !columns[106]) {
        errors.push({ location: `Fila ${i}, Col 107`, type: 'Campo requerido', description: 'Si hay fecha de urocultivo, debe haber un resultado.' });
    }

  });

  return errors;
}


function validateRcvFileContent(content: string): ValidationError[] {
  const errors: ValidationError[] = [];
  const rows = content.split(/\r?\n/);

  const dataRows = rows.slice(3); 

  dataRows.forEach((row, rowIndex) => {
    const i = rowIndex + 4; // Fila real en el excel
    if (row.trim() === '') return;

    let columns = row.split(/\t/);

    const validateOptions = (colIdx: number, validOptions: string[], colName: string) => {
        const value = columns[colIdx - 1]?.trim().toUpperCase();
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
        if (value && !/^\d{4}\/\d{2}\/\d{1,2}$/.test(value)) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Formato de fecha incorrecto',
                description: `El formato para ${colName} debe ser AAAA/MM/DD. Se encontró "${value}".`,
            });
        }
    };

    const validateNumber = (colIdx: number, colName: string) => {
      const value = columns[colIdx-1];
       if (value && isNaN(Number(value.replace(',','.')))) {
            errors.push({
                location: `Fila ${i}, Col ${colIdx}`,
                type: 'Valor no numérico',
                description: `El campo ${colName} debe ser un número. Se encontró "${value}".`,
            });
       }
    };

    // Aplicando reglas
    if (!/^\d+$/.test(columns[0])) errors.push({ location: `Fila ${i}, Col 1`, type: 'Inválido', description: 'El consecutivo debe ser un número entero.' });

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
        let fileContentForValidation: string;
        
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Se formatea a AAAA/MM/DD para consistencia en la validación
        fileContentForValidation = XLSX.utils.sheet_to_csv(worksheet, { FS: "\t", dateNF: 'yyyy/mm/dd' });
        
        const validationErrors = validatorType === 'gestante' 
            ? validateGestanteFileContent(fileContentForValidation)
            : validateRcvFileContent(fileContentForValidation);

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
        
        // Log activity
        await logFileUpload(provider.razonSocial, module, `${year}/${fileName}`);

        return { success: true, path: filePath };
    } catch (error: any) {
        console.error(`Error al guardar el archivo validado: ${error.message}`);
        throw new Error(`No se pudo guardar el archivo en el servidor. Detalles: ${error.message}`);
    }
}
