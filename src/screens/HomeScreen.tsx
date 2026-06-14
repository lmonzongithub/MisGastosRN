import { View, Text, Button } from 'react-native';

import { logout } from '../services/authService';

export default function HomeScreen({ navigation }: any) {

  const handleLogout = async () => {
    try {
      await logout();
      navigation.replace('Login');
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text>Home - Mis Gastos</Text>

      <Button
        title="Cerrar sesión"
        onPress={handleLogout}
      />
    </View>
  );
}