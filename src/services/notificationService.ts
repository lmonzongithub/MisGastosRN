import { Platform } from 'react-native';
import Constants from 'expo-constants';

const CHANNEL_ID = 'expense_alerts_channel';
const isExpoGo = Constants.appOwnership === 'expo';

export type LimitExceededNotificationTexts = {
  channelName: string;
  channelDescription: string;
  title: string;
  body: string;
  currentTotalLabel: string;
  configuredLimitLabel: string;
};

function formatMoney(value: number) {
  return `$ ${value.toFixed(2)}`;
}

export async function setupExpenseNotifications(
  texts: Pick<
    LimitExceededNotificationTexts,
    'channelName' | 'channelDescription'
  >
) {
  if (Platform.OS === 'web') {
    return true;
  }

  if (isExpoGo) {
    console.log('Notifications skipped in Expo Go');
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
      name: texts.channelName,
      importance: Notifications.AndroidImportance.HIGH,
      description: texts.channelDescription,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0B6B2B',
    });
  }

  return true;
}

export async function showLimitExceededNotification(
  monthlyTotal: number,
  monthlyLimit: number,
  texts: LimitExceededNotificationTexts
) {
  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGo) {
    console.log('Notification skipped in Expo Go');
    return;
  }

  const Notifications = await import('expo-notifications');

  const hasPermission = await setupExpenseNotifications({
    channelName: texts.channelName,
    channelDescription: texts.channelDescription,
  });

  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: texts.title,
      body: `${texts.body} ${texts.currentTotalLabel}: ${formatMoney(
        monthlyTotal
      )}. ${texts.configuredLimitLabel}: ${formatMoney(monthlyLimit)}.`,
      data: {
        monthlyTotal,
        monthlyLimit,
      },
    },
    trigger: null,
  });
}