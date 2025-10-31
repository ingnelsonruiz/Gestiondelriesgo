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
import * as fs from 'fs';
import {z} from 'zod';
import { ModelReference } from 'genkit/ai';

// Moved from scripts/build-file-manifest.ts to avoid Edge Runtime issues
function findXlsxFiles(dir: string, baseDirForRelative: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  let results: string[] = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(findXlsxFiles(fullPath, baseDirForRelative));
    } else if (file.isFile() && file.name.toLowerCase().endsWith(".xlsx")) {
      results.push(path.relative(baseDirForRelative, fullPath).replace(/\\/g, '/'));
    }
  }
  return results;
}

export function runFileManifestUpdate() {
  const baseDir = path.join(process.cwd(), "public", "BASES DE DATOS");
  const outPath = path.join(process.cwd(), "public", "bases-manifest.json");
  const publicDir = path.join(process.cwd(), "public");

  if (!fs.existsSync(baseDir)) {
    console.warn("Advertencia: No se encontró la carpeta 'public/BASES DE DATOS'. Se generará un manifiesto vacío.");
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(outPath, JSON.stringify({ folder: "BASES DE DATOS", files: [] }, null, 2), "utf8");
    return;
  }
  
  const files = findXlsxFiles(baseDir, baseDir).sort();

  fs.writeFileSync(outPath, JSON.stringify({ folder: "BASES DE DATOS", files }, null, 2), "utf8");
  console.log(`Manifiesto generado: ${outPath} (${files.length} archivos)`);
}


export async function listFiles(): Promise<string[]> {
    const manifestPath = path.join(process.cwd(), 'public', 'bases-manifest.json');

    try {
        runFileManifestUpdate(); // Regenerate manifest before reading
        const manifestContent = await fs.promises.readFile(manifestPath, 'utf-8');
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
    const encodedPathParts = fileName.split('/').map(part => encodeURIComponent(part));
    const encodedFileName = encodedPathParts.join('/');
    const fileUrl = `${baseUrl}/BASES%20DE%20DATOS/${encodedFileName}`;

    try {
        const internalUrl = new URL(fileUrl, 'http://localhost:9002');
        const res = await fetch(internalUrl, { cache: 'no-store' });

        if (!res.ok) {
            throw new Error(`No se pudo descargar el archivo '${fileName}' desde el servidor. Estado: ${res.status}`);
        }

        const fileBuffer = Buffer.from(await res.arrayBuffer());

        return await processFileBufferFlow({
            fileBuffer,
            fileName: path.basename(fileName),
            year,
            month
        });

    } catch (error: any) {
        console.error(`Error procesando el archivo seleccionado '${fileName}':`, error);
        throw new Error(`Error al procesar el archivo '${fileName}': ${error.message}`);
    }
}


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
      await fs.promises.mkdir(yearDir, { recursive: true });

      const buffer = Buffer.from(fileDataUri.split(',')[1], 'base64');

      await fs.promises.writeFile(filePath, buffer);
      
      runFileManifestUpdate();

      return { success: true, path: filePath };
    } catch (error: any) {
      console.error(`Error al guardar el archivo: ${error.message}`);
      throw new Error(`No se pudo guardar el archivo en el servidor. Detalles: ${error.message}`);
    }
  }
);
