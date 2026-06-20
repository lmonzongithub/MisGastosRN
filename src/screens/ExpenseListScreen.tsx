import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Expense } from '../models/expense';
import {
  getExpensesByUser,
  deleteExpense,
  getMonthlyTotal,
} from '../services/expenseService';
import { getCategoryLabel } from '../utils/categories';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

export default function ExpenseListScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const [data, total] = await Promise.all([
        getExpensesByUser(),
        getMonthlyTotal(),
      ]);

      setExpenses(data);
      setMonthlyTotal(total);
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

  const openDeleteModal = (expense: Expense) => {
    setExpenseToDelete(expense);
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteModalVisible(false);
    setExpenseToDelete(null);
  };

  const confirmDelete = async () => {
    if (!expenseToDelete?.id) return;

    try {
      setDeleting(true);

      await deleteExpense(expenseToDelete.id);
      await loadExpenses();

      setDeleteModalVisible(false);
      setExpenseToDelete(null);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo eliminar el gasto');
    } finally {
      setDeleting(false);
    }
  };

  const monthlyExpenseCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.date);

      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    }).length;
  }, [expenses]);

  const formatAmount = (amount: number) => {
    return `$ ${amount.toFixed(2)}`;
  };

  const expenseCountText =
    monthlyExpenseCount === 1
      ? '1 gasto registrado'
      : `${monthlyExpenseCount} gastos registrados`;


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

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E6E0EA',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: '#666666',
            fontSize: 14,
            marginBottom: 4,
          }}
        >
          Gastos del mes
        </Text>

        <Text
          style={{
            color: '#0B6B2B',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          {formatAmount(monthlyTotal)}
        </Text>

        <Text
          style={{
            color: '#666666',
            marginTop: 6,
          }}
        >
          {expenseCountText}
        </Text>
      </View>

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

      {loading && expenses.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <ActivityIndicator size="large" />
          <Text style={{ color: '#666666' }}>Cargando gastos...</Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={loadExpenses}
          ListEmptyComponent={
            <View
              style={{
                alignItems: 'center',
                padding: 24,
                borderWidth: 1,
                borderColor: '#E6E0EA',
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: '#1F1F1F',
                  marginBottom: 6,
                }}
              >
                Todavía no hay gastos
              </Text>
              <Text
                style={{
                  color: '#666666',
                  textAlign: 'center',
                }}
              >
                Tocá “Nuevo gasto” para registrar el primero.
              </Text>
            </View>
          }
          ListFooterComponent={
            loading && expenses.length > 0 ? (
              <View
                style={{
                  paddingVertical: 16,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <ActivityIndicator />
                <Text style={{ color: '#666666' }}>Actualizando gastos...</Text>
              </View>
            ) : null
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
                disabled={deleting}
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
                onPress={() => openDeleteModal(item)}
                disabled={deleting}
                style={{
                  backgroundColor: deleting ? '#C77986' : '#B00020',
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
      )}

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        loading={deleting}
        title="Eliminar gasto"
        message={
          expenseToDelete
            ? `¿Seguro que querés eliminar este gasto? Esta acción no se puede deshacer.`
            : '¿Seguro que querés eliminar este gasto?'
        }
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </View>
  );
}