'use client';

import React, { useState, useRef, type ChangeEvent, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { File as FileIcon, UploadCloud, XCircle, Download, Upload, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ValidationReport } from '@/components/validation-report';
import { Button } from '@/components/ui/button';
import { validateFile, saveValidatedFile, type ValidationError } from '@/app/validators/actions';
import * as XLSX from 'xlsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getProviders, Provider } from '@/lib/providers';
import { Loader2 } from 'lucide-react';
import { descargarCertificadoCargue } from '@/lib/certificado-pdf';
import { loadImageAsBase64 } from '@/lib/image-loader';


export function ModuloGestantes() {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errors, setErrors] = useState<ValidationError[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for selectors
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(String(new Date().getFullYear()));
  const [selectedMonth, setSelectedMonth] = useState<string>('ENERO');
  const [isUploading, setIsUploading] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');


  useEffect(() => {
    async function fetchProviders() {
      try {
        const providerList = await getProviders();
        setProviders(providerList);
      } catch (error) {
        console.error('Failed to fetch providers:', error);
        toast({
          variant: 'destructive',
          title: 'Error al cargar prestadores',
          description: 'No se pudo obtener la lista de prestadores de servicios.',
        });
      }
    }
    fetchProviders();
  }, [toast]);

  const filteredProviders = useMemo(() => {
    if (!providerSearch) return providers;
    return providers.filter(p => p.razonSocial.toLowerCase().includes(providerSearch.toLowerCase()));
  }, [providers, providerSearch]);

  const processFile = async (selectedFile: File) => {
    if (!selectedProvider) {
      toast({
        variant: 'destructive',
        title: 'Selección requerida',
        description: 'Por favor, selecciona un prestador antes de validar el archivo.',
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setErrors(null);
    setIsLoading(true);

    try {
        const result = await validateFile(selectedFile, 'gestante');

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
    XLSX.writeFile(workbook, 'reporte_de_errores_gestantes.xlsx');
  };
  
  const handleUploadValidatedFile = async () => {
    if (!file || errors?.length !== 0 || !selectedProvider) return;

    setIsUploading(true);
    toast({ title: 'Subiendo archivo validado...', description: 'Por favor, espere.' });
    try {
      const provider = providers.find(p => p.nit === selectedProvider);
      if (!provider) {
        throw new Error('Prestador seleccionado no es válido.');
      }
      
      await saveValidatedFile({
        file: file,
        provider,
        year: selectedYear,
        month: selectedMonth,
        module: 'Gestantes'
      });

      toast({
        title: '¡Éxito!',
        description: `El archivo validado para ${provider.razonSocial} ha sido guardado.`,
      });

      // Generar y descargar el certificado
      const backgroundImg = await loadImageAsBase64('imagenes pdf/pdf.jpg');
      await descargarCertificadoCargue({
          providerName: provider.razonSocial,
          module: 'Gestantes',
          fileName: file.name,
          timestamp: new Date()
      }, { background: backgroundImg });
      
    } catch (error: any) {
      console.error('Error al subir el archivo:', error);
      toast({
        variant: 'destructive',
        title: 'Error al Subir',
        description: error.message || 'Ocurrió un error al guardar el archivo en el servidor.',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const monthNames = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];

  return (
    <div className="space-y-8 mt-4">
        <Card>
        <CardHeader>
            <CardTitle>Subir Archivo - Data Gestante</CardTitle>
            <CardDescription>
            Selecciona los datos y el archivo (.xlsx) para comenzar la
            validación.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="grid gap-2 md:col-span-3">
                     <Label htmlFor="provider-search">Buscar Prestador (IPS)</Label>
                     <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="provider-search"
                            placeholder="Escribe para buscar..."
                            value={providerSearch}
                            onChange={(e) => setProviderSearch(e.target.value)}
                            className="pl-8"
                            disabled={!!file}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="provider-select">Seleccionar Prestador (IPS)</Label>
                    <Select value={selectedProvider} onValueChange={setSelectedProvider} disabled={!!file}>
                        <SelectTrigger id="provider-select">
                            <SelectValue placeholder="Seleccione un prestador..." />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredProviders.length > 0 ? (
                                filteredProviders.map(p => (
                                    <SelectItem key={p.nit} value={p.nit}>{p.razonSocial} ({p.departamento})</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-results" disabled>No se encontraron prestadores</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="year-select">Año</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear} disabled={!!file}>
                        <SelectTrigger id="year-select">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="2024">2024</SelectItem>
                            <SelectItem value="2025">2025</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="month-select">Mes</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth} disabled={!!file}>
                        <SelectTrigger id="month-select">
                            <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthNames.map((month) => (
                                <SelectItem key={month} value={month}>{month}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div
            className={'flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer hover:bg-accent/50'}
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
                id="file-upload-gestante"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                disabled={isLoading || !!fileName || !selectedProvider}
            />
            </div>
            {fileName && (
            <div className="mt-4 flex items-center justify-between text-sm">
                <div className="flex items-center text-muted-foreground gap-2">
                    <FileIcon className="h-4 w-4" />
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
            <ValidationReport
                isLoading={isLoading}
                errors={errors}
                actionButton={
                    errors?.length === 0 && file ? (
                    <Button onClick={handleUploadValidatedFile} disabled={isUploading}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Subir Archivo Validado
                    </Button>
                    ) : null
                }
            />
        </div>
    </div>
  );
}
