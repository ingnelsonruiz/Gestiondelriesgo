"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Panel de Gestión del Riesgo</h1>
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
        {/* Aquí se pueden añadir más tarjetas para futuros módulos */}
      </div>
    </main>
  );
}
