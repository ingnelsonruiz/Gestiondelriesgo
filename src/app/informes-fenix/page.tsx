
"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { DataProcessingResult, GroupedResult, KpiResults } from '@/lib/data-processing';
import { processSelectedFile, listFiles, listModels, uploadFile } from '@/ai/actions';
import { useToast } from "@/hooks/use-toast";
import { Toaster } from '@/components/ui/toaster';
import { FenixFileUpload } from '@/components/fenix/fenix-file-upload';
import { FenixModelSelector } from '@/components/fenix/fenix-model-selector';
import { FenixKpiDashboard } from '@/components/fenix/fenix-kpi-dashboard';
import { FenixReportGenerator } from '@/components/fenix/fenix-report-generator';
import Script from 'next/script';
import { ModelReference } from 'genkit/ai';

export default function InformesFenixPage() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Listo para procesar.');
  const [xlsxLoaded, setXlsxLoaded] = useState(false);
  
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  
  const [lastResults, setLastResults] = useState<DataProcessingResult | null>(null);
  const [selectedIpsForPdf, setSelectedIpsForPdf] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('all');

  const [yearForPdf, setYearForPdf] = useState<number>(new Date().getFullYear());
  const [monthForPdf, setMonthForPdf] = useState<number>(new Date().getMonth() + 1);

  const [availableModels, setAvailableModels] = useState<ModelReference[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-1.5-flash-latest');
  
  const fetchFiles = useCallback(() => {
    return listFiles().then(files => {
        setAvailableFiles(files);
        return files;
    }).catch(err => {
        console.error("Failed to list files:", err);
        toast({ title: 'Error', description: 'No se pudo cargar la lista de archivos desde el servidor.', variant: 'destructive' });
        return [];
    });
  }, [toast]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window.XLSX !== 'undefined') {
        setXlsxLoaded(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const startProcessing = (action: Promise<DataProcessingResult>) => {
    setIsProcessing(true);
    setProgress(20);
    setStatus('Procesando archivo en el servidor...');

    action.then(results => {
      setLastResults(results);
      setSelectedDepartment('all');
      setSelectedMunicipio('all');
      setStatus('Completado.');
      setProgress(100);
      toast({ title: 'Éxito', description: 'El archivo ha sido procesado correctamente.' });
    }).catch(err => {
      console.error(err);
      toast({ title: 'Error procesando archivo', description: err?.message || String(err), variant: 'destructive' });
      setStatus('Error.');
      setProgress(0);
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleProcess = async () => {
    if (!selectedFile) {
        toast({ title: 'Error', description: 'Por favor, seleccione un archivo de la lista.', variant: 'destructive' });
        return;
    }

    const parts = selectedFile.replace(/\.xlsx$/i, '').split('/');
    if (parts.length < 2) {
      toast({ title: 'Error de formato', description: 'El nombre del archivo no tiene el formato esperado "AÑO/MES.xlsx"', variant: 'destructive' });
      return;
    }

    const year = parseInt(parts[0], 10);
    const monthName = parts[1].toUpperCase();
    const monthMap: { [key: string]: number } = {
        ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6,
        JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12
    };
    const month = monthMap[monthName];

    if (isNaN(year) || !month) {
        toast({ title: 'Error de formato', description: 'No se pudo extraer el mes y el año del nombre del archivo.', variant: 'destructive' });
        return;
    }
    
    setYearForPdf(year);
    setMonthForPdf(month);

    startProcessing(processSelectedFile(selectedFile, year, month));
  };
  
  const handleClearResults = () => {
    setLastResults(null);
    setStatus('Listo para procesar.');
    setProgress(0);
  };
  
  const { departments, municipios, filteredGroupedData } = useMemo(() => {
    if (!lastResults) return { departments: [], municipios: [], filteredGroupedData: [] };
    
    const departments = [...new Set(lastResults.groupedData.map(g => g.keys.dpto))].sort();
    
    const byDepartment = selectedDepartment === 'all' 
      ? lastResults.groupedData
      : lastResults.groupedData.filter(g => g.keys.dpto === selectedDepartment);
      
    const municipios = [...new Set(byDepartment.map(g => g.keys.municipio))].sort();

    const byMunicipio = selectedMunicipio === 'all'
      ? byDepartment
      : byDepartment.filter(g => g.keys.municipio === selectedMunicipio);
      
    return { departments, municipios, filteredGroupedData: byMunicipio };
  }, [lastResults, selectedDepartment, selectedMunicipio]);

  useEffect(() => {
    setSelectedMunicipio('all');
  }, [selectedDepartment]);

  const kpis = useMemo(() => {
    if (!lastResults) return null;
    
    if (selectedDepartment === 'all' && selectedMunicipio === 'all') {
        return lastResults.R;
    }

    const initialKpis: KpiResults & { TOTAL_FILAS: number } = {
        NUMERADOR_HTA: 0, NUMERADOR_HTA_MAYORES: 0, DENOMINADOR_HTA_MAYORES: 0, NUMERADOR_DM_CONTROLADOS: 0,
        DENOMINADOR_DM_CONTROLADOS: 0, POBLACION_DM_TOTAL: 0, NUMERADOR_DM: 0, NUMERADOR_HTA_MENORES: 0,
        DENOMINADOR_HTA_MENORES: 0, DENOMINADOR_HTA_MENORES_ARCHIVO: 0, NUMERADOR_CREATININA: 0,
        DENOMINADOR_CREATININA: 0, NUMERADOR_HBA1C: 0, NUMERADOR_MICROALBUMINURIA: 0, NUMERADOR_INASISTENTE: 0,
        TFG_E1: 0, TFG_E2: 0, TFG_E3: 0, TFG_E4: 0, TFG_E5: 0, TFG_TOTAL: 0, TOTAL_FILAS: 0,
    };

    return filteredGroupedData.reduce((acc, group) => {
        Object.keys(group.results).forEach(keyStr => {
            const key = keyStr as keyof KpiResults;
            (acc as any)[key] = ((acc as any)[key] || 0) + (group.results[key] || 0);
        });
        acc.TOTAL_FILAS += group.rowCount;
        return acc;
    }, initialKpis as any);

  }, [lastResults, filteredGroupedData, selectedDepartment, selectedMunicipio]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"
        strategy="lazyOnload"
        onLoad={() => setXlsxLoaded(true)}
      />
      <Toaster />
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            
            <FenixFileUpload
                availableFiles={availableFiles}
                setAvailableFiles={setAvailableFiles}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                isProcessing={isProcessing}
                progress={progress}
                status={status}
                onProcess={handleProcess}
                onClear={handleClearResults}
                fetchFiles={fetchFiles}
            />

            <FenixModelSelector
                availableModels={availableModels}
                setAvailableModels={setAvailableModels}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                isProcessing={isProcessing}
            />

          {lastResults && kpis && (
             <div className="grid gap-8">
                <FenixKpiDashboard
                    kpis={kpis}
                    departments={departments}
                    municipios={municipios}
                    selectedDepartment={selectedDepartment}
                    setSelectedDepartment={setSelectedDepartment}
                    selectedMunicipio={selectedMunicipio}
                    setSelectedMunicipio={setSelectedMunicipio}
                />

                <FenixReportGenerator
                    lastResults={lastResults}
                    xlsxLoaded={xlsxLoaded}
                    selectedModel={selectedModel}
                    selectedIpsForPdf={selectedIpsForPdf}
                    setSelectedIpsForPdf={setSelectedIpsForPdf}
                    yearForPdf={yearForPdf}
                    monthForPdf={monthForPdf}
                    uniqueIpsLocations={
                        [...new Map(filteredGroupedData.map(item => [`${item.keys.ips}|${item.keys.municipio}`, item])).values()]
                            .map(item => ({
                                value: `${item.keys.ips}|${item.keys.municipio}`,
                                label: `${item.keys.ips} - ${item.keys.municipio}`
                            }))
                            .sort((a, b) => a.label.localeCompare(b.label))
                    }
                />
             </div>
          )}
        </main>
      </div>
    </>
  );
}
