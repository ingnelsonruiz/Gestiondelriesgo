
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const validationRules = [
  { column: 1, field: "No", rule: "Se debe escribir el consecutivo comenzando por el No. 1." },
  { column: 2, field: "Tipo de documento de identidad", rule: "Opciones: CC, MS, TI, PA, CD, AS, CE, PE. No se permite RC." },
  { column: 3, field: "No. De Identificación", rule: "Número de identificación del afiliado." },
  { column: 4, field: "Apellido_1", rule: "Primer apellido, sin símbolos ni tildes." },
  { column: 5, field: "Apellido_2", rule: "Segundo apellido o 'NOAP' si no tiene." },
  { column: 6, field: "Nombre_1", rule: "Primer nombre, sin símbolos ni tildes." },
  { column: 7, field: "Nombre_2", rule: "Segundo nombre o 'NONE' si no tiene." },
  { column: 8, field: "Fecha de Nacimiento", rule: "Formato: AAAA/MM/DD." },
  { column: 9, field: "Edad (años)", rule: "Calculado automáticamente. No modificar." },
  { column: 10, field: "Sexo", rule: "Solo se permite 'Femenino'." },
  { column: 11, field: "Regimen Afiliacion", rule: "Opciones: Subsidiado (S) o Contributivo (C)." },
  { column: 12, field: "Pertenencia Etnica", rule: "Opciones: Indígena, Mestizo, Ningunas de las Anteriores, etc." },
  { column: 13, field: "Grupo Poblacional", rule: "Debe ser 'Mujer Embarazada'." },
  { column: 14, field: "Departamento Residencia", rule: "Nombre del departamento de la IPS." },
  { column: 15, field: "Municipio de Residencia", rule: "Nombre del municipio de la IPS." },
  { column: 16, field: "Zona", rule: "Opciones: Rural, Urbana." },
  { column: 17, field: "Etnia", rule: "Opciones: Wayuu, Arhuaco, etc. Debe ser consistente con 'Pertenencia Étnica'." },
  { column: 18, field: "Asentamiento/Rancheria/Comunidad", rule: "Si es zona rural, ingresar nombre de la comunidad." },
  { column: 19, field: "Teléfono usuaria", rule: "Ingresar obligatoriamente un número de teléfono." },
  { column: 20, field: "Direccion", rule: "Si es zona urbana, ingresar dirección." },
  { column: 29, field: "Fecha de diagnostico del embarazo", rule: "Formato AAAA/MM/DD. No puede ser anterior a la FUM." },
  { column: 30, field: "Fecha de Ingreso al Control Prenatal", rule: "Formato AAAA/MM/DD. No puede ser anterior a la fecha de diagnóstico." },
  { column: 31, field: "FUM", rule: "Fecha de la última Mestruación. Formato: AAAA/MM/DD." },
  { column: 32, field: "FPP", rule: "Calculado automáticamente. No modificar." },
  { column: 40, field: "Edad Gest Inicio Control", rule: "Calculado automáticamente. No debe ser mayor a 41 ni menor a 3 sin justificación." },
  { column: 62, field: "Clasificación del riesgo", rule: "Opciones: Alto riesgo obstétrico, Bajo riesgo obstétrico. No puede estar vacío." },
  { column: 63, field: "Causas de Alto Riesgo", rule: "Seleccionar de la lista si el riesgo es alto. No puede estar vacío si es ARO." },
  { column: 81, field: "Fecha Toma Prueba VIH Primer Tamizaje", rule: "Formato: AAAA/MM/DD." },
  { column: 82, field: "Resultado Primer Tamizaje prueba de VIH", rule: "Opciones: Positivo, Negativo." },
  { column: 87, field: "Fecha Primera Prueba Treponemica Rapida Sifilis", rule: "Formato: AAAA/MM/DD." },
  { column: 88, field: "Resultado Primera Prueba Treponemica Rápida Sífilis", rule: "Opciones: Positivo, Negativo." },
  { column: 106, field: "Fecha de Toma de Urocultivo", rule: "Formato: AAAA/MM/DD." },
  { column: 107, field: "Resultado Urocultivo", rule: "Si se ingresa fecha, se debe ingresar resultado." },
  // Se pueden agregar más reglas según sea necesario
];


export function GestantesValidationRules() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[80px]">Columna</TableHead>
          <TableHead>Campo</TableHead>
          <TableHead>Regla de Validación Principal</TableHead>
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

