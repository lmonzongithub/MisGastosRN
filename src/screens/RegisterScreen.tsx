import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { register } from '../services/authService';
import { authStyles } from '../styles/authStyles';
import { useLanguage } from '../i18n/LanguageContext';

export default function RegisterScreen({ navigation }: any) {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    if (loading) return;

    if (email.trim().length === 0 || password.trim().length === 0) {
      setErrorMessage(t('auth.completeFields'));
      return;
    }

    if (password.length < 6) {
      setErrorMessage(t('auth.shortPassword'));
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      await register(email.trim(), password);

      navigation.replace('Home');
    } catch (error) {
      console.log(error);
      setErrorMessage(t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>
        {t('auth.appName')}
      </Text>

      <Text style={authStyles.subtitle}>
        {t('auth.registerTitle')}
      </Text>

      <View style={authStyles.card}>
        <TextInput
          placeholder={t('auth.emailPlaceholder')}
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setErrorMessage('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
          style={[
            authStyles.input,
            loading && { opacity: 0.6 },
          ]}
        />

        <TextInput
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setErrorMessage('');
          }}
          secureTextEntry
          editable={!loading}
          style={[
            authStyles.input,
            loading && { opacity: 0.6 },
          ]}
        />

        {errorMessage.length > 0 && (
          <Text
            style={{
              color: '#B00020',
              fontWeight: 'bold',
              marginBottom: 10,
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </Text>
        )}

        <TouchableOpacity
          style={[
            authStyles.button,
            loading && { opacity: 0.7 },
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <ActivityIndicator size="small" color="#FFFFFF" />

              <Text style={authStyles.buttonText}>
                {t('auth.creatingAccount')}
              </Text>
            </View>
          ) : (
            <Text style={authStyles.buttonText}>
              {t('auth.registerButton')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text
            style={[
              authStyles.link,
              loading && { opacity: 0.5 },
            ]}
          >
            {t('auth.goToLogin')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}