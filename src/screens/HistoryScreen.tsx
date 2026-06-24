import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Print from 'expo-print';

import { Expense } from '../models/expense';
import { getExpensesByUser } from '../services/expenseService';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategoryCode,
  normalizeCategory,
} from '../utils/categories';
import InfoModal from '../components/InfoModal';
import { useLanguage } from '../i18n/LanguageContext';

type FilterCategory = 'ALL' | ExpenseCategoryCode;

function formatMoney(value: number) {
  return `$ ${value.toFixed(2)}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function isSameMonth(timestamp: number, selectedDate: Date) {
  const date = new Date(timestamp);

  return (
    date.getMonth() === selectedDate.getMonth() &&
    date.getFullYear() === selectedDate.getFullYear()
  );
}

function getDateLocale(language: string) {
  if (language === 'en') return 'en-US';
  if (language === 'pt') return 'pt-BR';

  return 'es-AR';
}

function getMonthLabel(date: Date, language: string) {
  return date.toLocaleDateString(getDateLocale(language), {
    month: 'long',
    year: 'numeric',
  });
}

function formatDateForFileName(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

function normalizeForFileName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');
}

function getPdfFileName(
  selectedMonth: Date,
  categoryLabel: string,
  language: string
) {
  const today = formatDateForFileName(new Date());
  const monthLabel = normalizeForFileName(
    getMonthLabel(selectedMonth, language)
  );
  const normalizedCategory = normalizeForFileName(categoryLabel);

  return `historial-${monthLabel}-${normalizedCategory}-${today}`;
}

async function printReportHtml(
  html: string,
  fileName: string,
  popupBlockedMessage: string
) {
  if (Platform.OS === 'web') {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      Alert.alert('PDF', popupBlockedMessage);
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

export default function HistoryScreen() {
  const { t, language } = useLanguage();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedCategory, setSelectedCategory] =
    useState<FilterCategory>('ALL');

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [infoModalTitle, setInfoModalTitle] = useState('');
  const [infoModalMessage, setInfoModalMessage] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);

      const data = await getExpensesByUser();
      setExpenses(data);
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('history.loadError'));
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
    return expenses.filter((expense) =>
      isSameMonth(expense.date, selectedMonth)
    );
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
        label: t(`categories.${category}`),
        total,
      };
    }).filter((item) => item.total > 0);
  }, [monthlyExpenses, t]);

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

  const showInfoModal = (title: string, message: string) => {
    setInfoModalTitle(title);
    setInfoModalMessage(message);
    setInfoModalVisible(true);
  };

  const handleExportPdf = async () => {
    try {
      if (filteredExpenses.length === 0) {
        const categoryLabel =
          selectedCategory === 'ALL'
            ? t('history.currentSelection')
            : t(`categories.${selectedCategory}`);

        showInfoModal(
          t('history.noExpensesToExportTitle'),
          `${t('history.noExpensesFor')} ${categoryLabel} ${t(
            'history.reportMonth'
          ).toLowerCase()} ${getMonthLabel(
            selectedMonth,
            language
          )}. ${t('history.noExpensesExportMessageEnd')}`
        );

        return;
      }

      const categoryLabel =
        selectedCategory === 'ALL'
          ? t('categories.ALL')
          : t(`categories.${selectedCategory}`);

      const fileName = getPdfFileName(
        selectedMonth,
        categoryLabel,
        language
      );

      const categoryRows = categorySummary
        .map(
          (item) => `
            <tr>
              <td>${escapeHtml(item.label)}</td>
              <td class="right">${formatMoney(item.total)}</td>
            </tr>
          `
        )
        .join('');

      const expenseRows = filteredExpenses
        .map(
          (expense) => `
            <tr>
              <td>${new Date(expense.date).toLocaleDateString(
                getDateLocale(language)
              )}</td>
              <td>${escapeHtml(expense.description)}</td>
              <td>${escapeHtml(
                t(`categories.${normalizeCategory(expense.category)}`)
              )}</td>
              <td class="right">${formatMoney(expense.amount)}</td>
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

              .empty {
                color: #666;
                font-style: italic;
              }
            </style>
          </head>

          <body>
            <h1>${t('history.reportTitle')}</h1>

            <div class="subtitle">
              ${t('history.reportMonth')}: ${getMonthLabel(
                selectedMonth,
                language
              )}<br />
              ${t('history.reportCategory')}: ${escapeHtml(categoryLabel)}
            </div>

            <div class="summary">
              <div class="summary-title">${t('history.reportSummary')}</div>

              <div class="summary-row">
                <span>${t('history.reportMonthlyTotal')}</span>
                <strong>${formatMoney(monthlyTotal)}</strong>
              </div>

              ${
                selectedCategory !== 'ALL'
                  ? `
                    <div class="summary-row">
                      <span>${t('history.reportFilteredTotal')}</span>
                      <strong>${formatMoney(filteredTotal)}</strong>
                    </div>
                  `
                  : ''
              }

              <div class="summary-row">
                <span>${t('history.reportExportedCount')}</span>
                <strong>${filteredExpenses.length}</strong>
              </div>
            </div>

            <h2>${t('history.reportCategorySummary')}</h2>

            ${
              categorySummary.length === 0
                ? `<p class="empty">${t('history.reportNoSummary')}</p>`
                : `
                  <table>
                    <thead>
                      <tr>
                        <th>${t('history.pdfCategory')}</th>
                        <th class="right">${t('history.pdfTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${categoryRows}
                    </tbody>
                  </table>
                `
            }

            <h2>${t('history.reportExpenseDetail')}</h2>

            <table>
              <thead>
                <tr>
                  <th>${t('history.pdfDate')}</th>
                  <th>${t('history.pdfDescription')}</th>
                  <th>${t('history.pdfCategory')}</th>
                  <th class="right">${t('history.pdfAmount')}</th>
                </tr>
              </thead>
              <tbody>
                ${expenseRows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      await printReportHtml(
        html,
        fileName,
        t('history.popupBlocked')
      );
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('history.exportError'));
    }
  };

  const monthExpenseCountText =
    monthlyExpenses.length === 1
      ? t('history.oneExpenseRegistered')
      : `${monthlyExpenses.length} ${t('history.expensesRegistered')}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#FDF7FF' }}
      contentContainerStyle={{ padding: 16, gap: 14 }}
    >
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F1F1F' }}>
        {t('history.title')}
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
          {t('history.selectedMonth')}
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
              {t('history.previous')}
            </Text>
          </TouchableOpacity>

          <Text style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
            {getMonthLabel(selectedMonth, language)}
          </Text>

          <TouchableOpacity onPress={goToNextMonth}>
            <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
              {t('history.next')}
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
          {t('history.monthlyExpenses')}
        </Text>

        <Text style={{ color: '#FFFFFF', fontSize: 26, fontWeight: 'bold' }}>
          {formatMoney(monthlyTotal)}
        </Text>

        <Text style={{ color: '#E7F3EA' }}>
          {monthExpenseCountText}
        </Text>

        {selectedCategory !== 'ALL' && (
          <Text style={{ color: '#E7F3EA' }}>
            {t('history.filtered')}: {formatMoney(filteredTotal)}
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
          {t('history.exportPdf')}
        </Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F1F1F' }}>
        {t('history.filterByCategory')}
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
              {t('categories.ALL')}
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
                  {t(`categories.${category}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F1F1F' }}>
        {t('history.categorySummary')}
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
            {t('history.noSummaryExpenses')}
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
        {t('history.expenses')}
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
            {t('history.noExpensesForFilter')}
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
              {t(`categories.${normalizeCategory(expense.category)}`)} ·{' '}
              {new Date(expense.date).toLocaleDateString(getDateLocale(language))}
            </Text>

            <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
              {formatMoney(expense.amount)}
            </Text>
          </View>
        ))
      )}

      <InfoModal
        visible={infoModalVisible}
        title={infoModalTitle}
        message={infoModalMessage}
        onClose={() => setInfoModalVisible(false)}
      />
    </ScrollView>
  );
}