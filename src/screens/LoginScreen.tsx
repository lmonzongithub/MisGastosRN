import { useState } from 'react';
import { View, Text, Button, TextInput } from 'react-native';

import { login } from '../services/authService';

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
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
      <Text>Login</Text>

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
        title="Entrar"
        onPress={handleLogin}
      />

      <Button
        title="Ir a registro"
        onPress={() => navigation.navigate('Register')}
      />
    </View>
  );
}