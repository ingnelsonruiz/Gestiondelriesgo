
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
import { File as FileIcon, UploadCloud, Download, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ValidationReport } from '@/components/validation-report';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { uploadFile, validateFile, checkForExistingFile, type ValidationError } from '../app/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';


function getMonthAndYearFromContent(file: File, fileContent: string | ArrayBuffer): { month: string; year: string } | null {
    if (file.type.includes('sheet')) {
        const workbook = XLSX.read(fileContent, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        const firstRow = 0;
        if (range.e.r < firstRow) return null;

        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: firstRow, c: C });
            const cell = worksheet[address];

            if (cell && cell.v) {
                let cellValue = '';
                if(cell.t === 'd' && cell.v instanceof Date) {
                    const date = cell.v as Date;
                    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
                     return {
                        month: utcDate.toLocaleString('es-ES', { month: 'long', timeZone: 'UTC' }),
                        year: utcDate.getUTCFullYear().toString(),
                    };
                } else {
                    cellValue = cell.w || cell.v.toString();
                }

                const dateRegex = /(\d{1,2}\/\d{2}\/\d{4})/g;
                const matches = cellValue.match(dateRegex);
                
                if (matches && matches.length > 0) {
                    const dateStr = matches[matches.length - 1];
                    const parts = dateStr.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const monthIndex = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2], 10);
                        
                        if (!isNaN(monthIndex) && !isNaN(year) && monthIndex >= 0 && monthIndex <= 11) {
                            const date = new Date(year, monthIndex, day);
                            return {
                                month: date.toLocaleString('es-ES', { month: 'long' }),
                                year: year.toString(),
                            };
                        }
                    }
                }
            }
        }
    }

    return null;
}


export default function RcvValidator() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<{ month: string; year: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [fileToOverwrite, setFileToOverwrite] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setErrors(null);
    setUploadInfo(null);
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
                
                 const reader = new FileReader();
                 reader.onload = (e) => {
                    const data = e.target?.result;
                    if(data) {
                        const monthAndYear = getMonthAndYearFromContent(selectedFile, data);
                        setUploadInfo(monthAndYear);
                    }
                 };
                 if (selectedFile.type.includes('sheet')) {
                    reader.readAsBinaryString(selectedFile);
                 }

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

  const handleUploadConfirmation = async () => {
    if (!file || !canUpload) {
        toast({
            variant: 'destructive',
            title: 'No se puede cargar el archivo',
            description: 'El archivo tiene errores o no ha sido seleccionado.',
        });
        return;
    }

    let { year, month } = uploadInfo || { 
        year: new Date().getFullYear().toString(), 
        month: new Date().toLocaleString('es-ES', { month: 'long' }) 
    };

    const existingFile = await checkForExistingFile(year, month, 'rcv');
    setFileToOverwrite(existingFile);
    setShowConfirmation(true);
  }

  const handleLoadClick = async () => {
    setShowConfirmation(false);
    if (!file) {
      toast({
        variant: 'destructive',
        title: 'No se puede cargar el archivo',
        description: 'No ha sido seleccionado.',
      });
      return;
    }
    
    let year: string;
    let month: string;

    if (uploadInfo) {
        year = uploadInfo.year;
        month = uploadInfo.month;
    } else {
        const now = new Date();
        year = now.getFullYear().toString();
        month = now.toLocaleString('es-ES', { month: 'long' });
    }

    const currentYear = new Date().getFullYear();
    if (parseInt(year) < currentYear) {
      toast({
        variant: 'destructive',
        title: 'Año no válido',
        description: 'No se pueden cargar archivos de años anteriores al actual.',
      });
      return;
    }


    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);
      formData.append('month', month);
      formData.append('validatorType', 'rcv');
      if (fileToOverwrite) {
        formData.append('fileToOverwrite', fileToOverwrite);
      }

      const result = await uploadFile(formData);

      if (result.success) {
        toast({
          title: fileToOverwrite ? 'Archivo Sobrescrito' : 'Archivo Cargado',
          description: `El archivo ${fileName} ha sido guardado exitosamente.`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error al Cargar',
        description: error.message || 'Ocurrió un error al cargar el archivo.',
      });
    } finally {
        setFileToOverwrite(null);
    }
  };

  const handleDeleteFile = () => {
    setFile(null);
    setFileName(null);
    setErrors(null);
    setUploadInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast({
      title: 'Archivo borrado',
      description: 'Puedes subir un nuevo archivo para validar.',
    });
  };

  const canUpload = !!file && errors !== null && errors.length === 0;

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
                    <div className='flex gap-2'>
                        <Button onClick={handleDeleteFile} variant="outline">
                            <XCircle className="mr-2 h-4 w-4" />
                            Borrar archivo
                        </Button>
                        <Button onClick={handleUploadConfirmation} disabled={!canUpload}>
                            <Download className="mr-2 h-4 w-4" />
                            Cargar
                        </Button>
                    </div>
                </div>
                )}
            </CardContent>
            </Card>

            <div className="mt-8">
            <ValidationReport isLoading={isLoading} errors={errors} />
            </div>
        
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {fileToOverwrite ? (
                            <div className='flex items-center gap-2'>
                                <AlertTriangle className='text-destructive' />
                                Confirmar Sobrescritura
                            </div>
                        ) : 'Confirmar Carga'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {fileToOverwrite ?
                            `Ya existe un archivo para el período ${uploadInfo?.month}/${uploadInfo?.year}. ¿Desea reemplazar el archivo existente (${fileToOverwrite})?` :
                            (uploadInfo ?
                            `¿Está seguro que desea cargar el archivo para el mes de ${uploadInfo.month} del año ${uploadInfo.year}?` :
                            'No se pudo detectar el mes y el año del archivo. Se usará la fecha actual. ¿Desea continuar?')
                        }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setFileToOverwrite(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLoadClick}>{fileToOverwrite ? 'Sobrescribir' : 'Confirmar'}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </div>
  );
}
