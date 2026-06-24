import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from '../services/firebase';
import { useLanguage } from '../i18n/LanguageContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ExpenseFormScreen from '../screens/ExpenseFormScreen';
import ExpenseDetailScreen from '../screens/ExpenseDetailScreen';

import HomeTabs from './HomeTabs';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingSession(false);
    });

    return unsubscribe;
  }, []);

  if (checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FDF7FF',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <ActivityIndicator size="large" color="#0B6B2B" />

        <Text style={{ color: '#666666' }}>
          {t('navigation.checkingSession')}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        key={user ? 'logged-in' : 'logged-out'}
        initialRouteName={user ? 'Home' : 'Login'}
      >
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ title: t('navigation.login') }}
        />

        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{ title: t('navigation.register') }}
        />

        <Stack.Screen
          name="Home"
          component={HomeTabs}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name="ExpenseForm"
          component={ExpenseFormScreen}
          options={{ title: t('navigation.expenseForm') }}
        />

        <Stack.Screen
          name="ExpenseDetail"
          component={ExpenseDetailScreen}
          options={{ title: t('navigation.expenseDetail') }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}