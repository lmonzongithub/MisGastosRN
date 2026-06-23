import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CHANNEL_ID = 'expense_alerts_channel';
const isExpoGo = Constants.appOwnership === 'expo';

function formatMoney(value: number) {
  return `$ ${value.toFixed(2)}`;
}

export async function setupExpenseNotifications() {
  if (Platform.OS === 'web') {
    return true;
  }

  if (isExpoGo) {
    console.log('Notificaciones omitidas en Expo Go');
    return false;
  }

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const currentPermissions = await Notifications.getPermissionsAsync();

  let finalStatus = currentPermissions.status;

  if (currentPermissions.status !== 'granted') {
    const requestedPermissions = await Notifications.requestPermissionsAsync();
    finalStatus = requestedPermissions.status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Alertas de gastos',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notificaciones cuando se supera el límite mensual de gastos',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0B6B2B',
    });
  }

  return true;
}

export async function showLimitExceededNotification(
  monthlyTotal: number,
  monthlyLimit: number
) {
  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGo) {
    console.log('Notificación omitida en Expo Go');
    return;
  }

  const Notifications = await import('expo-notifications');

  const hasPermission = await setupExpenseNotifications();

  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Límite mensual superado',
      body: `Superaste tu límite mensual de gastos. Total actual: ${formatMoney(monthlyTotal)}. Límite configurado: ${formatMoney(monthlyLimit)}.`,
      data: {
        monthlyTotal,
        monthlyLimit,
      },
    },
    trigger: null,
  });
}