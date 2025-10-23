
'use client';

import { useEffect, useState } from 'react';
import { listModels } from '@/ai/actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, ServerCrash, CheckCircle, XCircle } from 'lucide-react';
import { ModelReference } from 'genkit/ai';

export default function ListModelsPage() {
  const [models, setModels] = useState<ModelReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean | null>(null);

  useEffect(() => {
    async function fetchModelsAndEnv() {
      try {
        setLoading(true);
        setError(null);
        
        // Check for API Key
        const envRes = await fetch('/api/check-env');
        const envData = await envRes.json();
        setIsApiKeySet(envData.isSet);
        
        if (!envData.isSet) {
          throw new Error('La variable de entorno GEMINI_API_KEY no está configurada.');
        }

        // Fetch models
        const modelData = await listModels();
        setModels(modelData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Ocurrió un error desconocido.');
      } finally {
        setLoading(false);
      }
    }
    fetchModelsAndEnv();
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
          {isApiKeySet === null && <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Verificando...</div>}
          {isApiKeySet === true && <Alert variant="default" className="border-green-500 text-green-700">
            <CheckCircle className="h-4 w-4 !text-green-700" />
            <AlertTitle>¡Éxito!</AlertTitle>
            <AlertDescription>La clave de API de Gemini está configurada correctamente.</AlertDescription>
          </Alert>}
          {isApiKeySet === false && <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error de Configuración</AlertTitle>
            <AlertDescription>La variable de entorno GEMINI_API_KEY no está configurada en el servidor. La IA no funcionará.</AlertDescription>
          </Alert>}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Modelos de IA Disponibles</CardTitle>
          <CardDescription>
            Esta es la lista de modelos de IA de Google que están disponibles a través de Genkit.
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre del Modelo</TableHead>
                    <TableHead>Nombre para Mostrar</TableHead>
                    <TableHead>Capacidades</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {models.map((model) => (
                    <TableRow key={model.name}>
                      <TableCell className="font-mono">{model.name}</TableCell>
                      <TableCell>{model.label}</TableCell>
                      <TableCell className="flex flex-wrap gap-1">
                        {model.supports?.generate && <Badge variant="secondary">Generate</Badge>}
                        {model.supports?.multiturn && <Badge variant="secondary">Multiturn</Badge>}
                        {model.supports?.tools && <Badge variant="secondary">Tools</Badge>}
                        {model.supports?.media && <Badge variant="secondary">Media</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
           {!loading && !error && models.length === 0 && isApiKeySet && (
             <p className="py-8 text-center text-muted-foreground">No se encontraron modelos disponibles.</p>
           )}
        </CardContent>
      </Card>
    </main>
  );
}
