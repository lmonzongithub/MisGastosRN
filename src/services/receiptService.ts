import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { auth, storage } from './firebase';

export type ReceiptFile = {
  uri: string;
  name: string;
  mimeType: string;
};

function getCurrentUserId(): string {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  return userId;
}

function sanitizeFileName(fileName: string): string {
  return fileName
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '');
}

function getFileExtension(fileName: string, mimeType: string): string {
  const extensionFromName = fileName.split('.').pop();

  if (extensionFromName && extensionFromName !== fileName) {
    return extensionFromName.toLowerCase();
  }

  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('png')) return 'png';
  if (mimeType.includes('webp')) return 'webp';

  return 'jpg';
}

function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(new Error('No se pudo leer el archivo seleccionado'));
    };

    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

export const uploadReceipt = async (
  file: ReceiptFile,
  expenseId?: string
) => {
  const userId = getCurrentUserId();
  const extension = getFileExtension(file.name, file.mimeType);
  const safeName = sanitizeFileName(file.name) || `comprobante.${extension}`;
  const fileId = expenseId ?? `nuevo_${Date.now()}`;

  const path = `users/${userId}/receipts/${fileId}_${Date.now()}_${safeName}`;

  const storageRef = ref(storage, path);

  const blob = await uriToBlob(file.uri);

  await uploadBytes(storageRef, blob, {
    contentType: file.mimeType,
  });

  const downloadUrl = await getDownloadURL(storageRef);

  return {
    receiptUrl: downloadUrl,
    receiptName: file.name,
    receiptType: file.mimeType,
    receiptPath: path,
  };
};