
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const gestanteRules = [
    { field: "Tipo de documento", column: "2", validation: 'Debe ser uno de: "CC", "MS", "RC", "TI", "PA", "CD", "AS", "PT".' },
    { field: "Fecha de Nacimiento", column: "8", validation: 'Debe tener el formato DD/MM/AAAA.' },
    { field: "Sexo", column: "10", validation: 'Debe ser "FEMENINO".' },
    { field: "Municipio de Residencia", column: "15", validation: 'Debe ser un municipio válido de la lista predefinida.' },
    { field: "IPS Primaria", column: "29", validation: 'Debe coincidir con la IPS seleccionada en el validador.' },
];

const rcvRules = [
    { field: "Tipo de documento", column: "6", validation: 'Debe ser uno de: "CC", "MS", "RC", "TI", "PA", "CD", "AS", "PT".' },
    { field: "Fecha de Nacimiento", column: "8", validation: 'Debe tener el formato AAAA/MM/DD.' },
    { field: "IPS que hace seguimiento", column: "23", validation: 'Debe coincidir con la IPS seleccionada en el validador.' },
];

export default function MallaValidadoraPage() {
    return (
        <div className="container mx-auto max-w-6xl py-8 px-4">
            <div className="relative text-center mb-8">
                <Link href="/validador-pym" passHref>
                    <Button variant="outline" className="absolute left-0 top-1/2 -translate-y-1/2">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Validador
                    </Button>
                </Link>
                <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">
                    Malla Validadora
                </h1>
                <p className="mt-3 text-lg text-muted-foreground">
                    Reglas de negocio aplicadas durante la validación de archivos.
                </p>
            </div>

            <Card>
                <Tabs defaultValue="gestante" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gestante">Reglas Data Gestante</TabsTrigger>
                        <TabsTrigger value="rcv">Reglas Data RCV</TabsTrigger>
                    </TabsList>
                    <TabsContent value="gestante">
                        <Card>
                            <CardHeader>
                                <CardTitle>Validaciones para Data Gestante</CardTitle>
                                <CardDescription>Se aplican las siguientes reglas a cada fila del archivo cargado.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Campo Validado</TableHead>
                                            <TableHead>Columna</TableHead>
                                            <TableHead>Regla de Validación</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {gestanteRules.map((rule, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{rule.field}</TableCell>
                                                <TableCell>{rule.column}</TableCell>
                                                <TableCell>{rule.validation}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="rcv">
                         <Card>
                            <CardHeader>
                                <CardTitle>Validaciones para Data RCV</CardTitle>
                                <CardDescription>Se aplican las siguientes reglas a cada fila del archivo cargado. Los datos inician en la fila 4.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Campo Validado</TableHead>
                                            <TableHead>Columna</TableHead>
                                            <TableHead>Regla de Validación</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rcvRules.map((rule, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">{rule.field}</TableCell>
                                                <TableCell>{rule.column}</TableCell>
                                                <TableCell>{rule.validation}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
