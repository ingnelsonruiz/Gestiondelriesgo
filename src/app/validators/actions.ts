
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
