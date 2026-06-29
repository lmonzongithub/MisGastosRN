import { useCallback, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';

import {
  createExpense,
  getExpenseById,
  getMonthlyTotal,
  updateExpense,
} from '../services/expenseService';
import { getUserSettings } from '../services/settingsService';
import { showLimitExceededNotification } from '../services/notificationService';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategoryCode,
  normalizeCategory,
} from '../utils/categories';
import { uploadReceipt, ReceiptFile } from '../services/receiptService';
import { useLanguage } from '../i18n/LanguageContext';
import {
  extractAmountFromText,
  extractTextFromReceiptBase64,
} from '../services/ocrService';
 import * as ImagePicker from 'expo-image-picker';

type UploadedReceipt = {
  receiptUrl: string;
  receiptName: string;
  receiptType: string;
  receiptPath: string;
};

export default function ExpenseFormScreen({ route, navigation }: any) {
  const { t } = useLanguage();

  const expenseId = route.params?.expenseId;
  const isEditing = !!expenseId;

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryCode>('FOOD');
  const [loading, setLoading] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);

  const [receiptFile, setReceiptFile] = useState<ReceiptFile | null>(null);
  const [currentReceiptName, setCurrentReceiptName] = useState<string | null>(null);
  const [currentReceiptUrl, setCurrentReceiptUrl] = useState<string | null>(null);
  const [scanningReceipt, setScanningReceipt] = useState(false);

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const loadExpense = async () => {
    if (!expenseId) return;

    try {
      setLoadingExpense(true);

      const expense = await getExpenseById(expenseId);

      if (!expense) {
        Alert.alert(t('common.error'), t('expenseForm.expenseNotFound'));
        navigation.goBack();
        return;
      }

      setDescription(expense.description);
      setAmount(String(expense.amount));
      setCategory(normalizeCategory(expense.category));

      setCurrentReceiptName(expense.receiptName ?? null);
      setCurrentReceiptUrl(expense.receiptUrl ?? expense.imageUrl ?? null);
      setReceiptFile(null);
      setLatitude(expense.latitude ?? null);
      setLongitude(expense.longitude ?? null);
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('expenseForm.loadError'));
    } finally {
      setLoadingExpense(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadExpense();
    }, [expenseId])
  );

  const handlePickReceipt = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'application/octet-stream';

      if (!mimeType.startsWith('image/') && mimeType !== 'application/pdf') {
        Alert.alert(
          t('expenseForm.invalidReceiptTitle'),
          t('expenseForm.invalidReceiptMessage')
        );
        return;
      }

      setReceiptFile({
        uri: asset.uri,
        name: asset.name ?? `comprobante-${Date.now()}`,
        mimeType,
      });
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('expenseForm.pickReceiptError'));
    }
  };

  const handleScanReceipt = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (!asset.base64) {
      Alert.alert('OCR', 'No se pudo leer la imagen.');
      return;
    }

    setScanningReceipt(true);

    const text = await extractTextFromReceiptBase64(asset.base64);

    const detectedAmount = extractAmountFromText(text);

    if (detectedAmount) {
      setAmount(String(detectedAmount));

      Alert.alert(
        'OCR',
        `Monto detectado: $${detectedAmount}`
      );
    } else {
      Alert.alert(
        'OCR',
        'No se pudo detectar el monto.'
      );
    }
  } catch (error) {
    console.log('Error OCR', error);

    Alert.alert(
      'OCR',
      'No se pudo leer el comprobante.'
    );
  } finally {
    setScanningReceipt(false);
  }
};

  const handleUseCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          t('expenseForm.locationPermissionTitle'),
          t('expenseForm.locationPermissionMessage')
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(currentLocation.coords.latitude);
      setLongitude(currentLocation.coords.longitude);

      Alert.alert(
        t('expenseForm.locationSavedTitle'),
        t('expenseForm.locationSavedMessage')
      );
    } catch (error) {
      console.log(error);
      Alert.alert(t('common.error'), t('expenseForm.locationError'));
    } finally {
      setGettingLocation(false);
    }
  };

  const checkMonthlyLimitNotification = async () => {
    try {
      const settings = await getUserSettings();

      if (!settings.notificationsEnabled) return;
      if (settings.monthlyLimit <= 0) return;

      const currentMonthlyTotal = await getMonthlyTotal();

      if (currentMonthlyTotal > settings.monthlyLimit) {
        await showLimitExceededNotification(
          currentMonthlyTotal,
          settings.monthlyLimit,
          {
            channelName: t('notifications.channelName'),
            channelDescription: t('notifications.channelDescription'),
            title: t('notifications.limitExceededTitle'),
            body: t('notifications.limitExceededBody'),
            currentTotalLabel: t('notifications.currentTotal'),
            configuredLimitLabel: t('notifications.configuredLimit'),
          }
        );
      }
    } catch (error) {
      console.log('Error al verificar límite mensual', error);
    }
  };

  const handleSave = async () => {
    if (gettingLocation || scanningReceipt) return;

    const parsedAmount = Number(amount.replace(',', '.'));

    if (description.trim().length === 0) {
      Alert.alert(t('common.error'), t('expenseForm.missingDescription'));
      return;
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert(t('common.error'), t('expenseForm.invalidAmount'));
      return;
    }

    try {
      setLoading(true);

      let uploadedReceipt: UploadedReceipt | null = null;

      if (receiptFile) {
        uploadedReceipt = await uploadReceipt(receiptFile, expenseId);
      }

      if (isEditing) {
        await updateExpense(expenseId, {
          description: description.trim(),
          amount: parsedAmount,
          category,
          latitude,
          longitude,
          ...(uploadedReceipt
            ? {
                receiptUrl: uploadedReceipt.receiptUrl,
                receiptName: uploadedReceipt.receiptName,
                receiptType: uploadedReceipt.receiptType,
                receiptPath: uploadedReceipt.receiptPath,
                imageUrl: uploadedReceipt.receiptType.startsWith('image/')
                  ? uploadedReceipt.receiptUrl
                  : null,
              }
            : {}),
        });
      } else {
        await createExpense({
          description: description.trim(),
          amount: parsedAmount,
          category,
          date: Date.now(),
          imageUrl:
            uploadedReceipt?.receiptType.startsWith('image/')
              ? uploadedReceipt.receiptUrl
              : null,
          receiptUrl: uploadedReceipt?.receiptUrl ?? null,
          receiptName: uploadedReceipt?.receiptName ?? null,
          receiptType: uploadedReceipt?.receiptType ?? null,
          receiptPath: uploadedReceipt?.receiptPath ?? null,
          latitude,
          longitude,
        });
      }

      await checkMonthlyLimitNotification();

      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert(
        t('common.error'),
        isEditing
          ? t('expenseForm.updateError')
          : t('expenseForm.saveError')
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingExpense) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: '#FDF7FF' }}>
        <Text>{t('expenseForm.loadingExpense')}</Text>
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
        {isEditing ? t('expenseForm.editTitle') : t('expenseForm.newTitle')}
      </Text>

      <TextInput
        placeholder={t('expenseForm.descriptionPlaceholder')}
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
        placeholder={t('expenseForm.amountPlaceholder')}
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

      <Text style={{ fontWeight: 'bold', color: '#1F1F1F', marginTop: 8 }}>
        {t('expenseForm.category')}
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
                {t(`categories.${item}`)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={{ fontWeight: 'bold', color: '#1F1F1F', marginTop: 8 }}>
        {t('expenseForm.receipt')}
      </Text>

      <View
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#E6E0EA',
          backgroundColor: '#FFFFFF',
          gap: 8,
        }}
      >
        <Text>
          {receiptFile?.name ??
            currentReceiptName ??
            t('expenseForm.noReceipt')}
        </Text>

        {receiptFile && (
          <Text style={{ color: '#0B6B2B', fontSize: 12 }}>
            {t('expenseForm.selectedReceipt')}
          </Text>
        )}

        {currentReceiptUrl && !receiptFile && (
          <Text style={{ color: '#666666', fontSize: 12 }}>
            {t('expenseForm.savedReceipt')}
          </Text>
        )}

        <TouchableOpacity
          onPress={handlePickReceipt}
          disabled={loading || scanningReceipt}
          style={{
            borderWidth: 1,
            borderColor: '#0B6B2B',
            padding: 12,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
            {scanningReceipt
              ? 'Leyendo comprobante...'
              : receiptFile || currentReceiptUrl
                ? t('expenseForm.changeReceipt')
                : t('expenseForm.attachReceipt')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
  onPress={handleScanReceipt}
  disabled={loading || scanningReceipt}
  style={{
    borderWidth: 1,
    borderColor: '#0B6B2B',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  }}
>
  <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
    {scanningReceipt
      ? 'Leyendo comprobante...'
      : 'Escanear comprobante OCR'}
  </Text>
</TouchableOpacity>
      </View>

      <Text style={{ fontWeight: 'bold', color: '#1F1F1F', marginTop: 8 }}>
        {t('expenseForm.location')}
      </Text>

      <View
        style={{
          padding: 12,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#E6E0EA',
          backgroundColor: '#FFFFFF',
          gap: 8,
        }}
      >
        {latitude && longitude ? (
          <Text style={{ color: '#1F1F1F' }}>
            Lat: {latitude.toFixed(6)} · Lng: {longitude.toFixed(6)}
          </Text>
        ) : (
          <Text style={{ color: '#666666' }}>
            {t('expenseForm.noLocation')}
          </Text>
        )}

        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          disabled={loading || gettingLocation}
          style={{
            borderWidth: 1,
            borderColor: '#0B6B2B',
            padding: 12,
            borderRadius: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#0B6B2B', fontWeight: 'bold' }}>
            {gettingLocation
              ? t('expenseForm.gettingLocation')
              : t('expenseForm.useCurrentLocation')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={loading || gettingLocation || scanningReceipt}
        style={{
          backgroundColor:
            loading || gettingLocation || scanningReceipt ? '#73A883' : '#0B6B2B',
          padding: 14,
          borderRadius: 10,
          alignItems: 'center',
          marginTop: 12,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          {loading
            ? isEditing
              ? t('expenseForm.updating')
              : t('expenseForm.saving')
            : isEditing
              ? t('expenseForm.updateExpense')
              : t('expenseForm.saveExpense')}
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
          {t('expenseForm.cancel')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}