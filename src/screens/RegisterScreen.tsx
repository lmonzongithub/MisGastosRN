import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';

import { register } from '../services/authService';
import { authStyles } from '../styles/authStyles';

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async () => {
    try {
      await register(email, password);
      navigation.replace('Home');
    } catch (error) {
      console.log(error);
      alert('Error al registrarse');
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.title}>MisGastos</Text>
      <Text style={authStyles.subtitle}>Crear cuenta</Text>

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

        <TouchableOpacity style={authStyles.button} onPress={handleRegister}>
          <Text style={authStyles.buttonText}>Registrarse</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={authStyles.link}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}