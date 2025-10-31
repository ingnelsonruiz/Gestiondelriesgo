
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ServerCrash, CheckCircle, Link2 } from 'lucide-react';
import { checkGoogleSheetConnection } from '../actions';

export default function GoogleSheetsCheckerPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [rowCount, setRowCount] = useState<number>(0);

  const handleCheckConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('idle');
      setRowCount(0);

      const result = await checkGoogleSheetConnection();
      
      if (result.success) {
        setStatus('success');
        setRowCount(result.count || 0);
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
            <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
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
            Haga clic en el botón para verificar el acceso y la correcta lectura de la hoja de cálculo.
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
                <AlertTitle className="text-green-700">¡Conexión y Lectura Exitosa!</AlertTitle>
                <AlertDescription>
                    Se estableció la conexión y se leyeron correctamente <strong>{rowCount}</strong> filas de datos desde Google Sheets.
                </AlertDescription>
            </Alert>
          )}

           {status === 'error' && (
            <Alert variant="destructive">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Error de Conexión o Lectura</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
