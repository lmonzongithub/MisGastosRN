import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  createExpense,
  getExpenseById,
  updateExpense,
} from '../services/expenseService';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategoryCode,
  getCategoryLabel,
  normalizeCategory,
} from '../utils/categories';

export default function ExpenseFormScreen({ route, navigation }: any) {
  const expenseId = route.params?.expenseId;
  const isEditing = !!expenseId;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryCode>('FOOD');
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);

  const loadExpense = async () => {
    if (!expenseId) return;

    try {
      setLoadingExpense(true);

      const expense = await getExpenseById(expenseId);

      if (!expense) {
        Alert.alert('Error', 'No se encontró el gasto');
        navigation.goBack();
        return;
      }

      setDescription(expense.description);
      setAmount(String(expense.amount));
      setCategory(normalizeCategory(expense.category));
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar el gasto');
    } finally {
      setLoadingExpense(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpense();
    }, [expenseId])
  );

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(',', '.'));

    if (description.trim().length === 0) {
      Alert.alert('Error', 'Completá la descripción');
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Ingresá un monto válido');
      return;
    }

    try {
      setLoading(true);

      if (isEditing) {
        await updateExpense(expenseId, {
          description: description.trim(),
          amount: parsedAmount,
          category,
        });
      } else {
        await createExpense({
          description: description.trim(),
          amount: parsedAmount,
          category,
          date: Date.now(),
          imageUrl: null,
          latitude: null,
          longitude: null,
        });
      }

      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert(
        'Error',
        isEditing
          ? 'No se pudo actualizar el gasto'
          : 'No se pudo guardar el gasto'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingExpense) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#FDF7FF' }}>
        <Text>Cargando gasto...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDF7FF' }}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1F1F1F',
          marginBottom: 4,
        }}
      >
        {isEditing ? 'Editar gasto' : 'Nuevo gasto'}
      </Text>

      <TextInput
        placeholder="Descripción"
        value={description}
        onChangeText={setDescription}
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#E6E0EA',
          backgroundColor: '#FFFFFF',
          padding: 12,
          borderRadius: 10,
        }}
      />

      <TextInput
        placeholder="Monto"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        editable={!loading}
        style={{
          borderWidth: 1,
          borderColor: '#E6E0EA',
          backgroundColor: '#FFFFFF',
          padding: 12,
          borderRadius: 10,
        }}
      />

      <Text
        style={{
          fontWeight: 'bold',
          color: '#1F1F1F',
          marginTop: 8,
        }}
      >
        Categoría
      </Text>

      <View style={{ gap: 8 }}>
        {EXPENSE_CATEGORIES.map((item) => {
          const isSelected = category === item;

          return (
            <TouchableOpacity
              key={item}
              disabled={loading}
              onPress={() => setCategory(item)}
              style={{
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: isSelected ? '#0B6B2B' : '#E6E0EA',
                backgroundColor: isSelected ? '#E7F3EA' : '#FFFFFF',
              }}
            >
              <Text
                style={{
                  color: isSelected ? '#0B6B2B' : '#1F1F1F',
                  fontWeight: isSelected ? 'bold' : 'normal',
                }}
              >
                {getCategoryLabel(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#73A883' : '#0B6B2B',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 12,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          {loading
            ? isEditing
              ? 'Actualizando...'
              : 'Guardando...'
            : isEditing
              ? 'Actualizar gasto'
              : 'Guardar gasto'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        disabled={loading}
        style={{
          padding: 12,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
          Cancelar
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}