'use client';

import React from 'react';
import Link from 'next/link';
import { CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { FileCheck, GanttChartSquare, Link2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold font-headline tracking-tight text-gray-800 sm:text-6xl">
            Panel de Control
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            Seleccione una herramienta para comenzar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link href="/validator" className="group relative flex h-full transform flex-col overflow-hidden rounded-2xl bg-blue-500 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <CardHeader className="z-10 flex flex-col items-center text-center p-6">
                <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm">
                  <FileCheck className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Validador de Archivos</CardTitle>
                <CardDescription className="mt-2 text-lg text-blue-100">
                  Valide la estructura de sus archivos de carga.
                </CardDescription>
              </CardHeader>
              <CardContent className="z-10 p-6 pt-0 text-center"></CardContent>
            </Link>
            
            <Link href="/dashboard" className="group relative flex h-full transform flex-col overflow-hidden rounded-2xl bg-blue-500 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <CardHeader className="z-10 flex flex-col items-center text-center p-6">
                 <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm">
                  <GanttChartSquare className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Control de Cargue</CardTitle>
                <CardDescription className="mt-2 text-lg text-blue-100">
                  Consulte y descargue los archivos consolidados.
                </CardDescription>
              </CardHeader>
              <CardContent className="z-10 p-6 pt-0 text-center"></CardContent>
            </Link>

            <Link href="/google-sheets-checker" className="group relative flex h-full transform flex-col overflow-hidden rounded-2xl bg-green-500 text-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl md:col-span-2">
              <CardHeader className="z-10 flex flex-col items-center text-center p-6">
                <div className="mb-4 rounded-full bg-white/20 p-4 backdrop-blur-sm">
                  <Link2 className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold">Verificador Google Sheets</CardTitle>
                <CardDescription className="mt-2 text-lg text-green-100">
                  Herramienta de diagnóstico para probar la conexión con la hoja de cálculo.
                </CardDescription>
              </CardHeader>
              <CardContent className="z-10 p-6 pt-0 text-center"></CardContent>
            </Link>
        </div>
      </div>
    </div>
  );
}
