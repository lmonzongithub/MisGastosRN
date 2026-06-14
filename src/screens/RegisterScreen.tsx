import { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

import { register } from '../services/authService';

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
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Text>Registro</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          width: 250,
          borderWidth: 1,
          padding: 8,
        }}
      />

      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          width: 250,
          borderWidth: 1,
          padding: 8,
        }}
      />

      <Button
        title="Registrarse"
        onPress={handleRegister}
      />

      <Button
        title="Volver al Login"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}