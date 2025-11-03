
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp, RefreshCw, Trash2, Info, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { uploadFile } from '@/ai/actions';

interface FenixFileUploadProps {
    availableFiles: string[];
    setAvailableFiles: (files: string[]) => void;
    selectedFile: string;
    setSelectedFile: (file: string) => void;
    isProcessing: boolean;
    progress: number;
    status: string;
    onProcess: () => void;
    onClear: () => void;
    fetchFiles: () => Promise<string[]>;
}

export function FenixFileUpload({
    availableFiles,
    setAvailableFiles,
    selectedFile,
    setSelectedFile,
    isProcessing,
    progress,
    status,
    onProcess,
    onClear,
    fetchFiles,
}: FenixFileUploadProps) {
    const { toast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [availableYears, setAvailableYears] = useState<string[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');

    // State for file upload
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [uploadYear, setUploadYear] = useState<string>(String(new Date().getFullYear()));
    const [uploadMonth, setUploadMonth] = useState<string>('');
    const [isUploading, setIsUploading] = useState(false);

    const handleFetchFiles = useCallback(() => {
        setIsRefreshing(true);
        fetchFiles().then(files => {
            const years = [...new Set(files.map(f => f.split('/')[0]))].sort((a,b) => b.localeCompare(a));
            setAvailableYears(years);

            if (years.length > 0) {
                const latestYear = years[0];
                setSelectedYear(currentYear => years.includes(currentYear) ? currentYear : latestYear);
            } else if (files.length === 0) {
                toast({ title: 'Advertencia', description: 'No se encontraron archivos .xlsx en /public/BASES DE DATOS/. Si añadió archivos, necesita recompilar la aplicación.', variant: 'default' });
            }
        }).finally(() => {
            setIsRefreshing(false);
        });
    }, [fetchFiles, toast]);
    
    useEffect(() => {
        handleFetchFiles();
    }, [handleFetchFiles]);

    const filteredFiles = useMemo(() => {
        if (!selectedYear) return [];
        return availableFiles.filter(file => file.startsWith(`${selectedYear}/`));
    }, [selectedYear, availableFiles]);

    useEffect(() => {
        if (filteredFiles.length > 0) {
            if (!filteredFiles.includes(selectedFile)) {
                setSelectedFile(filteredFiles[0]);
            }
        } else {
            setSelectedFile('');
        }
    }, [filteredFiles, selectedFile, setSelectedFile]);

    const handleFileUpload = async () => {
        if (!fileToUpload || !uploadYear || !uploadMonth) {
            toast({
                title: 'Datos incompletos',
                description: 'Por favor, seleccione un archivo, un año y un nombre para el mes.',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        toast({ title: 'Subiendo archivo...', description: 'Por favor espere.' });

        try {
            const reader = new FileReader();
            reader.readAsDataURL(fileToUpload);
            reader.onload = async () => {
                const base64Data = reader.result as string;

                await uploadFile({
                    fileDataUri: base64Data,
                    year: uploadYear,
                    month: uploadMonth,
                });

                toast({ title: '¡Éxito!', description: 'El archivo se ha subido correctamente.' });
                
                setFileToUpload(null);
                setUploadMonth('');
                handleFetchFiles();
            };
            reader.onerror = (error) => {
                throw new Error('No se pudo leer el archivo: ' + error);
            };
        } catch (error: any) {
            console.error('Error al subir archivo:', error);
            toast({
                title: 'Error al subir',
                description: error.message || 'No se pudo completar la subida del archivo.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };


    return (
        <>
            <Card className="shadow-md">
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle>Cargue y Configuración</CardTitle>
                        <CardDescription>Seleccione el año y el archivo de datos para analizar. La población se cruzará con <code>Poblacion 2025.csv</code>.</CardDescription>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Info className="h-4 w-4" />
                                <span className="sr-only">Instrucciones</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Instrucciones de Uso</DialogTitle>
                                <DialogDescription>
                                    Para usar la aplicación, asegúrese de que los siguientes archivos estén en la carpeta `public` de su proyecto:
                                </DialogDescription>
                            </DialogHeader>
                            <div className="text-sm text-muted-foreground">
                                <ul className="list-disc space-y-2 pl-5">
                                    <li>
                                        <b>Archivo de Población General:</b>
                                        <ul className="list-inside list-disc pl-5 mt-1">
                                            <li>Nombre: <code>Poblacion 2025.csv</code></li>
                                            <li>Ubicación: <code>/public/Poblacion 2025.csv</code></li>
                                        </ul>
                                    </li>
                                    <li>
                                        <b>Archivos de Datos Mensuales:</b>
                                        <ul className="list-inside list-disc pl-5 mt-1">
                                            <li>Formato: <code>.xlsx</code></li>
                                            <li>Ubicación: Dentro de <code>/public/BASES DE DATOS/</code>, organizados por año.</li>
                                            <li>Ejemplo: <code>/public/BASES DE DATOS/2024/ENERO.xlsx</code></li>
                                        </ul>
                                    </li>
                                </ul>
                                <p className="mt-4 font-semibold">
                                    <b>Importante:</b> Después de subir un archivo nuevo, la lista se actualizará automáticamente.
                                </p>
                            </div>
                            <DialogFooter>
                                <DialogTrigger asChild>
                                    <Button>Entendido</Button>
                                </DialogTrigger>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="yearSelect">Año</Label>
                            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={isProcessing}>
                                <SelectTrigger id="yearSelect">
                                    <SelectValue placeholder="Seleccione un año..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableYears.length > 0 ? (
                                        availableYears.map(year => (
                                            <SelectItem key={year} value={year}>{year}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-years" disabled>No hay años disponibles</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="fileSelect">Archivo de Datos (Mes)</Label>
                            <Select value={selectedFile} onValueChange={setSelectedFile} disabled={isProcessing || !selectedYear}>
                                <SelectTrigger id="fileSelect">
                                    <SelectValue placeholder="Seleccione un archivo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredFiles.length > 0 ? (
                                        filteredFiles.map(file => (
                                            <SelectItem key={file} value={file}>{file.split('/')[1]?.replace(/\.xlsx$/i, '')}</SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="no-files" disabled>No hay archivos para este año</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2 justify-self-end self-end w-full">
                            <Button onClick={onProcess} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isProcessing || !selectedFile}>
                                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileUp className="mr-2 h-4 w-4" />}
                                {isProcessing ? 'Procesando...' : 'Procesar Archivo'}
                            </Button>
                            <Button onClick={handleFetchFiles} variant="outline" size="icon" className="flex-shrink-0" disabled={isRefreshing}>
                                {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                <span className="sr-only">Actualizar lista</span>
                            </Button>
                            <Button onClick={onClear} variant="outline" size="icon" className="flex-shrink-0" disabled={isProcessing || !availableFiles}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Limpiar Resultados</span>
                            </Button>
                        </div>
                    </div>

                    {isProcessing && (
                        <div className="mt-6 border-t pt-4">
                            <Label className="font-medium text-muted-foreground">{status}</Label>
                            <div className="flex items-center gap-3 mt-2">
                                <Progress value={progress} className="w-full h-2" />
                                <span className="font-semibold min-w-[4ch] text-right">{Math.round(progress)}%</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Subir Nuevo Archivo de Datos</CardTitle>
                    <CardDescription>
                        Añada un nuevo archivo Excel a la plataforma. Especifique el año y el nombre del mes (ej. ENERO).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-4 gap-6 items-end">
                        <div className="grid gap-2">
                            <Label htmlFor="file-upload-input">Archivo (.xlsx)</Label>
                            <Input
                                id="file-upload-input"
                                type="file"
                                accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                onChange={(e) => setFileToUpload(e.target.files ? e.target.files[0] : null)}
                                disabled={isUploading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="upload-year">Año</Label>
                            <Input
                                id="upload-year"
                                type="number"
                                placeholder="Ej: 2025"
                                value={uploadYear}
                                onChange={(e) => setUploadYear(e.target.value)}
                                disabled={isUploading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="upload-month">Nombre del Mes</Label>
                            <Input
                                id="upload-month"
                                type="text"
                                placeholder="Ej: SEPTIEMBRE"
                                value={uploadMonth}
                                onChange={(e) => setUploadMonth(e.target.value.toUpperCase())}
                                disabled={isUploading}
                            />
                        </div>
                        <Button onClick={handleFileUpload} disabled={isUploading || !fileToUpload || !uploadYear || !uploadMonth}>
                            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Subir Archivo
                        </Button>
                    </div>
                    {fileToUpload && (
                        <div className="mt-4 text-sm text-muted-foreground">
                            Archivo seleccionado: <strong>{fileToUpload.name}</strong>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
