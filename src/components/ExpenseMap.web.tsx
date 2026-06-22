import { View, Text, TouchableOpacity, Linking } from 'react-native';

type Props = {
  latitude: number;
  longitude: number;
  title?: string;
};

export default function ExpenseMap({ latitude, longitude }: Props) {
  const openMap = async () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View
      style={{
        width: '100%',
        minHeight: 140,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E6E0EA',
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Text style={{ color: '#666666', textAlign: 'center' }}>
        Vista de mapa no disponible en web.
      </Text>

      <TouchableOpacity
        onPress={openMap}
        style={{
          backgroundColor: '#0B6B2B',
          paddingVertical: 12,
          paddingHorizontal: 16,
          borderRadius: 10,
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>
          Abrir en Google Maps
        </Text>
      </TouchableOpacity>
    </View>
  );
}