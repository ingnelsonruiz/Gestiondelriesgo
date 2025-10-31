
'use client';

import React, { useState, useRef, type ChangeEvent } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { File as FileIcon, UploadCloud, XCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ValidationReport } from '@/components/validation-report';
import { Button } from '@/components/ui/button';
import { validateFile, type ValidationError } from '@/app/validators/actions';
import * as XLSX from 'xlsx';

export function ModuloRcv() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setErrors(null);
    setIsLoading(true);

    try {
        const result = await validateFile(selectedFile, 'rcv');

        if (result.message) {
             toast({
                variant: 'destructive',
                title: 'Error de Validación',
                description: result.message,
            });
            setErrors([]);
        } else {
            setErrors(result.errors);
            if (result.errors.length === 0) {
                toast({
                    title: 'Validación Exitosa',
                    description: 'Tu archivo ha sido validado y no se encontraron errores.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: `Se encontraron ${result.errors.length} problemas`,
                    description: 'Revisa el informe de validación para más detalles.',
                });
            }
        }
    } catch (error: any) {
        console.error('Error procesando el archivo:', error);
        toast({
            variant: 'destructive',
            title: 'Error de Procesamiento',
            description: error.message || 'Ocurrió un error al procesar el archivo.',
        });
        setErrors([]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteFile = () => {
    setFile(null);
    setFileName(null);
    setErrors(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Archivo borrado',
      description: 'Puedes subir un nuevo archivo para validar.',
    });
  };

  const handleExportErrors = () => {
    if (!errors || errors.length === 0) {
      toast({
        variant: 'default',
        title: 'No hay errores para exportar',
      });
      return;
    }
    
    const dataToExport = errors.map(err => ({
      'Ubicación': err.location,
      'Tipo de Error': err.type,
      'Descripción': err.description
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Errores');
    XLSX.writeFile(workbook, 'reporte_de_errores_rcv.xlsx');
  };


  return (
    <div className="space-y-8 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo - Data RCV</CardTitle>
            <CardDescription>
              Selecciona un archivo (.xlsx) para comenzar la validación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:bg-accent/50"
              onClick={handleAreaClick}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <UploadCloud className="w-12 h-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-center">
                <span className="font-semibold text-primary">
                  Haz clic para subir
                </span>{' '}
                o arrastra y suelta
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Formatos admitidos: XLSX
              </p>
              <Input
                ref={fileInputRef}
                id="file-upload-rcv"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={isLoading || !!fileName}
              />
            </div>
            {fileName && (
              <div className="mt-4 flex items-center justify-between text-sm">
                  <div className="flex items-center text-muted-foreground">
                      <FileIcon className="h-4 w-4 mr-2" />
                      <span>
                          Archivo seleccionado:{' '}
                          <span className="font-medium">{fileName}</span>
                      </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                        onClick={handleExportErrors}
                        variant="outline"
                        disabled={!errors || errors.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Descargar Errores (Excel)
                    </Button>
                    <Button onClick={handleDeleteFile} variant="destructive">
                        <XCircle className="mr-2 h-4 w-4" />
                        Borrar archivo
                    </Button>
                  </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8">
          <ValidationReport isLoading={isLoading} errors={errors} />
        </div>
    </div>
  );
}
