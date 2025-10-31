
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Trash2, Search, Package, PackageCheck, FileDown, RefreshCw } from 'lucide-react';
import { listFilesForAdmin, downloadFilesAsZip, deleteFileForAdmin, type UploadedFile } from '../actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FileManagerPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    
    const { toast } = useToast();

    const fetchFiles = useCallback(async () => {
        setLoading(true);
        setSelectedFiles([]);
        try {
            const fileList = await listFilesForAdmin();
            setFiles(fileList);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al cargar archivos',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const filteredFiles = useMemo(() => {
        if (!searchTerm) return files;
        return files.filter(file => 
            file.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.module.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.year.includes(searchTerm)
        );
    }, [files, searchTerm]);

    const handleDownloadSelected = async () => {
        if (selectedFiles.length === 0) {
            toast({ title: 'Error', description: 'No ha seleccionado ningún archivo para descargar.', variant: 'destructive' });
            return;
        }

        setIsDownloading(true);
        toast({ title: 'Preparando descarga...', description: `Comprimiendo ${selectedFiles.length} archivo(s).` });
        
        try {
            const filesToDownload = files
                .filter(f => selectedFiles.includes(f.path))
                .map(f => ({ path: f.path, name: `${f.module}/${f.provider}/${f.year}/${f.fileName}` }));

            const base64Zip = await downloadFilesAsZip(filesToDownload);
            
            const link = document.createElement('a');
            link.href = `data:application/zip;base64,${base64Zip}`;
            link.download = `Archivos_Dusakawi_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({ title: '¡Éxito!', description: 'La descarga del archivo ZIP ha comenzado.' });
            setSelectedFiles([]);

        } catch (error: any) {
            toast({ title: 'Error de descarga', description: error.message, variant: 'destructive' });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleDeleteFile = async (filePath: string) => {
        setIsDeleting(true);
        try {
            const result = await deleteFileForAdmin(filePath);
            if (result.success) {
                toast({ title: 'Éxito', description: 'El archivo ha sido eliminado.' });
                fetchFiles(); // Refresh the list
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
        } finally {
            setIsDeleting(false);
        }
    }
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedFiles(filteredFiles.map(f => f.path));
        } else {
            setSelectedFiles([]);
        }
    };

    const handleSelectRow = (path: string, checked: boolean) => {
        if (checked) {
            setSelectedFiles(prev => [...prev, path]);
        } else {
            setSelectedFiles(prev => prev.filter(p => p !== path));
        }
    };
    
    const isAllSelected = filteredFiles.length > 0 && selectedFiles.length === filteredFiles.length;


    return (
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Gestor de Archivos</CardTitle>
                            <CardDescription>Administre los archivos validados y subidos por los prestadores.</CardDescription>
                        </div>
                         <div className="relative flex-1 md:grow-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por prestador, año, módulo..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <div className="flex justify-center items-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                        <div className="flex items-center gap-4 mb-4">
                            <Button onClick={handleDownloadSelected} disabled={isDownloading || selectedFiles.length === 0}>
                                {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                                Descargar Seleccionados ({selectedFiles.length})
                            </Button>
                            <Button onClick={fetchFiles} variant="outline" size="icon" disabled={loading}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">
                                             <Checkbox
                                                checked={isAllSelected}
                                                onCheckedChange={handleSelectAll}
                                                aria-label="Seleccionar todo"
                                            />
                                        </TableHead>
                                        <TableHead>Módulo</TableHead>
                                        <TableHead>Prestador</TableHead>
                                        <TableHead>Fecha de Cargue</TableHead>
                                        <TableHead>Año</TableHead>
                                        <TableHead>Mes</TableHead>
                                        <TableHead>Nombre Archivo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredFiles.length > 0 ? filteredFiles.map((file) => (
                                        <TableRow key={file.path} data-state={selectedFiles.includes(file.path) ? 'selected' : ''}>
                                             <TableCell>
                                                <Checkbox
                                                    checked={selectedFiles.includes(file.path)}
                                                    onCheckedChange={(checked) => handleSelectRow(file.path, !!checked)}
                                                    aria-label={`Seleccionar ${file.fileName}`}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={file.module === 'Gestantes' ? 'secondary' : 'outline'}>{file.module}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">{file.provider}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(file.timestamp), "d 'de' LLLL, h:mm a", { locale: es })}
                                            </TableCell>
                                            <TableCell>{file.year}</TableCell>
                                            <TableCell>{file.month}</TableCell>
                                            <TableCell>{file.fileName}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={file.path} download target="_blank">
                                                        <FileDown className="h-4 w-4" />
                                                        <span className="sr-only">Descargar</span>
                                                    </Link>
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="icon">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Está seguro de eliminar este archivo?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{file.fileName}</strong> del prestador <strong>{file.provider}</strong>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteFile(file.path)} disabled={isDeleting}>
                                                                 {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Confirmar Eliminación
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No se encontraron archivos.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
