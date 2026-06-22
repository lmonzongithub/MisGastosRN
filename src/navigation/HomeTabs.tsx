import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ExpenseListScreen from '../screens/ExpenseListScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function HomeTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Lista"
        component={ExpenseListScreen}
      />
      <Tab.Screen
        name="Histórico"
        component={HistoryScreen}
      />
      <Tab.Screen
        name="Configuración"
        component={SettingsScreen}
      />
    </Tab.Navigator>
  );
}