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

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (loading) return;

    if (email.trim().length === 0 || password.trim().length === 0) {
      setErrorMessage('Completá el correo y la contraseña');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');

      await login(email.trim(), password);

      navigation.replace('Home');
    } catch (error) {
      console.log(error);
      setErrorMessage('Usuario o contraseña inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>MisGastos</Text>
      <Text style={authStyles.subtitle}>Iniciar sesión</Text>

      <View style={authStyles.card}>
        <TextInput
          placeholder="Correo electrónico"
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
          placeholder="Contraseña"
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
                Ingresando...
              </Text>
            </View>
          ) : (
            <Text style={authStyles.buttonText}>Ingresar</Text>
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
            ¿No tenés cuenta? Registrate
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}