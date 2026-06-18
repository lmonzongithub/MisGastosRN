import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Expense } from '../models/expense';
import {
  getExpensesByUser,
  deleteExpense,
} from '../services/expenseService';
import { getCategoryLabel } from '../utils/categories';

export default function ExpenseListScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const data = await getExpensesByUser();
      setExpenses(data);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudieron cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

const handleDelete = async (id?: string) => {
  if (!id) {
    console.log('No hay id para eliminar');
    return;
  }

  const doDelete = async () => {
    try {
      console.log('Eliminando gasto con id:', id);
      await deleteExpense(id);
      await loadExpenses();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo eliminar el gasto');
    }
  };

  if (Platform.OS === 'web') {
    await doDelete();
    return;
  }

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
        onPress: doDelete,
      },
    ]
  );
};

  const formatAmount = (amount: number) => {
    return `$ ${amount.toFixed(2)}`;
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#FDF7FF' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 16,
          color: '#1F1F1F',
        }}
      >
        Mis Gastos
      </Text>

      <TouchableOpacity
        onPress={() => navigation.navigate('ExpenseForm')}
        style={{
          backgroundColor: '#0B6B2B',
          padding: 14,
          borderRadius: 10,
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
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={loadExpenses}
        ListEmptyComponent={
          <Text style={{ color: '#666666' }}>
            No hay gastos cargados.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: '#E6E0EA',
              borderRadius: 14,
              marginBottom: 10,
              backgroundColor: '#FFFFFF',
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#1F1F1F',
              }}
            >
              {getCategoryLabel(item.category)}
            </Text>

            <Text
              style={{
                marginTop: 4,
                color: '#666666',
              }}
            >
              {item.description}
            </Text>

            <Text
              style={{
                marginTop: 8,
                fontSize: 18,
                fontWeight: 'bold',
                color: '#0B6B2B',
              }}
            >
              {formatAmount(item.amount)}
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ExpenseDetail', {
                  expenseId: item.id,
                })
              }
              style={{
                backgroundColor: '#0B6B2B',
                padding: 10,
                borderRadius: 8,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
              <Text
                style={{
                  color: '#FFF',
                  fontWeight: 'bold',
                }}
              >
                Ver detalle
              </Text>
            </TouchableOpacity>

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