
'use client';
import { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Files, Eye, FileDown } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { DataProcessingResult } from '@/lib/data-processing';
import { generateReportText } from '@/ai/flows/report-flow';
import { AIContent } from '@/ai/schemas';
import JSZip from 'jszip';
import { descargarInformePDF, buildDocDefinition, InformeDatos, PdfImages } from '@/lib/informe-riesgo-pdf';
import { loadImageAsBase64 } from '@/lib/image-loader';

interface FenixReportGeneratorProps {
    lastResults: DataProcessingResult;
    xlsxLoaded: boolean;
    selectedModel: string;
    selectedIpsForPdf: string;
    setSelectedIpsForPdf: (value: string) => void;
    yearForPdf: number;
    monthForPdf: number;
    uniqueIpsLocations: { value: string; label: string }[];
}

const formatPercent = (value: number) => {
    if (value === 0) return '0%';
    if (!value || !Number.isFinite(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
}

export function FenixReportGenerator({
    lastResults,
    xlsxLoaded,
    selectedModel,
    selectedIpsForPdf,
    setSelectedIpsForPdf,
    yearForPdf,
    monthForPdf,
    uniqueIpsLocations,
}: FenixReportGeneratorProps) {
    const { toast } = useToast();
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [isExportPreviewOpen, setIsExportPreviewOpen] = useState(false);
    
    // Make sure XLSX is loaded in the main page component if you use window.XLSX
    declare global {
        interface Window { XLSX: any; }
    }

    const getInasistentesData = (
        relevantRows: any[][],
        headerMap: any
      ) => {
        if (!lastResults || lastResults.R.FALTANTES_ENCABEZADOS.includes('FECHA DE LA ULTIMA TOMA DE PRESION ARTERIAL REPORTADO EN HISTORIA CLINICA')) {
            return [];
        }
    
        const range6m = {
            start: new Date(yearForPdf, monthForPdf - 6, 1),
            end: new Date(yearForPdf, monthForPdf, 0)
        };
    
        return relevantRows.filter(row => {
            const fpa_val = row[headerMap['fecha_pa_last']];
            if (!fpa_val) return false;
            
            let fpa: Date | null = null;
            if (typeof fpa_val === 'number') {
                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                fpa = new Date(excelEpoch.getTime() + (fpa_val - (fpa_val > 60 ? 1 : 0)) * 86400000);
            } else if (fpa_val instanceof Date) {
                fpa = fpa_val;
            } else if (typeof fpa_val === 'string') {
                const isoMatch = fpa_val.match(/^(\d{4})-(\d{2})-(\d{2})/);
                if (isoMatch) {
                   const [_, y, m, d] = isoMatch;
                   fpa = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
                } else {
                   const commonMatch = fpa_val.match(/^(?:(\d{1,2})[.\/-])?(\d{1,2})[.\/-](\d{2,4})$/);
                   if (commonMatch) {
                       let [_, p1, p2, p3] = commonMatch;
                       let yearNum = Number(p3);
                       if (p3.length <= 2) yearNum += 2000;
                       if (Number(p1) > 0 && Number(p1) <= 31 && Number(p2) > 0 && Number(p2) <= 12) {
                           fpa = new Date(Date.UTC(yearNum, Number(p2) - 1, Number(p1)));
                       } else if (Number(p2) > 0 && Number(p2) <= 31 && Number(p1) > 0 && Number(p1) <= 12) {
                           fpa = new Date(Date.UTC(yearNum, Number(p1) - 1, Number(p2)));
                       }
                   }
                }
            }
    
            if (fpa && fpa instanceof Date && !isNaN(fpa.getTime())) {
                const isInRange = fpa.getTime() >= range6m.start.getTime() && fpa.getTime() <= range6m.end.getTime();
                return !isInRange;
            }
            return false;
        }).map(row => ({
            tipo_id: row[headerMap['tipo_id']] || '',
            id: row[headerMap['id']] || '',
            tel: row[headerMap['tel']] || '',
            dir: row[headerMap['dir']] || '',
        }));
      };
    
     const mapToInformeDatos = (
        resultsForPdf: DataProcessingResult,
        aiContent: AIContent,
        targetIps: string | undefined,
        targetMunicipio: string | undefined,
        includeInasistentes: boolean
      ): InformeDatos => {
        const { R: kpis, rawRows, headerMap } = resultsForPdf;
        const analysisDate = new Date();
        
        let inasistentes: InformeDatos['inasistentes'] = [];
        if (includeInasistentes) {
            let relevantRows = rawRows;
            if (targetIps && targetMunicipio) {
                relevantRows = rawRows.filter(row => 
                    (row[headerMap['ips']] || '').toUpperCase().trim() === targetIps &&
                    (row[headerMap['municipio']] || '').toUpperCase().trim() === targetMunicipio
                );
            }
            inasistentes = getInasistentesData(relevantRows, headerMap);
        }
    
    
        return {
          encabezado: {
            proceso: 'Dirección del Riesgo en Salud',
            formato: 'Evaluación de indicadores de gestantes, hipertensos y diabéticos (código DR-PP-F-06, versión 01; emisión 18/06/2019; vigencia 02/07/2019)',
            entidad: `${targetIps || "Consolidado"} - Municipio: ${targetMunicipio || "Todos"}`,
            vigencia: `01/01/${yearForPdf}–31/12/${yearForPdf}`,
            lugarFecha: `Valledupar, ${analysisDate.toLocaleDateString('es-ES')}`
          },
          referencia: aiContent.reference.replace(/<p>|<\/p>/g, ''),
          analisisResumido: parseAIContent(aiContent.summary),
          datosAExtraer: [
            { label: "Población HTA (según archivo población)", valor: String(kpis.DENOMINADOR_HTA_MENORES) },
            { label: "Población DM (según archivo población)", valor: String(kpis.POBLACION_DM_TOTAL) },
            { label: "Total pacientes en data", valor: String(kpis.TOTAL_FILAS) },
            { label: `Distribución (HTA=${kpis.NUMERADOR_HTA}, DM=${kpis.NUMERADOR_DM})`, valor: "" },
            { label: "Inasistencia (por última TA)", valor: `${kpis.NUMERADOR_INASISTENTE} usuarios` },
            { label: "Tamizaje Creatinina", valor: formatPercent(kpis.DENOMINADOR_CREATININA > 0 ? kpis.NUMERADOR_CREATININA / kpis.DENOMINADOR_CREATININA : 0) },
            { label: "Tamizaje HbA1c (en DM)", valor: formatPercent(kpis.DENOMINADOR_DM_CONTROLADOS > 0 ? kpis.NUMERADOR_HBA1C / kpis.DENOMINADOR_DM_CONTROLADOS : 0) },
            { label: "Tamizaje Microalbuminuria (en DM)", valor: formatPercent(kpis.DENOMINADOR_DM_CONTROLADOS > 0 ? kpis.NUMERADOR_MICROALBUMINURIA / kpis.DENOMINADOR_DM_CONTROLADOS : 0) },
          ],
          calidadDato: parseAIContent(aiContent.dataQuality),
          observaciones: parseAIContent(aiContent.specificObservations),
          compromisos: parseAIContent(aiContent.actions),
          inasistentes: inasistentes,
          kpisTFG: {
              TFG_E1: kpis.TFG_E1,
              TFG_E2: kpis.TFG_E2,
              TFG_E3: kpis.TFG_E3,
              TFG_E4: kpis.TFG_E4,
              TFG_E5: kpis.TFG_E5,
              TFG_TOTAL: kpis.TFG_TOTAL,
          }
        };
      };
    
      const parseAIContent = (content: string): any[] => {
            if (!content) return [];
            // Expanded regex to remove more HTML tags like <b>
            const cleanContent = content.replace(/<\/?(p|ul|li|ol|strong|b)>/g, '\n').trim();
            const items = cleanContent.split('\n').map(s => s.trim()).filter(Boolean);
            return items;
        };

    const handleGeneratePdf = async () => {
        if (!selectedModel) {
          toast({ title: 'Error', description: 'Por favor, seleccione un modelo de IA antes de generar el PDF.', variant: 'destructive' });
          return;
        }
        setIsGeneratingPdf(true);
        toast({ title: 'Generando PDF con IA...', description: 'Redactando análisis, esto puede tardar un momento.' });
    
        try {
            const monthName = new Date(yearForPdf, monthForPdf - 1).toLocaleString('es', { month: 'long' });
    
            let resultsForPdf: DataProcessingResult = lastResults;
            let targetIps: string | undefined;
            let targetMunicipio: string | undefined;
            
            if (selectedIpsForPdf !== 'all') {
                const [ips, municipio] = selectedIpsForPdf.split('|');
                targetIps = ips;
                targetMunicipio = municipio;
    
                const specificGroupData = lastResults.groupedData.find(
                    g => g.keys.ips === targetIps && g.keys.municipio === targetMunicipio
                );
                
                if (specificGroupData) {
                    resultsForPdf = {
                        ...lastResults,
                        R: { ...specificGroupData.results, TOTAL_FILAS: specificGroupData.rowCount, FALTANTES_ENCABEZADOS: lastResults.R.FALTANTES_ENCABEZADOS },
                    };
                } else {
                     throw new Error(`No se encontraron datos para ${targetIps} en ${targetMunicipio}`);
                }
            }
    
            const aiContent = await generateReportText({
                results: resultsForPdf,
                targetIps: targetIps,
                targetMunicipio: targetMunicipio,
                corte: {
                    year: yearForPdf,
                    month: monthForPdf,
                    monthName: monthName
                },
                model: selectedModel,
            });
            
            const datosInforme = mapToInformeDatos(resultsForPdf, aiContent, targetIps, targetMunicipio, false);
            
            const backgroundImg = await loadImageAsBase64('imagenes pdf/pdf.jpg');
            
            const images: PdfImages = { background: backgroundImg };
            
            await descargarInformePDF(datosInforme, images);
    
        } catch (error: any) {
            console.error("Error generando el PDF:", error);
            if (error.message && error.message.includes('429')) {
                 toast({ 
                    title: 'Límite de cuota excedido', 
                    description: 'Ha realizado demasiadas solicitudes a la IA en poco tiempo. Por favor, espere un minuto y vuelva a intentarlo.', 
                    variant: 'destructive',
                    duration: 9000
                });
            } else {
                toast({ title: 'Error al generar PDF con IA', description: error?.message || 'No se pudo generar el informe.', variant: 'destructive' });
            }
        } finally {
            setIsGeneratingPdf(false);
        }
     };

     const handleBulkGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        toast({ title: 'Generando PDFs Masivos...', description: 'Esto puede tardar varios minutos. No cierre la ventana.' });
    
        const zip = new JSZip();
        const monthName = new Date(yearForPdf, monthForPdf - 1).toLocaleString('es', { month: 'long' });
    
        const mockAiContent: AIContent = {
            reference: "<p>Análisis de indicadores de gestión del riesgo, sin redacción de IA.</p>",
            summary: "<p>Análisis pendiente. Revisar datos para conclusiones.</p>",
            dataQuality: "<p>Oportunidades de mejora no analizadas por IA. Revisar datos para conclusiones.</p>",
            specificObservations: "<p>Observaciones no generadas. Revisar indicadores.</p>",
            actions: "<p>Compromisos y acciones por definir.</p>",
        };
        
        const pdfMake = (await import("pdfmake/build/pdfmake")).default;
        const pdfFonts = (await import("pdfmake/build/vfs_fonts")).default;
        pdfMake.vfs = pdfFonts;
        
        try {
            const backgroundImg = await loadImageAsBase64('imagenes pdf/pdf.jpg');
          
            const images: PdfImages = { background: backgroundImg };
          
            const uniqueGroups = [...new Map(lastResults.groupedData.map(item => [`${item.keys.ips}|${item.keys.municipio}`, item])).values()];
    
            for (const group of uniqueGroups) {
                const { ips, municipio } = group.keys;
                toast({ title: `Generando: ${ips} - ${municipio}`, description: 'Por favor, espere...' });
                
                const resultsForPdf: DataProcessingResult = {
                    ...lastResults,
                    R: { ...group.results, TOTAL_FILAS: group.rowCount, FALTANTES_ENCABEZADOS: lastResults.R.FALTANTES_ENCABEZADOS },
                };
    
                const reportData = mapToInformeDatos(resultsForPdf, mockAiContent, ips, municipio, true);
                
                const docDefinition = buildDocDefinition(reportData, images);
    
                const pdfDoc = pdfMake.createPdf(docDefinition);
    
                const pdfBlob = await new Promise<Blob>((resolve) => {
                    pdfDoc.getBlob((blob) => resolve(blob));
                });
    
                const fileName = `Informe_${ips.replace(/\s/g, '_')}_${municipio.replace(/\s/g, '_')}.pdf`;
                zip.file(fileName, pdfBlob);
            }
    
            toast({ title: 'Comprimiendo archivos...', description: 'Preparando la descarga del archivo ZIP.' });
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(zipBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Informes_Masivos_${monthName}_${yearForPdf}.zip`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
    
            toast({ title: 'Éxito', description: 'La descarga del archivo ZIP ha comenzado.' });
    
        } catch (error: any) {
            console.error("Error generando el ZIP de PDFs:", error);
            toast({ title: 'Error', description: error?.message || 'No se pudo generar el archivo ZIP.', variant: 'destructive' });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const exportResults = () => {
        const { R, issues, groupedData } = lastResults;
    
        if (!xlsxLoaded) {
            toast({ title: 'Error', description: 'La librería de exportación (XLSX) no está cargada. Por favor espere.', variant: 'destructive' });
            return;
        }
        
        const XLSX = window.XLSX;
        const wb = XLSX.utils.book_new();
    
        const summaryData = groupedData.map(g => {
            const poblacionHTA = g.results.DENOMINADOR_HTA_MENORES;
            const poblacionDM = g.results.POBLACION_DM_TOTAL;
            const denominadorDM = g.results.DENOMINADOR_DM_CONTROLADOS;
            const resultadoHTA = poblacionHTA > 0 ? g.results.NUMERADOR_HTA / poblacionHTA : 0;
            const resultadoMenores = g.results.DENOMINADOR_HTA_MENORES_ARCHIVO > 0 ? g.results.NUMERADOR_HTA_MENORES / g.results.DENOMINADOR_HTA_MENORES_ARCHIVO : 0;
            const resultadoMayores = g.results.DENOMINADOR_HTA_MAYORES > 0 ? g.results.NUMERADOR_HTA_MAYORES / g.results.DENOMINADOR_HTA_MAYORES : 0;
            const resultadoDM = denominadorDM > 0 ? g.results.NUMERADOR_DM_CONTROLADOS / denominadorDM : 0;
            const resultadoCreatinina = g.results.DENOMINADOR_CREATININA > 0 ? g.results.NUMERADOR_CREATININA / g.results.DENOMINADOR_CREATININA : 0;
    
            return {
                'DEPARTAMENTO DE RESIDENCIA': g.keys.dpto,
                'MUNICIPIO DE RESIDENCIA': g.keys.municipio,
                'NOMBRE DE LA IPS QUE HACE SEGUIMIENTO': g.keys.ips,
                'Numerador_HTA': g.results.NUMERADOR_HTA,
                'Poblacion_HTA': poblacionHTA,
                'RESULTADO HTA': resultadoHTA,
                'NUMERADOR_HTA_MENORES': g.results.NUMERADOR_HTA_MENORES,
                'DENOMINADOR_HTA_MENORES (ARCHIVO)': g.results.DENOMINADOR_HTA_MENORES_ARCHIVO, 
                '% MENORES': resultadoMenores,
                'NUMERADOR_HTA_MAYORES': g.results.NUMERADOR_HTA_MAYORES,
                'DENOMINADOR_HTA_MAYORES': g.results.DENOMINADOR_HTA_MAYORES,
                '% MAYORES': resultadoMayores,
                'NUMERADOR_DM': g.results.NUMERADOR_DM,
                'Poblacion_DM': poblacionDM,
                'RESULTADO_DM': resultadoDM,
                'NUMERADOR_DM_CONTROLADOS': g.results.NUMERADOR_DM_CONTROLADOS,
                'DENOMINADOR_DM_CONTROLADOS': denominadorDM,
                '%_DM_CONTROLADOS': resultadoDM,
                'NUMERADOR_CREATININA': g.results.NUMERADOR_CREATININA,
                'DENOMINADOR_CREATININA': g.results.DENOMINADOR_CREATININA,
                '%_CREATININA': resultadoCreatinina,
            };
        });
    
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen KPIs Agrupado');
    
    
        const kpiData = Object.entries(R).map(([k, v]) => ({ Indicador: k, Valor: Array.isArray(v) ? v.join(', ') : v }));
        const wsKPI = XLSX.utils.json_to_sheet(kpiData, {header: ["Indicador", "Valor"]});
        XLSX.utils.book_append_sheet(wb, wsKPI, 'KPIs Totales');
        
        if(issues.dates.length > 0) {
          const wsF = XLSX.utils.aoa_to_sheet([['Fila', 'Campo', 'Valor original', 'Observación'], ...issues.dates]);
          XLSX.utils.book_append_sheet(wb, wsF, 'Fechas dudosas');
        }
        if(issues.nums.length > 0) {
          const wsN = XLSX.utils.aoa_to_sheet([['Fila', 'Campo', 'Valor', 'Observación'], ...issues.nums]);
          XLSX.utils.book_append_sheet(wb, wsN, 'Num inválidos');
        }
        if(issues.cats.length > 0) {
          const wsC = XLSX.utils.aoa_to_sheet([['Fila', 'Campo', 'Valor', 'Esperado'], ...issues.cats]);
          XLSX.utils.book_append_sheet(wb, wsC, 'Cats inesperados');
        }
    
        const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'resultados_indicadores.xlsx'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
        setIsExportPreviewOpen(false);
    }
    
    const exportPreviewData = useMemo(() => {
        if (!lastResults) return [];
        return lastResults.groupedData.slice(0, 5).map(g => {
             const resultadoCreatinina = g.results.DENOMINADOR_CREATININA > 0 ? g.results.NUMERADOR_CREATININA / g.results.DENOMINADOR_CREATININA : 0;
             return {
                ips: g.keys.ips,
                municipio: g.keys.municipio,
                numerador: g.results.NUMERADOR_CREATININA,
                denominador: g.results.DENOMINADOR_CREATININA,
                porcentaje: formatPercent(resultadoCreatinina),
             }
        })
    }, [lastResults]);
      
    return (
        <Card>
            <CardHeader>
                <CardTitle>Observaciones y Exportación</CardTitle>
                <CardDescription>Calidad de datos, exportación a Excel y generación de informes en PDF.</CardDescription>
            </CardHeader>
            <CardContent>
                    <div className="grid gap-4">
                    <div className="grid sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                            <Dialog open={isExportPreviewOpen} onOpenChange={setIsExportPreviewOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" disabled={isGeneratingPdf} className="mb-2 sm:mb-0 w-full sm:w-auto">
                                    <Eye className="mr-2 h-4 w-4"/>
                                    Exportar Excel
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Vista Previa de Exportación</DialogTitle>
                                    <DialogDescription>
                                        Esta es una vista previa de las primeras 5 filas de datos que se exportarán a Excel.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="max-h-[50vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>IPS</TableHead>
                                                <TableHead>Municipio</TableHead>
                                                <TableHead>Num. Creat.</TableHead>
                                                <TableHead>Den. Creat.</TableHead>
                                                <TableHead>% Creatinina</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {exportPreviewData.map((row, i) => (
                                                <TableRow key={i}>
                                                    <TableCell>{row.ips}</TableCell>
                                                    <TableCell>{row.municipio}</TableCell>
                                                    <TableCell>{row.numerador}</TableCell>
                                                    <TableCell>{row.denominador}</TableCell>
                                                    <TableCell>{row.porcentaje}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsExportPreviewOpen(false)}>Cancelar</Button>
                                    <Button onClick={exportResults}>
                                        <FileDown className="mr-2 h-4 w-4"/>
                                        Confirmar y Descargar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Select value={selectedIpsForPdf} onValueChange={setSelectedIpsForPdf} disabled={isGeneratingPdf}>
                            <SelectTrigger className="w-full sm:w-[280px]">
                            <SelectValue placeholder="Seleccionar IPS para PDF" />
                            </SelectTrigger>
                            <SelectContent>
                            <SelectItem value="all">Consolidado</SelectItem>
                            {uniqueIpsLocations.map(item => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                            <Button onClick={handleGeneratePdf} variant="default" disabled={isGeneratingPdf} className="w-full">
                                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4"/>}
                                {isGeneratingPdf ? 'Generando...' : 'Generar PDF'}
                            </Button>
                                <Button onClick={handleBulkGeneratePdf} variant="secondary" disabled={isGeneratingPdf} className="w-full">
                                {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Files className="mr-2 h-4 w-4"/>}
                                {isGeneratingPdf ? 'Generando...' : 'Masivo PDF'}
                                </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
