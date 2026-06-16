import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

import { login } from '../services/authService';
import { authStyles } from '../styles/authStyles';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      await login(email, password);
      navigation.replace('Home');
    } catch (error) {
      console.log(error);
      alert('Error al iniciar sesión');
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
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={authStyles.input}
        />

        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={authStyles.input}
        />

        <TouchableOpacity style={authStyles.button} onPress={handleLogin}>
          <Text style={authStyles.buttonText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={authStyles.link}>¿No tenés cuenta? Registrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}