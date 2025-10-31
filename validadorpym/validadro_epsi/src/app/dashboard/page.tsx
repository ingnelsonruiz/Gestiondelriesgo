
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Download, FolderIcon, Loader2, FileIcon, FileSpreadsheet } from 'lucide-react';
import { readDirectory, readIndividualUploads } from '@/app/actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const PASSWORD = 'PequeñaMerly';

interface UploadedFile {
    name: string;
    path: string;
    size: number;
    lastModified: string;
    year: string;
    month: string;
    type: string;
}

interface IndividualFile {
    name: string;
    ips: string;
    path: string;
    size: number;
    lastModified: string;
    year: string;
    month: string;
    type: string;
}

interface ConsolidatedFileData {
    type: string;
    years: {
        year: string;
        months: {
            month: string;
            files: UploadedFile[];
        }[];
    }[];
}

interface IndividualFileData {
    type: string;
    years: {
        year: string;
        months: {
            month: string;
            ips: {
                name: string;
                files: IndividualFile[];
            }[];
        }[];
    }[];
}


function ConsolidatedFilesTab({ fileTree, loading }: { fileTree: ConsolidatedFileData[], loading: boolean }) {
    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Archivos Consolidados</CardTitle>
                <CardDescription>
                    Archivos consolidados organizados por tipo, año y mes de carga.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {fileTree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center shadow-sm">
                        <FileIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 font-medium">No hay archivos consolidados</p>
                        <p className="text-sm text-muted-foreground">
                            Cuando se carguen archivos, los consolidados aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {fileTree.map((typeData) => (
                            <AccordionItem value={typeData.type} key={typeData.type}>
                                <AccordionTrigger className="text-2xl font-bold p-4 bg-gray-100 rounded-lg">
                                    {typeData.type}
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pl-4">
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {typeData.years.map(yearData => (
                                            <AccordionItem value={`${typeData.type}-${yearData.year}`} key={yearData.year}>
                                                <AccordionTrigger className="text-xl font-semibold p-3 bg-gray-50 rounded-md">
                                                    Año {yearData.year}
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pl-4">
                                                     <div className="space-y-4">
                                                        {yearData.months.map(monthData => (
                                                            <div key={monthData.month}>
                                                                <h3 className="text-lg font-semibold mb-2">{monthData.month.charAt(0).toUpperCase() + monthData.month.slice(1)}</h3>
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Nombre del Archivo</TableHead>
                                                                            <TableHead>Fecha de Cargue</TableHead>
                                                                            <TableHead>Tamaño</TableHead>
                                                                            <TableHead className="text-right">Acción</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {monthData.files.map(fileInfo => (
                                                                            <TableRow key={fileInfo.path}>
                                                                                <TableCell className="font-medium flex items-center gap-2">
                                                                                    <FileIcon className='h-4 w-4 text-muted-foreground' />
                                                                                    {fileInfo.name}
                                                                                </TableCell>
                                                                                <TableCell>{fileInfo.lastModified}</TableCell>
                                                                                <TableCell>{(fileInfo.size / 1024).toFixed(2)} KB</TableCell>
                                                                                <TableCell className="text-right">
                                                                                    <Button asChild variant="outline" size="sm">
                                                                                        <a href={fileInfo.path} download>
                                                                                            <Download className="mr-2 h-4 w-4" />
                                                                                            Descargar
                                                                                        </a>
                                                                                    </Button>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    );
}

function DetailsTab({ loading }: { loading: boolean }) {
    const [individualFiles, setIndividualFiles] = useState<IndividualFile[]>([]);
    const [fileTree, setFileTree] = useState<IndividualFileData[]>([]);

    useEffect(() => {
        const fetchFiles = async () => {
            const files = await readIndividualUploads();
            setIndividualFiles(files);

            const groupedFiles = files.reduce((acc, file) => {
                let typeData = acc.find(t => t.type === file.type);
                if (!typeData) {
                    typeData = { type: file.type, years: [] };
                    acc.push(typeData);
                }

                let yearData = typeData.years.find(y => y.year === file.year);
                if (!yearData) {
                    yearData = { year: file.year, months: [] };
                    typeData.years.push(yearData);
                }

                let monthData = yearData.months.find(m => m.month === file.month);
                if (!monthData) {
                    monthData = { month: file.month, ips: [] };
                    yearData.months.push(monthData);
                }

                let ipsData = monthData.ips.find(i => i.name === file.ips);
                if (!ipsData) {
                    ipsData = { name: file.ips, files: [] };
                    monthData.ips.push(ipsData);
                }

                ipsData.files.push(file);

                return acc;
            }, [] as IndividualFileData[]);

            const monthOrder: { [key: string]: number } = {
                'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
                'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
            };

            groupedFiles.forEach(typeData => {
                typeData.years.sort((a, b) => parseInt(b.year) - parseInt(a.year));
                typeData.years.forEach(yearData => {
                    yearData.months.sort((a, b) => (monthOrder[b.month.toLowerCase()] || 0) - (monthOrder[a.month.toLowerCase()] || 0));
                    yearData.months.forEach(monthData => {
                        monthData.ips.sort((a, b) => a.name.localeCompare(b.name));
                    });
                });
            });

            setFileTree(groupedFiles);
        };
        fetchFiles();
    }, []);
    

    const handleExport = () => {
        const dataToExport = individualFiles.map(file => ({
            'IPS': file.ips,
            'Mes de Cargue': `${file.month.charAt(0).toUpperCase() + file.month.slice(1)} ${file.year}`,
            'Nombre del Archivo': file.name,
            'Tipo': file.type,
            'Fecha de Cargue': file.lastModified,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Detalle de Cargues");
        
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], {type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8"});
        saveAs(data, "detalle_cargues.xlsx");
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <Card>
            <CardHeader className='flex-row items-center justify-between'>
                <div>
                    <CardTitle>Detalle de Cargues Individuales</CardTitle>
                    <CardDescription>
                        Información detallada de los archivos subidos por cada IPS.
                    </CardDescription>
                </div>
                <Button onClick={handleExport} disabled={individualFiles.length === 0}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar a Excel
                </Button>
            </CardHeader>
            <CardContent>
                {fileTree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center shadow-sm">
                        <FileIcon className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 font-medium">No hay archivos individuales</p>
                        <p className="text-sm text-muted-foreground">
                            Cuando se carguen archivos, los detalles aparecerán aquí.
                        </p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="w-full space-y-4">
                        {fileTree.map((typeData) => (
                            <AccordionItem value={typeData.type} key={typeData.type}>
                                <AccordionTrigger className="text-2xl font-bold p-4 bg-gray-100 rounded-lg">
                                    {typeData.type}
                                </AccordionTrigger>
                                <AccordionContent className="pt-4 pl-4">
                                    <Accordion type="multiple" className="w-full space-y-2">
                                        {typeData.years.map(yearData => (
                                            <AccordionItem value={`${typeData.type}-${yearData.year}`} key={yearData.year}>
                                                <AccordionTrigger className="text-xl font-semibold p-3 bg-gray-50 rounded-md">
                                                    Año {yearData.year}
                                                </AccordionTrigger>
                                                <AccordionContent className="pt-2 pl-4">
                                                    <Accordion type="multiple" className="w-full space-y-1">
                                                        {yearData.months.map(monthData => (
                                                            <AccordionItem value={`${typeData.type}-${yearData.year}-${monthData.month}`} key={monthData.month}>
                                                                <AccordionTrigger className="text-lg font-medium p-2">
                                                                    {monthData.month.charAt(0).toUpperCase() + monthData.month.slice(1)}
                                                                </AccordionTrigger>
                                                                <AccordionContent className="pt-2 pl-4">
                                                                    <Accordion type="single" collapsible className="w-full">
                                                                        {monthData.ips.map(ipsData => (
                                                                            <AccordionItem value={`${typeData.type}-${yearData.year}-${monthData.month}-${ipsData.name}`} key={ipsData.name}>
                                                                                <AccordionTrigger className='text-base font-normal'>
                                                                                    {ipsData.name}
                                                                                </AccordionTrigger>
                                                                                <AccordionContent className="p-2">
                                                                                    <Table>
                                                                                        <TableHeader>
                                                                                            <TableRow>
                                                                                                <TableHead>Nombre del Archivo</TableHead>
                                                                                                <TableHead>Fecha de Cargue</TableHead>
                                                                                                <TableHead className="text-right">Acción</TableHead>
                                                                                            </TableRow>
                                                                                        </TableHeader>
                                                                                        <TableBody>
                                                                                            {ipsData.files.map(file => (
                                                                                                <TableRow key={file.path}>
                                                                                                    <TableCell>{file.name}</TableCell>
                                                                                                    <TableCell>{file.lastModified}</TableCell>
                                                                                                    <TableCell className="text-right">
                                                                                                        <Button asChild variant="outline" size="sm">
                                                                                                            <a href={file.path} download>
                                                                                                                <Download className="mr-2 h-4 w-4" />
                                                                                                                Descargar
                                                                                                            </a>
                                                                                                        </Button>
                                                                                                    </TableCell>
                                                                                                </TableRow>
                                                                                            ))}
                                                                                        </TableBody>
                                                                                    </Table>
                                                                                </AccordionContent>
                                                                            </AccordionItem>
                                                                        ))}
                                                                    </Accordion>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                )}
            </CardContent>
        </Card>
    )
}

function FileDashboardContent() {
    const [fileTree, setFileTree] = useState<ConsolidatedFileData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                setLoading(true);
                const fetchedFiles: UploadedFile[] = await readDirectory();
                
                const groupedFiles = fetchedFiles.reduce((acc, file) => {
                    let typeData = acc.find(t => t.type === file.type);
                    if (!typeData) {
                        typeData = { type: file.type, years: [] };
                        acc.push(typeData);
                    }

                    let yearData = typeData.years.find(y => y.year === file.year);
                    if (!yearData) {
                        yearData = { year: file.year, months: [] };
                        typeData.years.push(yearData);
                    }

                    let monthData = yearData.months.find(m => m.month === file.month);
                    if (!monthData) {
                        monthData = { month: file.month, files: [] };
                        yearData.months.push(monthData);
                    }
                    
                    monthData.files.push(file);
                    return acc;
                }, [] as ConsolidatedFileData[]);

                const monthOrder: { [key: string]: number } = {
                    'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
                    'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12
                };

                groupedFiles.forEach(typeData => {
                    typeData.years.sort((a, b) => parseInt(b.year) - parseInt(a.year));
                    typeData.years.forEach(yearData => {
                        yearData.months.sort((a, b) => {
                            const monthA = monthOrder[a.month.toLowerCase()] || 0;
                            const monthB = monthOrder[b.month.toLowerCase()] || 0;
                            return monthB - monthA;
                        });
                    });
                });

                setFileTree(groupedFiles);

            } catch (error) {
                console.error("Error fetching files:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, []);

    return (
        <div className="container mx-auto max-w-6xl py-8 px-4">
            <div className="text-left mb-8 relative">
                 <Link href="/" passHref>
                    <Button variant="outline" className="absolute left-0 top-1/2 -translate-y-1/2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Button>
                </Link>
                <div className='text-center'>
                    <h1 className="text-4xl font-bold">Control de Cargue</h1>
                    <p className="mt-2 text-lg text-gray-500">Aquí puedes ver y descargar los archivos consolidados y el detalle de cargues.</p>
                </div>
            </div>
             
             <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="consolidated">Archivos Consolidados</TabsTrigger>
                    <TabsTrigger value="details">Detalle de Cargue</TabsTrigger>
                </TabsList>
                <TabsContent value="consolidated">
                   <ConsolidatedFilesTab fileTree={fileTree} loading={loading} />
                </TabsContent>
                <TabsContent value="details">
                   <DetailsTab loading={loading} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function DashboardPage() {
    const [password, setPassword] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const authStatus = sessionStorage.getItem('dashboard-authenticated');
        if (authStatus === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === PASSWORD) {
            sessionStorage.setItem('dashboard-authenticated', 'true');
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Contraseña incorrecta');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="container mx-auto max-w-md py-12 px-4">
                <div className="relative mb-8 text-center">
                     <Link href="/" passHref>
                        <Button variant="outline" className="absolute left-0 top-1/2 -translate-y-1/2">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                </div>
                <Card className="mt-16">
                    <CardHeader>
                        <CardTitle>Acceso Restringido</CardTitle>
                        <CardDescription>Por favor, ingrese la contraseña para ver el dashboard.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                className="w-full"
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full">
                                Ingresar
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return <FileDashboardContent />;
}
