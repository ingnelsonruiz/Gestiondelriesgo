
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ModuloRcv } from '@/components/modulo-rcv';
import { Toaster } from '@/components/ui/toaster';

export default function ModuloRcvPage() {
  return (
    <>
    <Toaster />
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="relative text-center mb-8">
        <Link href="/" passHref>
          <Button variant="outline" className="absolute left-0 top-1/2 -translate-y-1/2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">
          Módulo RCV
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Herramienta para la validación de archivos de data para RCV.
        </p>
      </div>

      <ModuloRcv />

    </div>
    </>
  );
}
