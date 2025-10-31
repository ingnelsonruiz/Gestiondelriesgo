
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileDown, Clock, Archive, RefreshCw, FileArchive } from 'lucide-react';
import { getMyFiles, getMyActivityLog } from './actions';
import { type UploadedFile, type ActivityLogEntry } from '../admin/actions';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MisCarguesPage() {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [fileList, logEntries] = await Promise.all([
                getMyFiles(),
                getMyActivityLog()
            ]);
            setFiles(fileList);
            setActivityLog(logEntries);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al cargar datos',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center justify-between">
                 <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Mis Cargues</h1>
                    <p className="text-sm text-muted-foreground">Consulte su historial de actividad y los archivos que ha enviado.</p>
                </div>
                <Button onClick={fetchData} variant="outline" size="icon" disabled={loading}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="ml-4 text-muted-foreground">Cargando su historial...</p>
                </div>
            ) : (
                <Tabs defaultValue="archivos" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="archivos">
                            <FileArchive className="mr-2 h-4 w-4"/>
                            Archivos Enviados
                        </TabsTrigger>
                        <TabsTrigger value="bitacora">
                            <Clock className="mr-2 h-4 w-4"/>
                            Bitácora de Actividad
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="archivos">
                        <Card>
                            <CardHeader>
                                <CardTitle>Archivos Enviados</CardTitle>
                                <CardDescription>Esta es la lista de todos los archivos que ha subido exitosamente a la plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Módulo</TableHead>
                                                <TableHead>Año</TableHead>
                                                <TableHead>Mes</TableHead>
                                                <TableHead>Nombre Archivo</TableHead>
                                                <TableHead className="text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {files.length > 0 ? files.map((file) => (
                                                <TableRow key={file.path}>
                                                    <TableCell>
                                                        <Badge variant={file.module === 'Gestantes' ? 'secondary' : 'outline'}>{file.module}</Badge>
                                                    </TableCell>
                                                    <TableCell>{file.year}</TableCell>
                                                    <TableCell>{file.month}</TableCell>
                                                    <TableCell className="font-medium">{file.fileName}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={file.path} download target="_blank">
                                                                <FileDown className="h-4 w-4" />
                                                                <span className="sr-only">Descargar</span>
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">
                                                        <Archive className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                                        No ha enviado ningún archivo todavía.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="bitacora">
                        <Card>
                            <CardHeader>
                                <CardTitle>Bitácora de Actividad</CardTitle>
                                <CardDescription>Un registro de todas sus acciones recientes en la plataforma.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha y Hora</TableHead>
                                                <TableHead>Acción</TableHead>
                                                <TableHead>Detalles</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {activityLog.length > 0 ? activityLog.map((log, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {format(new Date(log.timestamp), "d 'de' LLLL 'de' yyyy, h:mm:ss a", { locale: es })}
                                                    </TableCell>
                                                    <TableCell>{log.action}</TableCell>
                                                    <TableCell>{log.details}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={3} className="h-24 text-center">
                                                         <Clock className="mx-auto h-8 w-8 mb-2 text-muted-foreground" />
                                                        No hay actividad registrada todavía.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </main>
    );
}

