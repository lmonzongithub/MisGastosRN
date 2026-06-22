import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Expense } from '../models/expense';
import { getExpensesByUser } from '../services/expenseService';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategoryCode,
  getCategoryLabel,
  normalizeCategory,
} from '../utils/categories';

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

type FilterCategory = 'ALL' | ExpenseCategoryCode;

function formatMoney(value: number) {
  return `$ ${value.toFixed(2)}`;
}

function isSameMonth(timestamp: number, selectedDate: Date) {
  const date = new Date(timestamp);

  return (
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear()
  );
}

function getMonthLabel(date: Date) {
  return date.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });
}

export default function HistoryScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('ALL');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await getExpensesByUser();
      setExpenses(data);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [])
  );

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense) => isSameMonth(expense.date, selectedMonth));
  }, [expenses, selectedMonth]);

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'ALL') return monthlyExpenses;

    return monthlyExpenses.filter(
      (expense) => normalizeCategory(expense.category) === selectedCategory
    );
  }, [monthlyExpenses, selectedCategory]);

  const monthlyTotal = useMemo(() => {
    return monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [monthlyExpenses]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [filteredExpenses]);

  const categorySummary = useMemo(() => {
    return EXPENSE_CATEGORIES.map((category) => {
      const total = monthlyExpenses
        .filter((expense) => normalizeCategory(expense.category) === category)
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        category,
        label: getCategoryLabel(category),
        total,
      };
    }).filter((item) => item.total > 0);
  }, [monthlyExpenses]);

  const goToPreviousMonth = () => {
    setSelectedMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const goToNextMonth = () => {
    setSelectedMonth((current) => {
      const next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const handleExportPdf = async () => {
  try {
    const categoryRows = categorySummary
      .map(
        (item) => `
          <tr>
            <td>${item.label}</td>
            <td class="right">${formatMoney(item.total)}</td>
          </tr>
        `
      )
      .join('');

    const expenseRows = filteredExpenses
      .map(
        (expense) => `
          <tr>
            <td>${new Date(expense.date).toLocaleDateString('es-AR')}</td>
            <td>${expense.description}</td>
            <td>${getCategoryLabel(expense.category)}</td>
            <td class="right">${formatMoney(expense.amount)}</td>
          </tr>
        `
      )
      .join('');

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 24px;
              color: #1F1F1F;
            }

            h1 {
              color: #0B6B2B;
              margin-bottom: 4px;
            }

            h2 {
              margin-top: 28px;
              color: #1F1F1F;
              border-bottom: 1px solid #ddd;
              padding-bottom: 6px;
            }

            .subtitle {
              color: #666;
              margin-bottom: 24px;
            }

            .summary {
              background: #E7F3EA;
              border: 1px solid #0B6B2B;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 20px;
            }

            .summary-total {
              font-size: 28px;
              font-weight: bold;
              color: #0B6B2B;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }

            th {
              text-align: left;
              background: #0B6B2B;
              color: white;
              padding: 8px;
              font-size: 13px;
            }

            td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
              font-size: 13px;
            }

            .right {
              text-align: right;
            }

            .empty {
              color: #666;
              font-style: italic;
            }
          </style>
        </head>

        <body>
          <h1>Historial de gastos</h1>

          <div class="subtitle">
            Mes: ${getMonthLabel(selectedMonth)}
          </div>

          <div class="summary">
            <div>Gastos del mes</div>
            <div class="summary-total">${formatMoney(monthlyTotal)}</div>
            <div>${monthlyExpenses.length} gastos registrados</div>
          </div>

          <h2>Resumen por categoría</h2>

          ${
            categorySummary.length === 0
              ? `<p class="empty">No hay gastos para resumir.</p>`
              : `
                <table>
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th class="right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${categoryRows}
                  </tbody>
                </table>
              `
          }

          <h2>Detalle de gastos</h2>

          ${
            filteredExpenses.length === 0
              ? `<p class="empty">No hay gastos para este filtro.</p>`
              : `
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Categoría</th>
                      <th class="right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${expenseRows}
                  </tbody>
                </table>
              `
          }
        </body>
      </html>
    `;

   await Print.printAsync({
  html,
});
  } catch (error) {
    console.log(error);
    Alert.alert('Error', 'No se pudo exportar el PDF');
  }
};

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDF7FF' }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F1F1F' }}>
        Historial
      </Text>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: '#E6E0EA',
          gap: 10,
        }}
      >
        <Text style={{ fontWeight: 'bold', color: '#1F1F1F' }}>
          Mes seleccionado
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
              ← Anterior
            </Text>
          </TouchableOpacity>

          <Text style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
            {getMonthLabel(selectedMonth)}
          </Text>

          <TouchableOpacity onPress={goToNextMonth}>
            <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
              Siguiente →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#0B6B2B',
          borderRadius: 12,
          padding: 16,
          gap: 6,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontSize: 16 }}>
          Gastos del mes
        </Text>

        <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 'bold' }}>
          {formatMoney(monthlyTotal)}
        </Text>

        <Text style={{ color: '#E7F3EA' }}>
          {monthlyExpenses.length} gastos registrados
        </Text>

        {selectedCategory !== 'ALL' && (
          <Text style={{ color: '#E7F3EA' }}>
            Filtrado: {formatMoney(filteredTotal)}
          </Text>
        )}
      </View>

      <TouchableOpacity
  onPress={handleExportPdf}
  disabled={loading}
  style={{
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#0B6B2B',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  }}
>
  <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
    Exportar PDF
  </Text>
</TouchableOpacity>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F1F1F' }}>
        Filtrar por categoría
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('ALL')}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor:
                selectedCategory === 'ALL' ? '#0B6B2B' : '#FFFFFF',
              borderWidth: 1,
              borderColor: '#0B6B2B',
            }}
          >
            <Text
              style={{
                color: selectedCategory === 'ALL' ? '#FFFFFF' : '#0B6B2B',
                fontWeight: 'bold',
              }}
            >
              Todas
            </Text>
          </TouchableOpacity>

          {EXPENSE_CATEGORIES.map((category) => {
            const selected = selectedCategory === category;

            return (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: selected ? '#0B6B2B' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#0B6B2B',
                }}
              >
                <Text
                  style={{
                    color: selected ? '#FFFFFF' : '#0B6B2B',
                    fontWeight: 'bold',
                  }}
                >
                  {getCategoryLabel(category)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F1F1F' }}>
        Resumen por categoría
      </Text>

      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          padding: 14,
          borderWidth: 1,
          borderColor: '#E6E0EA',
          gap: 10,
        }}
      >
        {categorySummary.length === 0 ? (
          <Text style={{ color: '#666666' }}>
            No hay gastos para resumir en este mes.
          </Text>
        ) : (
          categorySummary.map((item) => (
            <View
              key={item.category}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}
            >
              <Text>{item.label}</Text>
              <Text style={{ fontWeight: 'bold' }}>
                {formatMoney(item.total)}
              </Text>
            </View>
          ))
        )}
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F1F1F' }}>
        Gastos
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#0B6B2B" />
      ) : filteredExpenses.length === 0 ? (
        <View
          style={{
            backgroundColor: '#FFFFFF',
            padding: 18,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#E6E0EA',
          }}
        >
          <Text style={{ color: '#666666', textAlign: 'center' }}>
            No hay gastos para este filtro.
          </Text>
        </View>
      ) : (
        filteredExpenses.map((expense) => (
          <View
            key={expense.id}
            style={{
              backgroundColor: '#FFFFFF',
              padding: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#E6E0EA',
              gap: 4,
            }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
              {expense.description}
            </Text>

            <Text style={{ color: '#666666' }}>
              {getCategoryLabel(expense.category)} ·{' '}
              {new Date(expense.date).toLocaleDateString('es-AR')}
            </Text>

            <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
              {formatMoney(expense.amount)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}