import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';

import { createExpense } from '../services/expenseService';

export default function ExpenseFormScreen({ navigation }: any) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');

  const handleSave = async () => {
    try {
      const user = getAuth().currentUser;

      if (!user) {
        Alert.alert('Error', 'No hay usuario logueado');
        return;
      }

      await createExpense({
        description,
        amount: Number(amount),
        category,
        date: Date.now(),
        userId: user.uid,
      });

      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo guardar el gasto');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Nuevo gasto</Text>

      <TextInput
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Monto"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TextInput
        placeholder="Categoría"
        value={category}
        onChangeText={setCategory}
        style={{ borderWidth: 1, padding: 10, borderRadius: 8 }}
      />

      <TouchableOpacity
        onPress={handleSave}
        style={{
          backgroundColor: '#0B6B2B',
          padding: 14,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          Guardar gasto
        </Text>
      </TouchableOpacity>
    </View>
  );
}