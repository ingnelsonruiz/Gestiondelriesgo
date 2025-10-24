
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookCheck } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GestanteValidator from '@/components/gestante-validator';
import RcvValidator from '@/components/rcv-validator';
import { Card } from '@/components/ui/card';

export default function ValidatorPage() {
  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <div className="relative text-center mb-8">
        <Link href="/" passHref>
          <Button variant="outline" className="absolute left-0 top-1/2 -translate-y-1/2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Inicio
          </Button>
        </Link>
        <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">
          Validadores Dusakawi EPSI
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Seleccione el tipo de archivo que desea validar, revise el dashboard o consulte las reglas.
        </p>
         <div className="flex justify-center gap-4 mt-4">
            <Button asChild>
                <Link href="/validador-pym/dashboard">Ir al Control de Cargue</Link>
            </Button>
            <Button asChild variant="secondary">
                <Link href="/validador-pym/malla-validadora">
                    <BookCheck className="mr-2 h-4 w-4"/>
                    Ver Malla Validadora
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <Tabs defaultValue="gestante" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gestante">Data Gestante</TabsTrigger>
            <TabsTrigger value="rcv">Data RCV</TabsTrigger>
            </TabsList>
            <TabsContent value="gestante">
            <GestanteValidator />
            </TabsContent>
            <TabsContent value="rcv">
            <RcvValidator />
            </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
