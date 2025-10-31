'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, KeyRound, Clock } from 'lucide-react';
import { getUsers, updateUserPassword, getActivityLog, ProviderForAdmin, ActivityLogEntry } from './actions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminPage() {
    const [users, setUsers] = useState<ProviderForAdmin[]>([]);
    const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingLog, setLoadingLog] = useState(true);
    const [selectedUser, setSelectedUser] = useState<ProviderForAdmin | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchUsers();
        fetchActivityLog();
    }, []);

    const fetchUsers = async () => {
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
    };
    
    const fetchActivityLog = async () => {
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
    };

    const handleOpenDialog = (user: ProviderForAdmin) => {
        setSelectedUser(user);
        setNewPassword('');
        setIsDialogOpen(true);
    };

    const handleUpdatePassword = async () => {
        if (!selectedUser || !newPassword) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'La nueva clave no puede estar vacía.',
            });
            return;
        }

        setIsUpdating(true);
        try {
            const result = await updateUserPassword(selectedUser.nit, newPassword);
            if (result.success) {
                toast({
                    title: 'Éxito',
                    description: `La clave para ${selectedUser.razonSocial} ha sido actualizada.`,
                });
                setIsDialogOpen(false);
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Error al actualizar',
                description: error.message,
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Panel de Administración</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Gestión de Usuarios</CardTitle>
                    <CardDescription>
                        Desde aquí podrás gestionar las claves de acceso de los prestadores.
                    </CardDescription>
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
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.nit}>
                                            <TableCell className="font-medium">{user.razonSocial}</TableCell>
                                            <TableCell>{user.nit}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => handleOpenDialog(user)}>
                                                    <KeyRound className="mr-2 h-4 w-4" />
                                                    Cambiar Clave
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Clave para {selectedUser?.razonSocial}</DialogTitle>
                        <DialogDescription>
                            Introduce la nueva clave de acceso para este usuario. El cambio será inmediato.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="new-password" className="text-right">
                                Nueva Clave
                            </Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleUpdatePassword} disabled={isUpdating}>
                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Actualizar Clave
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
