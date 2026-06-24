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
import {
  LANGUAGE_OPTIONS,
  Language,
} from '../i18n/translations';
import { useLanguage } from '../i18n/LanguageContext';

export default function SettingsScreen({ navigation }: any) {
  const { t, language, setLanguage } = useLanguage();

  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userEmail = auth.currentUser?.email ?? t('settings.noEmail');

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
      setSelectedLanguage(settings.language);
      setLanguage(settings.language);
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('settings.loadError'));
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
      Alert.alert(t('common.error'), t('settings.invalidLimit'));
      return;
    }

    try {
      setSaving(true);

      await saveUserSettings({
        monthlyLimit: monthlyLimit.trim().length === 0 ? 0 : parsedLimit,
        notificationsEnabled,
        language: selectedLanguage,
      });

      setLanguage(selectedLanguage);

      Alert.alert(t('settings.saveTitle'), t('settings.saveSuccess'));
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('settings.saveError'));
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
      Alert.alert(t('common.error'), t('settings.logoutError'));
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
          {t('settings.loading')}
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
        {t('settings.title')}
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
          {t('settings.user')}
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
          {t('settings.monthlyLimit')}
        </Text>

        <TextInput
          placeholder={t('settings.monthlyLimitPlaceholder')}
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
              {t('settings.limitAlerts')}
            </Text>

            <Text style={{ color: '#666666', marginTop: 2 }}>
              {t('settings.limitAlertsDescription')}
            </Text>
          </View>

          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            disabled={saving}
          />
        </View>
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
          {t('settings.language')}
        </Text>

        {LANGUAGE_OPTIONS.map((item) => {
          const isSelected = selectedLanguage === item.code;

          return (
            <TouchableOpacity
              key={item.code}
              onPress={() => setSelectedLanguage(item.code)}
              disabled={saving}
              style={{
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isSelected ? '#0B6B2B' : '#E6E0EA',
                backgroundColor: isSelected ? '#E7F3EA' : '#FFFFFF',
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#0B6B2B' : '#1F1F1F',
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
          {saving ? t('settings.saving') : t('settings.saveButton')}
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
          {t('settings.logout')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}