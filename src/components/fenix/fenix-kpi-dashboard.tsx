
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { KpiResults } from "@/lib/data-processing";

interface FenixKpiDashboardProps {
    kpis: KpiResults & { TOTAL_FILAS: number };
    departments: string[];
    municipios: string[];
    selectedDepartment: string;
    setSelectedDepartment: (value: string) => void;
    selectedMunicipio: string;
    setSelectedMunicipio: (value: string) => void;
}

const formatPercent = (value: number) => {
    if (value === 0) return '0%';
    if (!value || !Number.isFinite(value)) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
}

export function FenixKpiDashboard({
    kpis,
    departments,
    municipios,
    selectedDepartment,
    setSelectedDepartment,
    selectedMunicipio,
    setSelectedMunicipio,
}: FenixKpiDashboardProps) {

    const kpiGroups = kpis ? [
        {
          title: 'Resultado Captacion HTA',
          cards: [
            { label: 'Pacientes HTA (Numerador)', key: 'NUMERADOR_HTA', description: 'Pacientes HTA (18-69a) encontrados en el archivo.' },
            { label: 'Población HTA (Denominador)', key: 'DENOMINADOR_HTA_MENORES', description: 'Total de pacientes con diagnóstico de HTA según archivo de población.' },
            { label: 'Resultado HTA', key: 'RESULTADO_HTA', isPercentage: true, value: formatPercent(kpis.DENOMINADOR_HTA_MENORES > 0 ? kpis.NUMERADOR_HTA / kpis.DENOMINADOR_HTA_MENORES : 0), description: '(Numerador HTA / Población HTA)' },
          ]
        },
        {
          title: 'Resultado HTA < 60 años',
          cards: [
            { label: 'HTA Controlado <60 (Numerador)', key: 'NUMERADOR_HTA_MENORES', description: 'Pacientes HTA (18-59a) con PA < 140/90.' },
            { label: 'Población HTA <60 (Denominador)', key: 'DENOMINADOR_HTA_MENORES_ARCHIVO', description: 'Pacientes HTA (18-59a) del archivo cargado.' },
            { label: 'Resultado HTA <60', key: 'RESULTADO_HTA_MENORES', isPercentage: true, value: formatPercent(kpis.DENOMINADOR_HTA_MENORES_ARCHIVO > 0 ? kpis.NUMERADOR_HTA_MENORES / kpis.DENOMINADOR_HTA_MENORES_ARCHIVO : 0), description: '(Numerador / Denominador)' },
          ]
        },
        {
          title: 'Resultado HTA >= 60 años',
          cards: [
            { label: 'HTA Controlado >=60 (Numerador)', key: 'NUMERADOR_HTA_MAYORES', description: 'Pacientes HTA (>=60a, sin DM) con PA < 150/90.' },
            { label: 'Población HTA >=60 (Denominador)', key: 'DENOMINADOR_HTA_MAYORES', description: 'Pacientes HTA (>=60a, sin DM) del archivo cargado.' },
            { label: 'Resultado HTA >=60', key: 'RESULTADO_HTA_MAORIES', isPercentage: true, value: formatPercent(kpis.DENOMINADOR_HTA_MAYORES > 0 ? kpis.NUMERADOR_HTA_MAYORES / kpis.DENOMINADOR_HTA_MAYORES : 0), description: '(Numerador / Denominador)' },
          ]
        },
         {
          title: 'Resultado Adherencia DM (Archivo)',
          cards: [
            { label: 'Pacientes DM Archivo (Numerador)', key: 'NUMERADOR_DM', description: 'Total pacientes DM (18-69a) encontrados en el archivo.' },
            { label: 'Población DM Total (Denominador)', key: 'POBLACION_DM_TOTAL', description: 'Total de pacientes con diagnóstico de DM según archivo de población.' },
            { label: 'Resultado Adherencia DM', key: 'RESULTADO_DM_POB', isPercentage: true, value: formatPercent(kpis.POBLACION_DM_TOTAL > 0 ? kpis.NUMERADOR_DM / kpis.POBLACION_DM_TOTAL : 0), description: '(Numerador / Denominador)' },
          ]
        },
        {
          title: 'Resultado Control DM (HbA1c)',
          cards: [
            { label: 'DM Controlado (Numerador)', key: 'NUMERADOR_DM_CONTROLADOS', description: 'Pacientes DM con HbA1c < 7%.' },
            { label: 'Pacientes con DM (Denominador)', key: 'DENOMINADOR_DM_CONTROLADOS', description: 'Pacientes con DX de DM="SI" en el archivo cargado.' },
            { label: 'Resultado Control DM', key: 'RESULTADO_DM_CONTROL', isPercentage: true, value: formatPercent(kpis.DENOMINADOR_DM_CONTROLADOS > 0 ? kpis.NUMERADOR_DM_CONTROLADOS / kpis.DENOMINADOR_DM_CONTROLADOS : 0), description: '(Numerador / Denominador)' },
          ]
        },
        {
          title: 'Resultado Tamizaje Creatinina',
          cards: [
            { label: 'Creatinina Tomada (Numerador)', key: 'NUMERADOR_CREATININA', description: 'Pacientes con creatinina en últimos 12 meses.' },
            { label: 'Denominador Creatinina', key: 'DENOMINADOR_CREATININA', description: 'Total de registros con fecha de creatinina.' },
            { 
              label: 'Resultado Creatinina', 
              key: 'RESULTADO_CREATININA',
              isPercentage: true, 
              value: formatPercent(kpis.DENOMINADOR_CREATININA > 0 ? kpis.NUMERADOR_CREATININA / kpis.DENOMINADOR_CREATININA : 0),
              description: '(Numerador / Denominador)' 
            },
          ]
        },
        {
            title: 'Resultado Inasistentes',
            cards: [
                { label: 'Inasistentes a Control', key: 'NUMERADOR_INASISTENTE', description: 'Pacientes con fecha de PA registrada pero fuera de los últimos 6 meses.' },
                { label: 'Total Filas Leídas', key: 'TOTAL_FILAS', description: 'Número total de registros en el archivo.' },
                { 
                    label: 'Resultado Inasistentes', 
                    key: 'RESULTADO_INASISTENTES',
                    isPercentage: true, 
                    value: formatPercent(kpis.TOTAL_FILAS > 0 ? kpis.NUMERADOR_INASISTENTE / kpis.TOTAL_FILAS : 0),
                    description: '(Inasistentes / Total Filas)' 
                },
            ]
        }
      ] : [];

      const otherKpis = kpis ? [
        { label: 'HbA1c Tomada (DM)', key: 'NUMERADOR_HBA1C', description: 'Pacientes DM con HbA1c en últimos 6 meses.' },
        { label: 'Microalbuminuria Tomada (DM)', key: 'NUMERADOR_MICROALBUMINURIA', description: 'Pacientes DM con microalbuminuria en últimos 12 meses.' },
      ] : [];
    
      const tfgKpis = kpis ? [
        { label: 'Estadio 1', key: 'TFG_E1', description: 'Pacientes en Estadio 1 (TFG >= 90)' },
        { label: 'Estadio 2', key: 'TFG_E2', description: 'Pacientes en Estadio 2 (TFG 60-89)' },
        { label: 'Estadio 3', key: 'TFG_E3', description: 'Pacientes en Estadio 3 (TFG 30-59)' },
        { label: 'Estadio 4', key: 'TFG_E4', description: 'Pacientes en Estadio 4 (TFG 15-29)' },
        { label: 'Estadio 5', key: 'TFG_E5', description: 'Pacientes en Estadio 5 (TFG < 15)' },
        { label: 'Total con Estadio', key: 'TFG_TOTAL', description: 'Total pacientes con estadio TFG informado.' },
      ] : [];

      const chartDataHTA = kpis ? [
        { name: 'HTA General', Numerador: kpis.NUMERADOR_HTA, Denominador: kpis.DENOMINADOR_HTA_MENORES },
        { name: 'HTA <60', Numerador: kpis.NUMERADOR_HTA_MENORES, Denominador: kpis.DENOMINADOR_HTA_MENORES_ARCHIVO },
        { name: 'HTA >=60', Numerador: kpis.NUMERADOR_HTA_MAYORES, Denominador: kpis.DENOMINADOR_HTA_MAYORES },
      ] : [];
    
      const chartDataDM = kpis ? [
          { name: 'Adherencia DM', Numerador: kpis.NUMERADOR_DM, Denominador: kpis.POBLACION_DM_TOTAL },
          { name: 'Control DM (HbA1c)', Numerador: kpis.NUMERADOR_DM_CONTROLADOS, Denominador: kpis.DENOMINADOR_DM_CONTROLADOS },
      ] : [];
    
      const chartDataOtros = kpis ? [
          { name: 'Creatinina Tomada', Numerador: kpis.NUMERADOR_CREATININA, Denominador: kpis.DENOMINADOR_CREATININA },
          { name: 'HbA1c Tomada', Numerador: kpis.NUMERADOR_HBA1C, Denominador: kpis.DENOMINADOR_DM_CONTROLADOS },
          { name: 'Microalbuminuria Tomada', Numerador: kpis.NUMERADOR_MICROALBUMINURIA, Denominador: kpis.DENOMINADOR_DM_CONTROLADOS },
      ] : [];

    const chartConfig = {
        Numerador: { label: 'Numerador (Cumplen)', color: 'hsl(var(--primary))' },
        Denominador: { label: 'Denominador (Población)', color: 'hsl(var(--muted))' },
    };
      
    return (
        <>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Resultados de Indicadores ({selectedDepartment === 'all' ? 'Totales' : `${selectedDepartment}${selectedMunicipio === 'all' ? '' : ` - ${selectedMunicipio}`}`})</CardTitle>
                        <CardDescription>Resumen de los KPIs calculados para la selección actual.</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Seleccionar Depto." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Departamentos</SelectItem>
                                {departments.map(dpto => (
                                    <SelectItem key={dpto} value={dpto}>{dpto}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio} disabled={selectedDepartment === 'all'}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Seleccionar Municipio" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los Municipios</SelectItem>
                                {municipios.map(muni => (
                                    <SelectItem key={muni} value={muni}>{muni}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-8">
                    {kpiGroups.map((group, index) => (
                        <div key={index} className="space-y-4">
                        <h3 className="font-semibold text-card-foreground">{group.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {group.cards.map(({ label, key, description, isPercentage, value }) => (
                                <Card key={key || label} className="p-4 text-center flex flex-col justify-between hover:bg-card-foreground/5 transition-colors">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{isPercentage ? value : (kpis as any)[key] ?? 0}</p>
                                        <p className="font-semibold mt-1" dangerouslySetInnerHTML={{ __html: label }}></p>
                                    </div>
                                    <p className="text-muted-foreground mt-2">{description}</p>
                                </Card>
                            ))}
                        </div>
                        </div>
                    ))}
                        <div className="border-t pt-8 space-y-4">
                        <h3 className="font-semibold text-card-foreground">Resultados TFG por Estadio</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                            {tfgKpis.map(({ label, key, description }) => (
                                <Card key={key} className="p-4 text-center flex flex-col justify-between hover:bg-card-foreground/5 transition-colors">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{(kpis as any)[key] ?? 0}</p>
                                        <p className="font-semibold mt-1">{label}</p>
                                    </div>
                                    <p className="text-muted-foreground mt-2">{description}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                        <div className="border-t pt-8 space-y-4">
                        <h3 className="font-semibold text-card-foreground">Otros Indicadores y Métricas</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {otherKpis.map(({ label, key, description }) => (
                                <Card key={key} className="p-4 text-center flex flex-col justify-between hover:bg-card-foreground/5 transition-colors">
                                    <div>
                                        <p className="text-2xl font-bold text-primary">{(kpis as any)[key] ?? 0}</p>
                                        <p className="font-semibold mt-1">{label}</p>
                                    </div>
                                    <p className="text-muted-foreground mt-2">{description}</p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                <CardTitle>Análisis Visual de KPIs</CardTitle>
                <CardDescription>Comparación visual de pacientes que cumplen (numerador) vs. la población relevante (denominador) para cada indicador.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col gap-2">
                    <h3 className="text-center font-medium">Indicadores HTA</h3>
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={chartDataHTA} layout="vertical" margin={{ left: 30, right: 20 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100}/>
                        <XAxis type="number" />
                        <Tooltip cursor={{ fill: 'hsl(var(--accent) / 0.2)' }} content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="Denominador" fill="var(--color-Denominador)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Numerador" fill="var(--color-Numerador)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ChartContainer>
                    </div>
                    <div className="flex flex-col gap-2">
                    <h3 className="text-center font-medium">Indicadores DM</h3>
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={chartDataDM} layout="vertical" margin={{ left: 30, right: 20 }}>
                        <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100}/>
                        <XAxis type="number" />
                        <Tooltip cursor={{ fill: 'hsl(var(--accent) / 0.2)' }} content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="Denominador" fill="var(--color-Denominador)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Numerador" fill="var(--color-Numerador)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ChartContainer>
                    </div>
                    <div className="flex flex-col gap-2">
                    <h3 className="text-center font-medium">Otros Indicadores (DM)</h3>
                        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={chartDataOtros} layout="vertical" margin={{ left: 30, right: 20 }}>
                        <CartesianGrid horizontal={false} />
                            <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={100}/>
                        <XAxis type="number" />
                        <Tooltip cursor={{ fill: 'hsl(var(--accent) / 0.2)' }} content={<ChartTooltipContent indicator="dot" />} />
                        <Legend />
                        <Bar dataKey="Denominador" fill="var(--color-Denominador)" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Numerador" fill="var(--color-Numerador)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ChartContainer>
                    </div>
                </CardContent>
            </Card>
        </>
    );
}
