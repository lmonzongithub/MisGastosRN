import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import { login } from '../services/authService';
import { authStyles } from '../styles/authStyles';
import { useLanguage } from '../i18n/LanguageContext';

export default function LoginScreen({ navigation }: any) {
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (loading) return;

    if (email.trim().length === 0 || password.trim().length === 0) {
      setErrorMessage(t('auth.completeFields'));
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      await login(email.trim(), password);

      navigation.replace('Home');
    } catch (error) {
      console.log(error);
      setErrorMessage(t('auth.invalidCredentials'));
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
        {t('auth.loginTitle')}
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
          onPress={handleLogin}
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
                {t('auth.loggingIn')}
              </Text>
            </View>
          ) : (
            <Text style={authStyles.buttonText}>
              {t('auth.loginButton')}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text
            style={[
              authStyles.link,
              loading && { opacity: 0.5 },
            ]}
          >
            {t('auth.goToRegister')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}