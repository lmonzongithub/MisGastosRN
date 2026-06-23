import { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';

import { Expense } from '../models/expense';
import {
  getExpensesByUser,
  deleteExpense,
  getMonthlyTotal,
} from '../services/expenseService';
import {
  getUserSettings,
  UserSettings,
} from '../services/settingsService';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategoryCode,
  getCategoryLabel,
  normalizeCategory,
} from '../utils/categories';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import InfoModal from '../components/InfoModal';

type FilterCategory = 'ALL' | ExpenseCategoryCode;

function formatAmount(amount: number) {
  return `$ ${amount.toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatDateForFileName(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function getReportFileName(categoryLabel: string) {
  const today = formatDateForFileName(new Date());

  const normalizedCategory = categoryLabel
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');

  return `gastos-${normalizedCategory}-${today}`;
}

async function printReportHtml(html: string, fileName: string) {
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      Alert.alert(
        'PDF',
        'No se pudo abrir la ventana de impresión. Revisá si el navegador bloqueó ventanas emergentes.'
      );
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.document.title = fileName;

    printWindow.onload = () => {
      printWindow.document.title = fileName;
      printWindow.focus();
      printWindow.print();
    };

    return;
  }

  await Print.printAsync({ html });
}

export default function ExpenseListScreen({ navigation }: any) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('ALL');

  const [settings, setSettings] = useState<UserSettings>({
    monthlyLimit: 0,
    notificationsEnabled: false,
  });

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalMessage, setInfoModalMessage] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const [data, total, userSettings] = await Promise.all([
        getExpensesByUser(),
        getMonthlyTotal(),
        getUserSettings(),
      ]);

      setExpenses(data);
      setMonthlyTotal(total);
      setSettings(userSettings);
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

  const filteredExpenses = useMemo(() => {
    if (selectedCategory === 'ALL') return expenses;

    return expenses.filter(
      (expense) => normalizeCategory(expense.category) === selectedCategory
    );
  }, [expenses, selectedCategory]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0);
  }, [filteredExpenses]);

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

  const showInfoModal = (title: string, message: string) => {
    setInfoModalTitle(title);
    setInfoModalMessage(message);
    setInfoModalVisible(true);
  };

  const handleExportPdf = async () => {
  try {
    const categoryLabel =
      selectedCategory === 'ALL'
        ? 'Todas'
        : getCategoryLabel(selectedCategory);

    const fileName = getReportFileName(categoryLabel);

    if (filteredExpenses.length === 0) {
      showInfoModal(
        'No hay gastos para exportar',
        `No hay gastos cargados para ${
          selectedCategory === 'ALL' ? 'la selección actual' : categoryLabel
        }. Probá seleccionando otra categoría.`
      );

      return;
    }

    const expenseRows = filteredExpenses
      .map(
        (expense) => `
          <tr>
            <td>${new Date(expense.date).toLocaleDateString('es-AR')}</td>
            <td>${escapeHtml(expense.description)}</td>
            <td>${getCategoryLabel(expense.category)}</td>
            <td class="right">${formatAmount(expense.amount)}</td>
          </tr>
        `
      )
      .join('');

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <title>${fileName}</title>
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

              .summary-title {
                font-size: 16px;
                font-weight: bold;
                color: #0B6B2B;
                margin-bottom: 12px;
              }

              .summary-row {
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid #C9E5D0;
                padding: 8px 0;
              }

              .summary-row:last-child {
                border-bottom: none;
              }

              .summary-row strong {
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
            </style>
          </head>

          <body>
            <h1>Mis Gastos - Reporte</h1>

            <div class="subtitle">
              Categoría: ${categoryLabel}
            </div>

            <div class="summary">
              <div class="summary-title">Resumen del reporte</div>

              <div class="summary-row">
                <span>Total de gastos</span>
                <strong>${formatAmount(filteredTotal)}</strong>
              </div>

              <div class="summary-row">
                <span>Cantidad de gastos</span>
                <strong>${filteredExpenses.length}</strong>
              </div>
            </div>

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
          </body>
        </html>
      `;

      await printReportHtml(html, fileName);
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo exportar el PDF');
    }
  };

  const expenseCountText =
    monthlyExpenseCount === 1
      ? '1 gasto registrado'
      : `${monthlyExpenseCount} gastos registrados`;

  const hasMonthlyLimit = settings.monthlyLimit > 0;

  const monthlyLimitExceeded =
    hasMonthlyLimit &&
    settings.notificationsEnabled &&
    monthlyTotal > settings.monthlyLimit;

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
          borderColor: monthlyLimitExceeded ? '#B00020' : '#E6E0EA',
          borderRadius: 14,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#666666', fontSize: 14, marginBottom: 4 }}>
          Gastos del mes
        </Text>

        <Text
          style={{
            color: monthlyLimitExceeded ? '#B00020' : '#0B6B2B',
            fontSize: 24,
            fontWeight: 'bold',
          }}
        >
          {formatAmount(monthlyTotal)}
        </Text>

        <Text style={{ color: '#666666', marginTop: 6 }}>
          {expenseCountText}
        </Text>

        {hasMonthlyLimit && (
          <Text
            style={{
              color: monthlyLimitExceeded ? '#B00020' : '#666666',
              marginTop: 8,
              fontWeight: monthlyLimitExceeded ? 'bold' : 'normal',
            }}
          >
            Límite mensual: {formatAmount(settings.monthlyLimit)}
          </Text>
        )}

        {hasMonthlyLimit && !settings.notificationsEnabled && (
          <Text style={{ color: '#666666', marginTop: 8 }}>
            Alertas por límite desactivadas
          </Text>
        )}

        {monthlyLimitExceeded && (
          <View
            style={{
              backgroundColor: '#FCE8EC',
              borderRadius: 10,
              padding: 10,
              marginTop: 12,
            }}
          >
            <Text style={{ color: '#B00020', fontWeight: 'bold' }}>
              Superaste tu límite mensual
            </Text>

            <Text style={{ color: '#B00020', marginTop: 4 }}>
              Revisá tus gastos o ajustá el límite desde Configuración.
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate('ExpenseForm')}
        style={{
          backgroundColor: '#0B6B2B',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          Nuevo gasto
        </Text>
      </TouchableOpacity>

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
          marginBottom: 16,
        }}
      >
        <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
          Exportar PDF
        </Text>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#1F1F1F',
          marginBottom: 8,
        }}
      >
        Filtrar por categoría
      </Text>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => setSelectedCategory('ALL')}
          style={{
            minHeight: 40,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 20,
            backgroundColor:
              selectedCategory === 'ALL' ? '#0B6B2B' : '#FFFFFF',
            borderWidth: 1,
            borderColor: '#0B6B2B',
            justifyContent: 'center',
            alignItems: 'center',
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
                minHeight: 40,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                backgroundColor: selected ? '#0B6B2B' : '#FFFFFF',
                borderWidth: 1,
                borderColor: '#0B6B2B',
                justifyContent: 'center',
                alignItems: 'center',
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

      {selectedCategory !== 'ALL' && (
        <Text
          style={{
            color: '#666666',
            marginBottom: 12,
          }}
        >
          Total filtrado: {formatAmount(filteredTotal)}
        </Text>
      )}

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
          data={filteredExpenses}
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
                No hay gastos para este filtro
              </Text>

              <Text
                style={{
                  color: '#666666',
                  textAlign: 'center',
                }}
              >
                Probá con otra categoría o agregá un gasto nuevo.
              </Text>
            </View>
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

              <Text style={{ marginTop: 4, color: '#666666' }}>
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
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
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
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
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
        message="¿Seguro que querés eliminar este gasto? Esta acción no se puede deshacer."
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />

      <InfoModal
        visible={infoModalVisible}
        title={infoModalTitle}
        message={infoModalMessage}
        onClose={() => setInfoModalVisible(false)}
      />
    </View>
  );
}