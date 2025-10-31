
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const validationRules = [
    { column: 1, field: "Consecutivo", rule: "Se debe escribir el consecutivo comenzando por el No. 1" },
    { column: 2, field: "Primer Nombre", rule: "Ingresar Primer Nombre" },
    { column: 3, field: "Segundo Nombre", rule: "Ingresar Segundo Nombre" },
    { column: 4, field: "Primer Apellido", rule: "Ingresar Primer Apellido" },
    { column: 5, field: "Segundo Apellido", rule: "Ingresar Segundo Apellido" },
    { column: 6, field: "Tipo de documento", rule: "Opciones: CC, MS, RC, TI, PA, CD, AS, PT" },
    { column: 7, field: "No. De Identificación", rule: "Ingresar el número de identificación" },
    { column: 8, field: "Fecha de Nacimiento", rule: "Formato: año/mes/día" },
    { column: 9, field: "Edad (años)", rule: "Calculado automáticamente. No modificar." },
    { column: 10, field: "Edad (meses)", rule: "Calculado automáticamente. No modificar." },
    { column: 11, field: "Sexo", rule: "Opciones: Femenino, Masculino" },
    { column: 12, field: "Regimen Afiliacion", rule: "Opciones: Subsidiado: S, Contributivo: C" },
    { column: 13, field: "Pertenencia Etnica", rule: "Opciones: Indígena, ROM (Gitano), Raizal, Negro(a)/Afroamericano, Mestizo, Ninguna" },
    { column: 14, field: "Grupo Poblacional", rule: "Opciones: Población Infantil ICBF, Mujer Cabeza de Hogar, Discapacitados, etc." },
    { column: 15, field: "Etnia", rule: "Opciones: Wayuu, Arhuaco, Wiwa, Yukpa, Kogui, Inga, Kankuamo, Chimila, Zenu, Sin Etnia" },
    { column: 16, field: "Departamento Residencia", rule: "Ingresar el departamento de residencia" },
    { column: 17, field: "Municipio de la Ipsi", rule: "Ingresar el municipio de la IPSI" },
    { column: 18, field: "Teléfono", rule: "Ingresar número de teléfono" },
    { column: 19, field: "Zona", rule: "Opciones: Rural, Urbana" },
    { column: 20, field: "Dirección", rule: "Si es zona urbana, ingresar dirección" },
    { column: 21, field: "Asentamiento/Rancheria", rule: "Si es zona rural, ingresar nombre de la comunidad" },
    { column: 22, field: "Código Habilitación IPS", rule: "Ingresar código de habilitación de la IPS" },
    { column: 23, field: "Nombre de la IPS", rule: "Ingresar nombre de la IPS" },
    { column: 24, field: "Fecha Ingreso al programa", rule: "Formato: Año/Mes/Día" },
    { column: 25, field: "DX HTA", rule: "Opciones: Si, No" },
    { column: 26, field: "DX DM", rule: "Opciones: Si, No" },
    { column: 27, field: "DX ERC", rule: "Opciones: Si, No" },
    { column: 28, field: "Fecha Diagnóstico ERC", rule: "Formato: Año/Mes/Día" },
    { column: 29, field: "DX Obesidad", rule: "Opciones: Si, No" },
    { column: 30, field: "Fecha Diagnóstico Obesidad", rule: "Formato: Año/Mes/Día" },
    { column: 31, field: "Tipo DM", rule: "Opciones: Tipo 1, Tipo 2, No Aplica" },
    { column: 32, field: "Causa ERC", rule: "Opciones: HTA o DM, Autoinmune, Obstructiva, etc." },
    { column: 33, field: "TAS", rule: "Ingresar Presión Arterial Sistólica en número" },
    { column: 34, field: "TAD", rule: "Ingresar Presión Arterial Diastólica en número" },
    { column: 35, field: "Clasificacion HTA", rule: "Calculado automáticamente. No modificar." },
    { column: 36, field: "Fumador", rule: "Opciones: Si, No" },
    { column: 37, field: "Peso", rule: "Ingresar el peso en cada control" },
    { column: 38, field: "Talla", rule: "Ingresar la talla en metros, con coma" },
    { column: 39, field: "IMC", rule: "Calculado automáticamente. No modificar." },
    { column: 40, field: "Clasificación IMC", rule: "Calculado automáticamente. No modificar." },
    { column: 41, field: "Perimetro Abdominal", rule: "Ingresar la última medición en número" },
    { column: 42, field: "Clasificación Perimetro Abd", rule: "Calculado automáticamente. No modificar." },
    { column: 43, field: "Clasificación Riesgo Cardio.", rule: "Opciones: Riesgo Alto, Bajo, Moderado, No se Clasifico" },
    { column: 44, field: "Fecha Clasificacion RCV", rule: "Formato: Año/Mes/Día" },
    { column: 45, field: "Estadio ERC", rule: "Calculado automáticamente. No modificar." },
    { column: 46, field: "Fecha Creatinina", rule: "Formato: Año/Mes/Día" },
    { column: 47, field: "Resultado Creatinina", rule: "Ingresar el resultado en número" },
    { column: 48, field: "Fecha Microalbuminuria", rule: "Formato: Año/Mes/Día" },
    { column: 49, field: "Resultado Microalbuminuria", rule: "Ingresar el resultado en número" },
    { column: 50, field: "Fecha Uroanalisis", rule: "Formato: Año/Mes/Día" },
    { column: 51, field: "Resultado Uroanalisis", rule: "Opciones: Normal, Proteinura, Hematuria, Otra" },
    { column: 52, field: "Fecha Col Total", rule: "Formato: Año/Mes/Día" },
    { column: 53, field: "Resultado Col Total", rule: "Ingresar el resultado en número" },
    { column: 54, field: "Fecha Col LDL", rule: "Formato: Año/Mes/Día" },
    { column: 55, field: "Resultado Col LDL", rule: "Ingresar el resultado en número" },
    { column: 56, field: "Resultado Col HDL", rule: "Ingresar el resultado en número" },
    { column: 57, field: "Resultado Trigliceridos", rule: "Ingresar el resultado en número" },
    { column: 58, field: "No de Controles RCV", rule: "Ingresar el resultado en número" },
    { column: 59, field: "Fecha Glicemia Basal", rule: "Formato: Año/Mes/Día" },
    { column: 60, field: "Fecha Hemoglobina Glicosilada", rule: "Formato: Año/Mes/Día" },
    { column: 61, field: "Resultado Hemoglobina Glicosilada", rule: "Ingresar el resultado en número" },
    { column: 62, field: "Fecha Prueba de Ojo", rule: "Formato: Año/Mes/Día" },
    { column: 63, field: "Resultados Prueba Ojo", rule: "Opciones: Si, No" },
    { column: 64, field: "Dosis Insulina", rule: "Ingresar el resultado en número" },
    { column: 65, field: "Fecha Electrocardiograma", rule: "Formato: Año/Mes/Día" },
    { column: 66, field: "Resultado Electrocardiograma", rule: "Opciones: Normal, Enf. Coronaria, etc." },
    { column: 67, field: "Fecha Ecocardiograma", rule: "Formato: Año/Mes/Día" },
    { column: 68, field: "Resultado Ecocardiograma", rule: "Si es Normal: Si, si presenta anomalia: No" },
    { column: 69, field: "Fecha Holter", rule: "Formato: Año/Mes/Día" },
    { column: 70, field: "Adherencia a Controles", rule: "Calculado automáticamente. No modificar." },
    { column: 71, field: "Adherencia a Medicamentos", rule: "Calculado automáticamente. No modificar." },
    { column: 72, field: "Adherencia a Dieta", rule: "Calculado automáticamente. No modificar." },
    { column: 73, field: "Adherencia a Ejercicio", rule: "Calculado automáticamente. No modificar." },
    { column: 74, field: "Adherencia General", rule: "Calculado automáticamente. No modificar." },
    ...Array.from({ length: 12 }, (_, i) => ({ column: 75 + i * 2, field: `Fecha Control ${i + 1}`, rule: "Formato: Año/Mes/Día" })),
    ...Array.from({ length: 12 }, (_, i) => ({ column: 76 + i * 2, field: `Profesional Control ${i + 1}`, rule: "Opciones: Medico, Enfermera, Aux. Enfermeria" })),
    { column: 99, field: "Fecha Ultima Toma TA", rule: "Formato: Año/Mes/Día" },
    { column: 100, field: "TAS Ultima Toma", rule: "Ingresar Presión Arterial Sistólica en número" },
    { column: 101, field: "TAD Ultima Toma", rule: "Ingresar Presión Arterial Diastólica en número" },
    { column: 102, field: "Clasificación HTA Ultima Toma", rule: "Calculado automáticamente. No modificar." },
    { column: 103, field: "Fecha Ultimo Control", rule: "Calculado automáticamente. No modificar." },
    { column: 104, field: "Inasistente", rule: "Calculado automáticamente. No modificar." },
    { column: 105, field: "Medicamento IECA", rule: "Ingresar nombre del medicamento" },
    { column: 106, field: "Medicamento ARA II", rule: "Ingresar nombre del medicamento" },
    { column: 107, field: "Medicamento Calcioantagonista", rule: "Ingresar nombre del medicamento" },
    { column: 108, field: "Medicamento Betabloqueador", rule: "Ingresar nombre del medicamento" },
    { column: 109, field: "Medicamento Diurético", rule: "Ingresar nombre del medicamento" },
    { column: 110, field: "Medicamento Antiarritmico", rule: "Ingresar nombre del medicamento" },
    { column: 111, field: "Otro Medicamento", rule: "Ingresar nombre del medicamento" },
    { column: 112, field: "Remisión", rule: "Opciones: Si, No" },
    { column: 113, field: "Especialidad Remisión", rule: "Ingresar la especialidad a la que se remite" },
    { column: 114, field: "Fecha Hospitalización", rule: "Formato: Año/Mes/Día" },
    { column: 115, field: "Complicaciones", rule: "Ingresar complicaciones presentadas" },
    { column: 116, field: "Novedades", rule: "Ingresar novedades" },
    { column: 117, field: "Causa de Muerte", rule: "Ingresar causa básica de la muerte" },
    { column: 118, field: "Fecha de Muerte", rule: "Formato: Año/Mes/Día" },
    { column: 119, field: "Observaciones", rule: "Ingresar observaciones pertinentes" },
    { column: 120, field: "Medicamento Estatina", rule: "Ingresar nombre del medicamento" },
    { column: 121, field: "Medicamento Fibrato", rule: "Ingresar nombre del medicamento" },
    { column: 122, field: "Medicamento Antiagregante", rule: "Ingresar nombre del medicamento" },
    { column: 123, field: "Medicamento Hipoglicemiante", rule: "Ingresar nombre del medicamento" },
    { column: 124, field: "Medicamento Insulina", rule: "Ingresar nombre del medicamento" },
    { column: 125, field: "Otro Hipoglicemiante", rule: "Ingresar nombre del medicamento" }
];


export function RcvValidationRules() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Columna</TableHead>
          <TableHead>Campo</TableHead>
          <TableHead>Regla de Validación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {validationRules.map((rule) => (
          <TableRow key={rule.column}>
            <TableCell className="font-medium text-center">{rule.column}</TableCell>
            <TableCell>{rule.field}</TableCell>
            <TableCell>{rule.rule}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
