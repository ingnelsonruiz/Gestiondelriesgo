
'use server';

import * as XLSX from 'xlsx';

const VALID_MUNICIPIOS_GESTANTE = [
    "CODAZZI", "BECERRIL", "VALLEDUPAR", "LA PAZ", "CHIMICHAGUA", "SANTA MARTA",
    "ARACATACA", "FUNDACION", "CIENAGA", "PUEBLO BELLO", "SABANAS DE SAN ANGEL",
    "DIBULLA", "MAICAO", "MANAURE", "RIOHACHA", "HATONUEVO", "SAN JUAN DEL CESAR",
    "BARRANCAS", "FONSECA", "ALBANIA", "DISTRACCION", "URIBIA"
];

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
