
'use server';

import { getSession } from '@/app/login/session';
import { listFilesForAdmin, getActivityLog, type UploadedFile, type ActivityLogEntry } from '@/app/admin/actions';

/**
 * Fetches the activity log for the currently logged-in provider.
 * It filters the global activity log to return only entries relevant to the user.
 */
export async function getMyActivityLog(): Promise<ActivityLogEntry[]> {
  const session = await getSession();
  if (!session) {
    throw new Error('No autorizado. Por favor, inicie sesión.');
  }

  const allLogs = await getActivityLog();
  // Filter logs by the provider's name from the session.
  return allLogs.filter(log => log.provider === session.razonSocial);
}

/**
 * Fetches the list of uploaded files for the currently logged-in provider.
 * It filters the complete list of files to return only those belonging to the user.
 */
export async function getMyFiles(): Promise<UploadedFile[]> {
  const session = await getSession();
  if (!session) {
    throw new Error('No autorizado. Por favor, inicie sesión.');
  }

  const allFiles = await listFilesForAdmin();
  // Filter files based on the provider's name (razonSocial) stored in the session.
  const normalizedProviderName = session.razonSocial.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  
  return allFiles.filter(file => file.provider === normalizedProviderName);
}
