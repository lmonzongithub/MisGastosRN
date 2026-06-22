import {
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';

import { auth, db } from './firebase';

export type UserSettings = {
  monthlyLimit: number;
  notificationsEnabled: boolean;
};

const DEFAULT_SETTINGS: UserSettings = {
  monthlyLimit: 0,
  notificationsEnabled: false,
};

function getCurrentUserId(): string {
  const userId = auth.currentUser?.uid;

  if (!userId) {
    throw new Error('Usuario no autenticado');
  }

  return userId;
}

function getSettingsRef() {
  const userId = getCurrentUserId();

  return doc(
    db,
    'usuarios',
    userId,
    'settings',
    'preferences'
  );
}

export const getUserSettings = async (): Promise<UserSettings> => {
  const settingsRef = getSettingsRef();
  const snapshot = await getDoc(settingsRef);

  if (!snapshot.exists()) {
    return DEFAULT_SETTINGS;
  }

  return {
    ...DEFAULT_SETTINGS,
    ...snapshot.data(),
  } as UserSettings;
};

export const saveUserSettings = async (
  settings: UserSettings
) => {
  const settingsRef = getSettingsRef();

  return setDoc(
    settingsRef,
    {
      ...settings,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
};