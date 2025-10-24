
'use server';
/**
 * @fileOverview Server actions for data processing.
 *
 * - processSelectedFile - Downloads a file from the public folder and processes it.
 * - listFiles - Fetches the manifest of available XLSX files.
 * - listModels - Fetches the list of available AI models from the provider.
 * - uploadFile - Handles uploading a new data file.
 */
import {ai} from '@/ai/genkit';
import {DataProcessingResult, processDataFile} from '@/lib/data-processing';
import {ProcessFileResponseSchema} from './schemas';
import * as path from 'path';
import * as fs from 'fs/promises';
import {z} from 'zod';
import { ModelReference } from 'genkit/ai';
import { run } from '../../scripts/build-file-manifest';


export async function listFiles(): Promise<string[]> {
    const manifestPath = path.join(process.cwd(), 'public', 'bases-manifest.json');

    try {
        run(); // Regenerate manifest before reading
        const manifestContent = await fs.readFile(manifestPath, 'utf-8');
        const data = JSON.parse(manifestContent);
        return Array.isArray(data.files) ? data.files : [];
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            console.warn(`Advertencia: El archivo de manifiesto no se encontró en '${manifestPath}'. Ejecute el script de precompilación.`);
        } else {
            console.error('Error al leer o analizar el manifiesto de archivos:', error);
        }
        return [];
    }
}


export async function processSelectedFile(fileName: string, year: number, month: number): Promise<DataProcessingResult> {
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_PATH || '';
    // La ruta del archivo ahora puede contener subdirectorios, así que la dividimos y la codificamos
    const encodedPathParts = fileName.split('/').map(part => encodeURIComponent(part));
    const encodedFileName = encodedPathParts.join('/');
    const fileUrl = `${baseUrl}/BASES%20DE%20DATOS/${encodedFileName}`;

    try {
        // En el entorno del servidor de Next.js, necesitamos una URL absoluta para `fetch`
        const internalUrl = new URL(fileUrl, 'http://localhost:9002');
        const res = await fetch(internalUrl, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`No se pudo descargar el archivo '${fileName}' desde el servidor. Estado: ${res.status}`);
        }

        const fileBuffer = Buffer.from(await res.arrayBuffer());

        return await processFileBufferFlow({
            fileBuffer,
            fileName: path.basename(fileName), // Pasamos solo el nombre del archivo para mantener la lógica original
            year,
            month
        });

    } catch (error: any) {
        console.error(`Error procesando el archivo seleccionado '${fileName}':`, error);
        throw new Error(`Error al procesar el archivo '${fileName}': ${error.message}`);
    }
}


// Reusable flow for processing a file buffer
const processFileBufferFlow = ai.defineFlow(
  {
    name: 'processFileBufferFlow',
    inputSchema: z.object({
        fileBuffer: z.any(),
        fileName: z.string(),
        year: z.number(),
        month: z.number(),
    }),
    outputSchema: ProcessFileResponseSchema,
  },
  async ({ fileBuffer, fileName, year, month }) => {
    
    const mockFile = {
        name: fileName,
        buffer: fileBuffer,
    };
    
    const onProgress = (percentage: number, status: string) => {
        console.log(`Processing Progress: ${percentage}% - ${status}`);
    };

    const results = await processDataFile(mockFile as any, year, month, onProgress);
    
    return results;
  }
);


export async function listModels(): Promise<ModelReference<any>[]> {
    // Returning a static list as requested by the user to avoid service call errors.
    const staticModels = [
        { name: 'embedding-gecko-001', label: 'Embedding Gecko', supports: { generate: false, multiturn: false, tools: false, media: false } },
        { name: 'gemini-1.5-flash-latest', label: 'Gemini 1.5 Flash', supports: { generate: true, multiturn: true, tools: true, media: true } },
        { name: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro', supports: { generate: true, multiturn: true, tools: true, media: true } },
        { name: 'gemini-pro', label: 'Gemini Pro', supports: { generate: true, multiturn: true, tools: false, media: false } },
        { name: 'gemini-pro-vision', label: 'Gemini Pro Vision', supports: { generate: true, multiturn: true, tools: false, media: true } },
        { name: 'text-embedding-004', label: 'Text Embedding 004', supports: { generate: false, multiturn: false, tools: false, media: false } },
        { name: 'aqa', label: 'Attributed Question Answering', supports: { generate: true, multiturn: false, tools: false, media: false } },
        { name: 'imagen-3.0-generate-002', label: 'Imagen 3.0', supports: { generate: true, multiturn: false, tools: false, media: false } },
        { name: 'imagen-4.0-generate-preview-06-06', label: 'Imagen 4 (Preview)', supports: { generate: true, multiturn: false, tools: false, media: false } },
    ];
    
    return staticModels
        .map(m => ({ ...m, name: m.name, supports: m.supports, label: m.label || m.name }))
        .sort((a,b) => a.name.localeCompare(b.name));
}


const UploadFileSchema = z.object({
  fileDataUri: z.string(),
  year: z.string(),
  month: z.string(),
});

export const uploadFile = ai.defineFlow(
  {
    name: 'uploadFile',
    inputSchema: UploadFileSchema,
    outputSchema: z.object({ success: z.boolean(), path: z.string() }),
  },
  async ({ fileDataUri, year, month }) => {
    const baseDir = path.join(process.cwd(), 'public', 'BASES DE DATOS');
    const yearDir = path.join(baseDir, year);
    const fileName = `${month.toUpperCase()}.xlsx`;
    const filePath = path.join(yearDir, fileName);

    try {
      // Create year directory if it doesn't exist
      await fs.mkdir(yearDir, { recursive: true });

      // Convert data URI to buffer
      const buffer = Buffer.from(fileDataUri.split(',')[1], 'base64');

      // Write file to disk
      await fs.writeFile(filePath, buffer);
      
      // Re-run the manifest script
      run();

      return { success: true, path: filePath };
    } catch (error: any) {
      console.error(`Error al guardar el archivo: ${error.message}`);
      throw new Error(`No se pudo guardar el archivo en el servidor. Detalles: ${error.message}`);
    }
  }
);
