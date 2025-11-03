
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Edit, Trash2, Search } from 'lucide-react';
import { searchAfiliados, addAfiliado, updateAfiliado, deleteAfiliado, type Afiliado } from './actions';

type FormState = Afiliado;

export default function AdminAfiliadosPage() {
    const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formState, setFormState] = useState<FormState>({ tipo_identificacion: '', numero_identificacion: '', primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', fecha_nacimiento: '', sexo: '' });
    const [editingUser, setEditingUser] = useState<Afiliado | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [isPending, startTransition] = useTransition();

    const { toast } = useToast();

    const fetchAfiliados = useCallback((query: string) => {
        setLoading(true);
        searchAfiliados(query)
            .then(setAfiliados)
            .catch(error => {
                toast({
                    variant: 'destructive',
                    title: 'Error al buscar afiliados',
                    description: error.message,
                });
            })
            .finally(() => setLoading(false));
    }, [toast]);
    
    useEffect(() => {
        const handler = setTimeout(() => {
             startTransition(() => {
                fetchAfiliados(searchTerm);
            });
        }, 300); // Debounce de 300ms

        return () => clearTimeout(handler);
    }, [searchTerm, fetchAfiliados]);

    const handleOpenForm = (afiliado: Afiliado | null) => {
        setEditingUser(afiliado);
        if (afiliado) {
            setFormState(afiliado);
        } else {
            setFormState({ tipo_identificacion: '', numero_identificacion: '', primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', fecha_nacimiento: '', sexo: '' });
        }
        setIsFormOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formState.numero_identificacion || !formState.primer_nombre || !formState.primer_apellido) {
            toast({ variant: 'destructive', title: 'Error', description: 'Identificación, primer nombre y primer apellido son obligatorios.' });
            return;
        }

        setIsSubmitting(true);
        try {
            let result;
            if (editingUser) {
                result = await updateAfiliado(formState);
                if(result.success) toast({ title: 'Éxito', description: `Afiliado actualizado.` });
            } else {
                result = await addAfiliado(formState);
                 if(result.success) toast({ title: 'Éxito', description: `Afiliado añadido.` });
            }
            
            if (!result.success) throw new Error(result.error);
            
            setIsFormOpen(false);
            fetchAfiliados(searchTerm);

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        setIsSubmitting(true);
        try {
            const result = await deleteAfiliado(id);
            if(result.success) {
                toast({ title: 'Éxito', description: 'El afiliado ha sido eliminado.' });
                fetchAfiliados(searchTerm);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al eliminar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <CardTitle>Gestión de Afiliados</CardTitle>
                        <CardDescription>
                            Busque, añada, edite o elimine los afiliados de la base de datos maestra.
                        </CardDescription>
                    </div>
                    <div className='flex gap-4'>
                        <div className="relative flex-1 md:grow-0">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Buscar por nombre o ID..."
                                className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button onClick={() => handleOpenForm(null)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Afiliado
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {(loading || isPending) ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="border rounded-lg max-h-[60vh] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre Completo</TableHead>
                                        <TableHead>Tipo ID</TableHead>
                                        <TableHead>No. Identificación</TableHead>
                                        <TableHead>Sexo</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {afiliados.length > 0 ? afiliados.map((user) => (
                                        <TableRow key={user.numero_identificacion}>
                                            <TableCell className="font-medium">{`${user.primer_nombre} ${user.segundo_nombre} ${user.primer_apellido} ${user.segundo_apellido}`}</TableCell>
                                            <TableCell>{user.tipo_identificacion}</TableCell>
                                            <TableCell>{user.numero_identificacion}</TableCell>
                                            <TableCell>{user.sexo}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                 <Button variant="outline" size="sm" onClick={() => handleOpenForm(user)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente al afiliado.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(user.numero_identificacion)} disabled={isSubmitting}>
                                                                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Continuar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No se encontraron afiliados. {searchTerm ? 'Intente con otra búsqueda.' : 'Puede empezar por buscar o añadir un nuevo afiliado.'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar' : 'Añadir'} Afiliado</DialogTitle>
                        <DialogDescription>
                           {editingUser ? 'Modifique los datos del afiliado.' : 'Complete el formulario para añadir un nuevo afiliado.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primer_nombre">Primer Nombre</Label>
                                <Input id="primer_nombre" name="primer_nombre" value={formState.primer_nombre} onChange={handleFormChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="segundo_nombre">Segundo Nombre</Label>
                                <Input id="segundo_nombre" name="segundo_nombre" value={formState.segundo_nombre} onChange={handleFormChange} />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="primer_apellido">Primer Apellido</Label>
                                <Input id="primer_apellido" name="primer_apellido" value={formState.primer_apellido} onChange={handleFormChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="segundo_apellido">Segundo Apellido</Label>
                                <Input id="segundo_apellido" name="segundo_apellido" value={formState.segundo_apellido} onChange={handleFormChange} />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tipo_identificacion">Tipo ID</Label>
                                <Input id="tipo_identificacion" name="tipo_identificacion" value={formState.tipo_identificacion} onChange={handleFormChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="numero_identificacion">No. Identificación</Label>
                                <Input id="numero_identificacion" name="numero_identificacion" value={formState.numero_identificacion} onChange={handleFormChange} disabled={!!editingUser} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fecha_nacimiento">Fecha Nacimiento (AAAA-MM-DD)</Label>
                                <Input id="fecha_nacimiento" name="fecha_nacimiento" value={formState.fecha_nacimiento} onChange={handleFormChange} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="sexo">Sexo</Label>
                                <Input id="sexo" name="sexo" value={formState.sexo} onChange={handleFormChange} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}
