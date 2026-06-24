import { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Expense } from '../models/expense';
import {
  getExpenseById,
  deleteExpense,
} from '../services/expenseService';
import { normalizeCategory } from '../utils/categories';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ExpenseMap from '../components/ExpenseMap';
import { useLanguage } from '../i18n/LanguageContext';

function getDateLocale(language: string) {
  if (language === 'en') return 'en-US';
  if (language === 'pt') return 'pt-BR';

  return 'es-AR';
}

export default function ExpenseDetailScreen({ route, navigation }: any) {
  const { t, language } = useLanguage();

  const { expenseId } = route.params;

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadExpense = async () => {
    try {
      setLoading(true);

      const data = await getExpenseById(expenseId);

      if (!data) {
        Alert.alert(t('common.error'), t('expenseDetail.notFound'));
        navigation.goBack();
        return;
      }

      setExpense(data);
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('expenseDetail.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpense();
    }, [expenseId])
  );

  const formatAmount = (amount: number) => {
    return `$ ${amount.toFixed(2)}`;
  };

  const formatDate = (date: number) => {
    return new Date(date).toLocaleDateString(getDateLocale(language));
  };

  const openDeleteModal = () => {
    setDeleteModalVisible(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;

    setDeleteModalVisible(false);
  };

  const confirmDelete = async () => {
    if (!expense?.id) return;

    try {
      setDeleting(true);

      await deleteExpense(expense.id);

      setDeleteModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('expenseDetail.deleteError'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !expense) {
    return (
      <View
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: '#FDF7FF',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <ActivityIndicator size="large" />
        <Text style={{ color: '#666666' }}>
          {t('expenseDetail.loading')}
        </Text>
      </View>
    );
  }

  const receiptUrl = expense.receiptUrl ?? expense.imageUrl;
  const receiptName =
    expense.receiptName ?? t('expenseDetail.attachedReceipt');

  const isImageReceipt =
    !!receiptUrl &&
    (expense.receiptType?.startsWith('image/') || !!expense.imageUrl);

  const openReceipt = async () => {
    const receiptUrl = expense?.receiptUrl ?? expense?.imageUrl;

    if (!receiptUrl) return;

    try {
      await Linking.openURL(receiptUrl);
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('expenseDetail.openReceiptError'));
    }
  };

  const hasLocation =
    typeof expense.latitude === 'number' &&
    typeof expense.longitude === 'number';

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#FDF7FF' }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          color: '#1F1F1F',
          marginBottom: 16,
        }}
      >
        {t('expenseDetail.title')}
      </Text>

      <View
        style={{
          padding: 16,
          borderRadius: 14,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#E6E0EA',
          gap: 10,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
          {t('expenseDetail.category')}
        </Text>

        <Text>
          {t(`categories.${normalizeCategory(expense.category)}`)}
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
          {t('expenseDetail.description')}
        </Text>

        <Text>{expense.description}</Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
          {t('expenseDetail.amount')}
        </Text>

        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#0B6B2B',
          }}
        >
          {formatAmount(expense.amount)}
        </Text>

        <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
          {t('expenseDetail.date')}
        </Text>

        <Text>{formatDate(expense.date)}</Text>
      </View>

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
        {t('expenseDetail.receipt')}
      </Text>

      {receiptUrl ? (
        <View style={{ gap: 10 }}>
          <Text>{receiptName}</Text>

          {isImageReceipt && (
            <Image
              source={{ uri: receiptUrl }}
              style={{
                width: '100%',
                height: 180,
                borderRadius: 10,
                backgroundColor: '#F1EDF5',
              }}
              resizeMode="cover"
            />
          )}

          <TouchableOpacity
            onPress={openReceipt}
            style={{
              borderWidth: 1,
              borderColor: '#0B6B2B',
              padding: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
              {t('expenseDetail.openReceipt')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={{ color: '#666666' }}>
          {t('expenseDetail.noReceipt')}
        </Text>
      )}

      <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 8 }}>
        {t('expenseDetail.location')}
      </Text>

      {hasLocation ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: '#666666' }}>
            Lat: {expense.latitude?.toFixed(6)} · Lng:{' '}
            {expense.longitude?.toFixed(6)}
          </Text>

          <ExpenseMap
            latitude={expense.latitude!}
            longitude={expense.longitude!}
            title={expense.description}
          />
        </View>
      ) : (
        <Text style={{ color: '#666666' }}>
          {t('expenseDetail.noLocation')}
        </Text>
      )}

      <TouchableOpacity
        onPress={() =>
          navigation.navigate('ExpenseForm', {
            expenseId: expense.id,
          })
        }
        disabled={deleting}
        style={{
          backgroundColor: deleting ? '#73A883' : '#0B6B2B',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 16,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          {t('expenseDetail.editExpense')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openDeleteModal}
        disabled={deleting}
        style={{
          backgroundColor: deleting ? '#C77986' : '#B00020',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 10,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          {t('expenseDetail.deleteExpense')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        disabled={deleting}
        style={{
          padding: 14,
          alignItems: 'center',
          marginTop: 10,
        }}
      >
        <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
          {t('expenseDetail.back')}
        </Text>
      </TouchableOpacity>

      <ConfirmDeleteModal
        visible={deleteModalVisible}
        loading={deleting}
        title={t('expenseDetail.deleteTitle')}
        message={t('expenseDetail.deleteMessage')}
        cancelText={t('common.cancel')}
        confirmText={t('common.delete')}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </View>
  );
}