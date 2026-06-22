import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { auth } from '../services/firebase';
import { logout } from '../services/authService';
import {
  getUserSettings,
  saveUserSettings,
} from '../services/settingsService';

export default function SettingsScreen({ navigation }: any) {
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userEmail = auth.currentUser?.email ?? 'Usuario sin email';

  const loadSettings = async () => {
    try {
      setLoading(true);

      const settings = await getUserSettings();

      setMonthlyLimit(
        settings.monthlyLimit > 0
          ? String(settings.monthlyLimit)
          : ''
      );

      setNotificationsEnabled(settings.notificationsEnabled);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const handleSave = async () => {
    const parsedLimit = Number(monthlyLimit.replace(',', '.'));

    if (
      monthlyLimit.trim().length > 0 &&
      (Number.isNaN(parsedLimit) || parsedLimit < 0)
    ) {
      Alert.alert('Error', 'Ingresá un límite mensual válido');
      return;
    }

    try {
      setSaving(true);

      await saveUserSettings({
        monthlyLimit: monthlyLimit.trim().length === 0 ? 0 : parsedLimit,
        notificationsEnabled,
      });

      Alert.alert('Configuración', 'Configuración guardada correctamente');
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();

      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cerrar sesión');
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#FDF7FF',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ color: '#666666' }}>
          Cargando configuración...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDF7FF' }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1F1F1F',
        }}
      >
        Configuración
      </Text>

      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E6E0EA',
          gap: 8,
        }}
      >
        <Text style={{ fontWeight: 'bold', color: '#1F1F1F' }}>
          Usuario
        </Text>

        <Text style={{ color: '#666666' }}>
          {userEmail}
        </Text>
      </View>

      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E6E0EA',
          gap: 12,
        }}
      >
        <Text style={{ fontWeight: 'bold', color: '#1F1F1F' }}>
          Límite mensual
        </Text>

        <TextInput
          placeholder="Ej: 100000"
          value={monthlyLimit}
          onChangeText={setMonthlyLimit}
          keyboardType="numeric"
          editable={!saving}
          style={{
            borderWidth: 1,
            borderColor: '#E6E0EA',
            backgroundColor: '#FFFFFF',
            padding: 12,
            borderRadius: 10,
          }}
        />

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ fontWeight: 'bold', color: '#1F1F1F' }}>
              Alertas por límite
            </Text>

            <Text style={{ color: '#666666', marginTop: 2 }}>
              Avisar cuando los gastos del mes superen el límite.
            </Text>
          </View>

          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            disabled={saving}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{
          backgroundColor: saving ? '#73A883' : '#0B6B2B',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        disabled={saving}
        style={{
          backgroundColor: '#B00020',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 8,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}