import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ExpenseListScreen from '../screens/ExpenseListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useLanguage } from '../i18n/LanguageContext';

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Lista"
        component={ExpenseListScreen}
        options={{
          title: t('tabs.list'),
          tabBarLabel: t('tabs.list'),
        }}
      />

      <Tab.Screen
        name="Histórico"
        component={HistoryScreen}
        options={{
          title: t('tabs.history'),
          tabBarLabel: t('tabs.history'),
        }}
      />

      <Tab.Screen
        name="Configuración"
        component={SettingsScreen}
        options={{
          title: t('tabs.settings'),
          tabBarLabel: t('tabs.settings'),
        }}
      />
    </Tab.Navigator>
  );
}