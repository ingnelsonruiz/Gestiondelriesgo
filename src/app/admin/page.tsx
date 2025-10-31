'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AdminPage() {
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Panel de Administración</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Bienvenido, Administrador</CardTitle>
                    <CardDescription>
                        Desde aquí podrás gestionar los usuarios y ver la actividad de la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>Las funcionalidades de gestión de claves y registro de actividad se añadirán en la siguiente fase.</p>
                </CardContent>
            </Card>
        </main>
    );
}
