
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, CheckCircle2, AlertTriangle, FileWarning, Download } from 'lucide-react';
import type { ValidationError } from '@/app/validators/actions';
import { Button } from './ui/button';
import { saveAs } from 'file-saver';

interface ValidationReportProps {
  errors: ValidationError[] | null;
  isLoading: boolean;
}

export function ValidationReport({
  errors,
  isLoading,
}: ValidationReportProps) {
  
  const handleExport = () => {
    if (!errors || errors.length === 0) return;

    const csvHeader = '"Ubicación","Tipo de Error","Descripción"\n';
    const csvRows = errors.map(e => 
      `"${e.location}","${e.type}","${e.description.replace(/"/g, '""')}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'reporte_de_errores.csv');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border p-12 text-center shadow-sm">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 font-medium">Analizando tu archivo...</p>
        <p className="text-sm text-muted-foreground">
          Por favor, espera un momento.
        </p>
      </div>
    );
  }

  if (errors === null) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center shadow-sm">
        <FileWarning className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 font-medium">Esperando archivo</p>
        <p className="text-sm text-muted-foreground">
          Sube un archivo para iniciar la validación.
        </p>
      </div>
    );
  }

  if (errors.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h3 className="text-2xl font-semibold font-headline">
            Validación Exitosa
          </h3>
          <p className="text-muted-foreground mt-2">
            Tu archivo ha sido validado y no se encontraron errores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive">
      <CardHeader className="flex flex-row items-start justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div>
            <CardTitle>Informe de Validación</CardTitle>
            <CardDescription>
              Se encontraron {errors.length} errores en el archivo.
            </CardDescription>
          </div>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar a CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ubicación</TableHead>
                <TableHead>Tipo de Error</TableHead>
                <TableHead>Descripción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.map((error, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{error.location}</TableCell>
                  <TableCell>{error.type}</TableCell>
                  <TableCell>{error.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
