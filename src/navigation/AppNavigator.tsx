import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ExpenseFormScreen from '../screens/ExpenseFormScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';

import HomeTabs from './HomeTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen
          name="Login"
          component={LoginScreen}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
        />

        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ExpenseForm"
          component={ExpenseFormScreen}
          options={{ title: 'Gasto' }}
        />

        <Stack.Screen
          name="ExpenseDetail"
          component={ExpenseDetailScreen}
          options={{ title: 'Detalle del gasto' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}