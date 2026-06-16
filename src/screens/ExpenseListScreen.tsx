import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';

import { Expense } from '../models/expense';
import {
  getExpensesByUser,
  deleteExpense,
} from '../services/expenseService';

export default function ExpenseListScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const loadExpenses = async () => {
    try {
      const user = getAuth().currentUser;

      if (!user) return;

      const data = await getExpensesByUser(user.uid);
      setExpenses(data);
    } catch (error) {
      console.log(error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const handleDelete = (id?: string) => {
    if (!id) return;

    Alert.alert(
      'Eliminar gasto',
      '¿Seguro que querés eliminar este gasto?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id);
              loadExpenses();
            } catch (error) {
              console.log(error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 16,
        }}
      >
        Mis Gastos
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('ExpenseForm')}
        style={{
          backgroundColor: '#0B6B2B',
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: '#FFF',
            fontWeight: 'bold',
          }}
        >
          Nuevo gasto
        </Text>
      </TouchableOpacity>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id ?? ''}
        ListEmptyComponent={
          <Text>No hay gastos cargados.</Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 10,
            }}
          >
            <Text>{item.description}</Text>

            <Text>
              ${item.amount}
            </Text>

            <Text>{item.category}</Text>

            <TouchableOpacity
              onPress={() => handleDelete(item.id)}
              style={{
                backgroundColor: '#B00020',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 10,
              }}
            >
              <Text
                style={{
                  color: '#FFF',
                  fontWeight: 'bold',
                }}
              >
                Eliminar
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}