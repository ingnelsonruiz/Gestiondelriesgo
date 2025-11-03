
'use client';
import { useState, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Cpu } from 'lucide-react';
import { listModels } from '@/ai/actions';
import { useToast } from "@/hooks/use-toast";
import { ModelReference } from 'genkit/ai';

interface FenixModelSelectorProps {
    availableModels: ModelReference[];
    setAvailableModels: (models: ModelReference[]) => void;
    selectedModel: string;
    setSelectedModel: (model: string) => void;
    isProcessing: boolean;
}

export function FenixModelSelector({
    availableModels,
    setAvailableModels,
    selectedModel,
    setSelectedModel,
    isProcessing,
}: FenixModelSelectorProps) {
    const { toast } = useToast();
    const [isFetchingModels, setIsFetchingModels] = useState(false);

    const handleFetchModels = useCallback(() => {
        setIsFetchingModels(true);
        listModels()
            .then(models => setAvailableModels(models))
            .catch(err => {
                console.error("Failed to list models:", err);
                toast({ title: 'Error', description: 'No se pudo cargar la lista de modelos de IA.', variant: 'destructive' });
            })
            .finally(() => setIsFetchingModels(false));
    }, [setAvailableModels, toast]);

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Verificar y Seleccionar Modelo de IA</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4 p-2">
                    <div className="space-y-1">
                        <h3 className="font-semibold">Modelos de IA</h3>
                        <p className="text-sm text-muted-foreground">
                        Seleccione el modelo de IA que se usará para generar los informes en PDF. Puede verificar los modelos disponibles si lo desea.
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={handleFetchModels} disabled={isFetchingModels}>
                            {isFetchingModels ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Cpu className="mr-2 h-4 w-4" />}
                            Verificar Modelos
                        </Button>
                        <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isProcessing}>
                            <SelectTrigger className="w-[280px]">
                                <SelectValue placeholder="Seleccionar Modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableModels.length > 0 ? availableModels.map((model: any) => (
                                    <SelectItem key={model.name} value={model.name}>{model.label || model.name}</SelectItem>
                                )) : <SelectItem value={selectedModel} disabled>{selectedModel}</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>
                    {isFetchingModels && availableModels.length === 0 && <p className="text-sm text-muted-foreground">Buscando modelos...</p>}
                    {availableModels.length > 0 && !isFetchingModels && (
                        <div className="mt-4 p-4 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-2">Modelos encontrados:</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm">
                                {availableModels.map((model: any) => (
                                    <li key={model.name}><code>{model.name}</code></li>
                                ))}
                            </ul>
                        </div>
                    )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
