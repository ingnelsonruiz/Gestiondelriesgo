
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Info, FileQuestion, Server } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold md:text-2xl">Panel de Gestión del Riesgo</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Info className="mr-2 h-4 w-4" />
              Instrucciones de Uso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Instrucciones de Uso</DialogTitle>
              <DialogDescription>
                Siga estos pasos para asegurar el correcto funcionamiento de la aplicación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <ul className="list-disc space-y-3 pl-5 text-muted-foreground">
                    <li>
                        <b>Archivos Requeridos:</b>
                        <ul className="list-inside list-disc pl-5 mt-2 space-y-2">
                            <li><b>Población General:</b> Un archivo CSV llamado <code>Poblacion 2025.csv</code> debe estar en la carpeta <code>/public</code>.</li>
                            <li><b>Datos Mensuales:</b> Archivos Excel (<code>.xlsx</code>) deben estar en <code>/public/BASES DE DATOS/</code>, organizados en subcarpetas por año (ej: <code>/2024/ENERO.xlsx</code>).</li>
                        </ul>
                    </li>
                    <li>
                        <b>Actualización de Archivos:</b>
                        <p>Si añade, elimina o cambia el nombre de algún archivo, es <b>necesario recompilar</b> la aplicación para que los cambios se reflejen.</p>
                    </li>
                     <li>
                        <b>Navegación:</b>
                        <p>Use el menú lateral para navegar entre el panel principal y el módulo de informes "Fenix".</p>
                    </li>
                </ul>
            </div>
            <DialogFooter>
              <DialogTrigger asChild>
                <Button type="button">Entendido</Button>
              </DialogTrigger>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/informes-fenix">
          <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Módulo de Informes
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Informes Fenix</div>
              <p className="text-xs text-muted-foreground pt-1">
                Análisis y visualización de indicadores HTA y DM.
              </p>
            </CardContent>
          </Card>
        </Link>
         <Link href="/ayuda">
           <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ayuda y Documentación
              </CardTitle>
              <FileQuestion className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Centro de Ayuda</div>
              <p className="text-xs text-muted-foreground pt-1">
                Encuentre respuestas y guías detalladas.
              </p>
            </CardContent>
          </Card>
        </Link>
         <Link href="/tools/list-models">
           <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Diagnóstico IA
              </CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">Estado de Modelos</div>
              <p className="text-xs text-muted-foreground pt-1">
                Verificar modelos de IA y configuración.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </main>
  );
}
