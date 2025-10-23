
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FileText, FolderTree, AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AyudaPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Centro de Ayuda y Documentación</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guía de Uso de la Aplicación</CardTitle>
          <CardDescription>
            Aquí encontrará toda la información necesaria para utilizar la plataforma de manera efectiva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full" defaultValue="item-4">
             <AccordionItem value="item-4">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <RefreshCw className="h-5 w-5 text-destructive" />
                    <span className="text-destructive">Paso Crítico: Actualización de Archivos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-destructive/50 ml-2 space-y-4 py-2">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>¡Importante!</AlertTitle>
                      <AlertDescription>
                        Cada vez que agregue, elimine o cambie el nombre de un archivo en las carpetas <code>public/</code> o <code>public/BASES DE DATOS/</code>, <strong>debe detener y reiniciar (recompilar) la aplicación</strong>. El sistema solo escanea los archivos al arrancar. Si no reinicia, los cambios no se verán reflejados en los menús desplegables del módulo de informes.
                      </AlertDescription>
                    </Alert>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-1">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <FolderTree className="h-5 w-5 text-primary" />
                    <span>Estructura de Archivos Requerida</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-4 border-l-2 border-primary/50 ml-2 space-y-4 py-2">
                    <p>Para el correcto funcionamiento del módulo <strong>Informes Fenix</strong>, es crucial que los archivos de datos se encuentren en la ubicación y formato correctos dentro de la carpeta <code>public</code> del proyecto.</p>
                    <div>
                        <h4 className="font-semibold mb-2">1. Archivo de Población General</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                            <li><strong>Nombre del archivo:</strong> <code>Poblacion 2025.csv</code></li>
                            <li><strong>Ubicación:</strong> Directamente en la carpeta <code>/public</code>.</li>
                            <li><strong>Ruta final:</strong> <code>/public/Poblacion 2025.csv</code></li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">2. Archivos de Datos Mensuales</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                             <li><strong>Formato:</strong> Archivo de Excel (<code>.xlsx</code>).</li>
                             <li><strong>Ubicación:</strong> Dentro de una carpeta llamada <code>BASES DE DATOS</code>, y a su vez, dentro de una subcarpeta con el año correspondiente.</li>
                             <li><strong>Nombre del archivo:</strong> Debe ser el mes en mayúsculas (ej: <code>ENERO.xlsx</code>, <code>FEBRERO.xlsx</code>).</li>
                             <li><strong>Ejemplo de ruta:</strong> <code>/public/BASES DE DATOS/2024/ENERO.xlsx</code></li>
                        </ul>
                    </div>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <span>Contenido y Columnas de los Archivos</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                   <div className="pl-4 border-l-2 border-primary/50 ml-2 space-y-4 py-2">
                     <p>Los archivos de datos (tanto el CSV de población como los XLSX mensuales) deben contener encabezados de columna específicos para que el sistema los pueda procesar. El sistema normaliza los nombres (ignora mayúsculas/minúsculas, tildes y espacios extra), pero es mejor mantenerlos lo más parecidos posible.</p>
                        <h4 className="font-semibold mb-2">Columnas Esenciales:</h4>
                        <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                            <li><code>DEPARTAMENTO DE RESIDENCIA</code></li>
                            <li><code>MUNICIPIO DE RESIDENCIA</code></li>
                            <li><code>NOMBRE DE LA IPS QUE HACE SEGUIMIENTO</code></li>
                            <li><code>EDAD</code></li>
                            <li><code>DX CONFIRMADO HTA</code> (con valores "SI" o "NO")</li>
                            <li><code>DX CONFIRMADO DM</code> (con valores "SI" o "NO")</li>
                            <li><code>ULTIMA TENSION ARTERIAL SISTOLICA</code></li>
                            <li><code>ULTIMA TENSION ARTERIAL DIASTOLICA</code></li>
                            <li><code>FECHA DE LA ULTIMA TOMA DE PRESION ARTERIAL...</code></li>
                            <li><code>FECHA DE REPORTE DE HEMOGLOBINA GLICOSILADA</code></li>
                            <li><code>REPORTE DE HEMOGLOBINA GLICOSILADA...</code></li>
                             <li><code>FECHA CREATININA SANGRE</code></li>
                             <li><code>FECHA ALBUMINURIA</code></li>
                             <li><code>ESTADIO SEGÚN TFG</code></li>
                             <li><code>TIPO ID</code></li>
                             <li><code>NUMERO DE IDENTIFICACION</code></li>
                        </ul>
                        <p className="text-xs text-muted-foreground pt-2">Nota: Si faltan columnas esenciales para la agrupación (Departamento, Municipio, IPS), el procesamiento fallará.</p>
                   </div>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <span>Consideraciones Adicionales</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                     <div className="pl-4 border-l-2 border-primary/50 ml-2 space-y-4 py-2">
                        <h4 className="font-semibold mb-2">Generación de Informes PDF</h4>
                         <p>La generación de informes, especialmente la masiva, puede consumir tiempo y recursos. Tenga paciencia y no cierre la pestaña del navegador mientras el proceso está en curso.</p>

                        <h4 className="font-semibold mb-2">Uso de la IA</h4>
                        <p>La generación de texto con IA para los informes consume recursos. Si encuentra errores de "límite de cuota excedido" (error 429), espere uno o dos minutos antes de volver a intentarlo.</p>
                   </div>
                </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </main>
  );
}
