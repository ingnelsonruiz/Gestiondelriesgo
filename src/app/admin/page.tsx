'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Clock, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getUsers, addProvider, updateProvider, deleteProvider, getActivityLog, type ProviderForAdmin, type ActivityLogEntry } from './actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type FormState = Omit<ProviderForAdmin, 'nit'> & { nit?: string };

export default function AdminPage() {
    const [users, setUsers] = useState<ProviderForAdmin[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLog, setLoadingLog] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // State for Dialogs
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [formState, setFormState] = useState<FormState>({ razonSocial: '', departamento: '', clave: '' });
    const [editingUser, setEditingUser] = useState<ProviderForAdmin | null>(null);

    const { toast } = useToast();

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const userList = await getUsers();
            setUsers(userList);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al cargar usuarios',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);
    
    const fetchActivityLog = useCallback(async () => {
        setLoadingLog(true);
        try {
            const logEntries = await getActivityLog();
            setActivityLog(logEntries);
        } catch (error: any) {
             toast({
                variant: 'destructive',
                title: 'Error al cargar el registro',
                description: error.message,
            });
        } finally {
            setLoadingLog(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchUsers();
        fetchActivityLog();
    }, [fetchUsers, fetchActivityLog]);


    const handleOpenForm = (user: ProviderForAdmin | null) => {
        setEditingUser(user);
        if (user) {
            setFormState(user);
        } else {
            setFormState({ nit: '', razonSocial: '', departamento: '', clave: '' });
        }
        setIsUserFormOpen(true);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formState.nit || !formState.razonSocial || !formState.departamento || !formState.clave) {
            toast({ variant: 'destructive', title: 'Error', description: 'Todos los campos son obligatorios.' });
            return;
        }

        setIsSubmitting(true);
        try {
            let result;
            if (editingUser) {
                result = await updateProvider({ ...formState, nit: editingUser.nit });
                if(result.success) toast({ title: 'Éxito', description: `Prestador ${formState.razonSocial} actualizado.` });
            } else {
                result = await addProvider(formState as ProviderForAdmin);
                 if(result.success) toast({ title: 'Éxito', description: `Prestador ${formState.razonSocial} añadido.` });
            }
            
            if (!result.success) throw new Error(result.error);
            
            setIsUserFormOpen(false);
            fetchUsers();

        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDelete = async (nit: string) => {
        setIsSubmitting(true);
        try {
            const result = await deleteProvider(nit);
            if(result.success) {
                toast({ title: 'Éxito', description: 'El prestador ha sido eliminado.' });
                fetchUsers();
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
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Gestión de Prestadores</CardTitle>
                        <CardDescription>
                            Añada, edite o elimine los prestadores y sus claves de acceso.
                        </CardDescription>
                    </div>
                     <Button onClick={() => handleOpenForm(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Prestador
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Razón Social</TableHead>
                                        <TableHead>NIT</TableHead>
                                        <TableHead>Departamento</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.nit}>
                                            <TableCell className="font-medium">{user.razonSocial}</TableCell>
                                            <TableCell>{user.nit}</TableCell>
                                            <TableCell>{user.departamento}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                 <Button variant="outline" size="sm" onClick={() => handleOpenForm(user)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="destructive" size="sm" disabled={user.razonSocial.toUpperCase() === 'ADMIN'}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta acción no se puede deshacer. Se eliminará permanentemente al prestador
                                                                <strong> {user.razonSocial}</strong>.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(user.nit)} disabled={isSubmitting}>
                                                                 {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Continuar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isUserFormOpen} onOpenChange={setIsUserFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Editar' : 'Añadir'} Prestador</DialogTitle>
                        <DialogDescription>
                           {editingUser ? 'Modifique los datos del prestador.' : 'Complete el formulario para añadir un nuevo prestador.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="nit" className="text-right">NIT</Label>
                            <Input id="nit" name="nit" value={formState.nit || ''} onChange={handleFormChange} className="col-span-3" disabled={!!editingUser} />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="razonSocial" className="text-right">Razón Social</Label>
                            <Input id="razonSocial" name="razonSocial" value={formState.razonSocial} onChange={handleFormChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="departamento" className="text-right">Departamento</Label>
                            <Input id="departamento" name="departamento" value={formState.departamento} onChange={handleFormChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="clave" className="text-right">Clave</Label>
                            <Input id="clave" name="clave" type="password" value={formState.clave} onChange={handleFormChange} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUserFormOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Card>
                <CardHeader>
                    <CardTitle>Registro de Actividad</CardTitle>
                    <CardDescription>
                       Un vistazo a las acciones más recientes realizadas en la plataforma.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingLog ? (
                         <div className="flex justify-center items-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : activityLog.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="mx-auto h-8 w-8 mb-2" />
                            <p>No hay actividad registrada todavía.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg max-h-96 overflow-y-auto">
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha y Hora</TableHead>
                                        <TableHead>Prestador</TableHead>
                                        <TableHead>Acción</TableHead>
                                        <TableHead>Detalles</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activityLog.map((log, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {format(new Date(log.timestamp), "d 'de' LLLL 'de' yyyy, h:mm:ss a", { locale: es })}
                                            </TableCell>
                                            <TableCell>{log.provider}</TableCell>
                                            <TableCell>{log.action}</TableCell>
                                            <TableCell>{log.details}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </main>
    );
}
