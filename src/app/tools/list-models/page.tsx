
'use client';

import { useEffect, useState } from 'react';
import { listModels } from '@/ai/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, ServerCrash, CheckCircle } from 'lucide-react';
import { ModelReference } from 'genkit/ai';

export default function ListModelsPage() {
  const [models, setModels] = useState<ModelReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchModels() {
      try {
        setLoading(true);
        setError(null);
        const modelData = await listModels();
        setModels(modelData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ocurrió un error desconocido.');
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, []);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Diagnóstico del Sistema de IA</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verificación de Entorno</CardTitle>
          <CardDescription>
            Estado de la configuración requerida para el funcionamiento de la IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="border-green-500 text-green-700">
            <CheckCircle className="h-4 w-4 !text-green-700" />
            <AlertTitle>¡Éxito!</AlertTitle>
            <AlertDescription>La clave de API de Gemini está configurada correctamente en el servidor.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Modelos de IA Disponibles</CardTitle>
          <CardDescription>
            Esta es la lista de modelos de Inteligencia Artificial de Google a los que tu proyecto tiene acceso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Cargando modelos...</span>
            </div>
          )}
          {error && !loading && (
            <Alert variant="destructive">
              <ServerCrash className="h-4 w-4" />
              <AlertTitle>Error al Cargar Modelos</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!loading && !error && models.length > 0 && (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Modelo (ID)</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Métodos Soportados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.name}>
                      <TableCell className="font-mono text-xs">{model.name}</TableCell>
                      <TableCell>{model.label}</TableCell>
                      <TableCell className="flex flex-wrap gap-1">
                        {model.supports?.generate && <Badge variant="outline">Generate</Badge>}
                        {model.supports?.multiturn && <Badge variant="outline">Multiturn</Badge>}
                        {model.supports?.tools && <Badge variant="outline">Tools</Badge>}
                        {model.supports?.media && <Badge variant="outline">Media</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
           {!loading && !error && models.length === 0 && (
             <p className="py-8 text-center text-muted-foreground">No se encontraron modelos disponibles.</p>
           )}
        </CardContent>
      </Card>
    </main>
  );
}
