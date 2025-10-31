
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ServerCrash, CheckCircle, Link2, ArrowLeft } from 'lucide-react';
import { checkGoogleSheetConnection } from '../actions';
import { PrestadorData } from '@/services/prestadores-service';
import Link from 'next/link';

export default function GoogleSheetsCheckerPage() {
  const [data, setData] = useState<PrestadorData[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('idle');
      setData([]);
      setCount(0);

      const result = await checkGoogleSheetConnection();
      
      if (result.success) {
        setStatus('success');
        setData(result.data || []);
        setCount(result.count || 0);
      } else {
        setStatus('error');
        setError(result.error || 'Ocurrió un error desconocido.');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
        <div className="relative text-center mb-8">
            <Link href="/" passHref>
            <Button variant="outline" className="absolute left-0 top-1/2 -translate-y-1/2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver
            </Button>
            </Link>
            <h1 className="text-4xl font-bold font-headline tracking-tight lg:text-5xl">
            Verificador de Conexión
            </h1>
            <p className="mt-3 text-lg text-muted-foreground">
            Use esta herramienta para diagnosticar la conexión con la hoja de cálculo de Google Sheets.
            </p>
        </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Diagnóstico de Google Sheets</CardTitle>
          <CardDescription>
            Haga clic en el botón para verificar el acceso a la hoja de cálculo y ver una muestra de los datos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={handleCheckConnection} disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="mr-2 h-4 w-4" />
            )}
            Verificar Conexión
          </Button>

          {status === 'success' && (
             <Alert variant="default" className="border-green-500">
                <CheckCircle className="h-4 w-4 !text-green-500" />
                <AlertTitle className="text-green-700">¡Conexión Exitosa!</AlertTitle>
                <AlertDescription>
                    Se conectó correctamente a Google Sheets y se encontraron <strong>{count}</strong> filas de datos. Se muestran las primeras 5 filas.
                </AlertDescription>
            </Alert>
          )}

           {status === 'error' && (
            <Alert variant="destructive">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Error de Conexión</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {data.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.Nombre}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
